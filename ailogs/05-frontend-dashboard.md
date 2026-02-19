# Session 05 — Frontend Dashboard

**Date:** February 18–19, 2026  
**Duration:** ~4 hours  
**Focus:** Next.js marketplace UI, Wagmi integration, Vercel deployment

---

## Design Philosophy

The dashboard needed to look premium enough to win a hackathon at first glance. We chose a **glassmorphism** aesthetic with dark mode, ambient glows, and gradient accents — the kind of UI that signals "this is a real product, not a homework project."

### Tech Stack Decision
| Choice | Rationale |
|---|---|
| **Next.js 14 (App Router)** | Server components, fast cold starts, Vercel-native |
| **Wagmi v2 + RainbowKit** | Best-in-class wallet UX with BSC testnet support |
| **Tailwind CSS v4** | Inline `@theme` tokens, no config file overhead |
| **Viem** | Already used in agents — shared mental model across stack |

## Component Architecture

### Layout & Styling
- **`globals.css`** — Built a full design system: CSS custom properties for glassmorphism panels, gradient text utilities, and ambient glow keyframes.
- **`layout.tsx`** — Inter font via `next/font`, dark background, full-viewport layout.

### Core Components

**`Navbar.tsx`** — Logo with gradient accent + RainbowKit `ConnectButton`. Clean, minimal.

**`StatsBar.tsx`** — Three stat cards that read live on-chain data:
- Total Providers (from `totalProviders()`)
- Active Providers (from `totalActiveProviders()`)
- Total Streams (from `totalStreamsCreated()`)

**`ProviderGrid.tsx`** — Batch-fetches all active provider IDs via `getActiveProviderIds()`, then reads each provider's details in parallel with `Promise.all`. Each provider renders as a `ProviderCard`.

**`ProviderCard.tsx`** — Glassmorphism card showing:
- Model name, service type badge
- Price per second (formatted from wei)
- Truncated endpoint URL
- Request count, registration date
- "Chat with Agent" CTA button

**`ChatPanel.tsx`** — The star component. Orchestrates the full inference flow:

```
[User types prompt]
    → createStream() on StreamPay (locks 60s of funds)
    → Wait for on-chain confirmation
    → POST /inference to provider endpoint
    → Receive LLM response
    → cancelStream() on StreamPay (refund unused)
    → Display cost summary
```

### Contract Integration (`lib/contracts.ts`)
Inline ABIs for both contracts, deployed addresses as constants, and a `Provider` TypeScript type. No external ABI files to import — everything is self-contained for the frontend bundle.

## Deployment

### Vercel
- Connected GitHub repo, set root directory to `frontend/`
- Build command: `npm run build`
- Zero environment variables needed (all chain config is client-side)
- Auto-deploys on every push to `master`

### Key Decision: No Backend for Frontend
The frontend is entirely client-side. All contract reads use Wagmi's `useReadContract` hooks hitting BSC Testnet RPC directly. Inference requests go straight from the browser to the provider's endpoint. No API routes, no middleware.

## Result

✅ **Live marketplace dashboard at [clawcompute.vercel.app](https://clawcompute.vercel.app)**
- Real-time on-chain stats
- Provider discovery and selection
- Full create→infer→cancel→refund flow from the browser
- Wallet-connected transactions via MetaMask
