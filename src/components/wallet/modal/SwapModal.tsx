"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { FaExchangeAlt } from "react-icons/fa";
import { SiSolana, SiEthereum } from "react-icons/si";

/* Tron icon */
const TronIcon = ({ className = "w-4 h-4 text-[#FF4747]" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

type ChainName = "Solana" | "Tron" | "Ethereum";
type ChainCode = "SOL" | "TRX" | "ETH";
type WalletBrief = { id: number; address: string };

interface Props {
  onClose: () => void;
  /** Pass the user’s wallet IDs so the server can sign */
  walletsBySymbol: Partial<Record<ChainCode, WalletBrief>>;
}

export default function SwapModal({ onClose, walletsBySymbol }: Props) {
  const [selectedNetwork, setSelectedNetwork] = useState<ChainName>("Solana");
  const [side, setSide] = useState<"USDT->NATIVE" | "NATIVE->USDT">("USDT->NATIVE");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [minOut, setMinOut] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [txLink, setTxLink] = useState<string | null>(null);

  // If your SOL execute route requires Jupiter's quoteResponse, store it here:
  const [quoteRoute, setQuoteRoute] = useState<any>(null);

  const chain: ChainCode =
    selectedNetwork === "Solana" ? "SOL" :
    selectedNetwork === "Tron"   ? "TRX" : "ETH";

  const nativeSymbol = chain === "SOL" ? "SOL" : chain === "TRX" ? "TRX" : "ETH";
  const fromWallet = walletsBySymbol?.[chain];

  const fromLabel = side === "USDT->NATIVE" ? "USDT" : nativeSymbol;
  const toLabel   = side === "USDT->NATIVE" ? nativeSymbol : "USDT";

  // QUOTE whenever amount / chain / side changes
  useEffect(() => {
    let cancelled = false;

    async function doQuote() {
      setErr(null);
      setTxLink(null);
      setMinOut(null);
      setQuoteRoute(null);

      if (!fromAmount || Number(fromAmount) <= 0) { setToAmount(""); return; }

      setQuoting(true);
      try {
        const r = await fetch("/api/swap/quote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chain, side, amount: fromAmount, slippageBps: 50 }),
        });
        const t = await r.text(); const j = t ? JSON.parse(t) : {};
        if (!r.ok) throw new Error(j?.error || `Quote failed (${r.status})`);
        if (cancelled) return;

        setToAmount(j.amountOut ?? "");
        setMinOut(j.minOut ?? null);
        // If your execute route wants the raw quote, keep it:
        if (j.route) setQuoteRoute(j.route);
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "Quote failed");
          setToAmount("");
        }
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }

    const id = setTimeout(doQuote, 300);
    return () => { cancelled = true; clearTimeout(id); };
  }, [chain, side, fromAmount]);

  async function onSwap() {
    try {
      setSubmitting(true);
      setErr(null);
      setTxLink(null);

      if (!fromWallet?.id) throw new Error(`No ${selectedNetwork} wallet found`);
      const amt = Number(fromAmount);
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid amount");

      const url =
        chain === "ETH" ? "/api/swap/eth" :
        chain === "SOL" ? "/api/swap/sol" :
        "/api/swap/trx";

      // If your SOL execute route is self-contained (re-quotes & swaps), this is enough:
      const payload: any = {
        fromWalletId: fromWallet.id,
        side,
        amount: fromAmount,
        slippageBps: 50,
      };
      if (minOut) payload.minOut = minOut;

      // If your SOL execute route expects the raw 'quoteResponse', uncomment:
      // if (chain === "SOL" && quoteRoute) payload.quoteResponse = quoteRoute;

      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const t = await r.text(); const j = t ? JSON.parse(t) : {};
      if (!r.ok) throw new Error(j?.error || "Swap failed");

      setTxLink(j.explorerTx || j.link || null);
      setFromAmount("");
      setToAmount("");
      setQuoteRoute(null);
      setMinOut(null);
    } catch (e: any) {
      setErr(e?.message || "Swap failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="relative w-full max-w-md rounded-2xl shadow-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-white/10 p-6 space-y-6"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 250, damping: 20 }}
        >
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white transition">
            <FiX size={22} />
          </button>

          <h2 className="text-xl font-semibold text-white">Swap Tokens</h2>

          {/* Network Selector */}
          <div className="flex justify-center gap-3">
            <button onClick={() => setSelectedNetwork("Solana")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${selectedNetwork === "Solana" ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-gray-600 text-gray-400"}`}>
              <SiSolana className="text-[#14F195]" /> Solana
            </button>
            <button onClick={() => setSelectedNetwork("Tron")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${selectedNetwork === "Tron" ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-gray-600 text-gray-400"}`}>
              <TronIcon /> Tron
            </button>
            <button onClick={() => setSelectedNetwork("Ethereum")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${selectedNetwork === "Ethereum" ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-gray-600 text-gray-400"}`}>
              <SiEthereum className="text-[#627EEA]" /> Ethereum
            </button>
          </div>

          {/* From */}
          <div>
            <label className="text-sm text-gray-400">From</label>
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mt-1">
              <input
                type="number"
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="w-full bg-transparent outline-none text-white text-lg"
                min="0"
              />
              <span className="text-sm text-gray-400 font-medium">{fromLabel}</span>
            </div>
          </div>

          {/* Flip */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => { setSide((s) => (s === "USDT->NATIVE" ? "NATIVE->USDT" : "USDT->NATIVE")); setFromAmount(""); setToAmount(""); setErr(null); }}
              className="bg-blue-500/10 p-3 rounded-full border border-blue-500/20 hover:bg-blue-500/20 transition"
              title="Flip direction"
            >
              <FaExchangeAlt className={`text-blue-500 text-xl ${quoting ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* To */}
          <div>
            <label className="text-sm text-gray-400">To</label>
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mt-1">
              <input type="text" readOnly placeholder="0.00" value={toAmount} className="w-full bg-transparent outline-none text-white text-lg" />
              <span className="text-sm text-gray-400 font-medium">{toLabel}</span>
            </div>
          </div>

          {/* Info / errors */}
          <div className="text-center text-xs">
            {err ? (
              <span className="text-rose-400">{err}</span>
            ) : toAmount && fromAmount ? (
              <span className="text-gray-400">
                1 {fromLabel} ≈ {(Number(toAmount) / Math.max(Number(fromAmount) || 1, 1)).toFixed(6)} {toLabel}
                {minOut && side === "USDT->NATIVE" && <> • Min receive: <span className="text-gray-300">{minOut} {toLabel}</span></>}
              </span>
            ) : (
              <span className="text-gray-500">Enter an amount to see a quote</span>
            )}
          </div>

          {/* Swap */}
          <button
            onClick={onSwap}
            disabled={
              submitting ||
              quoting ||
              !fromAmount ||
              Number(fromAmount) <= 0 ||
              !fromWallet?.id
            }
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Swapping..." : `Swap ${fromLabel} → ${toLabel}`}
          </button>

          {txLink && (
            <div className="text-xs text-center mt-2">
              <a className="underline text-blue-300" href={txLink} target="_blank" rel="noreferrer">
                View on explorer
              </a>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
