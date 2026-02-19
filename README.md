# 🤖 ClawCompute: Streaming Payments for Streaming Intelligence

> **The first per-second compute marketplace on BNB Chain.**
> *Why pay a monthly subscription when you only need 30 seconds of intelligence?*

![License](https://img.shields.io/badge/license-MIT-blue)
![Network](https://img.shields.io/badge/BNB%20Chain-Testnet-yellow)
![Status](https://img.shields.io/badge/Status-Live%20Demo-green)

---

## 🚀 Live Demo

- **Marketplace Dashboard**: [https://clawcompute.vercel.app](https://clawcompute.vercel.app)
- **Provider Agent (Backend)**: [https://claw-compute.onrender.com/health](https://claw-compute.onrender.com/health)
- **Smart Contracts**: [Registry](https://testnet.bscscan.com/address/0x27c880836d63ed6d786c86ec465dfaf356e7b8f5) | [StreamPay](https://testnet.bscscan.com/address/0xb3666a3515673ef9d72bace59c279a960fad4cb5)

---

## 💡 The Problem: "The $20 Subscription Trap"

We are moving into an era of billions of AI agents. But current economic models for AI are broken:

1.  **Wasted Capital**: Users pay $20/month for ChatGPT/Claude but might only use it for 1 hour total.
2.  **Opaque Pricing**: "Credits" systems are confusing and often expire.
3.  **Centralized Gatekeepers**: API access is permissioned and can be revoked.

**Agents need a native economy.** An autonomous agent shouldn't need a credit card subscription. It needs to pay *exactly* for what it consumes, in real-time.

## ⚡ The Solution: Pay-Per-Second Compute

**ClawCompute** is a decentralized marketplace where AI agents buy and sell inference power using **payment streams**.

*   **Streaming Money for Streaming Tokens**: The moment an AI provider starts generating tokens, a payment stream opens.
*   **Trustless Stop**: The moment the inference is done (or if the user cancels), the stream stops. Unused funds are **instantly refunded**.
*   **Zero Waste**: If an inference takes 4.2 seconds, you pay for exactly 4.2 seconds. Not a cent more.

---

## 🛠️ How It Works

`User` → `Smart Contract` → `AI Provider`

1.  **Discover**: The user selects a provider (e.g., Llama 3 70B) from the on-chain registry.
2.  **Stream**: The user signs a transaction to open a **Money Stream** (via `StreamPay.sol`) to the provider.
3.  **Inference**: The provider detects the active stream and begins processing the prompt.
4.  **Settle**: Once the response is delivered, the stream is cancelled. The provider withdraws their earnings, and the user gets back their unspent deposit.

**Everything happens on-chain on BSC Testnet.**

---

## ✨ Key Features

- **🧠 Autonomous & Permissionless**: Any node running the `provider-agent` can join the network and start earning BNB. No approval needed.
- **💸 Real-Time Settlement**: Providers get paid every second. No "net-30" payouts.
- **🛡️ Sybil-Resistant Registry**: Providers stake their reputation (and gas) to register on-chain.
- **🔌 OpenClaw Compatible**: Built to the [OpenClaw](https://github.com/OpenClaw/OpenClaw) agent standard.

---

## 🏗️ Technical Architecture

This project was built for the **Good Vibes Only: OpenClaw Edition** hackathon.

| Component | Tech Stack | Description |
|---|---|---|
| **Smart Contracts** | Solidity, Hardhat | `ComputeRegistry` for discovery, `StreamPay` for SABLIER-style streaming. |
| **Frontend** | Next.js, Wagmi, RainbowKit | Modern glassmorphism UI for interacting with agents. Deployed on **Vercel**. |
| **Provider Agent** | Node.js, Viem, Groq | Autonomous agent that listens for streams and serves LLM inference. Deployed on **Render**. |
| **Blockchain** | BSC Testnet | Chosen for high speed and low gas costs (essential for micropayments). |

### 📂 Project Structure

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
├── frontend/                     # Next.js Dashboard
│   ├── src/components/           # Reusable UI components
│   ├── src/lib/                  # Wagmi & Contract integration
│   └── src/app/                  # App Router pages
└── openclaw-skill/               # OpenClaw skill definition
```

---

## 📜 Smart Contract Interface

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

## 🤖 AI Development Logs

This project leveraged **AI-assisted development** (powered by Google DeepMind's experimental agent) to accelerate the build process. Full session logs demonstrate the step-by-step reasoning and implementation:

| Session | Focus |
|---------|-------|
| [01 — Ideation](ailogs/01-ideation-architecture.md) | Hackathon focus, idea selection, system architecture design |
| [02 — Contracts](ailogs/02-smart-contracts.md) | Developing `ComputeRegistry` and `StreamPay` logic |
| [03 — Agents](ailogs/03-agent-development.md) | Implementing the Provider and Consumer agent logic |
| [04 — Deployment](ailogs/04-deployment-demo.md) | BSC Testnet deployment and end-to-end verification |

---

## 🏃 Quick Start (Run Locally)

Want to run your own AI node?

### 1. Clone & Install
```bash
git clone https://github.com/Shreshtthh/ClawCompute.git
cd ClawCompute
npm install
cd contracts && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configure Environment
Create a `.env` file:
```env
PRIVATE_KEY=your_wallet_private_key
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
GROQ_API_KEY=your_groq_api_key
```

### 3. Start a Provider Node
```bash
# Registers your node on-chain and starts listening for requests
npm run provider
```

### 4. Run the Frontend
```bash
cd frontend
npm run dev
```

---

## 🔮 Future Roadmap

- [ ] **Verifiable Inference**: Integrate opML (Optimistic Machine Learning) to cryptographically prove that the response actually came from the specific model (e.g., Llama 3).
- [ ] **Reputation System**: On-chain scoring based on latency and uptime.
- [ ] **Multi-Model Support**: Support for Image Gen (Stable Diffusion) and Audio agents.

---

## 📜 License
MIT
