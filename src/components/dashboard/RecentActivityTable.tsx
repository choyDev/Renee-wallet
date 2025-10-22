
// "use client";

// import React from "react";
// import { FaEthereum } from "react-icons/fa";
// import { SiTether, SiSolana } from "react-icons/si";
// import { BsCurrencyBitcoin } from "react-icons/bs";
// import Badge from "@/components/ui/badge/Badge";
// import Link from "next/link";

// // ✅ Tron Icon SVG (same size as other icons)
// const TronIcon = ({ className = "w-5 h-5 text-[#FF060A]" }) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     viewBox="0 0 32 32"
//     fill="currentColor"
//     className={className}
//   >
//     <path d="M16 2 2 5.5l12.6 24.5L30 5.5 16 2zm0 2.2 10.3 2.6-10.3 20.2L5.7 4.8 16 4.2zm-4.2 3.3L16 17.3l4.2-9.8h-8.4z" />
//   </svg>
// );

// const RecentActivityTable = () => {
//   const activities = [
//     {
//       coin: "USDT",
//       transaction: "Withdraw USDT",
//       amount: "$653.10",
//       id: "#14525156",
//       date: "Jun 10, 2024",
//       status: "Completed",
//       fee: "7.57321 BTC",
//     },
//     {
//       coin: "TRX",
//       transaction: "Deposit TRX",
//       amount: "$542.05",
//       id: "#03483195",
//       date: "Jun 15, 2024",
//       status: "Declined",
//       fee: "1.23450 BTC",
//     },
//     {
//       coin: "TRX",
//       transaction: "Deposit TRX",
//       amount: "$456.10",
//       id: "#8520097",
//       date: "Jun 18, 2024",
//       status: "Pending",
//       fee: "0.12000 BTC",
//     },
//     {
//       coin: "SOL",
//       transaction: "Withdraw SOL",
//       amount: "$759.10",
//       id: "#00078867",
//       date: "Jun 20, 2024",
//       status: "Completed",
//       fee: "0.49867 BTC",
//     },
//   ];

//   const getIcon = (coin: string) => {
//     switch (coin) {
//       case "TRX":
//         return <TronIcon className="w-5 h-5 text-[#FF060A]" />; // ✅ Tron red
//       case "ETH":
//         return <FaEthereum className="text-[#4B70C6] size-5" />;
//       case "USDT":
//         return <SiTether className="text-[#26A17B] size-5" />; // ✅ Official Tether green
//       case "SOL":
//         return <SiSolana className="text-[#14F195] size-5" />; // ✅ Solana neon green
//       default:
//         return <BsCurrencyBitcoin className="text-gray-400 size-5" />;
//     }
//   };

//   const getBadgeColor = (status: string) => {
//     if (status === "Completed") return "success";
//     if (status === "Pending") return "warning";
//     return "error";
//   };

//   return (
//     <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121B2E] p-6 shadow-sm">
//       <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-5 text-lg">
//         Recent Activities
//       </h3>
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm rounded-lg">
//           <thead>
//             <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
//               <th className="text-left py-3 px-4">Coin</th>
//               <th className="text-left py-3 px-4">Transaction</th>
//               <th className="text-left py-3 px-4">ID</th>
//               <th className="text-left py-3 px-4">Date</th>
//               <th className="text-left py-3 px-4">Status</th>
//               <th className="text-left py-3 px-4">Fees</th>
//             </tr>
//           </thead>
//           <tbody>
//             {activities.map((a, i) => (
//               <tr
//                 key={i}
//                 className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
//               >
//                 <td className="py-4 px-4 flex items-center gap-2 font-medium text-gray-800 dark:text-white/90 notranslate">
//                   {getIcon(a.coin)}
//                   <span>{a.coin}</span>
//                 </td>
//                 <td className="py-4 px-4">
//                   <span className="font-semibold text-gray-800 dark:text-white/90 mr-1">
//                     {a.amount}
//                   </span>
//                   <span className="text-gray-500 dark:text-gray-400">
//                     {a.transaction}
//                   </span>
//                 </td>
//                 <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
//                   {a.id}
//                 </td>
//                 <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
//                   {a.date}
//                 </td>
//                 <td className="py-4 px-4">
//                   <Badge size="sm" color={getBadgeColor(a.status)}>
//                     {a.status}
//                   </Badge>
//                 </td>
//                 <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
//                   {a.fee}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//       <div className="mt-6 text-center">
//         <Link
//           href="/wallet/transactions"
//           className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition"
//         >
//           View All →
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default RecentActivityTable;


"use client";

import React, { useEffect, useState } from "react";
import { FaEthereum } from "react-icons/fa";
import { SiTether, SiSolana } from "react-icons/si";
import { BsCurrencyBitcoin } from "react-icons/bs";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";

/* ✅ Tron Icon */
const TronIcon = ({ className = "w-5 h-5 text-[#FF060A]" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    fill="currentColor"
    className={className}
  >
    <path d="M16 2 2 5.5l12.6 24.5L30 5.5 16 2zm0 2.2 10.3 2.6-10.3 20.2L5.7 4.8 16 4.2zm-4.2 3.3L16 17.3l4.2-9.8h-8.4z" />
  </svg>
);

interface TxItem {
  id: number | string;
  token: string;
  amount: string;
  txHash: string | null;
  direction: "SENT" | "RECEIVED";
  status: string;
  fee?: string | null;
  createdAt: string;
}

export default function RecentActivityTable() {
  const [txs, setTxs] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return;

        const res = await fetch(`/api/transaction?userId=${userId}&limit=5`, {
          cache: "no-store",
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);

        setTxs(data.transactions?.slice(0, 5) || []);
      } catch (err) {
        console.error("Error fetching recent transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRecent();
  }, []);

  const getIcon = (coin: string) => {
    switch (coin) {
      case "TRX":
        return <TronIcon className="w-5 h-5 text-[#FF060A]" />;
      case "ETH":
        return <FaEthereum className="text-[#4B70C6] size-5" />;
      case "USDT":
        return <SiTether className="text-[#26A17B] size-5" />;
      case "SOL":
        return <SiSolana className="text-[#14F195] size-5" />;
      case "BTC":
        return <BsCurrencyBitcoin className="text-[#F7931A] size-5" />;
      default:
        return <BsCurrencyBitcoin className="text-gray-400 size-5" />;
    }
  };

  const getBadgeColor = (status: string) => {
    if (status === "CONFIRMED" || status === "Completed") return "success";
    if (status === "PENDING" || status === "Pending") return "warning";
    return "error";
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121B2E] p-6 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-5 text-lg">
        Recent Activities
      </h3>

      {loading ? (
        <p className="text-center text-gray-400 dark:text-gray-500 py-8">
          Loading recent transactions...
        </p>
      ) : txs.length === 0 ? (
        <p className="text-center text-gray-400 dark:text-gray-500 py-8">
          No recent activity found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm rounded-lg">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">Coin</th>
                <th className="text-left py-3 px-4">Action</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Fee</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Date</th>
              </tr>
            </thead>

            <tbody>
              {txs.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                >
                  <td className="py-4 px-4 flex items-center gap-2 font-medium text-gray-800 dark:text-white/90 notranslate">
                    {getIcon(t.token)}
                    <span>{t.token}</span>
                  </td>

                  <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                    {t.direction === "SENT" ? "Send" : "Receive"}
                  </td>

                  <td className="py-4 px-4 font-semibold text-gray-800 dark:text-white/90">
                    {t.amount}
                  </td>

                  <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                    {t.fee || "—"}
                  </td>

                  <td className="py-4 px-4">
                    <Badge size="sm" color={getBadgeColor(t.status)}>
                      {t.status}
                    </Badge>
                  </td>

                  <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/transaction"
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition"
        >
          View All →
        </Link>
      </div>
    </div>
  );
}
