
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiLoader, FiChevronDown, FiArrowRight } from "react-icons/fi";
import { FaExchangeAlt, FaEthereum, FaBitcoin } from "react-icons/fa";
import { SiSolana, SiTether, SiDogecoin, SiMonero, SiRipple } from "react-icons/si";
import toast from "react-hot-toast";
import { walletEventBus } from "@/lib/events";

/* ---------- Tron Icon ---------- */
const TronIcon = ({ color = "#FF4747", className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill={color}>
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

/* ---------- Networks ---------- */
const NETWORKS = [
  { name: "Ethereum", symbol: "ETH", Icon: FaEthereum, color: "#627EEA", tokens: ["ETH", "USDT(ERC20)"] },
  { name: "Tron", symbol: "TRX", Icon: TronIcon, color: "#FF4747", tokens: ["TRX", "USDT(TRC20)"] },
  { name: "Solana", symbol: "SOL", Icon: SiSolana, color: "#14F195", tokens: ["SOL", "USDT(SPL)"] },
  { name: "Bitcoin", symbol: "BTC", Icon: FaBitcoin, color: "#F7931A", tokens: ["BTC"] },
  { name: "Dogecoin", symbol: "DOGE", Icon: SiDogecoin, color: "#C2A633", tokens: ["DOGE"] },
  { name: "Monero", symbol: "XMR", Icon: SiMonero, color: "#FF6600", tokens: ["XMR"] },
  { name: "XRP", symbol: "XRP", Icon: SiRipple, color: "#0A74E6", tokens: ["XRP"] },
];

/* ---------- Token Icons ---------- */
const getTokenIcon = (token: string) => {
  if (token.includes("USDT")) return <SiTether className="text-[#26A17B] w-5 h-5" />;
  if (token.startsWith("TRX")) return <TronIcon />;
  if (token.startsWith("SOL")) return <SiSolana className="text-[#14F195] w-5 h-5" />;
  if (token.startsWith("ETH")) return <FaEthereum className="text-[#627EEA] w-5 h-5" />;
  if (token.startsWith("BTC")) return <FaBitcoin className="text-[#F7931A] w-5 h-5" />;
  if (token.startsWith("DOGE")) return <SiDogecoin className="text-[#C2A633] w-5 h-5" />;
  if (token.startsWith("XMR")) return <SiMonero className="text-[#FF6600] w-5 h-5" />;
  if (token.startsWith("XRP")) return <SiRipple className="text-[#0A74E6] w-5 h-5" />;
  return null;
};

/* ---------- Helper: strip network suffix ---------- */
const cleanTokenName = (token: string): string => token.replace(/\(.*?\)/, "").trim();

export default function BridgeModal({
  onClose,
  currentChain,
}: {
  onClose: () => void;
  currentChain?: "TRX" | "SOL" | "ETH" | "BTC" | "DOGE" | "XMR" | "XRP";
}) {
  const initialFrom = NETWORKS.find((n) => n.symbol === currentChain)!;
  const [fromNetwork] = useState(initialFrom);
  const [fromToken, setFromToken] = useState(initialFrom.tokens[0]);
  const [toNetwork, setToNetwork] = useState(NETWORKS.find((n) => n.symbol !== currentChain)!);
  const [toToken, setToToken] = useState(toNetwork.tokens[0]);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [openFromToken, setOpenFromToken] = useState(false);
  const [openToNet, setOpenToNet] = useState(false);
  const [openToToken, setOpenToToken] = useState(false);

  /* 🔹 Load user ID */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUserId(JSON.parse(stored).id);
  }, []);

  /* 🔹 Auto-reset To-Token when network changes */
  useEffect(() => {
    setToToken(toNetwork.tokens[0]);
  }, [toNetwork]);

  /* 🔹 Compatibility Logic */
  const isCompatible = useMemo(() => {
    const fromIsBTC = fromToken.startsWith("BTC") || fromNetwork.symbol === "BTC";
    const toIsBTC = toToken.startsWith("BTC") || toNetwork.symbol === "BTC";
    const fromIsUSDT = fromToken.includes("USDT");
    const toIsUSDT = toToken.includes("USDT");

    if ((fromIsBTC && toIsUSDT) || (toIsBTC && fromIsUSDT)) return false;
    if ((fromIsBTC && !toIsBTC) || (!fromIsBTC && toIsBTC)) return !fromIsUSDT && !toIsUSDT;

    return true;
  }, [fromToken, toToken, fromNetwork, toNetwork]);

  /* 🔹 Fetch Quote (cleaned token names) */
  useEffect(() => {
    if (!amount || Number(amount) <= 0 || !isCompatible) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      try {
        const fromBase = cleanTokenName(fromToken);
        const toBase = cleanTokenName(toToken);
        const res = await fetch(`/api/bridge/quote?from=${fromBase}&to=${toBase}&amount=${amount}`);
        const data = await res.json();
        setQuote(data);
      } catch (err) {
        console.error("Quote fetch failed", err);
        setQuote(null);
      }
    };
    fetchQuote();
  }, [fromToken, toToken, amount, isCompatible]);

  /* 🔹 Handle Bridge */
  const handleBridge = async () => {
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount");
    if (!isCompatible) return toast.error("This bridge pair is not supported");

    setSubmitting(true);
    try {
      const fromBase = cleanTokenName(fromToken);
      const toBase = cleanTokenName(toToken);

      const res = await fetch("/api/bridge/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUser: userId,
          fromChain: fromNetwork.symbol,
          toChain: toNetwork.symbol,
          fromToken: fromBase,
          toToken: toBase,
          amount,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Bridge failed");

      toast.success("Bridge completed successfully!");
      walletEventBus.refresh();
      setTimeout(() => onClose(), 500);
    } catch (err: any) {
      toast.error(err.message || "Bridge failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Dropdown Components ---------- */
  const TokenDropdown = ({ open, setOpen, tokens, current, onSelect }: any) => (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-2 text-white hover:bg-white/10 transition"
      >
        <div className="flex items-center gap-2">
          {getTokenIcon(current)}
          <span>{current}</span>
        </div>
        <FiChevronDown className={`text-gray-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute mt-2 w-full bg-[#1e293b]/95 border border-white/10 rounded-xl shadow-lg z-20 overflow-hidden"
          >
            {tokens.map((t: string) => (
              <button
                key={t}
                onClick={() => {
                  onSelect(t);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-left text-white hover:bg-blue-500/20 transition"
              >
                {getTokenIcon(t)}
                <span>{t}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const Dropdown = ({ open, setOpen, items, onSelect, current }: any) => (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-white hover:bg-white/10 transition"
      >
        <div className="flex items-center gap-2">
          <current.Icon color={current.color} className="w-5 h-5" />
          <span>{current.name}</span>
        </div>
        <FiChevronDown className={`text-gray-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute mt-2 w-full bg-[#1e293b]/95 border border-white/10 rounded-xl shadow-lg z-20 overflow-hidden"
          >
            {items.map((item: any) => (
              <button
                key={item.symbol}
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-left text-white hover:bg-blue-500/20 transition"
              >
                <item.Icon color={item.color} className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ---------- UI ---------- */
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md rounded-2xl shadow-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6 space-y-6"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 25 }}
        >
          {/* Close */}
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition disabled:opacity-40"
          >
            <FiX size={22} />
          </button>

          {/* Title */}
          <div className="flex items-center gap-2">
            <FaExchangeAlt className="text-blue-500 text-xl" />
            <h2 className="text-xl font-semibold text-white">Bridge Assets</h2>
          </div>

          {/* FROM */}
          <div>
            <label className="text-sm text-gray-400">From Chain</label>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-white">
              <fromNetwork.Icon color={fromNetwork.color} className="w-5 h-5" />
              <span className="ml-2">{fromNetwork.name}</span>
            </div>
            <label className="text-sm text-gray-400 mt-2">From Token</label>
           
            {fromNetwork.tokens.length > 1 ? (
              <TokenDropdown
                open={openFromToken}
                setOpen={setOpenFromToken}
                tokens={fromNetwork.tokens}
                current={fromToken}
                onSelect={setFromToken}
              />
            ) : (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-2 text-white text-sm font-medium">
                {getTokenIcon(fromNetwork.tokens[0])}
                <span>{fromNetwork.tokens[0]}</span>
              </div>
            )}
          </div>

          {/* TO */}
          <div>
            <label className="text-sm text-gray-400">To Chain</label>
            <Dropdown
              open={openToNet}
              setOpen={setOpenToNet}
              items={NETWORKS.filter((n) => n.symbol !== currentChain)}
              onSelect={setToNetwork}
              current={toNetwork}
            />
            <label className="text-sm text-gray-400 mt-2">To Token</label>
           
            {toNetwork.tokens.length > 1 ? (
              <TokenDropdown
                open={openToToken}
                setOpen={setOpenToToken}
                tokens={toNetwork.tokens}
                current={toToken}
                onSelect={setToToken}
              />
            ) : (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-2 text-white text-sm font-medium">
                {getTokenIcon(toNetwork.tokens[0])}
                <span>{toNetwork.tokens[0]}</span>
              </div>
            )}
          </div>

          {/* AMOUNT */}
          <div>
            <label className="text-sm text-gray-400">Amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* RATE */}
          {!isCompatible ? (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center py-2">
              ❌ This bridge pair is not supported
            </div>
          ) : (
            quote && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 px-4 py-3 flex items-center justify-between text-white mt-2"
              >
                <div className="flex items-center gap-2">
                  {getTokenIcon(fromToken)}
                  <span className="font-semibold">{amount || "0.00"}</span>
                  <span className="text-gray-400 text-sm">{cleanTokenName(fromToken)}</span>
                </div>
                <FiArrowRight className="text-blue-400 text-lg" />
                <div className="flex items-center gap-2">
                  {getTokenIcon(toToken)}
                  <span className="font-semibold">
                    {quote.toAmount?.toFixed(4) ?? "—"}
                  </span>
                  <span className="text-gray-400 text-sm">{cleanTokenName(toToken)}</span>
                </div>
              </motion.div>
            )
          )}

          {/* BUTTON */}
          <button
            onClick={handleBridge}
            disabled={submitting || !isCompatible || !quote}
            className={`w-full py-3 rounded-xl font-semibold transition ${
              submitting || !isCompatible || !quote
                ? "bg-gray-600/40 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90"
            }`}
          >
            {submitting
              ? "Processing..."
              : !isCompatible
              ? "Unsupported Pair"
              : quote
              ? `Bridge ${cleanTokenName(fromToken)} → ${cleanTokenName(toToken)}`
              : "Enter amount to get rate"}
          </button>

          {submitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl"
            >
              <FiLoader className="text-blue-400 animate-spin mb-3" size={28} />
              <p className="text-gray-200 text-sm">Processing transfer...</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



