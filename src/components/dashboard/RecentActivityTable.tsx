
"use client";

import React, { useEffect, useState } from "react";
import { SiTether, SiSolana, SiDogecoin, SiXrp } from "react-icons/si";
import { FaEthereum, FaBitcoin, FaMonero, FaArrowUp, FaArrowDown } from "react-icons/fa";

const TronIcon = ({ className = "w-4 h-4 text-[#FF060A]" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className={className}>
    <path d="M16 2 2 5.5l12.6 24.5L30 5.5 16 2zm0 2.2 10.3 2.6-10.3 20.2L5.7 4.8 16 4.2zm-4.2 3.3L16 17.3l4.2-9.8h-8.4z" />
  </svg>
);

interface TxItem {
  id: number | string;
  token: string;
  amount: string;
  txHash: string | null;
  direction: "SENT" | "RECIVED";
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

        const res = await fetch(`/api/transaction?userId=${userId}&limit=7`, { cache: "no-store" });
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        setTxs(data.transactions?.slice(0, 10) || []);
      } catch (err) {
        console.error("TX load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRecent();
  }, []);

  const getIcon = (coin: string) => {
    switch (coin) {
      case "TRX": return <TronIcon />;
      case "ETH": return <FaEthereum className="text-[#627EEA] w-4 h-4" />;
      case "USDT": return <SiTether className="text-[#26A17B] w-4 h-4" />;
      case "SOL": return <SiSolana className="text-[#14F195] w-4 h-4" />;
      case "BTC": return <FaBitcoin className="text-[#F7931A] w-4 h-4" />;
      case "DOGE": return <SiDogecoin className="text-[#C2A633] w-4 h-4" />;
      case "XMR": return <FaMonero className="text-[#FF6600] w-4 h-4" />;
      case "XRP": return <SiXrp className="text-[#0A74E6] w-4 h-4" />;
      default: return <SiTether className="text-[#26A17B] w-4 h-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const skeletonItems = Array.from({ length: 7 });

  return (
    <div className="
      rounded-2xl p-px
      dark:bg-gradient-to-br dark:from-purple-500/30 dark:via-transparent dark:to-cyan-500/30
      h-full
    ">
      <div
        className="
          h-full rounded-2xl p-6 shadow-sm flex flex-col transition-all duration-300
          bg-white border border-gray-200
          dark:bg-[#1A1F36]/80 dark:border-white/5 dark:backdrop-blur-xl
        "
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Transactions
        </h3>

        {/* SKELETON */}
        {loading ? (
          <div className="space-y-3 flex-1 overflow-hidden">
            {skeletonItems.map((_, i) => (
              <div
                key={i}
                className="
                  p-3 rounded-lg border animate-pulse
                  bg-gray-200/50 border-gray-200
                  dark:bg-white/5 dark:border-white/5
                "
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-white/10" />
                  <div className="w-16 h-4 bg-gray-300 dark:bg-white/10 rounded" />
                </div>

                <div className="w-24 h-4 bg-gray-300 dark:bg-white/10 rounded mb-3" />

                <div className="flex items-center justify-between">
                  <div className="w-16 h-3 bg-gray-300 dark:bg-white/10 rounded" />
                  <div className="w-14 h-4 bg-gray-300 dark:bg-white/10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {txs.map((t) => (
              <div
                key={t.id}
                className="
                  flex flex-col p-3 rounded-lg border transition-all
                  bg-gray-50 border-gray-200 hover:bg-gray-100
                  dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10
                "
              >
                {/* Top row */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                    {getIcon(t.token)}
                  </div>

                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t.token}
                  </p>

                  <div className={t.direction === "SENT" ? "text-red-500" : "text-green-500"}>
                    {t.direction === "SENT"
                      ? <FaArrowUp className="w-3 h-3" />
                      : <FaArrowDown className="w-3 h-3" />}
                  </div>
                </div>

                {/* Amount */}
                <p className={`
                  text-sm font-bold mb-1
                  ${t.direction === "SENT" ? "text-red-500" : "text-green-500"}
                `}>
                  {t.direction === "SENT" ? "-" : "+"}{t.amount}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatDate(t.createdAt)}
                  </span>

                  <span
                    className={`
                      px-2 py-0.5 rounded-full text-xs font-medium
                      ${
                        t.status === "CONFIRMED"
                          ? "bg-green-500/20 text-green-700 dark:text-green-400"
                          : t.status === "PENDING"
                          ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                          : "bg-red-500/20 text-red-700 dark:text-red-400"
                      }
                    `}
                  >
                    {t.status === "CONFIRMED"
                      ? "Confirmed"
                      : t.status === "PENDING"
                      ? "Pending"
                      : "Failed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
