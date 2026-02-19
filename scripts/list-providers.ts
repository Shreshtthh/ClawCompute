
import {
    getPublicClient,
    getDeployedAddresses,
    getComputeRegistryABI,
} from "../lib/config";
import { formatEther } from "viem";

async function main() {
    const publicClient = getPublicClient();
    const addresses = getDeployedAddresses();
    const registryABI = getComputeRegistryABI();

    const registryAddress = addresses.contracts.ComputeRegistry as `0x${string}`;

    console.log(`\n🔍 Checking Active Providers on ComputeRegistry: ${registryAddress}\n`);

    const activeIds = await publicClient.readContract({
        address: registryAddress,
        abi: registryABI,
        functionName: "getActiveProviderIds",
    }) as bigint[];

    if (!activeIds || activeIds.length === 0) {
        console.log("❌ No active providers found.");
        return;
    }

    console.log(`Found ${activeIds.length} active providers:\n`);

    for (const id of activeIds) {
        const provider = await publicClient.readContract({
            address: registryAddress,
            abi: registryABI,
            functionName: "getProvider",
            args: [id],
        }) as any;

        const [wallet, modelName, pricePerSecond, endpoint, isActive, totalEarned, totalRequests] = provider;

        console.log(`--- Provider #${id} ---`);
        console.log(`Wallet:   ${wallet}`);
        console.log(`Model:    ${modelName}`);
        console.log(`Price:    ${formatEther(pricePerSecond)} tBNB/s`);
        console.log(`Endpoint: ${endpoint}`); // <--- This is what we need to see
        console.log(`Active:   ${isActive ? "✅ Yes" : "❌ No"}`);
        console.log(`Requests: ${totalRequests}`);
        console.log(`Earned:   ${formatEther(totalEarned)} tBNB`);
        console.log("");
    }
}

main().catch(console.error);
