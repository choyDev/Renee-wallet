
"use client";

import React, { useEffect, useState } from "react";

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalWallets: 0,
    totalTransactions: 0,
    currentBalance: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return;

        const walletsRes = await fetch(`/api/wallets/balances?userId=${userId}`, { cache: "no-store" });
        const walletsData = await walletsRes.json();

        if (walletsData.wallets) {
          const wallets = walletsData.wallets;

          const balance = wallets.reduce((sum: number, w: any) => {
            const nativeUsd = Number(w.balances?.[0]?.usd ?? 0);
            const usdtUsd =
              parseFloat(w.balances?.find((b: any) => b.token?.symbol === "USDT")?.amount ?? "0") ||
              0;
            return sum + nativeUsd + usdtUsd;
          }, 0);

          const txRes = await fetch(`/api/transaction?userId=${userId}`, { cache: "no-store" });
          const txData = await txRes.json();

          setStats({
            totalWallets: wallets.length,
            totalTransactions: txData.transactions?.length || 0,
            currentBalance: balance,
          });
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div
      className="
        rounded-2xl p-px 
        dark:bg-gradient-to-br dark:from-purple-500/30 dark:via-transparent dark:to-cyan-500/30
        h-full
      "
    >
      <div
        className="
          rounded-2xl p-6 h-full min-h-[200px] flex flex-col justify-between
          shadow-sm transition-all duration-300

          /* Light mode */
          bg-white border border-gray-200

          /* Dark mode (same as second component) */
          dark:bg-[#1A1F36]/80 dark:border-white/5 dark:backdrop-blur-xl
        "
      >
        {/* TOP SECTION */}
        <div className="flex items-start justify-between gap-6 mb-6">
          {/* Wallets */}
          <div>
            {loading ? (
              <div className="w-14 h-10 rounded-md bg-gray-200 dark:bg-white/10 animate-pulse mb-2" />
            ) : (
              <div className="text-4xl font-extrabold text-gray-900 dark:text-white notranslate leading-tight">
                {stats.totalWallets}
              </div>
            )}

            <div className="text-sm font-semibold text-gray-500 dark:text-gray-300 tracking-wide">
              Wallets
            </div>
          </div>

          {/* Transactions */}
          <div className="text-right">
            {loading ? (
              <div className="w-16 h-10 rounded-md bg-gray-200 dark:bg-white/10 animate-pulse ml-auto mb-2" />
            ) : (
              <div className="text-4xl font-extrabold text-gray-900 dark:text-white notranslate leading-tight">
                {stats.totalTransactions}
              </div>
            )}

            <div className="text-sm font-semibold text-gray-500 dark:text-gray-300 tracking-wide">
              Transactions
            </div>
          </div>
        </div>

        {/* BALANCE */}
        <div>
          <div className="text-sm font-semibold text-gray-500 dark:text-gray-300 mb-1 tracking-wide">
            Current balance
          </div>

          {loading ? (
            <div className="w-32 h-6 rounded-md bg-gray-200 dark:bg-white/10 animate-pulse" />
          ) : (
            <div className="text-2xl font-bold text-gray-900 dark:text-white notranslate leading-tight">
              ${stats.currentBalance.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
