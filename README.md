# 🤖 ClawCompute — Agent Inference Marketplace on BNB Chain

> OpenClaw-native marketplace where AI agents autonomously buy and sell LLM inference on BSC Testnet, paying per-second via streaming payments.

**Built for the [Good Vibes Only: OpenClaw Edition](https://dorahacks.io/hackathon/good-vibes-only) hackathon**

![License](https://img.shields.io/badge/license-MIT-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-orange)
![Chain](https://img.shields.io/badge/Chain-BSC%20Testnet-yellow)

---

## 🎯 What is ClawCompute?

ClawCompute enables AI agents to form an **autonomous compute economy** on BNB Chain:

1. **Provider agents** register on-chain with their LLM model, pricing, and endpoint
2. **Consumer agents** discover providers, start a per-second payment stream, get inference, and stop the stream
3. Every transaction is on-chain — agents pay each other in real-time with **zero human intervention**

### Why it wins

- 🧠 **Agent autonomy** — AI agents make economic decisions on-chain without human clicks
- ⛓️ **On-chain proof** — Every inference request = 2 verifiable transactions on BSC Testnet
- 💰 **Real economics** — Per-second streaming payments with 0.1% keeper rewards
- 🔧 **OpenClaw-native** — Full skill definition for agent integration
- ⚡ **BSC Testnet** — Low gas fees make agent micropayments viable

---

## 🏗️ Architecture

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
         │                            │  ──► Groq API (free LLM)
         │  4. Receive result         │
         │◄───────────────────────────│
         │                            │
         │  5. Cancel stream          │
         │════════════════════════════►  (refund + settlement)
         │                            │
    ┌────┴────────────────────────────┴────┐
    │         BSC Testnet (Chain 97)        │
    │  ┌─────────────┐  ┌──────────────┐   │
    │  │ Compute      │  │ StreamPay    │  │
    │  │ Registry     │  │ (payments)   │  │
    │  └─────────────┘  └──────────────┘   │
    └──────────────────────────────────────┘
```

---

## 📂 Project Structure

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
└── frontend/                     # Dashboard (coming soon)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- Wallet with testnet tBNB ([faucet](https://www.bnbchain.org/en/testnet-faucet))
- Free Groq API key ([console.groq.com](https://console.groq.com))

### 1. Clone & Install

```bash
git clone https://github.com/Shreshtthh/ClawCompute.git
cd ClawCompute
npm install
cd contracts && npm install && cd ..
```

### 2. Configure

Edit `.env` at the project root:
```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
GROQ_API_KEY=gsk_YOUR_GROQ_KEY_HERE
```

### 3. Compile & Deploy

```bash
npm run compile
npm run deploy  # Deploys to BSC Testnet
```

### 4. Run the Demo

**Terminal 1 — Start Provider Agent:**
```bash
npm run provider
```

**Terminal 2 — Run Consumer Agent:**
```bash
npm run consumer What is BNB Chain?
```

**Check balances & stats:**
```bash
npm run balance
npm run discover
```

---

## 📜 Smart Contracts

### ComputeRegistry.sol
| Function | Description |
|----------|-------------|
| `registerProvider(model, price, endpoint, type)` | Register as a compute provider |
| `updateProvider(id, price, endpoint, active)` | Update provider details |
| `getCheapestProvider(model)` | Find cheapest provider for a model |
| `getActiveProviderIds()` | List all active providers |
| `recordCompletion(id, earned)` | Track completed requests |

### StreamPay.sol
| Function | Description |
|----------|-------------|
| `createStream(recipient, duration, type, providerId)` | Start per-second payment stream |
| `batchUpdateStreams(streamIds)` | Update stream balances (earns 0.1% keeper reward) |
| `withdrawFromStream(streamId)` | Provider withdraws earned funds |
| `cancelStream(streamId)` | Stop stream, refund remaining to sender |

---

## 🔗 Deployed Contracts (BSC Testnet)

| Contract | Address |
|----------|---------|
| ComputeRegistry | `0x27c880836d63ed6d786c86ec465dfaf356e7b8f5` |
| StreamPay | `0xb3666a3515673ef9d72bace59c279a960fad4cb5` |

---

## 🛠️ Tech Stack

- **Smart Contracts:** Solidity 0.8.24 + OpenZeppelin + Hardhat 2
- **Chain:** BSC Testnet (Chain ID 97)
- **Agent Runtime:** TypeScript + Viem
- **LLM Backend:** Groq API (free tier, Llama 3.3 70B)
- **Agent Framework:** OpenClaw skill format
- **Payments:** Per-second streaming with keeper rewards

---

## 🏆 Hackathon Track

**Good Vibes Only: OpenClaw Edition** — Agent Track

ClawCompute demonstrates the first autonomous agent compute marketplace on BNB Chain, where AI agents independently discover, negotiate, transact, and settle payments for LLM inference — all on-chain.

---

## 📄 License

MIT
