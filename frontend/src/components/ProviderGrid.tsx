"use client";

import { useReadContract, useReadContracts } from "wagmi";
import {
    computeRegistryAbi,
    COMPUTE_REGISTRY_ADDRESS,
    type Provider,
} from "@/lib/contracts";
import { ProviderCard } from "./ProviderCard";
import { Loader2, ServerOff } from "lucide-react";

interface ProviderGridProps {
    onSelectProvider: (provider: Provider) => void;
}

export function ProviderGrid({ onSelectProvider }: ProviderGridProps) {
    // Step 1: Get active provider IDs
    const {
        data: activeIds,
        isLoading: idsLoading,
        isError: idsError,
    } = useReadContract({
        address: COMPUTE_REGISTRY_ADDRESS,
        abi: computeRegistryAbi,
        functionName: "getActiveProviderIds",
    });

    // Step 2: Fetch each provider's details
    const providerContracts = (activeIds || []).map((id) => ({
        address: COMPUTE_REGISTRY_ADDRESS,
        abi: computeRegistryAbi,
        functionName: "getProvider" as const,
        args: [id] as const,
    }));

    const { data: providerResults, isLoading: providersLoading } =
        useReadContracts({
            contracts: providerContracts,
        });

    const isLoading = idsLoading || providersLoading;

    // Parse provider data
    const providers: Provider[] = [];
    if (activeIds && providerResults) {
        for (let i = 0; i < activeIds.length; i++) {
            const result = providerResults[i];
            if (result?.status === "success" && result.result) {
                const r = result.result as readonly [string, string, bigint, string, boolean, bigint, bigint, bigint, bigint];
                providers.push({
                    id: activeIds[i],
                    wallet: r[0],
                    modelName: r[1],
                    pricePerSecond: r[2],
                    endpoint: r[3],
                    isActive: r[4],
                    totalEarned: r[5],
                    totalRequests: r[6],
                    registeredAt: r[7],
                    serviceType: r[8],
                });
            }
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <p className="text-gray-500 text-sm">Loading providers from chain…</p>
            </div>
        );
    }

    if (idsError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <ServerOff className="w-10 h-10 text-red-400" />
                <p className="text-gray-400 text-sm">
                    Failed to load providers. Check your RPC connection.
                </p>
            </div>
        );
    }

    if (providers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <ServerOff className="w-8 h-8 text-gray-600" />
                </div>
                <div className="text-center">
                    <p className="text-gray-400 font-medium">No providers registered</p>
                    <p className="text-gray-600 text-sm mt-1">
                        Run <code className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">npm run provider</code> to register one
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map((provider) => (
                <ProviderCard
                    key={provider.id.toString()}
                    provider={provider}
                    onChat={onSelectProvider}
                />
            ))}
        </div>
    );
}
