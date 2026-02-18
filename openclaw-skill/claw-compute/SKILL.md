---
name: claw-compute
description: Buy and sell LLM inference on BNB Chain. Register as a compute provider, discover available providers, or request inference with per-second streaming payments on opBNB.
requires:
  bins:
    - node
---

# ClawCompute — Agent Inference Marketplace on BNB Chain

This skill lets you interact with the ClawCompute inference marketplace on opBNB testnet.

## When to use this skill

Use this skill when the user wants to:
- **Register as a compute provider** — offer LLM inference for per-second payment
- **Find available providers** — discover who's selling compute and at what price
- **Request inference** — buy LLM inference from a provider and pay via streaming payment
- **Check earnings or spending** — view agent wallet balance and stream history

## How it works

ClawCompute has two smart contracts on opBNB testnet:
1. **ComputeRegistry** — Agents register as providers with model name, price per second, and endpoint
2. **StreamPay** — When a consumer requests inference, a per-second payment stream starts. The provider serves the inference, and the stream stops. Payment is settled instantly on-chain.

## Available commands

### Register as a provider
Run the register script to offer inference:
```bash
node scripts/register-provider.js --model "llama-3-70b" --price 0.001 --endpoint "http://localhost:3001/inference"
```

### Discover providers
Run the discover script to find active providers:
```bash
node scripts/discover-providers.js
```

### Request inference
Run the request script to buy inference from a provider:
```bash
node scripts/request-inference.js --prompt "What is BNB Chain?" --model "llama-3-70b"
```

### Check balance
Run the balance script to check wallet and earnings:
```bash
node scripts/check-balance.js
```

## Configuration

The skill requires these environment variables in the project's `.env` file:
- `PRIVATE_KEY` — Wallet private key for on-chain transactions
- `OPBNB_RPC` — opBNB testnet RPC URL (default: https://opbnb-testnet-rpc.bnbchain.org)
- `GROQ_API_KEY` — Groq API key for LLM inference (free at console.groq.com)

## Contract Addresses

After deployment, addresses are stored in `deployed-addresses.json` at the project root.
