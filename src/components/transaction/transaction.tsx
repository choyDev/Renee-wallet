
"use client";

import React, { useEffect, useState } from "react";
import { FaEthereum } from "react-icons/fa";
import { SiTether, SiSolana } from "react-icons/si";
import { BsCurrencyBitcoin } from "react-icons/bs";
import { FiLoader } from "react-icons/fi";

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
        if (!userId) {
          console.warn("No user ID found in localStorage");
          setTxs([]);
          return;
        }
  
        const res = await fetch(
          `/api/transaction?userId=${userId}&chain=${chain}`, // 👈 chain filter
          { cache: "no-store" }
        );
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  
        setTxs(data.transactions || []);
      } catch (err) {
        console.error("Error loading transactions:", err);
      } finally {
        setLoading(false);
      }
    };
  
    loadTransactions();
  }, []);
  

  /* --------------------- HELPERS --------------------- */
  const getIcon = (sym: string) => {
    switch (sym) {
      case "TRX":
        return <TronIcon />;
      case "ETH":
        return <FaEthereum className="text-[#4B70C6] w-5 h-5" />;
      case "USDT":
        return <SiTether className="text-[#26A17B] w-5 h-5" />;
      case "SOL":
        return <SiSolana className="text-[#14F195] w-5 h-5" />;
      case "BTC":
        return <BsCurrencyBitcoin className="text-[#F7931A] w-5 h-5" />;
      default:
        return <BsCurrencyBitcoin className="text-gray-400 w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "Completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "PENDING":
      case "Pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "FAILED":
      case "Declined":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const shorten = (hash?: string | null) =>
    hash && hash.length > 16 ? `${hash.slice(0, 6)}...${hash.slice(-6)}` : hash || "—";

  const getDirectionStyle = (dir: "SENT" | "RECEIVED") =>
    dir === "SENT"
      ? "text-red-500 font-medium"
      : "text-green-500 font-medium";

  /* --------------------- RENDER --------------------- */
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121B2E] p-6 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-5 text-lg">
        Transactions
      </h3>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400">
          <FiLoader className="animate-spin mr-2" /> Loading transactions...
        </div>
      ) : txs.length === 0 ? (
        <p className="text-center py-8 text-gray-400 dark:text-gray-500">No transactions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm rounded-lg">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">Coin</th>
                <th className="text-left py-3 px-4">Direction</th>
                <th className="text-left py-3 px-4">Tx Hash</th>
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
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1A2235]/40 transition"
                >
                  <td className="py-4 px-4 flex items-center gap-2 font-medium text-gray-800 dark:text-white/90">
                    {getIcon(t.token)}
                    <span>{t.token}</span>
                  </td>

                  <td className={`py-4 px-4 ${getDirectionStyle(t.direction)}`}>
                    {t.direction === "SENT" ? "Send" : "Receive"}
                  </td>

                  <td className="py-4 px-4 font-mono text-[13px] text-gray-500 dark:text-gray-400">
                    {shorten(t.txHash)}
                  </td>

                  <td className="py-4 px-4 text-gray-500 dark:text-gray-300">{t.amount}</td>

                  <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                    {t.fee ? t.fee : "—"}
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}
                    >
                      {t.status}
                    </span>
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
    </div>
  );
}
