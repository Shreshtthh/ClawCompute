"use client";

import { useState } from "react";
import {
    useWriteContract,
    useReadContract,
    useAccount,
    usePublicClient,
} from "wagmi";
import {
    streamPayAbi,
    STREAM_PAY_ADDRESS,
    type Provider,
} from "@/lib/contracts";
import { formatEther } from "viem";
import { TxLink } from "./TxLink";
import {
    Send,
    X,
    Loader2,
    Bot,
    User,
    DollarSign,
} from "lucide-react";

type ChatStep =
    | "idle"
    | "creating_stream"
    | "waiting_stream_tx"
    | "inferencing"
    | "cancelling_stream"
    | "waiting_cancel_tx"
    | "done"
    | "error";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

interface ChatPanelProps {
    provider: Provider;
    onClose: () => void;
}

export function ChatPanel({ provider, onClose }: ChatPanelProps) {
    const { isConnected } = useAccount();
    const publicClient = usePublicClient();
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [step, setStep] = useState<ChatStep>("idle");
    const [createTxHash, setCreateTxHash] = useState<string>("");
    const [cancelTxHash, setCancelTxHash] = useState<string>("");
    const [costSummary, setCostSummary] = useState<string>("");

    const { writeContractAsync } = useWriteContract();

    // Read totalStreamsCreated for streamId lookup
    const { refetch: refetchStreamCount } = useReadContract({
        address: STREAM_PAY_ADDRESS,
        abi: streamPayAbi,
        functionName: "totalStreamsCreated",
    });

    const MAX_DURATION = 60n; // BigInt for contract args

    async function handleSubmit() {
        if (!prompt.trim() || !isConnected || !publicClient) return;

        const userMsg = prompt.trim();
        setPrompt("");
        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setCreateTxHash("");
        setCancelTxHash("");
        setCostSummary("");

        const startTime = Date.now();

        try {
            // Step 1: Create payment stream
            setStep("creating_stream");
            setMessages((prev) => [
                ...prev,
                {
                    role: "system",
                    content: "🔄 Creating payment stream on BSC Testnet…",
                },
            ]);

            const paymentValue = provider.pricePerSecond * MAX_DURATION;

            const hash = await writeContractAsync({
                address: STREAM_PAY_ADDRESS,
                abi: streamPayAbi,
                functionName: "createStream",
                args: [
                    provider.wallet as `0x${string}`,
                    MAX_DURATION,
                    "compute",
                    provider.id,
                ],
                value: paymentValue,
            });

            setCreateTxHash(hash);
            setStep("waiting_stream_tx");
            setMessages((prev) => [
                ...prev,
                { role: "system", content: "⏳ Waiting for stream transaction…" },
            ]);

            // Wait for confirmation using wagmi public client
            await publicClient.waitForTransactionReceipt({ hash });

            // Get stream ID
            const { data: streamCount } = await refetchStreamCount();
            const streamId = streamCount || 1n;

            setMessages((prev) => [
                ...prev,
                { role: "system", content: `✅ Stream #${streamId} created!` },
            ]);

            // Step 2: Send inference request
            setStep("inferencing");
            setMessages((prev) => [
                ...prev,
                {
                    role: "system",
                    content: `📤 Sending inference request to: ${provider.endpoint}`,
                },
            ]);

            let inferenceResult = "";
            try {
                const response = await fetch(provider.endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: userMsg }),
                });

                if (!response.ok) {
                    throw new Error(`Provider returned ${response.status}`);
                }

                const data = await response.json();
                inferenceResult = data.result || data.response || JSON.stringify(data);
            } catch (err: unknown) {
                const errMessage = err instanceof Error ? err.message : String(err);
                inferenceResult = `⚠️ Inference failed: ${errMessage}. The provider endpoint may be offline. Your stream will be cancelled and funds refunded.`;
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: inferenceResult },
            ]);

            // Step 3: Cancel stream to stop payment
            setStep("cancelling_stream");
            setMessages((prev) => [
                ...prev,
                { role: "system", content: "⏹️ Stopping payment stream…" },
            ]);

            try {
                const cancelHash = await writeContractAsync({
                    address: STREAM_PAY_ADDRESS,
                    abi: streamPayAbi,
                    functionName: "cancelStream",
                    args: [streamId],
                });

                setCancelTxHash(cancelHash);
                setStep("waiting_cancel_tx");
                await publicClient.waitForTransactionReceipt({ hash: cancelHash });

                const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
                const estimatedCost = formatEther(
                    provider.pricePerSecond * BigInt(Math.ceil(parseFloat(durationSec)))
                );
                setCostSummary(
                    `Duration: ${durationSec}s | Est. Cost: ${estimatedCost} tBNB`
                );

                setMessages((prev) => [
                    ...prev,
                    {
                        role: "system",
                        content: `✅ Stream cancelled. Unused funds refunded.`,
                    },
                ]);
            } catch {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "system",
                        content: "⚠️ Stream cancel failed (may have already ended).",
                    },
                ]);
            }

            setStep("done");
        } catch (err: unknown) {
            const errMessage = err instanceof Error ? err.message : String(err);
            setStep("error");
            setMessages((prev) => [
                ...prev,
                {
                    role: "system",
                    content: `❌ Error: ${errMessage.slice(0, 200)}`,
                },
            ]);
        }
    }

    const isProcessing =
        step !== "idle" && step !== "done" && step !== "error";

    return (
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col max-h-[600px]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-cyan-900/20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            {provider.modelName}
                        </h3>
                        <p className="text-[10px] text-gray-500">
                            {parseFloat(formatEther(provider.pricePerSecond)).toFixed(8)}{" "}
                            tBNB/s
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <Bot className="w-12 h-12 text-gray-700 mb-3" />
                        <p className="text-gray-500 text-sm">
                            Send a prompt to start an inference session.
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                            This will create a payment stream → get inference → cancel stream.
                        </p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        {msg.role !== "user" && (
                            <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "assistant"
                                    ? "bg-purple-500/20"
                                    : "bg-white/5"
                                    }`}
                            >
                                {msg.role === "assistant" ? (
                                    <Bot className="w-3.5 h-3.5 text-purple-400" />
                                ) : (
                                    <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
                                )}
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                                ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white"
                                : msg.role === "assistant"
                                    ? "bg-white/5 border border-white/10 text-gray-200"
                                    : "bg-transparent text-gray-500 text-xs italic"
                                }`}
                        >
                            {msg.content}
                        </div>
                        {msg.role === "user" && (
                            <div className="w-6 h-6 rounded-md bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                <User className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Tx Links & Cost */}
            {(createTxHash || cancelTxHash || costSummary) && (
                <div className="px-4 py-3 border-t border-white/5 flex flex-wrap items-center gap-2">
                    {createTxHash && <TxLink hash={createTxHash} label="Create" />}
                    {cancelTxHash && <TxLink hash={cancelTxHash} label="Cancel" />}
                    {costSummary && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <DollarSign className="w-3 h-3" />
                            {costSummary}
                        </span>
                    )}
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/5">
                {!isConnected ? (
                    <p className="text-center text-gray-500 text-sm py-2">
                        Connect your wallet to chat
                    </p>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !isProcessing && handleSubmit()}
                            placeholder="Ask the AI agent anything…"
                            disabled={isProcessing}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition-all disabled:opacity-50"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={isProcessing || !prompt.trim()}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
