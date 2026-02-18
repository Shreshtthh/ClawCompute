"use client";

import { useReadContract } from "wagmi";
import {
    computeRegistryAbi,
    streamPayAbi,
    COMPUTE_REGISTRY_ADDRESS,
    STREAM_PAY_ADDRESS,
} from "@/lib/contracts";
import { formatEther } from "viem";
import { Activity, Users, Zap, TrendingUp } from "lucide-react";

function StatCard({
    icon: Icon,
    label,
    value,
    gradient,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    gradient: string;
}) {
    return (
        <div className="relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" style={{ backgroundImage: gradient }} />
            <div className="glass-card rounded-2xl p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-gray-400">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-medium">
                        {label}
                    </span>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
            </div>
        </div>
    );
}

export function StatsBar() {
    const { data: registryStats } = useReadContract({
        address: COMPUTE_REGISTRY_ADDRESS,
        abi: computeRegistryAbi,
        functionName: "getRegistryStats",
    });

    const { data: protocolStats } = useReadContract({
        address: STREAM_PAY_ADDRESS,
        abi: streamPayAbi,
        functionName: "getProtocolStats",
    });

    const totalProviders = registryStats ? Number(registryStats[0]) : 0;
    const totalStreams = protocolStats ? Number(protocolStats[0]) : 0;
    const totalVolume = protocolStats ? formatEther(protocolStats[2]) : "0";
    const activeStreams = protocolStats ? Number(protocolStats[3]) : 0;

    // Format volume to max 6 decimals
    const formattedVolume = parseFloat(totalVolume).toFixed(4);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                icon={Users}
                label="Total Providers"
                value={totalProviders.toString()}
                gradient="linear-gradient(135deg, rgba(168,85,247,0.2), transparent)"
            />
            <StatCard
                icon={Activity}
                label="Active Streams"
                value={activeStreams.toString()}
                gradient="linear-gradient(135deg, rgba(34,211,238,0.2), transparent)"
            />
            <StatCard
                icon={TrendingUp}
                label="Volume (tBNB)"
                value={formattedVolume}
                gradient="linear-gradient(135deg, rgba(74,222,128,0.2), transparent)"
            />
            <StatCard
                icon={Zap}
                label="Total Streams"
                value={totalStreams.toString()}
                gradient="linear-gradient(135deg, rgba(251,191,36,0.2), transparent)"
            />
        </div>
    );
}
