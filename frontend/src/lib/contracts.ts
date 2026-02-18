// Contract addresses — BSC Testnet (Chain ID 97)
export const COMPUTE_REGISTRY_ADDRESS = "0x27c880836d63ed6d786c86ec465dfaf356e7b8f5" as const;
export const STREAM_PAY_ADDRESS = "0xb3666a3515673ef9d72bace59c279a960fad4cb5" as const;

// BSCScan base URL
export const BSCSCAN_URL = "https://testnet.bscscan.com";

// ComputeRegistry ABI — only the view/write functions we use
export const computeRegistryAbi = [
    {
        inputs: [],
        name: "getActiveProviderIds",
        outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "providerId", type: "uint256" }],
        name: "getProvider",
        outputs: [
            { internalType: "address", name: "wallet", type: "address" },
            { internalType: "string", name: "modelName", type: "string" },
            { internalType: "uint256", name: "pricePerSecond", type: "uint256" },
            { internalType: "string", name: "endpoint", type: "string" },
            { internalType: "bool", name: "isActive", type: "bool" },
            { internalType: "uint256", name: "totalEarned", type: "uint256" },
            { internalType: "uint256", name: "totalRequests", type: "uint256" },
            { internalType: "uint256", name: "registeredAt", type: "uint256" },
            { internalType: "uint256", name: "serviceType", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getRegistryStats",
        outputs: [
            { internalType: "uint256", name: "_totalProviders", type: "uint256" },
            { internalType: "uint256", name: "_totalActiveProviders", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
    },
] as const;

// StreamPay ABI — only the functions we use
export const streamPayAbi = [
    {
        inputs: [
            { internalType: "address", name: "recipient", type: "address" },
            { internalType: "uint256", name: "duration", type: "uint256" },
            { internalType: "string", name: "streamType", type: "string" },
            { internalType: "uint256", name: "computeProviderId", type: "uint256" },
        ],
        name: "createStream",
        outputs: [{ internalType: "uint256", name: "streamId", type: "uint256" }],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "streamId", type: "uint256" }],
        name: "cancelStream",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "getProtocolStats",
        outputs: [
            { internalType: "uint256", name: "totalStreams", type: "uint256" },
            { internalType: "uint256", name: "totalUpdates", type: "uint256" },
            { internalType: "uint256", name: "totalVolume", type: "uint256" },
            { internalType: "uint256", name: "activeStreams", type: "uint256" },
            { internalType: "uint256", name: "lastUpdate", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "totalStreamsCreated",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
] as const;

// Provider type for frontend usage
export interface Provider {
    id: bigint;
    wallet: string;
    modelName: string;
    pricePerSecond: bigint;
    endpoint: string;
    isActive: boolean;
    totalEarned: bigint;
    totalRequests: bigint;
    registeredAt: bigint;
    serviceType: bigint;
}
