
// "use client";

// import React, { useEffect, useState } from "react";
// import { SiTether, SiSolana, SiDogecoin, SiMonero, SiXrp } from "react-icons/si";
// import { FaEthereum, FaBitcoin } from "react-icons/fa";
// import { FiLoader, FiList } from "react-icons/fi";

// /*  Tron SVG icon */
// const TronIcon = ({ className = "w-5 h-5 text-[#FF060A]" }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className={className}>
//     <path d="M16 2 2 5.5l12.6 24.5L30 5.5 16 2zm0 2.2 10.3 2.6-10.3 20.2L5.7 4.8 16 4.2zm-4.2 3.3L16 17.3l4.2-9.8h-8.4z" />
//   </svg>
// );

// interface TxItem {
//   id: string | number;
//   txHash: string | null;
//   amount: string;
//   fee?: string | null;
//   token: string;
//   direction: "SENT" | "RECEIVED";
//   type: string;
//   status: string;
//   createdAt: string;
// }

// interface TransactionTableProps {
//   chain: string; // e.g. "SOL", "TRX", "ETH"
// }

// /* --------------------- MAIN COMPONENT --------------------- */
// export default function TransactionTable({ chain }: TransactionTableProps) {
//   const [txs, setTxs] = useState<TxItem[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadTransactions = async () => {
//       try {
//         const storedUser = localStorage.getItem("user");
//         const userId = storedUser ? JSON.parse(storedUser).id : null;
//         if (!userId) return setTxs([]);

//         const res = await fetch(`/api/transaction?userId=${userId}&chain=${chain}`, { cache: "no-store" });
//         const data = await res.json();
//         setTxs(data.transactions || []);
//       } catch (err) {
//         console.error("Error loading transactions:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadTransactions();
//   }, [chain]);

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "CONFIRMED":
//       case "Completed":
//         return "bg-green-500/10 text-green-500";
//       case "PENDING":
//       case "Pending":
//         return "bg-yellow-500/10 text-yellow-500";
//       case "FAILED":
//       case "Declined":
//         return "bg-red-500/10 text-red-500";
//       default:
//         return "bg-gray-500/10 text-gray-500";
//     }
//   };

//   const shorten = (hash?: string | null) =>
//     hash && hash.length > 16 ? `${hash.slice(0, 6)}...${hash.slice(-6)}` : hash || "—";

//   const getDirectionStyle = (dir: "SENT" | "RECEIVED") =>
//     dir === "SENT" ? "text-red-500 font-medium" : "text-green-500 font-medium";

//   const getIcon = (sym: string) => {
//     switch (sym) {
//       case "TRX": return <TronIcon className="w-5 h-5 text-[#FF060A]" />;
//       case "ETH": return <FaEthereum className="text-[#627EEA] size-5" />;
//       case "USDT": return <SiTether className="text-[#26A17B] size-5" />;
//       case "SOL": return <SiSolana className="text-[#14F195] size-5" />;
//       case "BTC": return <FaBitcoin className="text-[#F7931A] size-5" />;
//       case "DOGE": return <SiDogecoin className="text-[#C2A633] w-5 h-5" />;
//       case "XMR": return <SiMonero className="text-[#FF6600] w-5 h-5" />;
//       case "XRP": return <SiXrp className="text-[#25A768] w-5 h-5" />;
//       default:    return <SiTether className="text-[#26A17B] size-5" />;
//     }
//   };

//   return (
//     <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 
//                     bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm 
//                     shadow-sm hover:shadow-md transition-all duration-300 p-6">
//       <h3 className="font-semibold text-gray-900 dark:text-white mb-5 text-lg flex items-center gap-2">
//         <FiList className="w-5 h-5 text-blue-500" /> Transactions
//       </h3>

//       {loading ? (
//         <div className="flex justify-center py-12 text-gray-500 dark:text-gray-400">
//           <FiLoader className="animate-spin mr-2" /> Loading transactions...
//         </div>
//       ) : txs.length === 0 ? (
//         <p className="text-center py-10 text-gray-400 dark:text-gray-500">No transactions yet.</p>
//       ) : (
//         <div className="overflow-x-auto">
//           <table className="w-full text-[15px]">
//             <thead>
//               <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200/60 dark:border-gray-700/40 text-sm">
//                 <th className="py-3 px-4 text-left">Coin</th>
//                 <th className="py-3 px-4 text-left">Direction</th>
//                 <th className="py-3 px-4 text-left">Tx Hash</th>
//                 <th className="py-3 px-4 text-left">Amount</th>
//                 <th className="py-3 px-4 text-left">Fee</th>
//                 <th className="py-3 px-4 text-left">Status</th>
//                 <th className="py-3 px-4 text-left">Date</th>
//               </tr>
//             </thead>
//             <tbody>
//               {txs.map((t) => (
//                 <tr
//                   key={t.id}
//                   className="border-b border-gray-100/60 dark:border-gray-800/60 
//                              hover:bg-gray-50 dark:hover:bg-[#1A2235]/50 transition"
//                 >
//                   <td className="py-4 px-4 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
//                     {getIcon(t.token)}
//                     <span>{t.token}</span>
//                   </td>
//                   <td className={`py-4 px-4 ${getDirectionStyle(t.direction)}`}>
//                     {t.direction === "SENT" ? "Send" : "Receive"}
//                   </td>
//                   <td className="py-4 px-4 font-mono text-[13px] text-gray-500 dark:text-gray-400">
//                     {shorten(t.txHash)}
//                   </td>
//                   <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{t.amount}</td>
//                   <td className="py-4 px-4 text-gray-500 dark:text-gray-400">{t.fee ?? "—"}</td>
//                   <td className="py-4 px-4">
//                     <span
//                       className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}
//                     >
//                       {t.status}
//                     </span>
//                   </td>
//                   <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
//                     {new Date(t.createdAt).toLocaleDateString()}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
import { SiTether, SiSolana, SiDogecoin, SiMonero, SiXrp } from "react-icons/si";
import { FaEthereum, FaBitcoin } from "react-icons/fa";
import { FiLoader, FiList } from "react-icons/fi";
import { TransactionTableSkeleton } from "@/components/skeleton/SkeletonLoaders";

/* Tron SVG icon */
const TronIcon = ({ className = "w-5 h-5 text-[#FF060A]" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className={className}>
    <path d="M16 2 2 5.5l12.6 24.5L30 5.5 16 2zm0 2.2 10.3 2.6-10.3 20.2L5.7 4.8 16 4.2zm-4.2 3.3L16 17.3l4.2-9.8h-8.4z" />
  </svg>
);

interface TxItem {
  id: string | number;
  txHash: string | null;
  amount: string;
  fee?: string | null;
  token: string;
  direction: "SENT" | "RECEIVED";
  type: string;
  status: string;
  createdAt: string;
}

interface TransactionTableProps {
  chain: string;
}

export default function TransactionTable({ chain }: TransactionTableProps) {
  const [txs, setTxs] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        
        if (!userId) {
          setTxs([]);
          setLoading(false);
          return;
        }

        const res = await fetch(
          `/api/transaction?userId=${userId}&chain=${chain}`, 
          { cache: "no-store" }
        );
        
        const data = await res.json();
        setTxs(data.transactions || []);
      } catch (err) {
        console.error("Error loading transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [chain]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "Completed":
        return "bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-400";
      case "PENDING":
      case "Pending":
        return "bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20 dark:text-yellow-400";
      case "FAILED":
      case "Declined":
        return "bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400";
    }
  };

  const shorten = (hash?: string | null) =>
    hash && hash.length > 16 ? `${hash.slice(0, 6)}...${hash.slice(-6)}` : hash || "—";

  const getDirectionStyle = (dir: "SENT" | "RECEIVED") =>
    dir === "SENT" 
      ? "text-red-500 dark:text-red-400 font-medium" 
      : "text-green-500 dark:text-green-400 font-medium";

  const getIcon = (sym: string) => {
    const iconClass = "w-4 h-4 sm:w-5 sm:h-5"; // Responsive icon size
    switch (sym) {
      case "TRX": return <TronIcon className={`${iconClass} text-[#FF060A]`} />;
      case "ETH": return <FaEthereum className={`${iconClass} text-[#627EEA]`} />;
      case "USDT": return <SiTether className={`${iconClass} text-[#26A17B]`} />;
      case "SOL": return <SiSolana className={`${iconClass} text-[#14F195]`} />;
      case "BTC": return <FaBitcoin className={`${iconClass} text-[#F7931A]`} />;
      case "DOGE": return <SiDogecoin className={`${iconClass} text-[#C2A633]`} />;
      case "XMR": return <SiMonero className={`${iconClass} text-[#FF6600]`} />;
      case "XRP": return <SiXrp className={`${iconClass} text-[#25A768]`} />;
      default: return <SiTether className={`${iconClass} text-[#26A17B]`} />;
    }
  };

  // Show skeleton while loading
  if (loading) {
    return <TransactionTableSkeleton />;
  }

  return (
    <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 
                    bg-white/70 dark:bg-[#110f20] bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)] backdrop-blur-sm 
                    shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-5 md:p-6">
      
      {/* Header - Responsive */}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 sm:mb-5 
                     text-base sm:text-lg flex items-center gap-2">
        <FiList className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> 
        Transactions
      </h3>

      {/* Empty State */}
      {txs.length === 0 ? (
        <p className="text-center py-8 sm:py-10 text-sm sm:text-base text-gray-400 dark:text-gray-500">
          No transactions yet.
        </p>
      ) : (
        /* Table - Fully Responsive */
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full text-xs sm:text-sm md:text-[15px]">
                
                {/* Table Header - Hide on mobile, show on tablet+ */}
                <thead className="hidden sm:table-header-group">
                  <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200/60 dark:border-gray-700/40">
                    <th className="py-3 px-2 sm:px-3 md:px-4 text-left font-medium">Coin</th>
                    <th className="py-3 px-2 sm:px-3 md:px-4 text-left font-medium">Direction</th>
                    <th className="py-3 px-2 sm:px-3 md:px-4 text-left font-medium">Tx Hash</th>
                    <th className="py-3 px-2 sm:px-3 md:px-4 text-left font-medium">Amount</th>
                    <th className="py-3 px-2 sm:px-3 md:px-4 text-left font-medium hidden md:table-cell">Fee</th>
                    <th className="py-3 px-2 sm:px-3 md:px-4 text-left font-medium">Status</th>
                    <th className="py-3 px-2 sm:px-3 md:px-4 text-left font-medium hidden lg:table-cell">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {txs.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-gray-100/60 dark:border-gray-800/60 
                                 hover:bg-gray-50 dark:hover:bg-[#1A2235]/50 transition-colors"
                    >
                      {/* MOBILE: Card Layout */}
                      <td className="sm:hidden py-4 px-4" colSpan={7}>
                        <div className="space-y-3">
                          {/* Row 1: Coin + Amount */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getIcon(t.token)}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {t.token}
                              </span>
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {t.amount}
                            </span>
                          </div>

                          {/* Row 2: Direction + Status */}
                          <div className="flex items-center justify-between">
                            <span className={getDirectionStyle(t.direction)}>
                              {t.direction === "SENT" ? "Send" : "Receive"}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${getStatusColor(t.status)}`}>
                              {t.status}
                            </span>
                          </div>

                          {/* Row 3: Tx Hash */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Hash:</span>
                            <span className="font-mono text-gray-500 dark:text-gray-400">
                              {shorten(t.txHash)}
                            </span>
                          </div>

                          {/* Row 4: Date */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Date:</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* TABLET/DESKTOP: Table Layout */}
                      {/* Coin */}
                      <td className="hidden sm:table-cell py-3 sm:py-4 px-2 sm:px-3 md:px-4">
                        <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                          {getIcon(t.token)}
                          <span className="hidden md:inline">{t.token}</span>
                        </div>
                      </td>

                      {/* Direction */}
                      <td className={`hidden sm:table-cell py-3 sm:py-4 px-2 sm:px-3 md:px-4 ${getDirectionStyle(t.direction)}`}>
                        <span className="hidden md:inline">
                          {t.direction === "SENT" ? "Send" : "Receive"}
                        </span>
                        <span className="md:hidden">
                          {t.direction === "SENT" ? "S" : "R"}
                        </span>
                      </td>

                      {/* Tx Hash */}
                      <td className="hidden sm:table-cell py-3 sm:py-4 px-2 sm:px-3 md:px-4 
                                     font-mono text-[11px] sm:text-xs md:text-[13px] 
                                     text-gray-500 dark:text-gray-400">
                        <span className="hidden md:inline">{shorten(t.txHash)}</span>
                        <span className="md:hidden">{t.txHash ? `${t.txHash.slice(0, 4)}...` : "—"}</span>
                      </td>

                      {/* Amount */}
                      <td className="hidden sm:table-cell py-3 sm:py-4 px-2 sm:px-3 md:px-4 
                                     text-gray-700 dark:text-gray-300 font-medium">
                        {t.amount}
                      </td>

                      {/* Fee - Hidden on mobile and tablet */}
                      <td className="hidden md:table-cell py-3 sm:py-4 px-2 sm:px-3 md:px-4 
                                     text-gray-500 dark:text-gray-400">
                        {t.fee ?? "—"}
                      </td>

                      {/* Status */}
                      <td className="hidden sm:table-cell py-3 sm:py-4 px-2 sm:px-3 md:px-4">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(t.status)}`}>
                          {t.status}
                        </span>
                      </td>

                      {/* Date - Hidden on mobile and tablet */}
                      <td className="hidden lg:table-cell py-3 sm:py-4 px-2 sm:px-3 md:px-4 
                                     text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}