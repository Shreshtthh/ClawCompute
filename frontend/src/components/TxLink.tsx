"use client";

import { ExternalLink } from "lucide-react";
import { BSCSCAN_URL } from "@/lib/contracts";

interface TxLinkProps {
    hash: string;
    label?: string;
}

export function TxLink({ hash, label }: TxLinkProps) {
    const truncated = `${hash.slice(0, 6)}…${hash.slice(-4)}`;
    return (
        <a
            href={`${BSCSCAN_URL}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-purple-300 hover:bg-white/10 hover:border-purple-500/30 transition-all"
        >
            {label && <span className="text-gray-400 font-sans">{label}</span>}
            <span>{truncated}</span>
            <ExternalLink className="w-3 h-3" />
        </a>
    );
}
