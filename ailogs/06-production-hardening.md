# Session 06 — Production Hardening & Multi-Agent

**Date:** February 19, 2026  
**Duration:** ~5 hours  
**Focus:** Render deployment, endpoint debugging, UI polish, multi-model agents, documentation

---

## Problem: The Localhost Trap

After deploying the provider agent to Render, the frontend kept failing with `Failed to fetch`. Root cause: the provider had registered `http://localhost:3001/inference` as its on-chain endpoint. The Vercel frontend (running in a user's browser) was trying to reach `localhost` — which obviously doesn't exist on the user's machine.

### Fix
1. Added `ENDPOINT_URL` environment variable to `provider-agent.ts`
2. Set it to `https://clawcompute.onrender.com/inference` on Render
3. Created `scripts/update-provider.ts` to fix the on-chain record
4. Created `scripts/list-providers.ts` to diagnose endpoint issues

### Lesson Learned
On-chain state persists even when you redeploy. If a provider registers with `localhost`, that URL lives on the blockchain until someone explicitly updates it. This led to a key architectural improvement: **the agent now checks for existing registrations before creating new ones**.

## Duplicate Provider Cleanup

The `ComputeRegistry` contract allows multiple providers per wallet (by design — one wallet might run multiple models). But during development, every restart of the agent was creating a new registration entry, polluting the UI with duplicates.

### Solution: Smart Registration Logic
```
On startup:
  1. Call getWalletProviders(myWallet)
  2. For each provider ID:
     - If model matches AND is active → reuse it
     - If endpoint differs → update (but NEVER overwrite remote with localhost)
  3. If no match found → register new
```

### Safety Guard
Added a critical check: if the on-chain endpoint is a remote URL (e.g., `onrender.com`) and the agent is running locally (endpoint defaults to `localhost`), **skip the update**. This prevents local development from accidentally breaking the production deployment.

### Cleanup Script (`scripts/cleanup-providers.ts`)
Created a one-shot script that:
1. Finds the primary Render provider
2. Deactivates all other providers for the wallet
3. Leaves only the clean, active provider visible in the frontend

## UI Polish

### Markdown Rendering
AI responses were rendering as raw text — no bold, no lists, no formatting. Integrated `react-markdown` into `ChatPanel.tsx` with custom Tailwind-styled components for headings, lists, links, and code blocks. The chat now feels like a real AI assistant interface.

### Before vs After
- **Before:** Wall of plain text, hard to parse
- **After:** Rich formatted responses with bullet points, bold text, and proper paragraphs

## Multi-Agent Marketplace

Expanded from a single Llama 3 provider to **three concurrent agents**:

| Model | Provider ID | Render Service |
|---|---|---|
| Llama 3.3 70B Versatile | #3 | `clawcompute.onrender.com` |
| Mixtral 8x7B | #9 | `clawcompute-mixtral.onrender.com` |
| Gemma 7B | #10 | `clawcompute-gemma.onrender.com` |

### How It Works
The `provider-agent.ts` accepts `MODEL_NAME` and `PORT` as environment variables. Each Render service runs the **same codebase** with different config:

```bash
# Each Render service just sets different env vars:
MODEL_NAME=mixtral-8x7b-32768
ENDPOINT_URL=https://clawcompute-mixtral.onrender.com/inference
```

The agent auto-registers on-chain with the correct model name. The frontend's `ProviderGrid` picks up all active providers automatically — no frontend changes needed.

### Key Insight
The protocol is model-agnostic by design. Adding a new model to the marketplace is a **configuration change**, not a code change. This validates the vision: anyone can spin up a provider for any model and start earning BNB.

## Documentation Rewrite

Rewrote the README from a generic project description to a **hackathon-winning narrative**:

1. **Opening Hook** — "The $20 Subscription Trap" problem framing
2. **Technical Depth** — Contract function tables, project structure tree
3. **Reproducibility** — Step-by-step multi-agent setup (local + Render)
4. **Extensibility** — "Bring Your Own Model" section showing how to use Ollama, vLLM, DeepSeek
5. **AI Build Logs** — This very section, documenting the development process

## Utility Scripts Created

| Script | Purpose |
|---|---|
| `scripts/list-providers.ts` | Query and display all active providers |
| `scripts/update-provider.ts` | Update a specific provider's endpoint by ID |
| `scripts/cleanup-providers.ts` | Deactivate duplicate/stale provider entries |

## Result

✅ **Three live agents deployed and accessible from any browser**  
✅ **Smart registration prevents duplicate provider entries**  
✅ **Rich markdown chat UI for polished demo experience**  
✅ **Comprehensive documentation covering setup, deployment, and extensibility**
