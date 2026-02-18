import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "hardhat-gas-reporter";
import "dotenv/config";

// Only include real accounts if a valid private key is set
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const hasValidKey = PRIVATE_KEY
  && PRIVATE_KEY !== "your_wallet_private_key_here"
  && PRIVATE_KEY.length >= 64;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },

  networks: {
    hardhat: {
      chainId: 31337,
    },
    ...(hasValidKey ? {
      opbnbTestnet: {
        url: process.env.OPBNB_RPC || "https://opbnb-testnet-rpc.bnbchain.org",
        accounts: [PRIVATE_KEY!],
        chainId: 5611,
        gasPrice: 1000000008,
      },
      baseSepolia: {
        url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
        accounts: [PRIVATE_KEY!],
        chainId: 84532,
      },
      bscTestnet: {
        url: "https://data-seed-prebsc-1-s1.binance.org:8545",
        accounts: [PRIVATE_KEY!],
        chainId: 97,
        gasPrice: 10000000000,
      },
    } : {}),
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },

  etherscan: {
    apiKey: {
      opbnbTestnet: "empty",
      bscTestnet: process.env.BSCSCAN_API_KEY || "empty",
    },
    customChains: [
      {
        network: "opbnbTestnet",
        chainId: 5611,
        urls: {
          apiURL: "https://api-testnet.opbnbscan.com/api",
          browserURL: "https://testnet.opbnbscan.com",
        },
      },
    ],
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
