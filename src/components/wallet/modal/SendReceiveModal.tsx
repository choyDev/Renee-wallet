// "use client";

// import React, { useMemo, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FiX, FiCopy } from "react-icons/fi";
// import { SiSolana, SiEthereum, SiBitcoin } from "react-icons/si";
// import QRCode from "react-qr-code";
// import { FaChevronDown } from "react-icons/fa";

// /* Tron icon */
// const TronIcon = ({ className = "w-4 h-4 text-[#FF4747]" }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
//     <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
//   </svg>
// );

// type SymbolCode = "SOL" | "TRX" | "ETH" | "BTC";
// type WalletBrief = { id: number; address: string };

// interface Props {
//   type: "send" | "receive";
//   onClose: () => void;
//   walletsBySymbol?: Partial<Record<SymbolCode, WalletBrief>>;
// }

// export default function SendReceiveModal({ type, onClose, walletsBySymbol = {} }: Props) {
//   const networks = useMemo(
//     () => [
//       { label: "Solana",  symbol: "SOL" as const, icon: <SiSolana className="text-[#14F195] text-lg" /> },
//       { label: "Tron",    symbol: "TRX" as const, icon: <TronIcon /> },
//       { label: "Ethereum",symbol: "ETH" as const, icon: <SiEthereum className="text-[#627EEA] text-lg" /> },
//       { label: "Bitcoin", symbol: "BTC" as const, icon: <SiBitcoin className="text-[#F7931A] text-lg" /> },
//     ],
//     []
//   );

//   const firstAvailable = (["SOL","TRX","ETH","BTC"] as SymbolCode[]).find(s => !!walletsBySymbol[s]) ?? "SOL";
//   const [selectedSym, setSelectedSym] = useState<SymbolCode>(firstAvailable);
//   const [showDropdown, setShowDropdown] = useState(false);

//   // form state
//   const [to, setTo] = useState("");
//   const [amount, setAmount] = useState("");
//   const [memo, setMemo] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<{ id: string; link?: string } | null>(null);

//   const currentWallet = walletsBySymbol[selectedSym];
//   const currentAddress = currentWallet?.address ?? "—";
//   const amountLabel = `Amount (${selectedSym})`;

//   async function copyCurrent() {
//     await navigator.clipboard.writeText(currentAddress);
//   }

//   // --- Senders (all call your server routes) ---
//   async function sendSOL() {
//     const amt = parseFloat(amount);
//     const res = await fetch("/api/solana/send", {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountSol: amt, memo: memo || undefined }),
//     });
//     const text = await res.text(); const data = text ? JSON.parse(text) : {};
//     if (!res.ok) throw new Error(data?.error || `Send failed (${res.status})`);
//     return { id: data.signature as string, link: data.explorerTx as string | undefined };
//   }

//   async function sendTRX() {
//     const amt = parseFloat(amount);
//     const res = await fetch("/api/tron/send", {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountTrx: amt }),
//     });
//     const text = await res.text(); const data = text ? JSON.parse(text) : {};
//     if (!res.ok) throw new Error(data?.error || `Send failed (${res.status})`);
//     return { id: data.txid as string, link: data.explorerTx as string | undefined };
//   }

//   async function sendETH() {
//     const amt = parseFloat(amount);
//     const res = await fetch("/api/eth/send", {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountEth: amt }),
//     });
//     const text = await res.text(); const data = text ? JSON.parse(text) : {};
//     if (!res.ok) throw new Error(data?.error || `Send failed (${res.status})`);
//     return { id: data.hash as string, link: data.explorerTx as string | undefined };
//   }

//   async function sendBTC() {
//     const amt = parseFloat(amount);
//     const res = await fetch("/api/bitcoin/send", {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountBtc: amt }),
//     });
//     const text = await res.text(); const data = text ? JSON.parse(text) : {};
//     if (!res.ok) throw new Error(data?.error || `Send failed (${res.status})`);
//     return { id: (data.txid as string) ?? (data.hash as string), link: data.explorerTx as string | undefined };
//   }

//   async function onSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setSubmitting(true); setError(null); setSuccess(null);

//     try {
//       if (!currentWallet?.id) throw new Error("No wallet for selected network");
//       const amt = parseFloat(amount);
//       if (!to || !Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid address and amount");

//       let r: { id: string; link?: string };
//       switch (selectedSym) {
//         case "SOL": r = await sendSOL(); break;
//         case "TRX": r = await sendTRX(); break;
//         case "ETH": r = await sendETH(); break;
//         case "BTC": r = await sendBTC(); break;
//         default: throw new Error("Unsupported network");
//       }
//       setSuccess({ id: r.id, link: r.link });
//       setAmount(""); setMemo(""); setTo("");
//     } catch (err: any) {
//       setError(err?.message || "Failed to send");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   // render
//   return (
//     <AnimatePresence>
//       <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
//         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//         <motion.div
//           className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden
//                      bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]
//                      border border-white/10 p-6"
//           initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
//           transition={{ type: "spring", stiffness: 240, damping: 24 }}
//         >
//           <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white transition">
//             <FiX size={22} />
//           </button>

//           <h2 className="text-xl font-semibold text-white mb-6 capitalize tracking-wide">
//             {type === "send" ? "Send Crypto" : "Receive Crypto"}
//           </h2>

//           {/* Network selector */}
//           <div className="relative mb-6">
//             <button
//               onClick={() => setShowDropdown(!showDropdown)}
//               className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-white/10
//                          bg-white/5 hover:bg-white/10 transition text-white font-medium"
//             >
//               <div className="flex items-center gap-2">
//                 {networks.find(n => n.symbol === selectedSym)?.icon}
//                 <span>{networks.find(n => n.symbol === selectedSym)?.label}</span>
//               </div>
//               <FaChevronDown className={`transition ${showDropdown ? "rotate-180" : ""}`} />
//             </button>

//             {showDropdown && (
//               <div className="absolute mt-2 w-full bg-[#1e293b] border border-white/10 rounded-xl shadow-lg z-10">
//                 {networks.map((net) => (
//                   <button
//                     key={net.symbol}
//                     onClick={() => { setSelectedSym(net.symbol); setShowDropdown(false); }}
//                     className="flex items-center gap-2 w-full px-4 py-2 text-left text-white hover:bg-white/10 transition"
//                   >
//                     {net.icon}<span>{net.label}</span>
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Content */}
//           {type === "receive" ? (
//             <div className="flex flex-col items-center text-center space-y-5">
//               <div className="bg-white p-3 rounded-xl">
//                 <QRCode value={currentAddress} size={150} />
//               </div>
//               <p className="text-sm text-gray-300">Your {selectedSym} Address</p>
//               <div className="flex items-center justify-between bg-white/10 px-4 py-2 rounded-xl w-full text-sm text-gray-100 border border-white/10">
//                 <span className="truncate">{currentAddress}</span>
//                 <button
//                   onClick={copyCurrent}
//                   className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 rounded-md text-xs font-semibold text-white hover:opacity-90 transition"
//                 >
//                   <FiCopy size={14} /> Copy
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <form className="space-y-5" onSubmit={onSubmit}>
//               <div>
//                 <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
//                 <input
//                   value={to}
//                   onChange={(e) => setTo(e.target.value)}
//                   type="text"
//                   placeholder="Enter recipient address"
//                   className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm text-gray-400 mb-1">{amountLabel}</label>
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

//               {/* Optional memo for SOL only */}
//               {selectedSym === "SOL" && (
//                 <div>
//                   <label className="block text-sm text-gray-400 mb-1">Memo (optional)</label>
//                   <input
//                     value={memo}
//                     onChange={(e) => setMemo(e.target.value)}
//                     type="text"
//                     placeholder="Note for the recipient"
//                     className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//               )}

//               {error && <p className="text-sm text-rose-400">{error}</p>}
//               {success && (
//                 <p className="text-sm text-emerald-400">
//                   Sent! Tx: <span className="underline">{success.id}</span>{" "}
//                   {success.link && (
//                     <>
//                       —{" "}
//                       <a className="underline" href={success.link} target="_blank" rel="noreferrer">
//                         View on explorer
//                       </a>
//                     </>
//                   )}
//                 </p>
//               )}

//               <button
//                 type="submit"
//                 disabled={submitting || !currentWallet?.id}
//                 className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
//               >
//                 {submitting ? "Sending..." : `Send ${selectedSym}`}
//               </button>
//             </form>
//           )}
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }



// "use client";

// import React, { useMemo, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FiX, FiCopy, FiLoader } from "react-icons/fi";
// import { SiSolana, SiEthereum, SiBitcoin, SiTether } from "react-icons/si";
// import { FaChevronDown } from "react-icons/fa";
// import QRCode from "react-qr-code";
// import toast from "react-hot-toast";

// /* Tron icon */
// const TronIcon = ({ className = "w-4 h-4 text-[#FF4747]" }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
//     <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
//   </svg>
// );

// type SymbolCode = "SOL" | "TRX" | "ETH" | "BTC";
// type TokenCode = "NATIVE" | "USDT";
// type WalletBrief = { id: number; address: string };
// type SendResult = { id: string; link?: string };

// interface Props {
//   type: "send" | "receive";
//   onClose: () => void;
//   walletsBySymbol?: Partial<Record<SymbolCode, WalletBrief>>;
// }

// export default function SendReceiveModal({ type, onClose, walletsBySymbol = {} }: Props) {
//   const networks = useMemo(
//     () => [
//       { label: "Solana", symbol: "SOL" as const, icon: <SiSolana className="text-[#14F195] text-lg" /> },
//       { label: "Tron", symbol: "TRX" as const, icon: <TronIcon /> },
//       { label: "Ethereum", symbol: "ETH" as const, icon: <SiEthereum className="text-[#627EEA] text-lg" /> },
//       { label: "Bitcoin", symbol: "BTC" as const, icon: <SiBitcoin className="text-[#F7931A] text-lg" /> },
//     ],
//     []
//   );

//   const firstAvailable = (["SOL", "TRX", "ETH", "BTC"] as SymbolCode[]).find(s => !!walletsBySymbol[s]) ?? "SOL";
//   const [selectedSym, setSelectedSym] = useState<SymbolCode>(firstAvailable);
//   const [selectedToken, setSelectedToken] = useState<TokenCode>("NATIVE");
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [showTokenDropdown, setShowTokenDropdown] = useState(false);

//   const [to, setTo] = useState("");
//   const [amount, setAmount] = useState("");
//   const [memo, setMemo] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const currentWallet = walletsBySymbol[selectedSym];
//   const currentAddress = currentWallet?.address ?? "—";
//   const amountLabel =
//     selectedToken === "NATIVE"
//       ? `Amount (${selectedSym})`
//       : `Amount (USDT on ${selectedSym})`;

//   async function copyCurrent() {
//     await navigator.clipboard.writeText(currentAddress);
//     toast.success("Address copied to clipboard!");
//   }

//   /* ------------------ SEND FUNCTIONS ------------------ */
//   type SendResult = { id: string; link?: string };

//   async function sendSOL(): Promise<SendResult> {
//     const amt = parseFloat(amount);
//     const res = await fetch("/api/solana/send", {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountSol: amt, memo: memo || undefined }),
//     });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
//     return { id: data.signature, link: data.explorerTx };
//   }

//   async function sendTRX(): Promise<SendResult> {
//     const amt = parseFloat(amount);
//     const res = await fetch("/api/tron/send", {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountTrx: amt }),
//     });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
//     return { id: data.txid, link: data.explorerTx };
//   }

//   async function sendETH(): Promise<SendResult> {
//     const amt = parseFloat(amount);
//     const res = await fetch("/api/eth/send", {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountEth: amt }),
//     });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
//     return { id: data.hash, link: data.explorerTx };
//   }

//   async function sendBTC(): Promise<SendResult> {
//     const amt = parseFloat(amount);
//     const res = await fetch("/api/bitcoin/send", {
//       method: "POST",
//       headers: { "content-type": "application/json" },
//       body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountBtc: amt }),
//     });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
//     return { id: data.txid || data.hash, link: data.explorerTx };
//   }

//   async function sendUSDT(): Promise<SendResult> {
//     throw new Error("USDT transfer feature coming soon");
//   }

//   async function sendNative(): Promise<SendResult> {
//     switch (selectedSym) {
//       case "SOL": return await sendSOL();
//       case "TRX": return await sendTRX();
//       case "ETH": return await sendETH();
//       case "BTC": return await sendBTC();
//       default: throw new Error("Unsupported network");
//     }
//   }

//   async function onSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setSubmitting(true);
//     setError(null);

//     try {
//       if (!currentWallet?.id) throw new Error("No wallet for selected network");
//       const amt = parseFloat(amount);
//       if (!to || !Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid address and amount");

//       const r: SendResult = selectedToken === "USDT"
//         ? await sendUSDT()
//         : await sendNative();

//       toast.success("Transaction sent successfully!");
//       setTimeout(() => onClose(), 1200); // close modal after short delay
//       setAmount("");
//       setMemo("");
//       setTo("");
//     } catch (err: any) {
//       toast.error(err?.message || "Transaction failed");
//       setError(err?.message || "Failed to send");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   const tokensForNetwork: { code: TokenCode; label: string }[] =
//     selectedSym === "BTC"
//       ? [{ code: "NATIVE", label: "BTC" }]
//       : [
//           { code: "NATIVE", label: selectedSym },
//           { code: "USDT", label: "USDT" },
//         ];

//   /* ------------------ UI ------------------ */
//   return (
//     <AnimatePresence>
//       <motion.div
//         className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
//         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//       >
//         <motion.div
//           className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]
//                      bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6"
//           initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
//           transition={{ type: "spring", stiffness: 240, damping: 24 }}
//         >
//           {/* prevent close during tx */}
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

//           {/* Network selector */}
//           <div className="relative mb-4">
//             <button
//               onClick={() => setShowDropdown(!showDropdown)}
//               disabled={submitting}
//               className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-white/10
//                          bg-white/5 hover:bg-white/10 transition text-white font-medium"
//             >
//               <div className="flex items-center gap-2">
//                 {networks.find(n => n.symbol === selectedSym)?.icon}
//                 <span>{networks.find(n => n.symbol === selectedSym)?.label}</span>
//               </div>
//               <FaChevronDown className={`transition ${showDropdown ? "rotate-180" : ""}`} />
//             </button>

//             {showDropdown && (
//               <div className="absolute mt-2 w-full bg-[#1e293b] border border-white/10 rounded-xl shadow-lg z-10">
//                 {networks.map((net) => (
//                   <button
//                     key={net.symbol}
//                     onClick={() => { setSelectedSym(net.symbol); setSelectedToken("NATIVE"); setShowDropdown(false); }}
//                     className="flex items-center gap-2 w-full px-4 py-2 text-left text-white hover:bg-white/10 transition"
//                   >
//                     {net.icon}<span>{net.label}</span>
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Token selector */}
//           {selectedSym !== "BTC" && (
//             <div className="relative mb-6">
//               <button
//                 onClick={() => setShowTokenDropdown(!showTokenDropdown)}
//                 disabled={submitting}
//                 className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-white/10
//                            bg-white/5 hover:bg-white/10 transition text-white font-medium"
//               >
//                 <div className="flex items-center gap-2">
//                   {selectedToken === "USDT"
//                     ? <SiTether className="text-[#26A17B] text-lg" />
//                     : networks.find(n => n.symbol === selectedSym)?.icon}
//                   <span>{selectedToken === "USDT" ? "USDT" : selectedSym}</span>
//                 </div>
//                 <FaChevronDown className={`transition ${showTokenDropdown ? "rotate-180" : ""}`} />
//               </button>

//               {showTokenDropdown && (
//                 <div className="absolute mt-2 w-full bg-[#1e293b] border border-white/10 rounded-xl shadow-lg z-10">
//                   <button
//                     onClick={() => { setSelectedToken("NATIVE"); setShowTokenDropdown(false); }}
//                     className="flex items-center gap-2 w-full px-4 py-2 text-left text-white hover:bg-white/10 transition"
//                   >
//                     {networks.find(n => n.symbol === selectedSym)?.icon}
//                     <span>{selectedSym}</span>
//                   </button>
//                   <button
//                     onClick={() => { setSelectedToken("USDT"); setShowTokenDropdown(false); }}
//                     className="flex items-center gap-2 w-full px-4 py-2 text-left text-white hover:bg-white/10 transition"
//                   >
//                     <SiTether className="text-[#26A17B] text-lg" />
//                     <span>USDT</span>
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Content */}
//           {type === "receive" ? (
//             <div className="flex flex-col items-center text-center space-y-5">
//               <div className="bg-white p-3 rounded-xl">
//                 <QRCode value={currentAddress} size={150} />
//               </div>
//               <p className="text-sm text-gray-300">Your {selectedSym} Address</p>
//               <div className="flex items-center justify-between bg-white/10 px-4 py-2 rounded-xl w-full text-sm text-gray-100 border border-white/10">
//                 <span className="truncate">{currentAddress}</span>
//                 <button
//                   onClick={copyCurrent}
//                   className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 rounded-md text-xs font-semibold text-white hover:opacity-90 transition"
//                 >
//                   <FiCopy size={14} /> Copy
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <form className="space-y-5" onSubmit={onSubmit}>
//               <div>
//                 <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
//                 <input
//                   value={to}
//                   onChange={(e) => setTo(e.target.value)}
//                   type="text"
//                   placeholder="Enter recipient address"
//                   className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm text-gray-400 mb-1">{amountLabel}</label>
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

//               {selectedSym === "SOL" && (
//                 <div>
//                   <label className="block text-sm text-gray-400 mb-1">Memo (optional)</label>
//                   <input
//                     value={memo}
//                     onChange={(e) => setMemo(e.target.value)}
//                     type="text"
//                     placeholder="Note for recipient"
//                     className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//               )}

//               {error && <p className="text-sm text-rose-400">{error}</p>}

//               <button
//                 type="submit"
//                 disabled={submitting || !currentWallet?.id}
//                 className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
//               >
//                 {submitting ? "Sending..." : `Send ${selectedToken === "NATIVE" ? selectedSym : "USDT"}`}
//               </button>
//             </form>
//           )}

//           {/* Full-screen overlay while sending */}
//           <AnimatePresence>
//             {submitting && (
//               <motion.div
//                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//                 className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl"
//               >
//                 <FiLoader className="text-blue-400 animate-spin mb-3" size={28} />
//                 <p className="text-gray-200 text-sm">Processing transaction...</p>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCopy, FiLoader } from "react-icons/fi";
import { SiSolana, SiEthereum, SiBitcoin, SiTether } from "react-icons/si";
import { FaChevronDown } from "react-icons/fa";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";

/* Tron icon */
const TronIcon = ({ className = "w-4 h-4 text-[#FF4747]" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

type SymbolCode = "SOL" | "TRX" | "ETH" | "BTC";
type TokenCode = "NATIVE" | "USDT";
type WalletBrief = { id: number; address: string };
type SendResult = { id: string; link?: string };

interface Props {
  type: "send" | "receive";
  onClose: () => void;
  walletsBySymbol?: Partial<Record<SymbolCode, WalletBrief>>;
}

export default function SendReceiveModal({ type, onClose, walletsBySymbol = {} }: Props) {
  const networks = useMemo(
    () => [
      { label: "Solana", symbol: "SOL" as const, icon: <SiSolana className="text-[#14F195] text-lg" /> },
      { label: "Tron", symbol: "TRX" as const, icon: <TronIcon /> },
      { label: "Ethereum", symbol: "ETH" as const, icon: <SiEthereum className="text-[#627EEA] text-lg" /> },
      { label: "Bitcoin", symbol: "BTC" as const, icon: <SiBitcoin className="text-[#F7931A] text-lg" /> },
    ],
    []
  );

  const firstAvailable = (["SOL", "TRX", "ETH", "BTC"] as SymbolCode[]).find(s => !!walletsBySymbol[s]) ?? "SOL";
  const [selectedSym, setSelectedSym] = useState<SymbolCode>(firstAvailable);
  const [selectedToken, setSelectedToken] = useState<TokenCode>("NATIVE");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentWallet = walletsBySymbol[selectedSym];
  const currentAddress = currentWallet?.address ?? "—";
  const amountLabel =
    selectedToken === "NATIVE"
      ? `Amount (${selectedSym})`
      : `Amount (USDT on ${selectedSym})`;

  async function copyCurrent() {
    await navigator.clipboard.writeText(currentAddress);
    toast.success("Address copied to clipboard!");
  }

  /* ------------------ SEND FUNCTIONS ------------------ */
  async function sendSOL(): Promise<SendResult> {
    const amt = parseFloat(amount);
    const res = await fetch("/api/solana/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountSol: amt, memo: memo || undefined }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
    return { id: data.signature, link: data.explorerTx };
  }

  async function sendTRX(): Promise<SendResult> {
    const amt = parseFloat(amount);
    const res = await fetch("/api/tron/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountTrx: amt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
    return { id: data.txid, link: data.explorerTx };
  }

  async function sendETH(): Promise<SendResult> {
    const amt = parseFloat(amount);
    const res = await fetch("/api/eth/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountEth: amt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
    return { id: data.hash, link: data.explorerTx };
  }

  async function sendBTC(): Promise<SendResult> {
    const amt = parseFloat(amount);
    const res = await fetch("/api/bitcoin/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountBtc: amt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
    return { id: data.txid || data.hash, link: data.explorerTx };
  }

  //  USDT send: ERC-20 (ETH) & TRC-20 (TRX)
  async function sendUSDT(): Promise<SendResult> {
    const amt = parseFloat(amount);
    if (selectedSym === "ETH") {
      const res = await fetch("/api/eth/send-usdt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountUsdt: amt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
      return { id: data.hash, link: data.explorerTx };
    } else if (selectedSym === "TRX") {
      const res = await fetch("/api/tron/send-usdt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountUsdt: amt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
      return { id: data.txid, link: data.explorerTx };
    } else if (selectedSym === "SOL") {
      const res = await fetch("/api/solana/send-usdt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountUsdt: amt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
      return { id: data.txid, link: data.explorerTx };
    } else {
      throw new Error(`USDT not supported on ${selectedSym}`);
    }
  }

  async function sendNative(): Promise<SendResult> {
    switch (selectedSym) {
      case "SOL": return await sendSOL();
      case "TRX": return await sendTRX();
      case "ETH": return await sendETH();
      case "BTC": return await sendBTC();
      default: throw new Error("Unsupported network");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!currentWallet?.id) throw new Error("No wallet for selected network");
      const amt = parseFloat(amount);
      if (!to || !Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid address and amount");

      const r: SendResult = selectedToken === "USDT"
        ? await sendUSDT()
        : await sendNative();

      toast.success("Transaction sent successfully!");
      setTimeout(() => onClose(), 1500);
      setAmount("");
      setMemo("");
      setTo("");
    } catch (err: any) {
      toast.error(err?.message || "Transaction failed");
      setError(err?.message || "Failed to send");
    } finally {
      setSubmitting(false);
    }
  }

  const tokensForNetwork: { code: TokenCode; label: string }[] =
    selectedSym === "BTC"
      ? [{ code: "NATIVE", label: "BTC" }]
      : [
          { code: "NATIVE", label: selectedSym },
          { code: "USDT", label: "USDT" },
        ];

  /* ------------------ UI ------------------ */
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]
                     bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6"
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24 }}
        >
          {/* Prevent close while submitting */}
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition disabled:opacity-40"
          >
            <FiX size={22} />
          </button>

          <h2 className="text-xl font-semibold text-white mb-6 capitalize tracking-wide">
            {type === "send" ? "Send Crypto" : "Receive Crypto"}
          </h2>

          {/* Network selector */}
          <div className="relative mb-4">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={submitting}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-white/10
                         bg-white/5 hover:bg-white/10 transition text-white font-medium"
            >
              <div className="flex items-center gap-2">
                {networks.find(n => n.symbol === selectedSym)?.icon}
                <span>{networks.find(n => n.symbol === selectedSym)?.label}</span>
              </div>
              <FaChevronDown className={`transition ${showDropdown ? "rotate-180" : ""}`} />
            </button>

            {showDropdown && (
              <div className="absolute mt-2 w-full bg-[#1e293b] border border-white/10 rounded-xl shadow-lg z-10">
                {networks.map((net) => (
                  <button
                    key={net.symbol}
                    onClick={() => { setSelectedSym(net.symbol); setSelectedToken("NATIVE"); setShowDropdown(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left text-white hover:bg-white/10 transition"
                  >
                    {net.icon}<span>{net.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Token selector */}
          {selectedSym !== "BTC" && (
            <div className="relative mb-6">
              <button
                onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                disabled={submitting}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-white/10
                           bg-white/5 hover:bg-white/10 transition text-white font-medium"
              >
                <div className="flex items-center gap-2">
                  {selectedToken === "USDT"
                    ? <SiTether className="text-[#26A17B] text-lg" />
                    : networks.find(n => n.symbol === selectedSym)?.icon}
                  <span>{selectedToken === "USDT" ? "USDT" : selectedSym}</span>
                </div>
                <FaChevronDown className={`transition ${showTokenDropdown ? "rotate-180" : ""}`} />
              </button>

              {showTokenDropdown && (
                <div className="absolute mt-2 w-full bg-[#1e293b] border border-white/10 rounded-xl shadow-lg z-10">
                  {tokensForNetwork.map((t) => (
                    <button
                      key={t.code}
                      onClick={() => { setSelectedToken(t.code); setShowTokenDropdown(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-left text-white hover:bg-white/10 transition"
                    >
                      {t.code === "USDT"
                        ? <SiTether className="text-[#26A17B] text-lg" />
                        : networks.find(n => n.symbol === selectedSym)?.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          {type === "receive" ? (
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="bg-white p-3 rounded-xl">
                <QRCode value={currentAddress} size={150} />
              </div>
              <p className="text-sm text-gray-300">Your {selectedSym} Address</p>
              <div className="flex items-center justify-between bg-white/10 px-4 py-2 rounded-xl w-full text-sm text-gray-100 border border-white/10">
                <span className="truncate">{currentAddress}</span>
                <button
                  onClick={copyCurrent}
                  className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 rounded-md text-xs font-semibold text-white hover:opacity-90 transition"
                >
                  <FiCopy size={14} /> Copy
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  type="text"
                  placeholder="Enter recipient address"
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">{amountLabel}</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedSym === "SOL" && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Memo (optional)</label>
                  <input
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    type="text"
                    placeholder="Note for recipient"
                    className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={submitting || !currentWallet?.id}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? "Sending..." : `Send ${selectedToken === "NATIVE" ? selectedSym : "USDT"}`}
              </button>
            </form>
          )}

          {/* Overlay while sending */}
          <AnimatePresence>
            {submitting && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl"
              >
                <FiLoader className="text-blue-400 animate-spin mb-3" size={28} />
                <p className="text-gray-200 text-sm">Processing transaction...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

