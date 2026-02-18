import hre from "hardhat";
import { formatEther } from "viem";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    console.log("========================================");
    console.log("  ClawCompute - Deployment Script");
    console.log("========================================");
    console.log(`Deployer: ${deployer.account.address}`);

    const balance = await publicClient.getBalance({
        address: deployer.account.address,
    });
    console.log(`Balance: ${formatEther(balance)} tBNB`);
    console.log("");

    // 1. Deploy ComputeRegistry
    console.log("1/2 Deploying ComputeRegistry...");
    const computeRegistry = await hre.viem.deployContract("ComputeRegistry", [
        deployer.account.address,
    ]);
    console.log(`    ✅ ComputeRegistry: ${computeRegistry.address}`);

    // 2. Deploy StreamPay
    console.log("2/2 Deploying StreamPay...");
    const streamPay = await hre.viem.deployContract("StreamPay", [
        deployer.account.address,
    ]);
    console.log(`    ✅ StreamPay: ${streamPay.address}`);

    console.log("");
    console.log("========================================");
    console.log("  All contracts deployed successfully!");
    console.log("========================================");

    // Save deployed addresses
    const addresses = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        deployer: deployer.account.address,
        contracts: {
            ComputeRegistry: computeRegistry.address,
            StreamPay: streamPay.address,
        },
        deployedAt: new Date().toISOString(),
    };

    const outPath = path.join(__dirname, "..", "deployed-addresses.json");
    fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
    console.log(`\nAddresses saved to: ${outPath}`);

    // Also save to root project for agents/frontend to use
    const rootOutPath = path.join(__dirname, "..", "..", "deployed-addresses.json");
    fs.writeFileSync(rootOutPath, JSON.stringify(addresses, null, 2));
    console.log(`Addresses saved to: ${rootOutPath}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
