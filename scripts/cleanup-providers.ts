
import {
    getWalletClient,
    getPublicClient,
    getDeployedAddresses,
    getComputeRegistryABI,
} from "../lib/config";
import { formatEther } from "viem";

async function main() {
    const publicClient = getPublicClient();
    const walletClient = getWalletClient();
    const addresses = getDeployedAddresses();
    const registryABI = getComputeRegistryABI();
    const registryAddress = addresses.contracts.ComputeRegistry as `0x${string}`;

    const [account] = await walletClient.getAddresses();
    console.log(`\n🧹 Cleaning up providers for wallet: ${account}`);

    // Get all provider IDs for this wallet
    const providerIds = await publicClient.readContract({
        address: registryAddress,
        abi: registryABI,
        functionName: "getWalletProviders",
        args: [account],
    }) as bigint[];

    if (!providerIds || providerIds.length === 0) {
        console.log("❌ No providers found for this wallet.");
        return;
    }

    console.log(`Found ${providerIds.length} registered providers.`);

    let keptProviderId: bigint | null = null;
    let providersToDeactivate: bigint[] = [];

    // First pass: Identify which one is the Render provider (or default to the last one if updated)
    // Actually, let's keep the one that matches 'onrender.com' OR has non-localhost endpoint

    // We need to fetch details for ALL first
    const providers = [];
    for (const id of providerIds) {
        const p = await publicClient.readContract({
            address: registryAddress,
            abi: registryABI,
            functionName: "getProvider",
            args: [id],
        }) as any;
        providers.push({ id, endpoint: p[3], isActive: p[4], price: p[2] });
    }

    // Find the best candidate to KEEP
    // Priority: Has 'onrender.com' in endpoint AND is active
    const renderProvider = providers.find(p => p.endpoint.includes("onrender.com") && p.isActive);

    if (renderProvider) {
        keptProviderId = renderProvider.id;
        console.log(`✅ Keeping Render Provider ID #${keptProviderId} (${renderProvider.endpoint})`);
    } else {
        // If no render provider found, maybe keep the LAST one if active?
        // But user specifically asked for render.
        // Let's look for ANY active non-localhost one.
        const anyRemote = providers.reverse().find(p => !p.endpoint.includes("localhost") && p.isActive);
        if (anyRemote) {
            keptProviderId = anyRemote.id;
            console.log(`⚠️ No specific 'onrender' provider found, but keeping remote provider ID #${keptProviderId} (${anyRemote.endpoint})`);
        } else {
            console.error("❌ No suitable remote provider found to keep! Aborting to prevent full deletion.");
            return;
        }
    }

    // Identify ones to deactivate
    for (const p of providers) {
        if (p.id !== keptProviderId && p.isActive) {
            providersToDeactivate.push(p.id);
        }
    }

    if (providersToDeactivate.length === 0) {
        console.log("✨ No duplicate active providers found. System is already clean!");
        return;
    }

    console.log(`\n🛑 Deactivating ${providersToDeactivate.length} old/duplicate providers...`);

    for (const id of providersToDeactivate) {
        const p = providers.find(prov => prov.id === id)!;
        console.log(`   Deactivating ID #${id} (${p.endpoint})...`);

        // Deactivate: set isActive = false
        const hash = await walletClient.writeContract({
            address: registryAddress,
            abi: registryABI,
            functionName: "updateProvider",
            args: [id, p.price, p.endpoint, false],
        });

        console.log(`      Tx: ${hash}`);
        await publicClient.waitForTransactionReceipt({ hash });
        console.log(`      ✅ Done.`);
    }

    console.log("\n✨ Cleanup complete! Only one provider is now active.");
}

main().catch(console.error);
