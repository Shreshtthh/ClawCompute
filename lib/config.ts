// Shared configuration for ClawCompute agents and scripts
import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load .env from project root
dotenv.config({ path: path.join(__dirname, "..", ".env") });
// Also try contracts/.env
dotenv.config({ path: path.join(__dirname, "..", "contracts", ".env") });

// BSC Testnet chain definition
import { bscTestnet } from "viem/chains";

export const chain = bscTestnet;

// Load deployed addresses
export function getDeployedAddresses() {
    const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");
    if (!fs.existsSync(addressesPath)) {
        throw new Error(
            `deployed-addresses.json not found at ${addressesPath}. Deploy contracts first!`
        );
    }
    return JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
}

// Create viem clients
export function getAccount() {
    const pk = process.env.PRIVATE_KEY;
    if (!pk) throw new Error("PRIVATE_KEY not set in .env");
    return privateKeyToAccount(pk.startsWith("0x") ? (pk as `0x${string}`) : (`0x${pk}` as `0x${string}`));
}

export function getPublicClient() {
    return createPublicClient({
        chain,
        transport: http(),
    });
}

export function getWalletClient() {
    const account = getAccount();
    return createWalletClient({
        account,
        chain,
        transport: http(),
    });
}

// Load ABIs
export function getComputeRegistryABI() {
    const artifact = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, "..", "contracts", "artifacts", "contracts", "ComputeRegistry.sol", "ComputeRegistry.json"),
            "utf-8"
        )
    );
    return artifact.abi;
}

export function getStreamPayABI() {
    const artifact = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, "..", "contracts", "artifacts", "contracts", "StreamPay.sol", "StreamPay.json"),
            "utf-8"
        )
    );
    return artifact.abi;
}

// Groq API helper
export async function callGroqInference(prompt: string, model: string = "llama-3.3-70b-versatile"): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your_groq_api_key_here") {
        throw new Error("GROQ_API_KEY not set in .env");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as any;
    return data.choices[0].message.content;
}

// Export Groq API key check
export function hasGroqKey(): boolean {
    const key = process.env.GROQ_API_KEY;
    return !!key && key !== "your_groq_api_key_here";
}
