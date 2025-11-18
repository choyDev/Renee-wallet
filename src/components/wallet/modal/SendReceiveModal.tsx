
// "use client";

// import React, { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FiX, FiCopy, FiLoader } from "react-icons/fi";
// import { SiSolana, SiEthereum, SiBitcoin, SiTether, SiDogecoin, SiXrp, SiMonero } from "react-icons/si";
// import QRCode from "react-qr-code";
// import toast from "react-hot-toast";
// import { walletEventBus } from "@/lib/events";

// const TronIcon = ({ className = "w-4 h-4 text-[#FF4747]" }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
//     <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
//   </svg>
// );

// type SymbolCode = "SOL" | "TRX" | "ETH" | "BTC" | "DOGE" | "XMR" | "XRP";
// type TokenCode = "NATIVE" | "USDT";
// type WalletBrief = { id: number; address: string };
// type SendResult = { id: string; link?: string };

// interface Props {
//   type: "send" | "receive";
//   currentChain?: SymbolCode;
//   onClose: () => void;
//   walletsBySymbol?: Partial<Record<SymbolCode, WalletBrief>>;
// }

// export default function SendReceiveModal({
//   type,
//   currentChain,
//   onClose,
//   walletsBySymbol = {},
// }: Props) {
//   const [selectedToken, setSelectedToken] = useState<TokenCode>("NATIVE");
//   const [showTokenDropdown, setShowTokenDropdown] = useState(false);
//   const [to, setTo] = useState("");
//   const [amount, setAmount] = useState("");
//   const [memo, setMemo] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const selectedSym = currentChain ?? "SOL";
//   const currentWallet = walletsBySymbol[selectedSym];
//   const currentAddress = currentWallet?.address ?? "—";

//   // Choose icon for each network
//   const networkIcons: Record<SymbolCode, React.ReactNode> = {
//     SOL: <SiSolana className="text-[#14F195] text-lg" />,
//     TRX: <TronIcon />,
//     ETH: <SiEthereum className="text-[#627EEA] text-lg" />,
//     BTC: <SiBitcoin className="text-[#F7931A] text-lg" />,
//     DOGE:<SiDogecoin className="text-[#C2A633] text-lg" />,
//     XMR: <SiMonero className="text-[#FF6600] text-lg" />,
//     XRP: <SiXrp className="text-[#0A74E6] text-lg" />,
//   };

//   // token options per chain
//   const tokensForNetwork: { code: TokenCode; label: string }[] = (() => {
//     // networks without USDT
//     if (["BTC", "DOGE", "XMR", "XRP"].includes(selectedSym)) {
//       return [{ code: "NATIVE", label: selectedSym }];
//     }

//     // Determine correct USDT label based on chain
//     let usdtLabel = "USDT";
//     switch (selectedSym) {
//       case "TRX":
//         usdtLabel = "USDT (TRC-20)";
//         break;
//       case "ETH":
//         usdtLabel = "USDT (ERC-20)";
//         break;
//       case "SOL":
//         usdtLabel = "USDT (SPL)";
//         break;
//     }

//     return [
//       { code: "NATIVE", label: selectedSym },
//       { code: "USDT", label: usdtLabel },
//     ];
//   })();


//   /* ------------------ SEND FUNCTIONS ------------------ */
//   async function sendNative(): Promise<SendResult> {
//     const amt = parseFloat(amount);
//     let endpoint = "";
//     let body: any = { fromWalletId: currentWallet!.id, to, amount };

//     switch (selectedSym) {
//       case "SOL":
//         endpoint = "/api/solana/send";
//         body = { fromWalletId: currentWallet!.id, to, amountSol: amt, memo: memo || undefined };
//         break;
//       case "TRX":
//         endpoint = "/api/tron/send";
//         body = { fromWalletId: currentWallet!.id, to, amountTrx: amt };
//         break;
//       case "ETH":
//         endpoint = "/api/eth/send";
//         body = { fromWalletId: currentWallet!.id, to, amountEth: amt };
//         break;
//       case "BTC":
//         endpoint = "/api/bitcoin/send";
//         body = { fromWalletId: currentWallet!.id, to, amountBtc: amt };
//         break;
//         case "DOGE":
//           endpoint = "/api/dogecoin/send";
//           body = { fromWalletId: currentWallet!.id, to, amountDoge: amt };
//           break;

//         case "XRP":
//           endpoint = "/api/xrp/send";
//           body = { fromWalletId: currentWallet!.id, to, amountXrp: amt, memo: memo || undefined };
//           break;
    
//         case "XMR":
//           endpoint = "/api/xmr/send";
//           body = { fromWalletId: currentWallet!.id, to, amountXmr: amt, paymentId: memo || undefined };
//           break;
//       default:
//         throw new Error("Unsupported chain");
//     }

//     const res = await fetch(endpoint, {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify(body),
//     });

//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
//     return { id: data.signature || data.txid || data.hash, link: data.explorerTx };
//   }

//   async function sendUSDT(): Promise<SendResult> {
//     const amt = parseFloat(amount);
//     let endpoint = "";

//     switch (selectedSym) {
//       case "TRX":
//         endpoint = "/api/tron/send-usdt";
//         break;
//       case "ETH":
//         endpoint = "/api/eth/send-usdt";
//         break;
//       case "SOL":
//         endpoint = "/api/solana/send-usdt";
//         break;
//       default:
//         throw new Error(`USDT not supported on ${selectedSym}`);
//     }

//     const res = await fetch(endpoint, {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountUsdt: amt }),
//     });

//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
//     return { id: data.signature || data.txid || data.hash, link: data.explorerTx };
//   }

//   async function onSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setSubmitting(true);
//     setError(null);

//     try {
//       if (!currentWallet?.id) throw new Error("No wallet for this chain");
//       const amt = parseFloat(amount);
//       if (!to || !Number.isFinite(amt) || amt <= 0)
//         throw new Error("Enter valid address and amount");

//       const result =
//         selectedToken === "USDT" ? await sendUSDT() : await sendNative();

//       toast.success("Transaction sent successfully!");
//       walletEventBus.refresh();
//       setTimeout(onClose, 500);
//     } catch (err: any) {
//       setError(err.message || "Transaction failed");
//       toast.error(err.message || "Failed to send");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   /* ------------------ UI ------------------ */
//   return (
//     <AnimatePresence>
//       <motion.div
//         className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//       >
//         <motion.div
//            className="
//             relative w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-6 
//             border border-slate-200 bg-white 
//             dark:border-white/10 
//             dark:bg-[#110f20] dark:bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)]
//           "
//           initial={{ y: 60, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           exit={{ y: 40, opacity: 0 }}
//           transition={{ type: "spring", stiffness: 240, damping: 24 }}
//         >
//           <button
//             onClick={() => !submitting && onClose()}
//             disabled={submitting}
//             className="absolute right-4 top-4 text-gray-400 hover:text-white transition disabled:opacity-40"
//           >
//             <FiX size={22} />
//           </button>

//           <h2 className="text-xl font-semibold text-white mb-6 capitalize tracking-wide">
//             {type === "send" ? "Send Crypto" : "Receive Crypto"}
//           </h2>

//           {/* ====== RECEIVE MODE ====== */}
//           {type === "receive" && (
//             <div className="flex flex-col items-center text-center space-y-5">
//               <div className="bg-white p-3 rounded-xl">
//                 <QRCode value={currentAddress} size={150} />
//               </div>
//               <p className="text-sm text-gray-300">
//                 Your {selectedSym} Address
//               </p>
//               <div className="flex items-center justify-between bg-white/10 px-4 py-2 rounded-xl w-full text-sm text-gray-100 border border-white/10">
//                 <span className="truncate">{currentAddress}</span>
//                 <button
//                   onClick={async () => {
//                     await navigator.clipboard.writeText(currentAddress);
//                     toast.success("Address copied!");
//                   }}
//                   className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 rounded-md text-xs font-semibold text-white hover:opacity-90 transition"
//                 >
//                   <FiCopy size={14} /> Copy
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* ====== SEND MODE ====== */}
//           {type === "send" && (
//             <form className="space-y-5" onSubmit={onSubmit}>
//               <div>
//                 <label className="block text-sm text-gray-400 mb-1">
//                   Recipient Address
//                 </label>
//                 <input
//                   value={to}
//                   onChange={(e) => setTo(e.target.value)}
//                   type="text"
//                   placeholder="Enter recipient address"
//                   className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               {/* Token Selector or Static Label */}
//               {tokensForNetwork.length > 1 ? (
//                 /* --- Multi-token chains: show dropdown --- */
//                 <div>
//                   <label className="block text-sm text-gray-400 mb-1">Select Token</label>
//                   <div className="relative">
//                     <button
//                       type="button"
//                       onClick={() => setShowTokenDropdown((v) => !v)}
//                       disabled={submitting}
//                       className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-white/10 
//                                 bg-white/5 hover:bg-white/10 transition text-white font-medium focus:outline-none"
//                     >
//                       <div className="flex items-center gap-2">
//                         {selectedToken === "USDT" ? (
//                           <SiTether className="text-[#26A17B] text-lg" />
//                         ) : (
//                           networkIcons[selectedSym]
//                         )}
//                         <span>
//                           {tokensForNetwork.find((t) => t.code === selectedToken)?.label}
//                         </span>
//                       </div>
//                       <svg
//                         className={`w-4 h-4 text-gray-300 transition-transform ${
//                           showTokenDropdown ? "rotate-180" : ""
//                         }`}
//                         fill="none"
//                         stroke="currentColor"
//                         strokeWidth="2"
//                         viewBox="0 0 24 24"
//                       >
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//                       </svg>
//                     </button>

//                     {showTokenDropdown && (
//                       <div className="absolute mt-2 w-full bg-[#1e293b]/95 border border-white/10 rounded-xl shadow-lg z-10 backdrop-blur-md">
//                         {tokensForNetwork.map((t) => (
//                           <button
//                             key={t.code}
//                             onClick={() => {
//                               setSelectedToken(t.code);
//                               setShowTokenDropdown(false);
//                             }}
//                             className="flex items-center gap-2 w-full px-4 py-2 text-left text-white hover:bg-white/10 transition"
//                           >
//                             {t.code === "USDT" ? (
//                               <SiTether className="text-[#26A17B] text-lg" />
//                             ) : (
//                               networkIcons[selectedSym]
//                             )}
//                             <span>{t.label}</span>
//                           </button>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 /* --- Single-token chains: show simple label --- */
//                 <div className="flex items-center justify-start gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white text-sm font-medium">
//                   {networkIcons[selectedSym]}
//                   <span>{tokensForNetwork[0]?.label}</span>
//                 </div>
//               )}


//               <div>
//                 <label className="block text-sm text-gray-400 mb-1">
//                   Amount ({selectedToken === "NATIVE" ? selectedSym : "USDT"})
//                 </label>
//                 <input
//                   value={amount}
//                   onChange={(e) => setAmount(e.target.value)}
//                   type="number"
//                   min="0"
//                   step="any"
//                   placeholder="0.00"
//                   className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               {error && <p className="text-sm text-rose-400">{error}</p>}

//               <button
//                 type="submit"
//                 disabled={submitting || !currentWallet?.id}
//                 className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
//               >
//                 {submitting
//                   ? "Sending..."
//                   : `Send ${
//                       selectedToken === "NATIVE" ? selectedSym : "USDT"
//                     }`}
//               </button>
//             </form>
//           )}

//           {submitting && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl"
//             >
//               <FiLoader className="text-blue-400 animate-spin mb-3" size={28} />
//               <p className="text-gray-200 text-sm">
//                 Processing transaction...
//               </p>
//             </motion.div>
//           )}
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }


"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import { FiX, FiCopy, FiLoader } from "react-icons/fi";

import {
  SiSolana,
  SiEthereum,
  SiBitcoin,
  SiTether,
  SiDogecoin,
  SiXrp,
  SiMonero,
} from "react-icons/si";

import { walletEventBus } from "@/lib/events";
import SendReceivePortal from "./SendReceivePortal";

const TronIcon = ({ className = "w-4 h-4 text-[#FF4747]" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

type SymbolCode = "SOL" | "TRX" | "ETH" | "BTC" | "DOGE" | "XMR" | "XRP";
type TokenCode = "NATIVE" | "USDT";

type WalletBrief = { id: number; address: string };

interface Props {
  type: "send" | "receive";
  currentChain?: SymbolCode;
  onClose: () => void;
  walletsBySymbol?: Partial<Record<SymbolCode, WalletBrief>>;
}

export default function SendReceiveModal({
  type,
  currentChain,
  onClose,
  walletsBySymbol = {},
}: Props) {
  const [selectedToken, setSelectedToken] = useState<TokenCode>("NATIVE");
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sym = currentChain ?? "SOL";
  const wallet = walletsBySymbol[sym];
  const address = wallet?.address ?? "—";

  const icons: Record<SymbolCode, React.ReactNode> = {
    SOL: <SiSolana className="text-[#14F195] text-lg" />,
    TRX: <TronIcon />,
    ETH: <SiEthereum className="text-[#627EEA] text-lg" />,
    BTC: <SiBitcoin className="text-[#F7931A] text-lg" />,
    DOGE: <SiDogecoin className="text-[#C2A633] text-lg" />,
    XMR: <SiMonero className="text-[#FF6600] text-lg" />,
    XRP: <SiXrp className="text-[#0A74E6] text-lg" />,
  };

  const tokens =
    ["BTC", "DOGE", "XMR", "XRP"].includes(sym)
      ? [{ code: "NATIVE", label: sym }]
      : [
          { code: "NATIVE", label: sym },
          {
            code: "USDT",
            label:
              sym === "TRX"
                ? "USDT (TRC-20)"
                : sym === "ETH"
                ? "USDT (ERC-20)"
                : "USDT (SPL)",
          },
        ];

  async function submitSend() {
    const amt = Number(amount);

    if (!wallet?.id) throw new Error("No wallet");
    if (!to || !amt || amt <= 0) throw new Error("Invalid address or amount");

    let endpoint = "";
    let body: any = {};

    if (selectedToken === "USDT") {
      // --- USDT SEND ---
      endpoint =
        sym === "TRX"
          ? "/api/tron/send-usdt"
          : sym === "ETH"
          ? "/api/eth/send-usdt"
          : "/api/solana/send-usdt";

      body = { fromWalletId: wallet.id, to, amountUsdt: amt };
    } else {
      // --- Native send ---
      switch (sym) {
        case "SOL":
          endpoint = "/api/solana/send";
          body = { fromWalletId: wallet.id, to, amountSol: amt, memo: memo || undefined };
          break;
        case "TRX":
          endpoint = "/api/tron/send";
          body = { fromWalletId: wallet.id, to, amountTrx: amt };
          break;
        case "ETH":
          endpoint = "/api/eth/send";
          body = { fromWalletId: wallet.id, to, amountEth: amt };
          break;
        case "BTC":
          endpoint = "/api/bitcoin/send";
          body = { fromWalletId: wallet.id, to, amountBtc: amt };
          break;
        case "DOGE":
          endpoint = "/api/dogecoin/send";
          body = { fromWalletId: wallet.id, to, amountDoge: amt };
          break;
        case "XRP":
          endpoint = "/api/xrp/send";
          body = { fromWalletId: wallet.id, to, amountXrp: amt, memo: memo || undefined };
          break;
        case "XMR":
          endpoint = "/api/xmr/send";
          body = { fromWalletId: wallet.id, to, amountXmr: amt, paymentId: memo || undefined };
          break;
        default:
          throw new Error("Unsupported chain");
      }
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Send failed");

    return data;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await submitSend();
      toast.success("Transaction Sent!");
      walletEventBus.refresh();
      setTimeout(onClose, 500);
    } catch (err: any) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------
  //   RENDER (WITH PORTAL!)
  // ---------------------------------------------------------

  return (
    <SendReceivePortal>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center"
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
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
          >
            {/* Close Button */}
            <button
              onClick={() => !submitting && onClose()}
              className="absolute right-4 top-4 text-gray-400 disabled:opacity-40"
            >
              <FiX size={22} />
            </button>

            {/* ---------------- RECEIVE MODE ---------------- */}
            {type === "receive" && (
              <div className="flex flex-col items-center text-center space-y-5">
                <div className="bg-white p-3 rounded-xl">
                  <QRCode value={address} size={150} />
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-300">Your {sym} Address</p>

                <div className="flex items-center justify-between bg-white/10 px-4 py-2 rounded-xl w-full text-sm text-gray-800 dark:text-gray-300 border border-white/10">
                  <span className="truncate">{address}</span>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(address);
                      toast.success("Copied!");
                    }}
                    className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 rounded-md text-xs"
                  >
                    <FiCopy size={14} /> Copy
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- SEND MODE ---------------- */}
            {type === "send" && (
              <form className="space-y-5" onSubmit={onSubmit}>
                <div>
                  <label className="block text-sm text-gray-800 dark:text-gray-300 mb-1">
                    Recipient Address
                  </label>
                  <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full rounded-xl border border-gray-500 dark:border-white/10 p-3 text-sm text-gray-800 dark:text-gray-300 focus:outline-none"
                    placeholder="Enter address"
                  />
                </div>

                {/* Token Select */}
                {tokens.length > 1 ? (
                  <div>
                    <label className="block text-sm text-gray-800 dark:text-gray-300 mb-1">Select Token</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTokenDropdown((v) => !v)}
                        className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-gray-500 dark:border-white/10 text-gray-800 dark:text-gray-300"
                      >
                        <span className="flex items-center gap-2">
                          {selectedToken === "USDT" ? (
                            <SiTether className="text-[#26A17B] text-lg" />
                          ) : (
                            icons[sym]
                          )}
                          {tokens.find((t) => t.code === selectedToken)?.label}
                        </span>
                        <span className={`transition ${showTokenDropdown ? "rotate-180" : ""}`}>
                          ▼
                        </span>
                      </button>

                      {showTokenDropdown && (
                        <div className="absolute mt-2 w-full bg-gray-200 border border-white/10 rounded-xl shadow-lg z-10 backdrop-blur-md dark:bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)]">
                          {tokens.map((t) => (
                            <button
                              key={t.code}
                              type="button"
                              onClick={() => {
                                setSelectedToken(t.code as TokenCode);
                                setShowTokenDropdown(false);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-800 dark:text-gray-300 hover:bg-white/100"
                            >
                              {t.code === "USDT" ? (
                                <SiTether className="text-[#26A17B] text-lg" />
                              ) : (
                                icons[sym]
                              )}
                              {t.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white">
                    {icons[sym]}
                    {tokens[0].label}
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="block text-sm text-gray-800 dark:text-gray-300 mb-1 ">
                    Amount ({selectedToken === "NATIVE" ? sym : "USDT"})
                  </label>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-500 dark:border-white/10 text-gray-800 dark:text-gray-300 p-3 text-sm  outline-none 
                                focus:outline-none 
                                "
                    placeholder="0.00"
                  />
                </div>

                {["SOL", "XRP", "XMR"].includes(sym) && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      {sym === "XMR" ? "Payment ID" : "Memo (Optional)"}
                    </label>
                    <input
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 text-white p-3 text-sm"
                    />
                  </div>
                )}

                {error && <p className="text-sm text-rose-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold"
                >
                  {submitting ? "Sending..." : `Send ${selectedToken === "NATIVE" ? sym : "USDT"}`}
                </button>
              </form>
            )}

            {/* SUBMITTING OVERLAY */}
            {submitting && (
              <motion.div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <FiLoader className="text-blue-400 animate-spin" size={28} />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </SendReceivePortal>
  );
}
