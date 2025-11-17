
// "use client";

// import React, { useState } from "react";
// import { FaExchangeAlt } from "react-icons/fa";
// import { SiEthereum, SiBitcoin, SiSolana, SiXrp } from "react-icons/si";

// const TronIcon = ({ className = "w-6 h-6" }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
//     <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
//   </svg>
// );

// export default function BridgeCard() {
//   const [fromChain, setFromChain] = useState("ETH");
//   const [toChain, setToChain] = useState("SOL");
//   const [amount, setAmount] = useState("");

//   const chains = [
//     { symbol: "ETH", name: "Ethereum", icon: <SiEthereum />, color: "#627EEA" },
//     { symbol: "BTC", name: "Bitcoin", icon: <SiBitcoin />, color: "#F7931A" },
//     { symbol: "SOL", name: "Solana", icon: <SiSolana />, color: "#14F195" },
//     { symbol: "TRX", name: "Tron", icon: <TronIcon />, color: "#FF060A" },
//     { symbol: "XRP", name: "XRP", icon: <SiXrp />, color: "#25A768" },
//   ];

//   const getChain = (s: string) => chains.find((c) => c.symbol === s);

//   const swap = () => {
//     setFromChain(toChain);
//     setToChain(fromChain);
//   };

//   return (
//     <div className="
//       rounded-3xl p-px 
//       bg-gradient-to-br from-purple-600/20 via-indigo-600/10 to-cyan-500/20 
//       h-full
//     ">
//       <div
//         className="
//           h-full rounded-3xl backdrop-blur-xl p-7 flex flex-col
//           shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]
//           border
//           bg-white dark:bg-[#101422]/80
//           border-gray-300 dark:border-white/10
//         "
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between mb-6">
//           <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
//             Bridge
//           </h3>
//           <span
//             className="
//               px-3 py-1 rounded-xl text-xs font-semibold
//               bg-purple-500/10 dark:bg-purple-500/20 
//               text-purple-600 dark:text-purple-300
//               border border-purple-500/20 dark:border-purple-500/30
//             "
//           >
//             Cross-chain
//           </span>
//         </div>

//         {/* Content */}
//         <div className="flex flex-col gap-5 flex-1">

//           {/* FROM BOX */}
//           <div className="
//             p-4 rounded-2xl border shadow-inner
//             bg-gray-50/60 dark:bg-white/5 
//             border-gray-300 dark:border-white/10
//           ">
//             <label className="text-xs text-gray-600 dark:text-gray-400 block mb-2">
//               From
//             </label>

//             <div className="flex items-center justify-between">
//               <input
//                 type="number"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value)}
//                 placeholder="0.0"
//                 className="
//                   bg-transparent w-full text-2xl font-semibold 
//                   text-gray-900 dark:text-white 
//                   outline-none placeholder:text-gray-500 dark:placeholder:text-gray-600
//                 "
//               />

//               <div
//                 style={{ borderColor: getChain(fromChain)?.color + "50" }}
//                 className="
//                   px-4 py-2 ml-3 rounded-xl backdrop-blur-sm border flex items-center gap-2
//                   bg-white/60 dark:bg-white/10 
//                   cursor-pointer hover:bg-white/80 dark:hover:bg-white/15 transition
//                 "
//               >
//                 <span style={{ color: getChain(fromChain)?.color }}>
//                   {getChain(fromChain)?.icon}
//                 </span>
//                 <span className="text-sm font-semibold text-gray-900 dark:text-white">
//                   {fromChain}
//                 </span>
//               </div>
//             </div>

//             <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
//               Balance: 0.00 {fromChain}
//             </p>
//           </div>

//           {/* Swap Button */}
//           <div className="flex justify-center -mt-3 -mb-3">
//             <button
//               onClick={swap}
//               className="
//                 w-12 h-12 rounded-full border 
//                 flex items-center justify-center 
//                 hover:scale-110 transition-all duration-300 shadow-lg

//                 bg-purple-400/20 dark:bg-purple-500/20
//                 border-purple-500/30 dark:border-purple-500/40
//                 text-purple-600 dark:text-purple-300
//                 hover:bg-purple-500/30
//               "
//             >
//               <FaExchangeAlt className="w-5 h-5" />
//             </button>
//           </div>

//           {/* TO BOX */}
//           <div className="
//             p-4 rounded-2xl border shadow-inner
//             bg-gray-50/60 dark:bg-white/5
//             border-gray-300 dark:border-white/10
//           ">
//             <label className="text-xs text-gray-600 dark:text-gray-400 block mb-2">To</label>

//             <div className="flex items-center justify-between">
//               <div className="text-2xl font-semibold text-gray-500 dark:text-gray-400">
//                 {amount ? parseFloat(amount).toFixed(4) : "0.0"}
//               </div>

//               <div
//                 style={{ borderColor: getChain(toChain)?.color + "50" }}
//                 className="
//                   px-4 py-2 ml-3 rounded-xl backdrop-blur-sm border flex items-center gap-2
//                   bg-white/60 dark:bg-white/10
//                   cursor-pointer hover:bg-white/80 dark:hover:bg-white/15 transition
//                 "
//               >
//                 <span style={{ color: getChain(toChain)?.color }}>
//                   {getChain(toChain)?.icon}
//                 </span>
//                 <span className="text-sm font-semibold text-gray-900 dark:text-white">
//                   {toChain}
//                 </span>
//               </div>
//             </div>

//             <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
//               You will receive: ~{amount ? parseFloat(amount).toFixed(4) : "0.0"} {toChain}
//             </p>
//           </div>

//           {/* Fees */}
//           <div
//             className="
//               rounded-2xl p-4 
//               bg-gradient-to-r from-purple-400/10 to-indigo-400/10 
//               border border-purple-400/20 dark:border-purple-500/20
//             "
//           >
//             <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
//               <span>Estimated time</span>
//               <span className="text-gray-900 dark:text-white font-semibold">~5 minutes</span>
//             </div>
//             <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
//               <span>Bridge fee</span>
//               <span className="text-gray-900 dark:text-white font-semibold">0.1%</span>
//             </div>
//             <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
//               <span>Network fee</span>
//               <span className="text-gray-900 dark:text-white font-semibold">~$2.50</span>
//             </div>
//           </div>

//           {/* Button */}
//           <button
//             disabled={!amount || parseFloat(amount) <= 0}
//             className="
//               w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-300 shadow-lg
//               text-white 
//               bg-gradient-to-r from-purple-500 to-pink-500 
//               hover:from-purple-600 hover:to-pink-600 
//               disabled:opacity-50 disabled:cursor-not-allowed
//             "
//           >
//             Bridge Assets
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaExchangeAlt } from "react-icons/fa";
import { FiLoader, FiChevronDown, FiArrowRight } from "react-icons/fi";
import { SiEthereum, SiBitcoin, SiSolana, SiXrp, SiTether, SiDogecoin, SiMonero } from "react-icons/si";
import toast from "react-hot-toast";
import { walletEventBus } from "@/lib/events";

const TronIcon = ({ className = "w-6 h-6", color = "#FF060A" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={color} viewBox="0 0 24 24" className={className}>
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

/* ---------- NETWORKS WITH TOKENS ---------- */
const NETWORKS = [
  { 
    symbol: "ETH", 
    name: "Ethereum", 
    icon: <SiEthereum />, 
    color: "#627EEA",
    tokens: ["ETH", "USDT(ERC20)"]
  },
  { 
    symbol: "TRX", 
    name: "Tron", 
    icon: <TronIcon />, 
    color: "#FF060A",
    tokens: ["TRX", "USDT(TRC20)"]
  },
  { 
    symbol: "SOL", 
    name: "Solana", 
    icon: <SiSolana />, 
    color: "#14F195",
    tokens: ["SOL", "USDT(SPL)"]
  },
  { 
    symbol: "BTC", 
    name: "Bitcoin", 
    icon: <SiBitcoin />, 
    color: "#F7931A",
    tokens: ["BTC"]
  },
  { 
    symbol: "DOGE", 
    name: "Dogecoin", 
    icon: <SiDogecoin />, 
    color: "#C2A633",
    tokens: ["DOGE"]
  },
  { 
    symbol: "XMR", 
    name: "Monero", 
    icon: <SiMonero />, 
    color: "#FF6600",
    tokens: ["XMR"]
  },
  { 
    symbol: "XRP", 
    name: "XRP", 
    icon: <SiXrp />, 
    color: "#25A768",
    tokens: ["XRP"]
  },
];

/* ---------- TOKEN ICONS ---------- */
const getTokenIcon = (token: string) => {
  if (token.includes("USDT")) return <SiTether className="text-[#26A17B] w-5 h-5" />;
  if (token.startsWith("TRX")) return <TronIcon className="w-5 h-5" color="#FF060A" />;
  if (token.startsWith("SOL")) return <SiSolana className="text-[#14F195] w-5 h-5" />;
  if (token.startsWith("ETH")) return <SiEthereum className="text-[#627EEA] w-5 h-5" />;
  if (token.startsWith("BTC")) return <SiBitcoin className="text-[#F7931A] w-5 h-5" />;
  if (token.startsWith("DOGE")) return <SiDogecoin className="text-[#C2A633] w-5 h-5" />;
  if (token.startsWith("XMR")) return <SiMonero className="text-[#FF6600] w-5 h-5" />;
  if (token.startsWith("XRP")) return <SiXrp className="text-[#25A768] w-5 h-5" />;
  return null;
};

/* ---------- HELPER: Clean token name ---------- */
const cleanTokenName = (token: string): string => token.replace(/\(.*?\)/, "").trim();

export default function BridgeCard() {
  const [fromNetwork, setFromNetwork] = useState(NETWORKS[0]); // ETH
  const [fromToken, setFromToken] = useState(NETWORKS[0].tokens[0]); // ETH
  const [toNetwork, setToNetwork] = useState(NETWORKS[2]); // SOL
  const [toToken, setToToken] = useState(NETWORKS[2].tokens[0]); // SOL
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingQuote, setFetchingQuote] = useState(false);

  const [openFromNet, setOpenFromNet] = useState(false);
  const [openFromToken, setOpenFromToken] = useState(false);
  const [openToNet, setOpenToNet] = useState(false);
  const [openToToken, setOpenToToken] = useState(false);

  /* 🔹 Load user ID */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUserId(JSON.parse(stored).id);
  }, []);

  /* 🔹 Auto-reset tokens when network changes */
  useEffect(() => {
    setFromToken(fromNetwork.tokens[0]);
  }, [fromNetwork]);

  useEffect(() => {
    setToToken(toNetwork.tokens[0]);
  }, [toNetwork]);

  /* 🔹 COMPATIBILITY LOGIC (same as BridgeModal) */
  const isCompatible = useMemo(() => {
    const fromIsBTC = fromToken.startsWith("BTC") || fromNetwork.symbol === "BTC";
    const toIsBTC = toToken.startsWith("BTC") || toNetwork.symbol === "BTC";
    const fromIsUSDT = fromToken.includes("USDT");
    const toIsUSDT = toToken.includes("USDT");

    // BTC cannot bridge to/from USDT
    if ((fromIsBTC && toIsUSDT) || (toIsBTC && fromIsUSDT)) return false;
    
    // BTC can only bridge to BTC (not to other native tokens if USDT is involved)
    if ((fromIsBTC && !toIsBTC) || (!fromIsBTC && toIsBTC)) {
      return !fromIsUSDT && !toIsUSDT;
    }

    return true;
  }, [fromToken, toToken, fromNetwork, toNetwork]);

  /* 🔹 FETCH QUOTE (auto calculation) */
  useEffect(() => {
    if (!amount || Number(amount) <= 0 || !isCompatible) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      setFetchingQuote(true);
      try {
        const fromBase = cleanTokenName(fromToken);
        const toBase = cleanTokenName(toToken);
        
        const res = await fetch(
          `/api/bridge/quote?from=${fromBase}&to=${toBase}&amount=${amount}`
        );
        
        if (!res.ok) throw new Error("Failed to fetch quote");
        
        const data = await res.json();
        setQuote(data);
      } catch (err) {
        console.error("Quote fetch failed", err);
        setQuote(null);
      } finally {
        setFetchingQuote(false);
      }
    };

    // Debounce quote fetching
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fromToken, toToken, amount, isCompatible]);

  /* 🔹 HANDLE BRIDGE */
  const handleBridge = async () => {
    if (!amount || Number(amount) <= 0) {
      return toast.error("Enter a valid amount");
    }
    
    if (!isCompatible) {
      return toast.error("This bridge pair is not supported");
    }

    if (!userId) {
      return toast.error("Please log in to bridge assets");
    }

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
          amount: amount,
        }),
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || "Bridge failed");
      }

      toast.success("Bridge completed successfully!");
      walletEventBus.refresh();
      
      // Reset form
      setAmount("");
      setQuote(null);
    } catch (err: any) {
      toast.error(err.message || "Bridge failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* 🔹 SWAP NETWORKS */
  const swapNetworks = () => {
    const tempNet = fromNetwork;
    const tempToken = fromToken;
    setFromNetwork(toNetwork);
    setFromToken(toToken);
    setToNetwork(tempNet);
    setToToken(tempToken);
  };

  const getChain = (symbol: string) => NETWORKS.find((c) => c.symbol === symbol);

  return (
    <div className="rounded-3xl p-px bg-gradient-to-br from-purple-600/20 via-indigo-600/10 to-cyan-500/20 h-full">
      <div className="h-full rounded-3xl backdrop-blur-xl p-5 sm:p-7 flex flex-col shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] border bg-white dark:bg-[#101422]/80 border-gray-300 dark:border-white/10">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Bridge
          </h3>
          <span className="px-2 sm:px-3 py-1 rounded-xl text-[10px] sm:text-xs font-semibold bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/30">
            Cross-chain
          </span>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col gap-3 sm:gap-5 flex-1">

          {/* FROM BOX */}
          <div className="p-3 sm:p-4 rounded-2xl border shadow-inner bg-gray-50/60 dark:bg-white/5 border-gray-300 dark:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">From</label>
              
              {/* Network Selector */}
              <div className="relative">
                <button
                  onClick={() => setOpenFromNet(!openFromNet)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/60 dark:bg-white/10 border border-gray-300 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/15 transition"
                >
                  <span style={{ color: fromNetwork.color }} className="text-sm">
                    {fromNetwork.icon}
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {fromNetwork.symbol}
                  </span>
                  <FiChevronDown className="text-gray-400 text-xs" />
                </button>

                {/* Network Dropdown */}
                <AnimatePresence>
                  {openFromNet && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-white/10 rounded-xl shadow-lg z-20 overflow-hidden"
                    >
                      {NETWORKS.map((net) => (
                        <button
                          key={net.symbol}
                          onClick={() => {
                            if (net.symbol !== toNetwork.symbol) {
                              setFromNetwork(net);
                              setOpenFromNet(false);
                            }
                          }}
                          disabled={net.symbol === toNetwork.symbol}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span style={{ color: net.color }}>{net.icon}</span>
                          <span className="text-sm text-gray-900 dark:text-white">{net.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="bg-transparent w-full text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />

              {/* Token Selector */}
              {fromNetwork.tokens.length > 1 ? (
                <div className="relative">
                  <button
                    onClick={() => setOpenFromToken(!openFromToken)}
                    style={{ borderColor: fromNetwork.color + "50" }}
                    className="px-3 py-2 rounded-xl backdrop-blur-sm border flex items-center gap-2 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 transition whitespace-nowrap"
                  >
                    {getTokenIcon(fromToken)}
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      {cleanTokenName(fromToken)}
                    </span>
                    <FiChevronDown className="text-gray-400 text-xs" />
                  </button>

                  {/* Token Dropdown */}
                  <AnimatePresence>
                    {openFromToken && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-white/10 rounded-xl shadow-lg z-20 overflow-hidden"
                      >
                        {fromNetwork.tokens.map((token) => (
                          <button
                            key={token}
                            onClick={() => {
                              setFromToken(token);
                              setOpenFromToken(false);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-blue-500/20 transition"
                          >
                            {getTokenIcon(token)}
                            <span className="text-sm text-gray-900 dark:text-white">
                              {cleanTokenName(token)}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div
                  style={{ borderColor: fromNetwork.color + "50" }}
                  className="px-3 py-2 rounded-xl backdrop-blur-sm border flex items-center gap-2 bg-white/60 dark:bg-white/10"
                >
                  {getTokenIcon(fromToken)}
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    {cleanTokenName(fromToken)}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Balance: 0.00 {cleanTokenName(fromToken)}
            </p>
          </div>

          {/* SWAP BUTTON */}
          <div className="flex justify-center -my-2 sm:-my-3">
            <button
              onClick={swapNetworks}
              disabled={submitting}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg bg-purple-400/20 dark:bg-purple-500/20 border-purple-500/30 dark:border-purple-500/40 text-purple-600 dark:text-purple-300 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaExchangeAlt className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* TO BOX */}
          <div className="p-3 sm:p-4 rounded-2xl border shadow-inner bg-gray-50/60 dark:bg-white/5 border-gray-300 dark:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">To</label>
              
              {/* Network Selector */}
              <div className="relative">
                <button
                  onClick={() => setOpenToNet(!openToNet)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/60 dark:bg-white/10 border border-gray-300 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/15 transition"
                >
                  <span style={{ color: toNetwork.color }} className="text-sm">
                    {toNetwork.icon}
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {toNetwork.symbol}
                  </span>
                  <FiChevronDown className="text-gray-400 text-xs" />
                </button>

                {/* Network Dropdown */}
                <AnimatePresence>
                  {openToNet && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-white/10 rounded-xl shadow-lg z-20 overflow-hidden"
                    >
                      {NETWORKS.map((net) => (
                        <button
                          key={net.symbol}
                          onClick={() => {
                            if (net.symbol !== fromNetwork.symbol) {
                              setToNetwork(net);
                              setOpenToNet(false);
                            }
                          }}
                          disabled={net.symbol === fromNetwork.symbol}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span style={{ color: net.color }}>{net.icon}</span>
                          <span className="text-sm text-gray-900 dark:text-white">{net.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="text-xl sm:text-2xl font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
                {fetchingQuote ? (
                  <FiLoader className="animate-spin w-6 h-6" />
                ) : quote?.toAmount ? (
                  quote.toAmount.toFixed(4)
                ) : (
                  "0.0"
                )}
              </div>

              {/* Token Selector */}
              {toNetwork.tokens.length > 1 ? (
                <div className="relative">
                  <button
                    onClick={() => setOpenToToken(!openToToken)}
                    style={{ borderColor: toNetwork.color + "50" }}
                    className="px-3 py-2 rounded-xl backdrop-blur-sm border flex items-center gap-2 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 transition whitespace-nowrap"
                  >
                    {getTokenIcon(toToken)}
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                      {cleanTokenName(toToken)}
                    </span>
                    <FiChevronDown className="text-gray-400 text-xs" />
                  </button>

                  {/* Token Dropdown */}
                  <AnimatePresence>
                    {openToToken && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-white/10 rounded-xl shadow-lg z-20 overflow-hidden"
                      >
                        {toNetwork.tokens.map((token) => (
                          <button
                            key={token}
                            onClick={() => {
                              setToToken(token);
                              setOpenToToken(false);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-blue-500/20 transition"
                          >
                            {getTokenIcon(token)}
                            <span className="text-sm text-gray-900 dark:text-white">
                              {cleanTokenName(token)}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div
                  style={{ borderColor: toNetwork.color + "50" }}
                  className="px-3 py-2 rounded-xl backdrop-blur-sm border flex items-center gap-2 bg-white/60 dark:bg-white/10"
                >
                  {getTokenIcon(toToken)}
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    {cleanTokenName(toToken)}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              You will receive: ~{quote?.toAmount ? quote.toAmount.toFixed(4) : "0.0"} {cleanTokenName(toToken)}
            </p>
          </div>

          {/* COMPATIBILITY WARNING */}
          {!isCompatible && amount && Number(amount) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs sm:text-sm text-center py-2 px-3"
            >
              ❌ This bridge pair is not supported
            </motion.div>
          )}

          {/* QUOTE DISPLAY */}
          {isCompatible && quote && amount && Number(amount) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 dark:border-purple-500/30 p-3"
            >
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  {getTokenIcon(fromToken)}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {amount}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {cleanTokenName(fromToken)}
                  </span>
                </div>
                <FiArrowRight className="text-purple-500 dark:text-purple-400" />
                <div className="flex items-center gap-2">
                  {getTokenIcon(toToken)}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {quote.toAmount?.toFixed(4) ?? "—"}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {cleanTokenName(toToken)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* FEES */}
          <div className="rounded-2xl p-3 sm:p-4 bg-gradient-to-r from-purple-400/10 to-indigo-400/10 border border-purple-400/20 dark:border-purple-500/20">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
              <span>Estimated time</span>
              <span className="text-gray-900 dark:text-white font-semibold">~5 minutes</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
              <span>Bridge fee</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {quote?.fee ? `${quote.fee}%` : "0.1%"}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
              <span>Network fee</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {quote?.networkFee ? `$${quote.networkFee}` : "~$2.50"}
              </span>
            </div>
          </div>

          {/* BUTTON */}
          <button
            onClick={handleBridge}
            disabled={!amount || parseFloat(amount) <= 0 || !isCompatible || !quote || submitting}
            className="w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-300 shadow-lg text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale relative"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <FiLoader className="animate-spin" />
                Processing...
              </span>
            ) : !isCompatible ? (
              "Unsupported Pair"
            ) : !quote && amount && Number(amount) > 0 ? (
              <span className="flex items-center justify-center gap-2">
                <FiLoader className="animate-spin" />
                Getting quote...
              </span>
            ) : quote ? (
              `Bridge ${cleanTokenName(fromToken)} → ${cleanTokenName(toToken)}`
            ) : (
              "Enter amount to bridge"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}