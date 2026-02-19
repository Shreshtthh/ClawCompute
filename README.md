# 🤖 ClawCompute: Streaming Payments for Streaming Intelligence

> **The first per-second compute marketplace on BNB Chain.**
> *Why pay a monthly subscription when you only need 30 seconds of intelligence?*

![License](https://img.shields.io/badge/license-MIT-blue)
![Network](https://img.shields.io/badge/BNB%20Chain-Testnet-yellow)
![Status](https://img.shields.io/badge/Status-Live%20Demo-green)

---

## 🚀 Live Demo

- **Marketplace Dashboard**: [https://clawcompute.vercel.app](https://clawcompute.vercel.app)
- **Smart Contracts**: [Registry](https://testnet.bscscan.com/address/0x27c880836d63ed6d786c86ec465dfaf356e7b8f5) | [StreamPay](https://testnet.bscscan.com/address/0xb3666a3515673ef9d72bace59c279a960fad4cb5)

### Live Provider Agents

| Model | Render URL | Status |
|-------|-----------|--------|
| Llama 3.3 70B | [clawcompute.onrender.com](https://clawcompute.onrender.com/health) | ✅ Live |
| Mixtral 8x7B | [clawcompute-mixtral.onrender.com](https://clawcompute-mixtral.onrender.com/health) | ✅ Live |
| Gemma 7B | [clawcompute-gemma.onrender.com](https://clawcompute-gemma.onrender.com/health) | ✅ Live |

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
Create a `.env` file in the project root:
```env
PRIVATE_KEY=your_wallet_private_key
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
GROQ_API_KEY=your_groq_api_key
```

> **Getting a Groq API Key:** Sign up free at [console.groq.com](https://console.groq.com). Groq provides free access to Llama 3, Mixtral, and Gemma models.

### 3. Start Provider Agents

The provider agent auto-registers on-chain and starts serving inference. You can run **multiple models** simultaneously by setting the `MODEL_NAME` and `PORT` environment variables.

#### Run a single agent (Llama 3 — default):
```bash
npm run provider
```

#### Run all three agents locally (each in a separate terminal):

**Terminal 1 — Llama 3.3 70B (Port 3001):**
```bash
npm run provider
```

**Terminal 2 — Mixtral 8x7B (Port 3002):**
```bash
# Linux / macOS
MODEL_NAME="mixtral-8x7b-32768" PORT=3002 npm run provider

# Windows PowerShell
$env:MODEL_NAME="mixtral-8x7b-32768"; $env:PORT="3002"; npm run provider
```

**Terminal 3 — Gemma 7B (Port 3003):**
```bash
# Linux / macOS
MODEL_NAME="gemma-7b-it" PORT=3003 npm run provider

# Windows PowerShell
$env:MODEL_NAME="gemma-7b-it"; $env:PORT="3003"; npm run provider
```

> **Supported Models (via Groq):** `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`, `gemma-7b-it`

### 4. Run the Frontend
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) — you should see all your agents in the marketplace.

---

## ☁️ Deploying Agents to Render

To make agents accessible to anyone (not just your machine), deploy each as a **Web Service** on [Render](https://render.com).

### Per-Service Setup

1. Create a new **Web Service** on Render, connected to your GitHub repo.
2. Set the **Build Command**: `npm install && cd contracts && npm install && npx hardhat compile`
3. Set the **Start Command**: `npx tsx agents/provider-agent.ts`
4. Add these **Environment Variables**:

| Variable | Value |
|---|---|
| `PRIVATE_KEY` | Your wallet private key |
| `BSC_TESTNET_RPC` | `https://data-seed-prebsc-1-s1.binance.org:8545` |
| `GROQ_API_KEY` | Your Groq API key |
| `MODEL_NAME` | e.g. `mixtral-8x7b-32768` |
| `ENDPOINT_URL` | `https://<your-service-name>.onrender.com/inference` |

> **Important:** The `ENDPOINT_URL` must match your Render service's public URL + `/inference`. This is the URL registered on-chain so the frontend knows where to send requests.

### Update On-Chain Endpoint

If you need to update a provider's on-chain endpoint after deployment:
```bash
# Update a specific provider by ID
npx tsx scripts/update-provider.ts <NEW_URL> <PROVIDER_ID>

# Example: update provider #9 to its Render URL
npx tsx scripts/update-provider.ts https://clawcompute-mixtral.onrender.com/inference 9
```

### Utility Scripts

```bash
# List all active providers and their endpoints
npx tsx scripts/list-providers.ts

# Clean up duplicate/inactive providers
npx tsx scripts/cleanup-providers.ts
```

---

## � Extensibility: Bring Your Own Model

ClawCompute's protocol is **model-agnostic**. The smart contracts don't care what's behind the endpoint — they only handle payments. This means **anyone** can become a provider with **any** inference backend:

| Backend | Example | Effort |
|---|---|---|
| **Ollama** (local LLMs) | Run Llama 3, Mistral, or DeepSeek R1 on your own GPU | 🟢 Easy |
| **vLLM** (GPU server) | Point the agent at any OpenAI-compatible endpoint | 🟢 Easy |
| **HuggingFace TGI** | Self-host any HuggingFace model behind a TGI server | 🟡 Medium |
| **Stable Diffusion** | Return image URLs instead of text, use `serviceType = 1` | 🟡 Medium |
| **Whisper / TTS** | Accept audio input, return transcriptions | 🟠 Harder |

**The vision:** Someone in India with a spare RTX 4090 runs DeepSeek R1 locally, spins up a ClawCompute provider agent, registers on-chain, and instantly starts earning BNB from anyone in the world who needs inference — no middleman, no platform fees, no API key gatekeeping.

To use a custom backend, just replace the `callGroqInference()` call in `provider-agent.ts` with a `fetch()` to your local inference server (e.g., `http://localhost:11434/api/generate` for Ollama).

---

## �🔮 Future Roadmap

- [x] **Multi-Model Support**: Llama 3, Mixtral, and Gemma agents live on BSC Testnet.
- [ ] **Generic Provider Template**: Allow providers to plug in any OpenAI-compatible endpoint via env var (`INFERENCE_URL`), removing the Groq dependency entirely.
- [ ] **Verifiable Inference**: Integrate opML (Optimistic Machine Learning) to cryptographically prove that the response came from the claimed model.
- [ ] **Reputation System**: On-chain scoring based on latency, uptime, and user ratings.
- [ ] **Multi-Modal Support**: Image Gen (Stable Diffusion), Audio (Whisper), and Code (StarCoder) agents.

---

## 📜 License
MIT
