

"use client";

import React, { useEffect, useState } from "react";

interface WalletData {
  id: number;
  address: string;
  network: { name: string; symbol: string };
  balances: { token: { symbol: string; name: string }; amount: string; usd: number }[];
}

export default function PortfolioBreakdown() {
  const [portfolioBreakdown, setPortfolioBreakdown] = useState<
    Array<{ symbol: string; percentage: number; color: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return;

        const walletsRes = await fetch(`/api/wallets/balances?userId=${userId}`, {
          cache: "no-store",
        });
        const walletsData = await walletsRes.json();

        if (walletsData.wallets) {
          const wallets: WalletData[] = walletsData.wallets;

          const totalBalance = wallets.reduce((sum: number, w: any) => {
            const nativeUsd = Number(w.balances?.[0]?.usd ?? 0);
            const usdtUsd =
              parseFloat(
                w.balances?.find((b: any) => b.token?.symbol === "USDT")?.amount ?? "0"
              ) || 0;
            return sum + nativeUsd + usdtUsd;
          }, 0);

          const colorMap: Record<string, string> = {
            TRX: "#FF060A",
            SOL: "#14F195",
            ETH: "#627EEA",
            BTC: "#F7931A",
            XMR: "#FF6600",
            XRP: "#0A74E6",
            DOGE: "#C2A633",
          };

          const breakdown = wallets
            .map((w) => {
              const nativeUsd = Number(w.balances?.[0]?.usd ?? 0);
              const usdtUsd =
                parseFloat(
                  w.balances?.find((b: any) => b.token?.symbol === "USDT")?.amount ?? "0"
                ) || 0;

              const walletUsd = nativeUsd + usdtUsd;

              return {
                symbol: w.network.symbol,
                percentage: totalBalance > 0 ? (walletUsd / totalBalance) * 100 : 0,
                color: colorMap[w.network.symbol] || "#9CA3AF",
              };
            })
            .sort((a, b) => b.percentage - a.percentage);

          setPortfolioBreakdown(breakdown);
        }
      } catch (err) {
        console.error("Error fetching portfolio breakdown:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  const skeletonItems = Array.from({ length: 7 });

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
          h-full rounded-2xl p-6 shadow-sm flex flex-col transition-all duration-300

          /* Light mode */
          bg-white border border-gray-200

          /* Dark mode */
          dark:bg-[#1A1F36]/80 dark:border-white/5 dark:backdrop-blur-xl dark:hover:border-purple-500/30
        "
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
          Portfolio
        </h3>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {skeletonItems.map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
                <div className="flex-1">
                  <div className="w-20 h-4 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {portfolioBreakdown.length > 0 ? (
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                {portfolioBreakdown.map((item) => (
                  <div key={item.symbol} className="flex items-center gap-4">
                    {/* Circle Progress */}
                    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                      <svg className="w-14 h-14 transform -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="rgba(0,0,0,0.1)"
                          className="dark:stroke-[rgba(255,255,255,0.1)]"
                          strokeWidth="5"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke={item.color}
                          strokeWidth="5"
                          strokeDasharray={`${(item.percentage / 100) * 150.8} 150.8`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div
                        className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                        style={{ color: item.color }}
                      >
                        {Math.round(item.percentage)}%
                      </div>
                    </div>

                    <div className="text-base font-medium text-gray-900 dark:text-white">
                      {item.symbol}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No portfolio data
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
