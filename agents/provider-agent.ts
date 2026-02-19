/**
 * ClawCompute — Provider Agent
 *
 * This agent:
 * 1. Registers on-chain as a compute provider (ComputeRegistry)
 * 2. Starts an HTTP server to serve inference requests
 * 3. Uses Groq's free API for actual LLM inference
 * 4. Periodically withdraws earnings from payment streams
 */

import {
    getPublicClient,
    getWalletClient,
    getAccount,
    getDeployedAddresses,
    getComputeRegistryABI,
    getStreamPayABI,
    callGroqInference,
    hasGroqKey,
} from "../lib/config";
import { formatEther, parseEther } from "viem";
import * as http from "http";

// ============ Configuration ============
const MODEL_NAME = process.env.MODEL_NAME || "llama-3.3-70b-versatile";
const PRICE_PER_SECOND = process.env.PRICE_PER_SECOND || "0.0001"; // tBNB per second
const PORT = parseInt(process.env.PORT || process.env.PROVIDER_PORT || "3001");
const ENDPOINT_URL = process.env.ENDPOINT_URL || `http://localhost:${PORT}/inference`;

// ============ Main ============
async function main() {
    console.log("========================================");
    console.log("  ClawCompute — Provider Agent");
    console.log("========================================\n");

    // Validate
    if (!hasGroqKey()) {
        console.error("❌ GROQ_API_KEY not set in .env. Get one free at https://console.groq.com");
        process.exit(1);
    }

    const account = getAccount();
    const publicClient = getPublicClient();
    const walletClient = getWalletClient();
    const addresses = getDeployedAddresses();
    const registryABI = getComputeRegistryABI();
    const streamPayABI = getStreamPayABI();

    const registryAddress = addresses.contracts.ComputeRegistry as `0x${string}`;
    const streamPayAddress = addresses.contracts.StreamPay as `0x${string}`;

    console.log(`📍 Wallet: ${account.address}`);
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`💰 Balance: ${formatEther(balance)} tBNB`);
    console.log(`🤖 Model: ${MODEL_NAME}`);
    console.log(`💲 Price: ${PRICE_PER_SECOND} tBNB/second`);
    console.log(`🌐 Endpoint: ${ENDPOINT_URL}`);
    console.log("");

    // ============ Step 1: Register on-chain ============
    console.log("📝 Checking existing registrations...");

    try {
        const priceWei = parseEther(PRICE_PER_SECOND);

        // 1. Check if we already have an active provider for this model
        // We get all providers for this wallet
        const providerIds = await publicClient.readContract({
            address: registryAddress,
            abi: registryABI,
            functionName: "getWalletProviders",
            args: [account.address],
        }) as bigint[];

        let existingProviderId: bigint | null = null;
        let needsUpdate = false;

        if (providerIds && providerIds.length > 0) {
            console.log(`   Found ${providerIds.length} existing provider IDs.`);

            // Check the latest one
            for (let i = providerIds.length - 1; i >= 0; i--) {
                const pid = providerIds[i];
                const provider = await publicClient.readContract({
                    address: registryAddress,
                    abi: registryABI,
                    functionName: "getProvider",
                    args: [pid],
                }) as any;

                const [pWallet, pModel, pPrice, pEndpoint, pActive] = provider;

                // If it looks like this agent
                // Note: We might want to allow multiple models per wallet, so we check model name
                // If model name matches, we assume it's this agent.
                if (pModel === MODEL_NAME && pActive) {
                    existingProviderId = pid;
                    console.log(`   ✅ Found active provider #${pid} for model '${MODEL_NAME}'`);

                    // Check if we need to update params
                    if (pPrice !== priceWei || pEndpoint !== ENDPOINT_URL) {
                        console.log(`   ⚠️ Config changed! On-chain: ${pEndpoint} @ ${formatEther(pPrice)} BNB`);
                        console.log(`   🆕 New Config:   ${ENDPOINT_URL} @ ${PRICE_PER_SECOND} BNB`);
                        needsUpdate = true;
                    }
                    break;
                }
            }
        }

        if (existingProviderId !== null) {
            if (needsUpdate) {
                console.log(`   🔄 Updating Provider #${existingProviderId}...`);
                const hash = await walletClient.writeContract({
                    address: registryAddress,
                    abi: registryABI,
                    functionName: "updateProvider",
                    args: [existingProviderId, priceWei, ENDPOINT_URL, true],
                });
                console.log(`   ⏳ Update Tx: ${hash}`);
                await publicClient.waitForTransactionReceipt({ hash });
                console.log("   ✅ Provider updated successfully.");
            } else {
                console.log("   ✨ Provider is already up to date. Skipping registration.");
            }
        } else {
            // Register new
            console.log(`   🆕 Registering NEW provider for '${MODEL_NAME}'...`);
            const hash = await walletClient.writeContract({
                address: registryAddress,
                abi: registryABI,
                functionName: "registerProvider",
                args: [MODEL_NAME, priceWei, ENDPOINT_URL, 0n], // serviceType 0 = compute
            });

            console.log(`   ⏳ Tx submitted: ${hash}`);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            console.log(`   ✅ Registered! Block: ${receipt.blockNumber}`);
            console.log(`   🔗 Explorer: https://testnet.bscscan.com/tx/${hash}`);
        }

    } catch (error: any) {
        console.error(`   ❌ Registration check failed: ${error.message}`);
        console.log("   Continuing start-up sequence...");
    }

    console.log("");

    // ============ Step 2: Start HTTP server ============
    console.log("🚀 Starting inference server...\n");

    const server = http.createServer(async (req, res) => {
        // CORS headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
            res.writeHead(200);
            res.end();
            return;
        }

        if (req.method === "POST" && req.url === "/inference") {
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
                try {
                    const { prompt, model } = JSON.parse(body);

                    if (!prompt) {
                        res.writeHead(400, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: "Missing 'prompt' field" }));
                        return;
                    }

                    console.log(`📥 Inference request: "${prompt.substring(0, 60)}..."`);
                    const startTime = Date.now();

                    // Call Groq for actual inference
                    const result = await callGroqInference(prompt, model || MODEL_NAME);

                    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                    console.log(`📤 Response generated in ${duration}s`);

                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            result,
                            model: model || MODEL_NAME,
                            durationMs: Date.now() - startTime,
                            provider: account.address,
                        })
                    );
                } catch (error: any) {
                    console.error(`❌ Inference error: ${error.message}`);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
        } else if (req.method === "GET" && req.url === "/health") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    status: "ok",
                    model: MODEL_NAME,
                    provider: account.address,
                })
            );
        } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Not found. Use POST /inference or GET /health" }));
        }
    });

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`🟢 Provider agent listening on port ${PORT}`);
        console.log(`   POST /inference — send { "prompt": "..." } to get inference`);
        console.log(`   GET  /health    — check provider status`);
        console.log("\n⏳ Waiting for inference requests...\n");
    });

    // ============ Step 3: Periodic earnings withdrawal ============
    setInterval(async () => {
        try {
            const newBalance = await publicClient.getBalance({ address: account.address });
            console.log(`💰 Current balance: ${formatEther(newBalance)} tBNB`);
        } catch {
            // silently ignore balance check errors
        }
    }, 60000); // Check every 60 seconds
}

main().catch(console.error);
