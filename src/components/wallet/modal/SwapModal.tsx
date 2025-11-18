
// "use client";

// import React, { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FiX } from "react-icons/fi";
// import { FaExchangeAlt } from "react-icons/fa";
// import { SiSolana, SiEthereum, SiTether } from "react-icons/si";
// import toast from "react-hot-toast";
// import { walletEventBus } from "@/lib/events";

// /* Tron Icon */
// const TronIcon = ({ className = "w-4 h-4 text-[#FF4747]" }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
//     <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
//   </svg>
// );

// type ChainCode = "SOL" | "TRX" | "ETH" | "BTC" | "DOGE" | "XMR" | "XRP";
// type WalletBrief = { id: number; address: string };

// interface Props {
//   onClose: () => void;
//   /** Pass the current chain code */
//   currentChain?: ChainCode;
//   /** Pass the user’s wallet IDs so the server can sign */
//   walletsBySymbol: Partial<Record<ChainCode, WalletBrief>>;
// }

// export default function SwapModal({ onClose, currentChain, walletsBySymbol }: Props) {
//   const [side, setSide] = useState<"USDT->NATIVE" | "NATIVE->USDT">("USDT->NATIVE");
//   const [fromAmount, setFromAmount] = useState("");
//   const [toAmount, setToAmount] = useState("");
//   const [minOut, setMinOut] = useState<string | null>(null);
//   const [quoting, setQuoting] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [err, setErr] = useState<string | null>(null);
//   const [txLink, setTxLink] = useState<string | null>(null);

//   const [quoteRoute, setQuoteRoute] = useState<any>(null);

//   // Detect if Bitcoin → swap disabled
//   const swapUnsupported = ["BTC", "DOGE", "XMR", "XRP"].includes(currentChain || "");
//   const fromWallet = walletsBySymbol?.[currentChain!];

//   const nativeSymbol = currentChain === "SOL" ? "SOL" : currentChain === "TRX" ? "TRX" : "ETH";
//   const usdtLabel =
//     currentChain === "SOL"
//       ? "USDT(SPL)"
//       : currentChain === "TRX"
//         ? "USDT(TRC20)"
//         : "USDT(ERC20)";

//   const fromLabel = side === "USDT->NATIVE" ? "USDT" : nativeSymbol;
//   const toLabel = side === "USDT->NATIVE" ? nativeSymbol : "USDT";

//   // ----------- QUOTE LOGIC -----------
//   useEffect(() => {
//     if (swapUnsupported) return; // no swaps for BTC

//     let cancelled = false;

//     async function doQuote() {
//       setErr(null);
//       setTxLink(null);
//       setMinOut(null);
//       setQuoteRoute(null);

//       if (!fromAmount || Number(fromAmount) <= 0) {
//         setToAmount("");
//         return;
//       }

//       setQuoting(true);
//       try {
//         const res = await fetch("/api/swap/quote", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             chain: currentChain,
//             side,
//             amount: fromAmount,
//             slippageBps: 50,
//           }),
//         });

//         const txt = await res.text();
//         const json = txt ? JSON.parse(txt) : {};
//         if (!res.ok) throw new Error(json?.error || "Quote failed");

//         if (cancelled) return;
//         setToAmount(json.amountOut ?? "");
//         setMinOut(json.minOut ?? null);
//         if (json.route) setQuoteRoute(json.route);
//       } catch (e: any) {
//         if (!cancelled) {
//           setErr(e?.message || "Quote failed");
//           setToAmount("");
//         }
//       } finally {
//         if (!cancelled) setQuoting(false);
//       }
//     }

//     const id = setTimeout(doQuote, 300);
//     return () => {
//       cancelled = true;
//       clearTimeout(id);
//     };
//   }, [currentChain, side, fromAmount]);

//   // ----------- EXECUTE SWAP -----------
//   async function onSwap() {
//     try {
//       if (swapUnsupported) {
//         toast.error("{currentChain} swap is not supported");
//         return;
//       }
//       setSubmitting(true);
//       setErr(null);
//       setTxLink(null);

//       if (!fromWallet?.id) throw new Error(`No ${nativeSymbol} wallet found`);
//       const amt = Number(fromAmount);
//       if (!Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid amount");

//       const url =
//         currentChain === "ETH"
//           ? "/api/swap/eth"
//           : currentChain === "SOL"
//             ? "/api/swap/sol"
//             : "/api/swap/trx";

//       const payload: any = {
//         fromWalletId: fromWallet.id,
//         side,
//         amount: fromAmount,
//         slippageBps: 50,
//       };
//       if (minOut) payload.minOut = minOut;
//       if (currentChain === "SOL" && quoteRoute) payload.quoteResponse = quoteRoute;

//       const r = await fetch(url, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const t = await r.text();
//       const j = t ? JSON.parse(t) : {};
//       if (!r.ok) throw new Error(j?.error || "Swap failed");

//       setTxLink(j.explorerTx || j.link || null);
//       walletEventBus.refresh();
//       toast.success("Swap completed!");
//       setFromAmount("");
//       setToAmount("");
//       setQuoteRoute(null);
//       setMinOut(null);

//       // auto-close after a short beat (so toast renders)
//       setTimeout(() => onClose(), 800);
//     } catch (e: any) {
//       setErr(e?.message || "Swap failed");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   // ----------- UI -----------
//   return (
//     <AnimatePresence>
//       <motion.div
//         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//       >
//         <motion.div
//           className="
//             relative w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-6 
//             border border-slate-200 bg-white 
//             dark:border-white/10 
//             dark:bg-[#110f20] dark:bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)]
//           "
//           initial={{ scale: 0.9, opacity: 0, y: 20 }}
//           animate={{ scale: 1, opacity: 1, y: 0 }}
//           exit={{ scale: 0.9, opacity: 0, y: 20 }}
//           transition={{ type: "spring", stiffness: 250, damping: 20 }}
//         >
//           {/* Close Button */}
//           <button
//             onClick={onClose}
//             className="absolute right-4 top-4 text-gray-400 hover:text-white transition"
//           >
//             <FiX size={22} />
//           </button>

//           <h2 className="text-xl font-semibold text-white flex items-center gap-2">
//             <FaExchangeAlt className="text-blue-500" /> Swap Tokens
//           </h2>

//           {swapUnsupported ? (
//             <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl py-4 text-center font-medium">
//               ⚠️ Swapping is not available for {currentChain}. Only native BTC supported.
//             </div>
//           ) : (
//             <>
//               {/* From */}
//               <div>
//                 <label className="text-sm text-gray-400">From</label>
//                 <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mt-1">
//                   <input
//                     type="number"
//                     placeholder="0.00"
//                     value={fromAmount}
//                     onChange={(e) => setFromAmount(e.target.value)}
//                     className="w-full bg-transparent outline-none text-white text-lg"
//                     min="0"
//                   />
//                   <span className="text-sm text-gray-400 font-medium">
//                     {side === "USDT->NATIVE" ? usdtLabel : nativeSymbol}
//                   </span>
//                 </div>
//               </div>

//               {/* Flip */}
//               <div className="flex justify-center">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setSide((s) => (s === "USDT->NATIVE" ? "NATIVE->USDT" : "USDT->NATIVE"));
//                     setFromAmount("");
//                     setToAmount("");
//                     setErr(null);
//                   }}
//                   className="bg-blue-500/10 p-3 rounded-full border border-blue-500/20 hover:bg-blue-500/20 transition"
//                   title="Flip direction"
//                 >
//                   <FaExchangeAlt
//                     className={`text-blue-500 text-xl ${quoting ? "animate-spin" : ""}`}
//                   />
//                 </button>
//               </div>

//               {/* To */}
//               <div>
//                 <label className="text-sm text-gray-400">To</label>
//                 <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mt-1">
//                   <input
//                     type="text"
//                     readOnly
//                     placeholder="0.00"
//                     value={toAmount}
//                     className="w-full bg-transparent outline-none text-white text-lg"
//                   />
//                   <span className="text-sm text-gray-400 font-medium">
//                     {side === "USDT->NATIVE" ? nativeSymbol : usdtLabel}
//                   </span>
//                 </div>
//               </div>

//               {/* Info */}
//               <div className="text-center text-xs">
//                 {err ? (
//                   <span className="text-rose-400">{err}</span>
//                 ) : toAmount && fromAmount ? (
//                   <span className="text-gray-400">
//                     1 {fromLabel} ≈{" "}
//                     {(Number(toAmount) / Math.max(Number(fromAmount) || 1, 1)).toFixed(6)} {toLabel}
//                     {minOut && side === "USDT->NATIVE" && (
//                       <>
//                         {" "}
//                         {/* • Min receive:{" "} */}
//                         {/* <span className="text-gray-300">
//                           {minOut} {toLabel}
//                         </span> */}
//                       </>
//                     )}
//                   </span>
//                 ) : (
//                   <span className="text-gray-500">Enter an amount to see a quote</span>
//                 )}
//               </div>

//               {/* Button */}
//               <button
//                 onClick={onSwap}
//                 disabled={
//                   submitting ||
//                   quoting ||
//                   !fromAmount ||
//                   Number(fromAmount) <= 0 ||
//                   !fromWallet?.id
//                 }
//                 className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
//               >
//                 {submitting ? "Swapping..." : `Swap ${fromLabel} → ${toLabel}`}
//               </button>

//               {txLink && (
//                 <div className="text-xs text-center mt-2">
//                   <a
//                     className="underline text-blue-300"
//                     href={txLink}
//                     target="_blank"
//                     rel="noreferrer"
//                   >
//                     View on explorer
//                   </a>
//                 </div>
//               )}
//             </>
//           )}
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { FaExchangeAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import { walletEventBus } from "@/lib/events";

import SendReceivePortal from "./SendReceivePortal"; // ⭐ IMPORTANT

/* Tron Icon */
const TronIcon = ({ className = "w-4 h-4 text-[#FF4747]" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

/* Types */
type ChainCode = "SOL" | "TRX" | "ETH" | "BTC" | "DOGE" | "XMR" | "XRP";
type WalletBrief = { id: number; address: string };

interface Props {
  onClose: () => void;
  currentChain?: ChainCode;
  walletsBySymbol: Partial<Record<ChainCode, WalletBrief>>;
}

export default function SwapModal({ onClose, currentChain, walletsBySymbol }: Props) {
  const [side, setSide] = useState<"USDT->NATIVE" | "NATIVE->USDT">("USDT->NATIVE");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [minOut, setMinOut] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [txLink, setTxLink] = useState<string | null>(null);
  const [quoteRoute, setQuoteRoute] = useState<any>(null);

  const swapUnsupported = ["BTC", "DOGE", "XMR", "XRP"].includes(currentChain || "");
  const fromWallet = walletsBySymbol?.[currentChain!];

  const nativeSymbol = currentChain === "SOL" ? "SOL" : currentChain === "TRX" ? "TRX" : "ETH";
  const usdtLabel =
    currentChain === "SOL"
      ? "USDT(SPL)"
      : currentChain === "TRX"
        ? "USDT(TRC20)"
        : "USDT(ERC20)";

  const fromLabel = side === "USDT->NATIVE" ? "USDT" : nativeSymbol;
  const toLabel = side === "USDT->NATIVE" ? nativeSymbol : "USDT";

  /* ---------------- QUOTE ---------------- */
  useEffect(() => {
    if (swapUnsupported) return;

    let cancelled = false;

    async function doQuote() {
      setErr(null);
      setTxLink(null);
      setMinOut(null);
      setQuoteRoute(null);

      if (!fromAmount || Number(fromAmount) <= 0) {
        setToAmount("");
        return;
      }

      setQuoting(true);

      try {
        const res = await fetch("/api/swap/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chain: currentChain,
            side,
            amount: fromAmount,
            slippageBps: 50,
          }),
        });

        const txt = await res.text();
        const json = txt ? JSON.parse(txt) : {};
        if (!res.ok) throw new Error(json?.error || "Quote failed");

        if (cancelled) return;

        setToAmount(json.amountOut ?? "");
        setMinOut(json.minOut ?? null);
        if (json.route) setQuoteRoute(json.route);
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
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [currentChain, side, fromAmount]);

  /* ---------------- SWAP ---------------- */
  async function onSwap() {
    try {
      if (swapUnsupported) {
        toast.error(`${currentChain} swap is not supported`);
        return;
      }
      setSubmitting(true);

      if (!fromWallet?.id) throw new Error(`No ${nativeSymbol} wallet found`);
      const amt = Number(fromAmount);
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid amount");

      const url =
        currentChain === "ETH"
          ? "/api/swap/eth"
          : currentChain === "SOL"
            ? "/api/swap/sol"
            : "/api/swap/trx";

      const payload: any = {
        fromWalletId: fromWallet.id,
        side,
        amount: fromAmount,
        slippageBps: 50,
      };
      if (minOut) payload.minOut = minOut;
      if (currentChain === "SOL" && quoteRoute) payload.quoteResponse = quoteRoute;

      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const t = await r.text();
      const j = t ? JSON.parse(t) : {};
      if (!r.ok) throw new Error(j?.error || "Swap failed");

      setTxLink(j.explorerTx || j.link || null);
      walletEventBus.refresh();
      toast.success("Swap completed!");

      setFromAmount("");
      setToAmount("");

      setTimeout(onClose, 800);
    } catch (e: any) {
      setErr(e?.message || "Swap failed");
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     UI (With Portal to hide header)
  ======================================================= */
  return (
    <SendReceivePortal>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="
              relative w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-6 
              border border-slate-200 bg-white 
              dark:border-white/10 
              dark:bg-[#110f20] dark:bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)]
            "
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition"
            >
              <FiX size={22} />
            </button>

            {/* Title */}
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaExchangeAlt className="text-blue-500" /> Swap Tokens
            </h2>

            {/* Unsupported */}
            {swapUnsupported ? (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl py-4 text-center font-medium">
                ⚠️ Swapping is not available for {currentChain}.
              </div>
            ) : (
              <>
                {/* From */}
                <div>
                  <label className="text-sm text-gray-800 dark:text-gray-300">From</label>
                  <div className="flex items-center justify-between bg-white/5 border-gray-300 dark:border-gray-900 rounded-xl p-3 mt-1">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-300 text-lg"
                      min="0"
                    />
                    <span className="text-sm text-gray-400 font-medium">
                      {side === "USDT->NATIVE" ? usdtLabel : nativeSymbol}
                    </span>
                  </div>
                </div>

                {/* Flip */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSide((s) => (s === "USDT->NATIVE" ? "NATIVE->USDT" : "USDT->NATIVE"));
                      setFromAmount("");
                      setToAmount("");
                      setErr(null);
                    }}
                    className="bg-blue-500/10 p-3 rounded-full border border-blue-500/20 hover:bg-blue-500/20 transition"
                  >
                    <FaExchangeAlt className={`text-blue-500 text-xl ${quoting ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* To */}
                <div>
                  <label className="text-sm text-gray-800 dark:text-gray-300">To</label>
                  <div className="flex items-center justify-between bg-white/5 border border border-gray-300 dark:border-gray-900 rounded-xl p-3 mt-1">
                    <input
                      type="text"
                      readOnly
                      placeholder="0.00"
                      value={toAmount}
                      className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-300 text-lg"
                    />
                    <span className="text-sm text-gray-400 font-medium">
                      {side === "USDT->NATIVE" ? nativeSymbol : usdtLabel}
                    </span>
                  </div>
                </div>

                {/* Rate / Error */}
                <div className="text-center text-xs">
                  {err ? (
                    <span className="text-rose-400">{err}</span>
                  ) :
                    toAmount && fromAmount ? (
                      <span className="text-gray-800 dark:text-gray-300">
                        1 {fromLabel} ≈ {(Number(toAmount) / Number(fromAmount)).toFixed(6)} {toLabel}
                      </span>
                    ) : (
                      <span className="text-gray-800 dark:text-gray-300">Enter an amount to see a quote</span>
                    )}
                </div>

                {/* Button */}
                <button
                  onClick={onSwap}
                  disabled={submitting || quoting || !fromAmount || Number(fromAmount) <= 0}
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
              </>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </SendReceivePortal>
  );
}
