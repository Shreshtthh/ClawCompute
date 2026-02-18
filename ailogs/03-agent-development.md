# Session 03 — Agent Development

**Date:** February 14, 2026  
**Duration:** ~1.5 hours  
**Focus:** Provider agent, consumer agent, shared config, OpenClaw skill

---

## Shared Configuration (`lib/config.ts`)

Created a centralized config module that both agents use:

- **Chain definition** — BSC Testnet (Chain ID 97) via `viem/chains`
- **Viem clients** — `publicClient` for reads, `walletClient` for writes
- **ABI loading** — reads compiled Hardhat artifacts from `contracts/artifacts/`
- **Address resolution** — reads `deployed-addresses.json` from project root
- **Groq API wrapper** — `callGroqInference(prompt, model)` with error handling

### Decision: Viem over ethers.js
- Better TypeScript types
- Native BSC chain support
- Smaller bundle, modern API
- Consistent with Wagmi ecosystem (for future frontend)

## Provider Agent (`agents/provider-agent.ts`)

### Flow
1. Load wallet from `.env` PRIVATE_KEY
2. Check if already registered on ComputeRegistry
3. If not, call `registerProvider()` with model, price, endpoint
4. Start HTTP server on port 3001
5. Listen for POST `/inference` with `{ prompt: "..." }`
6. Call Groq API → return response
7. Periodically attempt to withdraw earnings from active streams

### Design Choices
- **HTTP server** (not WebSocket) — simplicity, any agent can call it
- **Groq API** — free tier, Llama 3.3 70B, fast inference (~2s)
- **Auto-registration** — agent registers itself on startup, no manual step
- **Idempotent** — checks existing registration before re-registering

## Consumer Agent (`agents/consumer-agent.ts`)

### Flow
1. Load wallet, check balance
2. Query ComputeRegistry for active providers
3. Select cheapest provider for requested model
4. Create payment stream via StreamPay (locks 0.006 tBNB for 60s)
5. Send HTTP POST to provider's endpoint with the prompt
6. Receive inference response
7. Cancel stream (refund unused portion)
8. Print summary: duration, cost, response

### Design Choices
- **Autonomous discovery** — no hardcoded provider addresses
- **Economic optimization** — always picks cheapest provider
- **Stream-then-request** — payment starts BEFORE inference (provider guaranteed payment)
- **Graceful cancel** — always attempts to stop stream, even if request fails

## OpenClaw Skill (`openclaw-skill/claw-compute/SKILL.md`)

Created proper SKILL.md with:
- Name, version, description
- Required environment variables
- Available commands: `discover`, `rent`, `check-balance`
- Example usage patterns

### Helper Scripts
- `scripts/discover-providers.ts` — CLI tool to list all registered providers
- `scripts/check-balance.ts` — CLI tool to check wallet balance and stream stats

## Key Insight

The agents are truly autonomous — once deployed:
- Provider auto-registers and serves requests
- Consumer auto-discovers, auto-pays, auto-receives
- Zero human intervention in the inference cycle
- Every action has on-chain proof (2 transactions per inference)
