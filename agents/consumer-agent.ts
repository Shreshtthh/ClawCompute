/**
 * ClawCompute — Consumer Agent
 *
 * This agent:
 * 1. Discovers available compute providers on-chain (ComputeRegistry)
 * 2. Picks the cheapest provider for a given model
 * 3. Starts a payment stream (StreamPay)
 * 4. Sends inference request to the provider
 * 5. Receives result, cancels/stops the stream
 * 6. Logs the full flow with on-chain proof
 */

import {
    getPublicClient,
    getWalletClient,
    getAccount,
    getDeployedAddresses,
    getComputeRegistryABI,
    getStreamPayABI,
} from "../lib/config";
import { formatEther, parseEther } from "viem";

// ============ Configuration ============
const DEFAULT_MODEL = process.env.MODEL_NAME || "llama-3.3-70b-versatile";
const MAX_DURATION_SECONDS = 60n; // Max 60 seconds per inference session
const MAX_PAYMENT = "0.01"; // Max 0.01 tBNB per request

// ============ Main ============
async function main() {
    // Get prompt from command line args
    const prompt = process.argv.slice(2).join(" ") || "What is BNB Chain? Explain in one paragraph.";

    console.log("========================================");
    console.log("  ClawCompute — Consumer Agent");
    console.log("========================================\n");

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
    console.log(`💬 Prompt: "${prompt}"`);
    console.log("");

    // ============ Step 1: Discover providers ============
    console.log("🔍 Step 1: Discovering providers on-chain...");

    const activeProviderIds = (await publicClient.readContract({
        address: registryAddress,
        abi: registryABI,
        functionName: "getActiveProviderIds",
    })) as bigint[];

    if (activeProviderIds.length === 0) {
        console.error("❌ No active providers found! Start a provider agent first.");
        process.exit(1);
    }

    console.log(`   Found ${activeProviderIds.length} active provider(s)`);

    // Get details for all providers
    let bestProvider: any = null;
    let bestProviderPrice = BigInt("999999999999999999999999");
    let bestProviderId = 0n;

    for (const providerId of activeProviderIds) {
        const provider = (await publicClient.readContract({
            address: registryAddress,
            abi: registryABI,
            functionName: "getProvider",
            args: [providerId],
        })) as any;

        const [wallet, modelName, pricePerSecond, endpoint, isActive] = provider;

        console.log(`   📦 Provider #${providerId}: ${modelName} @ ${formatEther(pricePerSecond)} tBNB/s → ${endpoint}`);

        if (isActive && pricePerSecond < bestProviderPrice) {
            bestProvider = { wallet, modelName, pricePerSecond, endpoint, isActive };
            bestProviderPrice = pricePerSecond;
            bestProviderId = providerId;
        }
    }

    if (!bestProvider) {
        console.error("❌ No suitable provider found!");
        process.exit(1);
    }

    console.log(`\n   ⭐ Selected: Provider #${bestProviderId} (${bestProvider.modelName} @ ${formatEther(bestProviderPrice)} tBNB/s)`);
    console.log("");

    // ============ Step 2: Create payment stream ============
    console.log("💸 Step 2: Creating payment stream on opBNB...");

    const paymentAmount = parseEther(MAX_PAYMENT);

    const createHash = await walletClient.writeContract({
        address: streamPayAddress,
        abi: streamPayABI,
        functionName: "createStream",
        args: [
            bestProvider.wallet as `0x${string}`,
            MAX_DURATION_SECONDS,
            "compute",
            bestProviderId,
        ],
        value: paymentAmount,
    });

    console.log(`   ⏳ Tx submitted: ${createHash}`);
    const createReceipt = await publicClient.waitForTransactionReceipt({
        hash: createHash,
    });
    console.log(`   ✅ Stream created! Block: ${createReceipt.blockNumber}`);
    console.log(`   🔗 Explorer: https://testnet.opbnbscan.com/tx/${createHash}`);

    // Extract streamId from event logs
    // The StreamCreated event is the first topic
    let streamId = 1n; // fallback
    try {
        // Read the latest stream count
        const totalStreams = (await publicClient.readContract({
            address: streamPayAddress,
            abi: streamPayABI,
            functionName: "totalStreamsCreated",
        })) as bigint;
        streamId = totalStreams;
        console.log(`   📋 Stream ID: ${streamId}`);
    } catch {
        console.log(`   📋 Stream ID: ${streamId} (estimated)`);
    }
    console.log("");

    // ============ Step 3: Send inference request ============
    console.log("📤 Step 3: Sending inference request to provider...");
    const inferenceStart = Date.now();

    let inferenceResult: string;
    try {
        const response = await fetch(bestProvider.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, model: DEFAULT_MODEL }),
        });

        if (!response.ok) {
            throw new Error(`Provider returned ${response.status}: ${await response.text()}`);
        }

        const data = (await response.json()) as any;
        inferenceResult = data.result;
        const durationSec = ((Date.now() - inferenceStart) / 1000).toFixed(2);
        console.log(`   ✅ Inference received in ${durationSec}s`);
    } catch (error: any) {
        console.error(`   ❌ Inference failed: ${error.message}`);
        console.log("   ⏹️ Cancelling stream to recover funds...");
        inferenceResult = "FAILED";
    }
    console.log("");

    // ============ Step 4: Cancel/stop stream ============
    console.log("⏹️ Step 4: Stopping payment stream...");

    try {
        const cancelHash = await walletClient.writeContract({
            address: streamPayAddress,
            abi: streamPayABI,
            functionName: "cancelStream",
            args: [streamId],
        });

        console.log(`   ⏳ Tx submitted: ${cancelHash}`);
        const cancelReceipt = await publicClient.waitForTransactionReceipt({
            hash: cancelHash,
        });
        console.log(`   ✅ Stream cancelled! Block: ${cancelReceipt.blockNumber}`);
        console.log(`   🔗 Explorer: https://testnet.opbnbscan.com/tx/${cancelHash}`);
    } catch (error: any) {
        console.log(`   ⚠️ Cancel failed (stream may have already ended): ${error.message?.substring(0, 100)}`);
    }
    console.log("");

    // ============ Step 5: Summary ============
    const finalBalance = await publicClient.getBalance({ address: account.address });
    const spent = balance - finalBalance;
    const durationTotal = ((Date.now() - inferenceStart) / 1000).toFixed(2);

    console.log("========================================");
    console.log("  Summary");
    console.log("========================================");
    console.log(`📝 Prompt:    "${prompt.substring(0, 60)}..."`);
    console.log(`🤖 Provider:  #${bestProviderId} (${bestProvider.modelName})`);
    console.log(`⏱️  Duration:  ${durationTotal}s`);
    console.log(`💰 Cost:      ${formatEther(spent > 0n ? spent : 0n)} tBNB`);
    console.log(`💰 Balance:   ${formatEther(finalBalance)} tBNB`);
    console.log("");

    if (inferenceResult && inferenceResult !== "FAILED") {
        console.log("📥 Response:");
        console.log("─".repeat(40));
        console.log(inferenceResult);
        console.log("─".repeat(40));
    }

    console.log("\n✅ Full agent-to-agent inference cycle complete!");
    console.log("   On-chain proof: 2 transactions on opBNB testnet");
}

main().catch(console.error);
