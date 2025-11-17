
"use client";

import React, { useState } from "react";
import { FaExchangeAlt } from "react-icons/fa";
import { SiEthereum, SiBitcoin, SiSolana, SiXrp } from "react-icons/si";

const TronIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

export default function BridgeCard() {
  const [fromChain, setFromChain] = useState("ETH");
  const [toChain, setToChain] = useState("SOL");
  const [amount, setAmount] = useState("");

  const chains = [
    { symbol: "ETH", name: "Ethereum", icon: <SiEthereum />, color: "#627EEA" },
    { symbol: "BTC", name: "Bitcoin", icon: <SiBitcoin />, color: "#F7931A" },
    { symbol: "SOL", name: "Solana", icon: <SiSolana />, color: "#14F195" },
    { symbol: "TRX", name: "Tron", icon: <TronIcon />, color: "#FF060A" },
    { symbol: "XRP", name: "XRP", icon: <SiXrp />, color: "#25A768" },
  ];

  const getChain = (s: string) => chains.find((c) => c.symbol === s);

  const swap = () => {
    setFromChain(toChain);
    setToChain(fromChain);
  };

  return (
    <div className="
      rounded-3xl p-px 
      bg-gradient-to-br from-purple-600/20 via-indigo-600/10 to-cyan-500/20 
      h-full
    ">
      <div
        className="
          h-full rounded-3xl backdrop-blur-xl p-7 flex flex-col
          shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]
          border
          bg-white dark:bg-[#101422]/80
          border-gray-300 dark:border-white/10
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Bridge
          </h3>
          <span
            className="
              px-3 py-1 rounded-xl text-xs font-semibold
              bg-purple-500/10 dark:bg-purple-500/20 
              text-purple-600 dark:text-purple-300
              border border-purple-500/20 dark:border-purple-500/30
            "
          >
            Cross-chain
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 flex-1">

          {/* FROM BOX */}
          <div className="
            p-4 rounded-2xl border shadow-inner
            bg-gray-50/60 dark:bg-white/5 
            border-gray-300 dark:border-white/10
          ">
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-2">
              From
            </label>

            <div className="flex items-center justify-between">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="
                  bg-transparent w-full text-2xl font-semibold 
                  text-gray-900 dark:text-white 
                  outline-none placeholder:text-gray-500 dark:placeholder:text-gray-600
                "
              />

              <div
                style={{ borderColor: getChain(fromChain)?.color + "50" }}
                className="
                  px-4 py-2 ml-3 rounded-xl backdrop-blur-sm border flex items-center gap-2
                  bg-white/60 dark:bg-white/10 
                  cursor-pointer hover:bg-white/80 dark:hover:bg-white/15 transition
                "
              >
                <span style={{ color: getChain(fromChain)?.color }}>
                  {getChain(fromChain)?.icon}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {fromChain}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Balance: 0.00 {fromChain}
            </p>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -mt-3 -mb-3">
            <button
              onClick={swap}
              className="
                w-12 h-12 rounded-full border 
                flex items-center justify-center 
                hover:scale-110 transition-all duration-300 shadow-lg

                bg-purple-400/20 dark:bg-purple-500/20
                border-purple-500/30 dark:border-purple-500/40
                text-purple-600 dark:text-purple-300
                hover:bg-purple-500/30
              "
            >
              <FaExchangeAlt className="w-5 h-5" />
            </button>
          </div>

          {/* TO BOX */}
          <div className="
            p-4 rounded-2xl border shadow-inner
            bg-gray-50/60 dark:bg-white/5
            border-gray-300 dark:border-white/10
          ">
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-2">To</label>

            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-500 dark:text-gray-400">
                {amount ? parseFloat(amount).toFixed(4) : "0.0"}
              </div>

              <div
                style={{ borderColor: getChain(toChain)?.color + "50" }}
                className="
                  px-4 py-2 ml-3 rounded-xl backdrop-blur-sm border flex items-center gap-2
                  bg-white/60 dark:bg-white/10
                  cursor-pointer hover:bg-white/80 dark:hover:bg-white/15 transition
                "
              >
                <span style={{ color: getChain(toChain)?.color }}>
                  {getChain(toChain)?.icon}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {toChain}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              You will receive: ~{amount ? parseFloat(amount).toFixed(4) : "0.0"} {toChain}
            </p>
          </div>

          {/* Fees */}
          <div
            className="
              rounded-2xl p-4 
              bg-gradient-to-r from-purple-400/10 to-indigo-400/10 
              border border-purple-400/20 dark:border-purple-500/20
            "
          >
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
              <span>Estimated time</span>
              <span className="text-gray-900 dark:text-white font-semibold">~5 minutes</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
              <span>Bridge fee</span>
              <span className="text-gray-900 dark:text-white font-semibold">0.1%</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
              <span>Network fee</span>
              <span className="text-gray-900 dark:text-white font-semibold">~$2.50</span>
            </div>
          </div>

          {/* Button */}
          <button
            disabled={!amount || parseFloat(amount) <= 0}
            className="
              w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-300 shadow-lg
              text-white 
              bg-gradient-to-r from-purple-500 to-pink-500 
              hover:from-purple-600 hover:to-pink-600 
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Bridge Assets
          </button>
        </div>
      </div>
    </div>
  );
}
