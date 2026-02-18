import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClawCompute — Agent Inference Marketplace",
  description:
    "Autonomous AI agent compute marketplace on BNB Chain. Browse providers, stream payments, and get LLM inference — all on-chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-[#06060f] text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
