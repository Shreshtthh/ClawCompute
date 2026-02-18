/**
 * Check wallet balance, active streams, and provider earnings
 */
import {
    getPublicClient,
    getAccount,
    getDeployedAddresses,
    getStreamPayABI,
    getComputeRegistryABI,
} from "../../../lib/config";
import { formatEther } from "viem";

async function main() {
    console.log("========================================");
    console.log("  ClawCompute — Balance & Stats");
    console.log("========================================\n");

    const account = getAccount();
    const publicClient = getPublicClient();
    const addresses = getDeployedAddresses();
    const streamPayABI = getStreamPayABI();
    const registryABI = getComputeRegistryABI();

    const streamPayAddress = addresses.contracts.StreamPay as `0x${string}`;
    const registryAddress = addresses.contracts.ComputeRegistry as `0x${string}`;

    // Wallet balance
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`📍 Wallet:  ${account.address}`);
    console.log(`💰 Balance: ${formatEther(balance)} tBNB\n`);

    // Protocol stats
    const [totalStreams, totalUpdates, totalVolume, activeStreams, lastUpdate] =
        (await publicClient.readContract({
            address: streamPayAddress,
            abi: streamPayABI,
            functionName: "getProtocolStats",
        })) as [bigint, bigint, bigint, bigint, bigint];

    console.log("📊 Protocol Stats:");
    console.log(`   Total streams:  ${totalStreams}`);
    console.log(`   Active streams: ${activeStreams}`);
    console.log(`   Total volume:   ${formatEther(totalVolume)} tBNB`);
    console.log(`   Total updates:  ${totalUpdates}`);
    console.log("");

    // Sender streams
    const senderStreams = (await publicClient.readContract({
        address: streamPayAddress,
        abi: streamPayABI,
        functionName: "getSenderStreams",
        args: [account.address],
    })) as bigint[];

    console.log(`📤 Streams as sender: ${senderStreams.length}`);

    // Recipient streams
    const recipientStreams = (await publicClient.readContract({
        address: streamPayAddress,
        abi: streamPayABI,
        functionName: "getRecipientStreams",
        args: [account.address],
    })) as bigint[];

    console.log(`📥 Streams as recipient: ${recipientStreams.length}`);

    // Provider info
    const walletProviders = (await publicClient.readContract({
        address: registryAddress,
        abi: registryABI,
        functionName: "getWalletProviders",
        args: [account.address],
    })) as bigint[];

    if (walletProviders.length > 0) {
        console.log(`\n🤖 Your providers:`);
        for (const id of walletProviders) {
            const provider = (await publicClient.readContract({
                address: registryAddress,
                abi: registryABI,
                functionName: "getProvider",
                args: [id],
            })) as any;
            const [, modelName, pricePerSecond, endpoint, isActive, totalEarned, totalRequests] = provider;
            console.log(`   #${id} ${modelName} — ${isActive ? "🟢 Active" : "🔴 Inactive"} — ${totalRequests} requests — ${formatEther(totalEarned)} tBNB earned`);
        }
    }
}

main().catch(console.error);
