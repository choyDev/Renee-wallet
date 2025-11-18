
// "use client";

// import React, { useEffect, useState } from "react";

// export default function DashboardStats() {
//   const [stats, setStats] = useState({
//     totalWallets: 0,
//     totalTransactions: 0,
//     currentBalance: 0,
//   });

//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchStats = async () => {
//       try {
//         const storedUser = localStorage.getItem("user");
//         const userId = storedUser ? JSON.parse(storedUser).id : null;
//         if (!userId) return;

//         const walletsRes = await fetch(`/api/wallets/balances?userId=${userId}`, { cache: "no-store" });
//         const walletsData = await walletsRes.json();

//         if (walletsData.wallets) {
//           const wallets = walletsData.wallets;

//           const balance = wallets.reduce((sum: number, w: any) => {
//             const nativeUsd = Number(w.balances?.[0]?.usd ?? 0);
//             const usdtUsd =
//               parseFloat(w.balances?.find((b: any) => b.token?.symbol === "USDT")?.amount ?? "0") ||
//               0;
//             return sum + nativeUsd + usdtUsd;
//           }, 0);

//           const txRes = await fetch(`/api/transaction?userId=${userId}`, { cache: "no-store" });
//           const txData = await txRes.json();

//           setStats({
//             totalWallets: wallets.length,
//             totalTransactions: txData.transactions?.length || 0,
//             currentBalance: balance,
//           });
//         }
//       } catch (err) {
//         console.error("Error fetching stats:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStats();
//   }, []);

//   return (
//     <div
//       className="
//         rounded-2xl p-px 
//         dark:bg-gradient-to-br dark:from-purple-500/30 dark:via-transparent dark:to-cyan-500/30
//         h-full
//       "
//     >
//       <div
//         className="
//           rounded-2xl p-6 h-full min-h-[200px] flex flex-col justify-between
//           shadow-sm transition-all duration-300

//           /* Light mode */
//           bg-white border border-gray-200

//           /* Dark mode (same as second component) */
//           dark:bg-[#1A1F36]/80 dark:border-white/5 dark:backdrop-blur-xl
//         "
//       >
//         {/* TOP SECTION */}
//         <div className="flex items-start justify-between gap-6 mb-6">
//           {/* Wallets */}
//           <div>
//             {loading ? (
//               <div className="w-14 h-10 rounded-md bg-gray-200 dark:bg-white/10 animate-pulse mb-2" />
//             ) : (
//               <div className="text-4xl font-extrabold text-gray-900 dark:text-white notranslate leading-tight">
//                 {stats.totalWallets}
//               </div>
//             )}

//             <div className="text-sm font-semibold text-gray-500 dark:text-gray-300 tracking-wide">
//               Wallets
//             </div>
//           </div>

//           {/* Transactions */}
//           <div className="text-right">
//             {loading ? (
//               <div className="w-16 h-10 rounded-md bg-gray-200 dark:bg-white/10 animate-pulse ml-auto mb-2" />
//             ) : (
//               <div className="text-4xl font-extrabold text-gray-900 dark:text-white notranslate leading-tight">
//                 {stats.totalTransactions}
//               </div>
//             )}

//             <div className="text-sm font-semibold text-gray-500 dark:text-gray-300 tracking-wide">
//               Transactions
//             </div>
//           </div>
//         </div>

//         {/* BALANCE */}
//         <div>
//           <div className="text-sm font-semibold text-gray-500 dark:text-gray-300 mb-1 tracking-wide">
//             Current balance
//           </div>

//           {loading ? (
//             <div className="w-32 h-6 rounded-md bg-gray-200 dark:bg-white/10 animate-pulse" />
//           ) : (
//             <div className="text-2xl font-bold text-gray-900 dark:text-white notranslate leading-tight">
//               ${stats.currentBalance.toFixed(1)}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";

interface WalletData {
  id: number;
  address: string;
  network: { name: string; symbol: string };
  balances: { token: { symbol: string; name: string }; amount: string; usd: number }[];
}

export default function DashboardStatsPortfolio() {
  const [stats, setStats] = useState({
    totalWallets: 0,
    totalTransactions: 0,
    currentBalance: 0,
  });

  const [portfolioBreakdown, setPortfolioBreakdown] = useState<
    Array<{ symbol: string; percentage: number; color: string }>
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return;

        const walletsRes = await fetch(`/api/wallets/balances?userId=${userId}`, { cache: "no-store" });
        const walletsData = await walletsRes.json();
        if (!walletsData.wallets) return;

        const wallets: WalletData[] = walletsData.wallets;

        const totalBalance = wallets.reduce((sum, w: any) => {
          const nativeUsd = Number(w.balances?.[0]?.usd ?? 0);
          const usdtUsd =
            parseFloat(w.balances?.find((b: any) => b.token?.symbol === "USDT")?.amount ?? "0") || 0;
          return sum + nativeUsd + usdtUsd;
        }, 0);

        const txRes = await fetch(`/api/transaction?userId=${userId}`, { cache: "no-store" });
        const txData = await txRes.json();

        setStats({
          totalWallets: wallets.length,
          totalTransactions: txData.transactions?.length || 0,
          currentBalance: totalBalance,
        });

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
              parseFloat(w.balances?.find((b: any) => b.token?.symbol === "USDT")?.amount ?? "0") ||
              0;

            const walletUsd = nativeUsd + usdtUsd;

            return {
              symbol: w.network.symbol,
              percentage: totalBalance > 0 ? (walletUsd / totalBalance) * 100 : 0,
              color: colorMap[w.network.symbol] || "#9CA3AF",
            };
          })
          .sort((a, b) => b.percentage - a.percentage);

        setPortfolioBreakdown(breakdown);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const skeletonItems = Array.from({ length: 7 });

  return (
    <div
      className="
        rounded-2xl p-px h-full
      "
    >
      <div
        className="
          rounded-2xl p-6 shadow-sm h-full flex flex-col transition-all duration-300
          bg-gray-50 border border-gray-300
          dark:bg-[#1A1730] dark:border-gray-900 dark:backdrop-blur-xl
        "
      >
        {/* ─────────────── VERTICAL STATS ─────────────── */}
        <div className="space-y-8 mb-10">

          {/* Wallets */}
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
              Wallets
            </div>
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 dark:bg-white/10 animate-pulse mb-2 rounded" />
            ) : (
              <div className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {stats.totalWallets}
              </div>
            )}
            
          </div>

          {/* Transactions */}
          
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
              Transactions
            </div>
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 dark:bg-white/10 animate-pulse mb-2 rounded" />
            ) : (
              <div className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {stats.totalTransactions}
              </div>
            )}
          </div>

          {/* Balance */}
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-300 mb-1">
              Current balance
            </div>

            {loading ? (
              <div className="w-20 h-8 bg-gray-200 dark:bg-white/10 animate-pulse mb-2 rounded" />
            ) : (
              <div className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                ${stats.currentBalance.toFixed(1)}
              </div>
            )}
          </div>
        </div>

        {/* ─────────────── PORTFOLIO ─────────────── */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-7">Portfolio</h3>

        {loading ? (
          <div className="space-y-4 flex-1">
            {skeletonItems.map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
                <div className="flex-1">
                  <div className="w-20 h-4 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : portfolioBreakdown.length > 0 ? (
          <div className="space-y-3 flex-1">
            {portfolioBreakdown.map((item) => (
              <div key={item.symbol} className="flex items-center gap-4">
                {/* Circle */}
                <div className="relative w-14 h-14 flex items-center justify-center">
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
            <p className="text-sm text-gray-500 dark:text-gray-400">No portfolio data</p>
          </div>
        )}
      </div>
    </div>
  );
}

