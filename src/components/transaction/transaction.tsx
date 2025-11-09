
"use client";

import React, { useEffect, useState } from "react";
import { SiTether, SiSolana, SiDogecoin, SiMonero, SiXrp } from "react-icons/si";
import { FaEthereum, FaBitcoin } from "react-icons/fa";
import { FiLoader, FiList } from "react-icons/fi";

/*  Tron SVG icon */
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
  chain: string; // e.g. "SOL", "TRX", "ETH"
}

/* --------------------- MAIN COMPONENT --------------------- */
export default function TransactionTable({ chain }: TransactionTableProps) {
  const [txs, setTxs] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return setTxs([]);

        const res = await fetch(`/api/transaction?userId=${userId}&chain=${chain}`, { cache: "no-store" });
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
        return "bg-green-500/10 text-green-500";
      case "PENDING":
      case "Pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "FAILED":
      case "Declined":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const shorten = (hash?: string | null) =>
    hash && hash.length > 16 ? `${hash.slice(0, 6)}...${hash.slice(-6)}` : hash || "—";

  const getDirectionStyle = (dir: "SENT" | "RECEIVED") =>
    dir === "SENT" ? "text-red-500 font-medium" : "text-green-500 font-medium";

  const getIcon = (sym: string) => {
    switch (sym) {
      case "TRX": return <TronIcon className="w-5 h-5 text-[#FF060A]" />;
      case "ETH": return <FaEthereum className="text-[#4B70C6] size-5" />;
      case "USDT": return <SiTether className="text-[#26A17B] size-5" />;
      case "SOL": return <SiSolana className="text-[#14F195] size-5" />;
      case "BTC": return <FaBitcoin className="text-[#F7931A] size-5" />;
      case "DOGE": return <SiDogecoin className="text-[#C2A633] w-5 h-5" />;
      case "XMR": return <SiMonero className="text-[#FF6600] w-5 h-5" />;
      case "XRP": return <SiXrp className="text-[#0A74E6] w-5 h-5" />;
      default:    return <SiTether className="text-[#26A17B] size-5" />;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 
                    bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm 
                    shadow-sm hover:shadow-md transition-all duration-300 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-5 text-lg flex items-center gap-2">
        <FiList className="w-5 h-5 text-blue-500" /> Transactions
      </h3>

      {loading ? (
        <div className="flex justify-center py-12 text-gray-500 dark:text-gray-400">
          <FiLoader className="animate-spin mr-2" /> Loading transactions...
        </div>
      ) : txs.length === 0 ? (
        <p className="text-center py-10 text-gray-400 dark:text-gray-500">No transactions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200/60 dark:border-gray-700/40 text-sm">
                <th className="py-3 px-4 text-left">Coin</th>
                <th className="py-3 px-4 text-left">Direction</th>
                <th className="py-3 px-4 text-left">Tx Hash</th>
                <th className="py-3 px-4 text-left">Amount</th>
                <th className="py-3 px-4 text-left">Fee</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-gray-100/60 dark:border-gray-800/60 
                             hover:bg-gray-50 dark:hover:bg-[#1A2235]/50 transition"
                >
                  <td className="py-4 px-4 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                    {getIcon(t.token)}
                    <span>{t.token}</span>
                  </td>
                  <td className={`py-4 px-4 ${getDirectionStyle(t.direction)}`}>
                    {t.direction === "SENT" ? "Send" : "Receive"}
                  </td>
                  <td className="py-4 px-4 font-mono text-[13px] text-gray-500 dark:text-gray-400">
                    {shorten(t.txHash)}
                  </td>
                  <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{t.amount}</td>
                  <td className="py-4 px-4 text-gray-500 dark:text-gray-400">{t.fee ?? "—"}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

