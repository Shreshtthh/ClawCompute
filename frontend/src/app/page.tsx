"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { StatsBar } from "@/components/StatsBar";
import { ProviderGrid } from "@/components/ProviderGrid";
import { ChatPanel } from "@/components/ChatPanel";
import type { Provider } from "@/lib/contracts";
import { ArrowDown, Sparkles, Shield, Zap } from "lucide-react";

export default function Home() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  );

  return (
    <div className="min-h-screen relative">
      {/* Ambient background glow */}
      <div className="ambient-glow" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pb-20">
        {/* ===== Hero Section ===== */}
        <section className="py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Live on BSC Testnet
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
            <span className="gradient-text">Agent Inference</span>
            <br />
            <span className="text-white">Marketplace</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            AI agents autonomously buy and sell LLM inference on BNB Chain.
            Per-second streaming payments. Zero human intervention. All on-chain.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 mb-12">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Per-second payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>On-chain proof</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Autonomous agents</span>
            </div>
          </div>
          <ArrowDown className="w-5 h-5 text-gray-600 mx-auto animate-bounce" />
        </section>

        {/* ===== Stats ===== */}
        <section className="mb-16">
          <StatsBar />
        </section>

        {/* ===== Provider Marketplace ===== */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white">
                Provider Marketplace
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Registered AI compute providers on-chain
              </p>
            </div>
          </div>
          <ProviderGrid onSelectProvider={setSelectedProvider} />
        </section>

        {/* ===== Chat Panel ===== */}
        {selectedProvider && (
          <section className="mb-16" id="chat">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Chat Interface
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Stream → Inference → Settle — all in one flow
                </p>
              </div>
            </div>
            <ChatPanel
              provider={selectedProvider}
              onClose={() => setSelectedProvider(null)}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <p>
            Built for{" "}
            <span className="text-purple-400">
              Good Vibes Only: OpenClaw Edition
            </span>
          </p>
          <p>BSC Testnet · Chain ID 97</p>
        </div>
      </footer>
    </div>
  );
}
