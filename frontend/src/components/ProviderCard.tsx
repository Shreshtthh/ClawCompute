"use client";

import { formatEther } from "viem";
import type { Provider } from "@/lib/contracts";
import { Globe, Zap, Clock, MessageSquare } from "lucide-react";

const SERVICE_LABELS: Record<number, string> = {
    0: "Compute",
    1: "Audit",
    2: "Data",
};

interface ProviderCardProps {
    provider: Provider;
    onChat: (provider: Provider) => void;
}

export function ProviderCard({ provider, onChat }: ProviderCardProps) {
    const priceFormatted = parseFloat(formatEther(provider.pricePerSecond)).toFixed(8);
    const serviceLabel = SERVICE_LABELS[Number(provider.serviceType)] || "Unknown";

    // Truncate endpoint for display
    const endpointDisplay =
        provider.endpoint.length > 40
            ? provider.endpoint.slice(0, 37) + "…"
            : provider.endpoint;

    return (
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 group hover:border-purple-500/30 transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white truncate">
                            {provider.modelName}
                        </h3>
                        {provider.isActive && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[10px] text-green-400 font-medium uppercase">
                                    Live
                                </span>
                            </span>
                        )}
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-medium uppercase tracking-wider">
                        {serviceLabel}
                    </span>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                    <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span className="text-gray-500">Price:</span>
                    <span className="text-white font-mono text-xs">
                        {priceFormatted} tBNB/s
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-gray-500">Endpoint:</span>
                    <span className="text-gray-300 font-mono text-xs truncate">
                        {endpointDisplay}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-gray-500">Requests:</span>
                    <span className="text-white font-mono text-xs">
                        {provider.totalRequests.toString()}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="text-gray-500">Registered:</span>
                    <span className="text-gray-300 text-xs">
                        {new Date(Number(provider.registeredAt) * 1000).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {/* Chat button */}
            <button
                onClick={() => onChat(provider)}
                className="mt-auto w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
                Chat with Agent
            </button>
        </div>
    );
}
