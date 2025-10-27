
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiLoader, FiChevronDown } from "react-icons/fi";
import { FaExchangeAlt, FaEthereum, FaBitcoin } from "react-icons/fa";
import { SiSolana } from "react-icons/si";
import toast from "react-hot-toast";
import { walletEventBus } from "@/lib/events";


/* ✅ Tron Icon with direct color binding */
const TronIcon = ({ color = "#FF4747", className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    className={className}
    fill={color}
  >
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

/* ✅ Network definitions with icons + brand colors */
const NETWORKS = [
  { name: "Ethereum", symbol: "ETH", Icon: FaEthereum, color: "#627EEA", tokens: ["ETH", "USDT"] },
  { name: "Tron", symbol: "TRX", Icon: TronIcon, color: "#FF4747", tokens: ["TRX", "USDT"] },
  { name: "Solana", symbol: "SOL", Icon: SiSolana, color: "#14F195", tokens: ["SOL", "USDT"] },
  { name: "Bitcoin", symbol: "BTC", Icon: FaBitcoin, color: "#F7931A", tokens: ["BTC"] },
];

export default function BridgeModal({ onClose }: { onClose: () => void }) {
  const [fromNetwork, setFromNetwork] = useState(NETWORKS[1]);
  const [toNetwork, setToNetwork] = useState(NETWORKS[2]);
  const [fromToken, setFromToken] = useState("TRX");
  const [toToken, setToToken] = useState("SOL");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // dropdown toggles
  const [openFromNet, setOpenFromNet] = useState(false);
  const [openToNet, setOpenToNet] = useState(false);
  const [openFromToken, setOpenFromToken] = useState(false);
  const [openToToken, setOpenToToken] = useState(false);

  /* ✅ Auto load user */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUserId(JSON.parse(stored).id);
  }, []);

  /* ✅ Sync tokens when network changes */
  useEffect(() => {
    if (!fromNetwork.tokens.includes(fromToken)) setFromToken(fromNetwork.tokens[0]);
  }, [fromNetwork]);
  useEffect(() => {
    if (!toNetwork.tokens.includes(toToken)) setToToken(toNetwork.tokens[0]);
  }, [toNetwork]);

  /* ✅ Fetch conversion quote dynamically */
  useEffect(() => {
    if (!amount || Number(amount) <= 0) return;
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/bridge/quote?from=${fromToken}&to=${toToken}&amount=${amount}`);
        const data = await res.json();
        setQuote(data);
      } catch (err) {
        console.error("Quote fetch failed", err);
      }
    };
    fetchQuote();
  }, [fromToken, toToken, amount]);

  const handleSwitch = () => {
    const tempNet = fromNetwork;
    const tempToken = fromToken;
    setFromNetwork(toNetwork);
    setToNetwork(tempNet);
    setFromToken(toToken);
    setToToken(tempToken);
  };

  const handleBridge = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bridge/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUser: userId,
          fromChain: fromNetwork.symbol,
          toChain: toNetwork.symbol,
          fromToken,
          toToken,
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

  /* ========= Subcomponents ========= */

  const Dropdown = ({
    open,
    setOpen,
    items,
    onSelect,
    current,
  }: {
    open: boolean;
    setOpen: (v: boolean) => void;
    items: any[];
    onSelect: (item: any) => void;
    current: any;
  }) => (
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
            {items.map((item) => (
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

  const TokenDropdown = ({
    open,
    setOpen,
    tokens,
    current,
    onSelect,
  }: {
    open: boolean;
    setOpen: (v: boolean) => void;
    tokens: string[];
    current: string;
    onSelect: (v: string) => void;
  }) => (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-2 text-white hover:bg-white/10 transition"
      >
        <span>{current}</span>
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
            {tokens.map((t) => (
              <button
                key={t}
                onClick={() => {
                  onSelect(t);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-white hover:bg-blue-500/20 transition"
              >
                {t}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ========= Main Modal ========= */
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md rounded-2xl shadow-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6 space-y-6 overflow-hidden"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 25 }}
        >
          {/* Close Button */}
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
            <label className="text-sm text-gray-400">From</label>
            <Dropdown
              open={openFromNet}
              setOpen={setOpenFromNet}
              items={NETWORKS}
              onSelect={setFromNetwork}
              current={fromNetwork}
            />
            <TokenDropdown
              open={openFromToken}
              setOpen={setOpenFromToken}
              tokens={fromNetwork.tokens}
              current={fromToken}
              onSelect={setFromToken}
            />
          </div>

          {/* SWITCH */}
          <div className="flex justify-center">
            <button
              onClick={handleSwitch}
              className="p-3 rounded-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition"
            >
              <FaExchangeAlt className="text-blue-500 text-lg rotate-90" />
            </button>
          </div>

          {/* TO */}
          <div>
            <label className="text-sm text-gray-400">To</label>
            <Dropdown
              open={openToNet}
              setOpen={setOpenToNet}
              items={NETWORKS}
              onSelect={setToNetwork}
              current={toNetwork}
            />
            <TokenDropdown
              open={openToToken}
              setOpen={setOpenToToken}
              tokens={toNetwork.tokens}
              current={toToken}
              onSelect={setToToken}
            />
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

          {/* QUOTE */}
          {quote && (
            <div className="text-xs text-gray-400 text-center">
              Fee: {quote.fee || "—"} | Rate: {quote.toAmount?.toFixed(4)} {toToken}
            </div>
          )}

          {/* BUTTON */}
          <button
            onClick={handleBridge}
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Processing..." : `Bridge ${fromToken} → ${toToken}`}
          </button>

          {/* Overlay Loader */}
          <AnimatePresence>
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
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



