"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { FaLink, FaExchangeAlt } from "react-icons/fa";
import { SiSolana } from "react-icons/si";

/* Custom Tron Icon */
const TronIcon = ({ className = "w-4 h-4 text-[#FF4747]" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

interface Props {
  onClose: () => void;
}

export default function BridgeModal({ onClose }: Props) {
  const [fromNetwork, setFromNetwork] = useState<"Solana" | "Tron">("Solana");
  const [toNetwork, setToNetwork] = useState<"Tron" | "Solana">("Tron");
  const [amount, setAmount] = useState("");

  const handleSwitchNetworks = () => {
    setFromNetwork(toNetwork);
    setToNetwork(fromNetwork);
  };

  const handleBridge = () => {
    alert(`Bridge ${amount} USDT from ${fromNetwork} to ${toNetwork}`);
  };

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
          transition={{ type: 'spring', stiffness: 250, damping: 22 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition"
          >
            <FiX size={22} />
          </button>

          {/* Title */}
          <div className="flex items-center gap-2">
            <FaLink className="text-blue-500 text-xl" />
            <h2 className="text-xl font-semibold text-white">Bridge Assets</h2>
          </div>

          {/* From Network */}
          <div>
            <label className="text-sm text-gray-400">From</label>
            <button
              onClick={() => handleSwitchNetworks()}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mt-1 w-full text-white"
            >
              <div className="flex items-center gap-2">
                {fromNetwork === "Solana" ? (
                  <SiSolana className="text-[#14F195]" />
                ) : (
                  <TronIcon />
                )}
                {fromNetwork}
              </div>
              <span className="text-xs text-gray-400">Click icon below to swap</span>
            </button>
          </div>

          {/* Swap Direction Icon */}
          <div className="flex justify-center -my-1">
            <button
              onClick={handleSwitchNetworks}
              className="p-3 rounded-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition"
            >
              <FaExchangeAlt className="text-blue-500 text-lg rotate-90" />
            </button>
          </div>

          {/* To Network */}
          <div>
            <label className="text-sm text-gray-400">To</label>
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mt-1 w-full text-white">
              <div className="flex items-center gap-2">
                {toNetwork === "Solana" ? (
                  <SiSolana className="text-[#14F195]" />
                ) : (
                  <TronIcon />
                )}
                {toNetwork}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm text-gray-400">Amount (USDT)</label>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-1">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent outline-none text-white text-lg"
              />
            </div>
          </div>

          {/* Info */}
          <div className="text-center text-gray-500 text-xs">
            Estimated Bridge Time: ~45 seconds
          </div>

          {/* Bridge Button */}
          <button
            onClick={handleBridge}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition"
          >
            Bridge Now
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
