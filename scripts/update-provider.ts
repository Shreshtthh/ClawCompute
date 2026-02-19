
import {
    getWalletClient,
    getPublicClient,
    getDeployedAddresses,
    getComputeRegistryABI,
} from "../lib/config";
import { parseEther } from "viem";

async function main() {
    const newEndpoint = process.argv[2];
    if (!newEndpoint) {
        console.error("❌ Usage: npx tsx scripts/update-provider.ts <NEW_ENDPOINT_URL>");
        process.exit(1);
    }

    const publicClient = getPublicClient();
    const walletClient = getWalletClient();
    const addresses = getDeployedAddresses();
    const registryABI = getComputeRegistryABI();
    const registryAddress = addresses.contracts.ComputeRegistry as `0x${string}`;

    const [account] = await walletClient.getAddresses();
    console.log(`\n🔄 Updating provider for wallet: ${account}`);
    console.log(`📍 Registry: ${registryAddress}`);

    // Get provider IDs for this wallet
    const providerIds = await publicClient.readContract({
        address: registryAddress,
        abi: registryABI,
        functionName: "getWalletProviders",
        args: [account],
    }) as bigint[];

    if (!providerIds || providerIds.length === 0) {
        console.error("❌ No provider found for this wallet.");
        process.exit(1);
    }

    // Update the last registered provider (most recent)
    const providerId = providerIds[providerIds.length - 1];

    // Fetch current details to preserve price/model
    const provider = await publicClient.readContract({
        address: registryAddress,
        abi: registryABI,
        functionName: "getProvider",
        args: [providerId],
    }) as any;

    const [wallet, modelName, pricePerSecond, oldEndpoint, wasActive] = provider;

    console.log(`\n--- Updating Provider #${providerId} ---`);
    console.log(`Model:    ${modelName}`);
    console.log(`Old URL:  ${oldEndpoint}`);
    console.log(`New URL:  ${newEndpoint}`);
    console.log(`Active:   ${wasActive}`);

    const hash = await walletClient.writeContract({
        address: registryAddress,
        abi: registryABI,
        functionName: "updateProvider",
        args: [providerId, pricePerSecond, newEndpoint, true], // Ensure it's active
    });

    console.log(`\n⏳ Transaction submitted: ${hash}`);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Provider endpoint updated successfully!");
    console.log("   Refreshing frontend provider grid should now show the new URL.");
}

main().catch(console.error);
