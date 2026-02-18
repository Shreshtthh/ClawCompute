# Session 02 — Smart Contract Development

**Date:** February 14, 2026  
**Duration:** ~1.5 hours  
**Focus:** Writing and compiling ComputeRegistry and StreamPay contracts

---

## ComputeRegistry.sol

### Design Goals
- Providers register with: model name, price per second, HTTP endpoint
- On-chain discovery: any agent can query active providers
- Price comparison: `getCheapestProvider(model)` for autonomous selection

### Key Decisions

**Provider struct:**
```solidity
struct Provider {
    address owner;
    string modelName;        // e.g., "llama-3.3-70b-versatile"
    uint256 pricePerSecond;  // in wei
    string endpoint;         // HTTP URL for inference
    string computeType;      // "llm", "image", "embedding"
    bool isActive;
    uint256 totalRequests;
    uint256 totalEarnings;
}
```

- Chose `string` for modelName/endpoint over bytes32 for readability
- `pricePerSecond` in wei enables sub-cent pricing on BSC
- `totalRequests` and `totalEarnings` provide on-chain reputation signal

**Discovery pattern:**
- `getActiveProviderIds()` returns all active IDs
- `getCheapestProvider(model)` loops through actives — O(n) but fine for hackathon scale
- Could optimize with sorted sets in production

## StreamPay.sol

### Design Goals
- Per-second payment streaming for compute sessions
- Consumer locks BNB → flow rate calculated → cancel refunds remainder
- Keeper reward (0.1%) incentivizes batch balance updates

### Adapted From
Originally studied the Somnia StreamPay contract. Key adaptations:
- Added `computeProviderId` field linking streams to registered providers
- Added `streamType` for categorization ("compute", "audit", "data")
- Simplified keeper logic for hackathon scope
- Used OpenZeppelin's `ReentrancyGuard`, `Ownable`, `Pausable`

### Security Considerations
- ReentrancyGuard on all state-changing functions
- Pausable for emergency stops
- Owner-only keeper management
- Duration cap (365 days max)
- Minimum flow rate check

## Compilation

```bash
npx hardhat compile
# Solidity 0.8.24
# OpenZeppelin Contracts 5.x
# Both contracts compiled successfully
```

**Artifacts generated:**
- `artifacts/contracts/ComputeRegistry.sol/ComputeRegistry.json`
- `artifacts/contracts/StreamPay.sol/StreamPay.json`


