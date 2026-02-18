# Session 01 — Ideation & Architecture

**Date:** February 14, 2026  
**Duration:** ~2 hours  
**Focus:** Hackathon analysis, idea selection, system design

---

## Context

Entered the **Good Vibes Only: OpenClaw Edition** hackathon on BNB Chain. Needed to pick an idea that:
- Uses BNB Chain (opBNB or BSC)
- Integrates with OpenClaw agent framework
- Has a working demo, not just contracts

## Ideas Explored

| Idea | Verdict |
|------|---------|
| AI Agent Marketplace (rent compute) | ✅ Selected |
| Decentralized AI Training Coordinator | Too complex for hackathon |
| Agent-to-Agent Negotiation Protocol | Novel but hard to demo |
| On-chain Model Registry | Too simple, no "wow" factor |

## Why "Agent Inference Marketplace"?

1. **Clear demo story** — Provider registers → Consumer discovers → Payment streams → Inference delivered
2. **Real economics** — Per-second streaming payments, not just "send tokens"
3. **AI is actually used** — Groq API for real LLM inference, not mock data
4. **OpenClaw native** — Skill definition fits the agent framework naturally

## Architecture Decisions

### Two-Contract Design
- **ComputeRegistry** — Provider identity, pricing, service discovery
- **StreamPay** — Per-second streaming payments tied to compute sessions

Considered a single monolithic contract but split for:
- Separation of concerns
- Independent upgradeability
- Clearer audit surface

### Agent Runtime: TypeScript + Viem
- Chose TypeScript over Python for Viem/Wagmi ecosystem compatibility
- Viem over ethers.js for modern type safety and better BSC support
- Groq API over OpenAI for free tier (hackathon budget = $0)

### Payment Model: Per-Second Streaming
- Inspired by Superfluid/Sablier but simplified for agent use
- Consumer locks funds → money flows per-second → cancel refunds remainder
- 0.1% keeper reward incentivizes batch updates

## Key Takeaway

The winning insight was combining **real AI inference** with **on-chain payment streaming**. Most hackathon projects do one or the other — we do both, autonomously.
