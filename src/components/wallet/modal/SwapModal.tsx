"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { FaExchangeAlt } from "react-icons/fa";
import { SiSolana } from "react-icons/si";

const TronIcon = ({ className = "w-4 h-4 text-[#FF4747]" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

interface Props {
  onClose: () => void;
}

export default function SwapModal({ onClose }: Props) {
  const [selectedNetwork, setSelectedNetwork] = useState<"Solana" | "Tron">("Solana");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md rounded-2xl shadow-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-white/10 p-6 space-y-6"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 250, damping: 20 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition"
          >
            <FiX size={22} />
          </button>

          {/* Title */}
          <h2 className="text-xl font-semibold text-white">Swap Tokens</h2>

          {/* Network Selector */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setSelectedNetwork("Solana")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
                selectedNetwork === "Solana"
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-gray-600 text-gray-400"
              }`}
            >
              <SiSolana className="text-[#14F195]" /> Solana
            </button>
            <button
              onClick={() => setSelectedNetwork("Tron")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
                selectedNetwork === "Tron"
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-gray-600 text-gray-400"
              }`}
            >
              <TronIcon /> Tron
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
              />
              <span className="text-sm text-gray-400 font-medium">USDT</span>
            </div>
          </div>

          {/* Swap Icon */}
          <div className="flex justify-center">
            <div className="bg-blue-500/10 p-3 rounded-full border border-blue-500/20">
              <FaExchangeAlt className="text-blue-500 text-xl rotate-90" />
            </div>
          </div>

          {/* To */}
          <div>
            <label className="text-sm text-gray-400">To</label>
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mt-1">
              <input
                type="number"
                placeholder="0.00"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                className="w-full bg-transparent outline-none text-white text-lg"
              />
              <span className="text-sm text-gray-400 font-medium">
                {selectedNetwork === "Solana" ? "SOL" : "TRX"}
              </span>
            </div>
          </div>

          {/* Exchange Info */}
          <div className="text-center text-gray-500 text-xs">
            1 USDT ≈ 0.034 {selectedNetwork === "Solana" ? "SOL" : "TRX"}
          </div>

          {/* Swap Button */}
          <button
            onClick={() => alert("Swap Initiated")}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition"
          >
            Swap Now
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
