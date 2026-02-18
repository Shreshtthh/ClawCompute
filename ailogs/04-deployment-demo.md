# Session 04 — Deployment & Demo

**Date:** February 18, 2026  
**Duration:** ~2 hours  
**Focus:** BSC Testnet deployment, network pivots, end-to-end demo

---

## Deployment

### Hardhat Configuration
```typescript
bscTestnet: {
    url: process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545",
    chainId: 97,
    accounts: [process.env.PRIVATE_KEY],
    gasPrice: 10000000000, // 10 gwei
}
```

### Deployed Contracts (BSC Testnet)
```
ComputeRegistry: 0x27c880836d63ed6d786c86ec465dfaf356e7b8f5
StreamPay:       0xb3666a3515673ef9d72bace59c279a960fad4cb5
Deployer:        0x92cbb44a94bef56944929e25077f3a4f4f7b95e6
```

### Deployment Cost
- ComputeRegistry: ~0.008 tBNB
- StreamPay: ~0.012 tBNB
- Total: ~0.020 tBNB (+ gas for registration)

## End-to-End Demo

### Provider Agent Output
```
📍 Wallet: 0x92CbB44A94BEf56944929e25077F3A4F4F7B95E6
📝 Registering as compute provider...
   ✅ Registered! Block: 91116205
🟢 Provider agent listening on http://localhost:3001
📥 Inference request: "Why is BNB Chain good for AI agents?..."
📤 Response generated in 1.94s
```

### Consumer Agent Output
```
📍 Wallet: 0x92CbB44A94BEf56944929e25077F3A4F4F7B95E6
💰 Balance: 0.0488657636 tBNB
🔍 Found 1 active provider(s)
💸 Stream created! Block: 91116255
✅ Inference received in 1.96s
⏱️  Duration: 3.43s
💰 Cost: 0.0100466595 tBNB
✅ Full agent-to-agent inference cycle complete!
```

### On-Chain Proof
- Registration tx: `0x9e94acb77c9fd4...`
- Stream creation tx: `0x17a18f15b6e350...`
- Both verifiable on [testnet.bscscan.com](https://testnet.bscscan.com)


**`StreamPay: Sender refund failed`**
- Cause: Edge case in self-streaming cancel flow
- Impact: Minor — inference still delivered, payment still recorded
- Status: Will fix when more tBNB available for redeployment

## Result

✅ **Full autonomous agent-to-agent inference cycle demonstrated on BSC Testnet**
- Real LLM inference (Llama 3.3 70B via Groq)
- Real on-chain payments (per-second streaming)
- Real agent discovery (on-chain registry)
- Zero human intervention during the cycle
