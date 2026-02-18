/**
 * Discover active compute providers on-chain
 */
import {
    getPublicClient,
    getDeployedAddresses,
    getComputeRegistryABI,
} from "../../../lib/config";
import { formatEther } from "viem";

async function main() {
    console.log("========================================");
    console.log("  ClawCompute — Provider Discovery");
    console.log("========================================\n");

    const publicClient = getPublicClient();
    const addresses = getDeployedAddresses();
    const registryABI = getComputeRegistryABI();
    const registryAddress = addresses.contracts.ComputeRegistry as `0x${string}`;

    // Get registry stats
    const [totalProviders, totalActive] = (await publicClient.readContract({
        address: registryAddress,
        abi: registryABI,
        functionName: "getRegistryStats",
    })) as [bigint, bigint];

    console.log(`📊 Registry: ${totalProviders} total providers, ${totalActive} active\n`);

    // Get active providers
    const activeIds = (await publicClient.readContract({
        address: registryAddress,
        abi: registryABI,
        functionName: "getActiveProviderIds",
    })) as bigint[];

    if (activeIds.length === 0) {
        console.log("No active providers found. Start a provider agent!\n");
        return;
    }

    console.log("Active Providers:");
    console.log("─".repeat(80));
    console.log(
        "ID".padEnd(6) +
        "Model".padEnd(30) +
        "Price/sec".padEnd(20) +
        "Requests".padEnd(10) +
        "Endpoint"
    );
    console.log("─".repeat(80));

    for (const id of activeIds) {
        const provider = (await publicClient.readContract({
            address: registryAddress,
            abi: registryABI,
            functionName: "getProvider",
            args: [id],
        })) as any;

        const [wallet, modelName, pricePerSecond, endpoint, isActive, totalEarned, totalRequests] = provider;

        console.log(
            `#${id}`.padEnd(6) +
            modelName.substring(0, 28).padEnd(30) +
            `${formatEther(pricePerSecond)} tBNB`.padEnd(20) +
            `${totalRequests}`.padEnd(10) +
            endpoint
        );
    }
    console.log("─".repeat(80));
}

main().catch(console.error);
