# ClawCompute — Autonomous Agent Inference Marketplace

## What is ClawCompute?

ClawCompute is a decentralized marketplace where AI agents autonomously buy and sell LLM inference on BNB Chain. Agents discover each other on-chain, negotiate pricing, and pay per-second using streaming payments — with zero human intervention.

## How It Works

1. **Provider agents** register on-chain with their model, pricing, and HTTP endpoint
2. **Consumer agents** query the on-chain registry and select the cheapest provider
3. A **per-second payment stream** is opened (BNB flows in real-time)
4. The consumer sends a prompt, receives inference, and cancels the stream
5. Unused funds are refunded — the provider keeps only what was earned

Every step produces verifiable on-chain transactions.

## Architecture

```
┌──────────────────┐         ┌──────────────────┐
│  Consumer Agent  │         │  Provider Agent   │
│  (buys compute)  │         │  (sells compute)  │
└────────┬─────────┘         └────────┬──────────┘
         │                            │
         │  1. Discover providers     │
         │───────────────────────────►│
         │                            │
         │  2. Start payment stream   │
         │════════════════════════════►  (on-chain StreamPay)
         │                            │
         │  3. Request inference      │
         │───────────────────────────►│
         │                            │  ──► Groq API (LLM)
         │  4. Receive result         │
         │◄───────────────────────────│
         │                            │
         │  5. Cancel stream          │
         │════════════════════════════►  (refund + settlement)
         │                            │
    ┌────┴────────────────────────────┴────┐
    │         BSC Testnet (Chain 97)        │
    │  ┌─────────────┐  ┌──────────────┐  │
    │  │ Compute      │  │ StreamPay    │  │
    │  │ Registry     │  │ (payments)   │  │
    │  └─────────────┘  └──────────────┘  │
    └──────────────────────────────────────┘
```

## Smart Contracts (BSC Testnet)

| Contract | Address |
|----------|---------|
| ComputeRegistry | `0x27c880836d63ed6d786c86ec465dfaf356e7b8f5` |
| StreamPay | `0xb3666a3515673ef9d72bace59c279a960fad4cb5` |

### ComputeRegistry.sol
- Provider registration with model name, pricing, and endpoint
- On-chain discovery via `getActiveProviderIds()` and `getProvider(id)`
- Price comparison with `getCheapestProvider(model)`
- Tracks lifetime earnings and request counts per provider

### StreamPay.sol
- Per-second payment streaming for compute sessions
- Consumer locks BNB → money flows at `pricePerSecond` → cancel refunds remainder
- 0.1% keeper reward incentivizes batch balance updates
- Built with OpenZeppelin ReentrancyGuard, Ownable, and Pausable

## Key Features

- **Fully autonomous** — agents make economic decisions without human clicks
- **On-chain proof** — every inference request = 2 verifiable transactions
- **Per-second payments** — no flat fees, pay only for what you use
- **OpenClaw-native** — full skill definition for agent framework integration
- **Real AI** — Llama 3.3 70B inference via Groq API

## Project Structure

```
ClawCompute/
├── contracts/                    # Smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── ComputeRegistry.sol   # Provider registration & discovery
│   │   └── StreamPay.sol         # Per-second payment streaming
│   ├── scripts/deploy.ts         # Deployment script
│   └── hardhat.config.ts         # BSC testnet configuration
├── agents/
│   ├── provider-agent.ts         # Registers + serves inference via Groq
│   └── consumer-agent.ts         # Discovers + pays + gets inference
├── lib/
│   └── config.ts                 # Shared viem clients, ABI loading, Groq API
├── openclaw-skill/
│   └── claw-compute/
│       ├── SKILL.md              # OpenClaw skill definition
│       └── scripts/              # Discovery & balance check scripts
├── ailogs/                       # AI development session logs
└── frontend/                     # Dashboard (Next.js)
```

## Tech Stack

- **Smart Contracts:** Solidity 0.8.24 + OpenZeppelin + Hardhat
- **Chain:** BSC Testnet (Chain ID 97)
- **Agent Runtime:** TypeScript + Viem
- **LLM Backend:** Groq API (free tier, Llama 3.3 70B)
- **Agent Framework:** OpenClaw skill format
- **Payments:** Per-second streaming with keeper rewards

## Quick Start

```bash
git clone https://github.com/Shreshtthh/ClawCompute.git
cd ClawCompute
npm install
cd contracts && npm install && cd ..
```

Configure `.env`:
```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
GROQ_API_KEY=gsk_YOUR_GROQ_KEY_HERE
```

Run the demo:
```bash
# Terminal 1 — Start Provider
npm run provider

# Terminal 2 — Run Consumer
npm run consumer "Why is BNB Chain good for AI agents?"
```

## Demo Output

**Provider Agent:**
```
📍 Wallet: 0x92CbB44A94BEf56944929e25077F3A4F4F7B95E6
📝 Registering as compute provider...
   ✅ Registered! Block: 91116205
🟢 Provider agent listening on http://localhost:3001
📥 Inference request: "Why is BNB Chain good for AI agents?..."
📤 Response generated in 1.94s
```

**Consumer Agent:**
```
📍 Wallet: 0x92CbB44A94BEf56944929e25077F3A4F4F7B95E6
💰 Balance: 0.0488 tBNB
🔍 Found 1 active provider(s)
💸 Stream created! Block: 91116255
✅ Inference received in 1.96s
⏱️  Duration: 3.43s
💰 Cost: 0.0100 tBNB
✅ Full agent-to-agent inference cycle complete!
```

## Repository

[github.com/Shreshtthh/ClawCompute](https://github.com/Shreshtthh/ClawCompute)
