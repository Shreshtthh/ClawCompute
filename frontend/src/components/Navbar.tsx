"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Cpu, Wallet, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";

function ConnectWallet() {
    const { address, isConnected } = useAccount();
    const { connectors, connect } = useConnect();
    const { disconnect } = useDisconnect();
    const [showOptions, setShowOptions] = useState(false);

    if (isConnected && address) {
        const truncated = `${address.slice(0, 6)}…${address.slice(-4)}`;
        return (
            <div className="relative">
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer"
                >
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-mono text-white">{truncated}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>
                {showOptions && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                        <div className="absolute right-0 mt-2 z-50 w-48 rounded-xl bg-[#12121f] border border-white/10 shadow-xl overflow-hidden">
                            <button
                                onClick={() => { disconnect(); setShowOptions(false); }}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Disconnect
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all cursor-pointer"
            >
                <Wallet className="w-4 h-4" />
                Connect Wallet
            </button>
            {showOptions && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                    <div className="absolute right-0 mt-2 z-50 w-56 rounded-xl bg-[#12121f] border border-white/10 shadow-xl overflow-hidden">
                        {connectors.map((connector) => (
                            <button
                                key={connector.uid}
                                onClick={() => { connect({ connector }); setShowOptions(false); }}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <Wallet className="w-4 h-4 text-purple-400" />
                                {connector.name}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export function Navbar() {
    return (
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[rgba(10,10,20,0.7)] border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Cpu className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a0a14] animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            ClawCompute
                        </h1>
                        <p className="text-[10px] text-gray-500 -mt-0.5 tracking-wider uppercase">
                            Inference Marketplace
                        </p>
                    </div>
                </div>
                <ConnectWallet />
            </div>
        </nav>
    );
}
