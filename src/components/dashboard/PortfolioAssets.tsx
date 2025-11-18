
// "use client";

// import React, { useEffect, useState } from "react";
// import dynamic from "next/dynamic";
// import type { ApexOptions } from "apexcharts";

// const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// /* -------------------------------------------------------
//    Modern Skeleton Loader
// ------------------------------------------------------- */
// function Skeleton({ className }: { className?: string }) {
//   return (
//     <div
//       className={`animate-pulse bg-gray-300/30 dark:bg-white/10 rounded-md ${className}`}
//     ></div>
//   );
// }

// function CircleSkeleton() {
//   return (
//     <div className="animate-pulse bg-gray-300/20 dark:bg-white/10 rounded-full w-[180px] h-[180px]"></div>
//   );
// }

// interface WalletData {
//   id: number;
//   address: string;
//   network: { name: string; symbol: string };
//   balances: { token: { symbol: string; name: string }; amount: string; usd: number }[];
// }

// export default function PortfolioAssets() {
//   const [wallets, setWallets] = useState<WalletData[]>([]);
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const storedUser = localStorage.getItem("user");
//         const userId = storedUser ? JSON.parse(storedUser).id : null;
//         if (!userId) return;

//         const res = await fetch(`/api/wallets/balances?userId=${userId}`, { cache: "no-store" });

//         const text = await res.text();
//         const data = text ? JSON.parse(text) : {};

//         if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);

//         setWallets(data.wallets || []);
//       } catch (err) {
//         console.error("Error fetching wallet balances:", err);
//       }
//     };

//     load();
//   }, []);

//   useEffect(() => {
//     const t = setTimeout(() => setMounted(true), 200);
//     return () => clearTimeout(t);
//   }, []);

//   /* -------------------------------------------------------
//      Prepare chart data
//   ------------------------------------------------------- */
//   const symbols = ["TRX", "SOL", "ETH", "BTC", "XMR", "XRP", "DOGE"];
//   const colors = ["#FF060A", "#14F195", "#627EEA", "#F7931A", "#FF6600", "#0A74E6", "#C2A633"];

//   const usdValues = symbols.map((sym) => {
//     const wallet = wallets.find((w) => w.network.symbol === sym);
//     if (!wallet) return 0;

//     const native = wallet.balances?.[0]?.usd ?? 0;
//     const usdt = parseFloat(
//       wallet.balances?.find((b) => b.token?.symbol === "USDT")?.amount ?? "0"
//     ) || 0;

//     return native + usdt;
//   });

//   const totalUsd = usdValues.reduce((a, b) => a + b, 0);
//   const series = totalUsd > 0 ? usdValues.map((v) => (v / totalUsd) * 100) : usdValues.map(() => 0);

//   const options: ApexOptions = {
//     chart: {
//       type: "donut",
//       background: "transparent",
//       toolbar: { show: false }
//     },
//     labels: symbols,
//     colors,
//     dataLabels: { enabled: false },
//     stroke: { show: false },
//     legend: { show: false },
//     plotOptions: {
//       pie: {
//         donut: {
//           size: "72%",
//           labels: {
//             show: true,
//             name: { show: false },
//             value: {
//               show: true,
//               fontSize: "14px",
//               fontWeight: 600,
//               color: "#FFF",
//               formatter: () => ""
//             },
//             total: {
//               show: true,
//               label: "Total",
//               color: "#9CA3AF",
//               fontSize: "14px",
//               formatter: () => `$${totalUsd.toFixed(2)}`
//             }
//           }
//         }
//       }
//     },
//     tooltip: {
//       theme: "dark",
//       y: {
//         formatter: (val, opts) => {
//           const idx = opts.seriesIndex ?? 0;
//           const usd = usdValues[idx] ?? 0;
//           return `$${usd.toFixed(2)} (${val.toFixed(1)}%)`;
//         },
//       },
//     },
//   };

//   const loading = !mounted || wallets.length === 0;

//   return (
//     <div className="rounded-2xl p-px bg-gradient-to-br from-purple-500/30 via-transparent to-cyan-500/30 h-full">
//       <div className="h-full rounded-2xl border border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-[#1A1F36]/80 backdrop-blur-xl p-6 shadow-sm transition-all duration-300 hover:border-purple-500/30 flex flex-col">

//         <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
//           Portfolio Assets
//         </h3>

//         {/* LOADING STATE */}
//         {loading ? (
//           <div className="flex flex-1 items-center gap-6">

//             {/* Circle skeleton */}
//             <div className="flex justify-center items-center flex-1">
//               <CircleSkeleton />
//             </div>

//             {/* Legend skeleton */}
//             <div className="flex flex-col gap-3 min-w-[150px]">
//               {Array.from({ length: 5 }).map((_, i) => (
//                 <Skeleton key={i} className="h-8 w-full" />
//               ))}
//             </div>
//           </div>
//         ) : (
//           <div className="flex flex-1 items-center gap-6">

//             {/* Chart */}
//             <div className="flex justify-center items-center flex-1 notranslate">
//               <ReactApexChart
//                 options={options}
//                 series={series}
//                 type="donut"
//                 height={220}
//                 width={220}
//               />
//             </div>

//             {/* Legend */}
//             <div className="flex flex-col gap-2 min-w-[150px]">
//               {symbols.map((symbol, index) => {
//                 const usd = usdValues[index];
//                 const perc = series[index];

//                 if (usd === 0) return null;

//                 return (
//                   <div
//                     key={symbol}
//                     className="flex items-center gap-2 group hover:bg-white/10 rounded px-2 py-1 transition"
//                   >
//                     <div
//                       className="w-3 h-3 rounded-full"
//                       style={{ backgroundColor: colors[index] }}
//                     ></div>

//                     <div className="flex flex-col flex-1">
//                       <span className="text-gray-400 dark:text-gray-300 text-xs">{symbol}</span>
//                       <span className="text-gray-900 dark:text-white text-sm font-semibold notranslate">
//                         ${usd.toFixed(2)}
//                       </span>
//                     </div>

//                     <span className="text-gray-500 dark:text-gray-400 text-xs">
//                       {perc.toFixed(1)}%
//                     </span>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }



"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

/* ===============================================
   SKELETON LOADERS
=============================================== */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-300/30 dark:bg-white/10 rounded-md ${className}`}
    />
  );
}

function CircleSkeleton() {
  return (
    <div className="animate-pulse bg-gray-300/20 dark:bg-white/10 rounded-full w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px]" />
  );
}

/* ===============================================
   INTERFACES
=============================================== */
interface WalletData {
  id: number;
  address: string;
  network: { 
    name: string; 
    symbol: string; 
  };
  balances: { 
    token: { 
      symbol: string; 
      name: string; 
    }; 
    amount: string; 
    usd: number;
  }[];
}

/* ===============================================
   MAIN COMPONENT
=============================================== */
export default function PortfolioAssets() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch wallet balances
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        
        if (!userId) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/wallets/balances?userId=${userId}`, { 
          cache: "no-store" 
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (!res.ok) {
          throw new Error(data?.error || `Request failed: ${res.status}`);
        }

        setWallets(data.wallets || []);
      } catch (err) {
        console.error("Error fetching wallet balances:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, []);

  // Mount component with delay
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(timer);
  }, []);

  /* ===============================================
     CHART DATA PREPARATION
  =============================================== */
  const symbols = ["TRX", "SOL", "ETH", "BTC", "XMR", "XRP", "DOGE"];
  const colors = [
    "#FF060A", // TRX - Red
    "#14F195", // SOL - Green
    "#627EEA", // ETH - Blue
    "#F7931A", // BTC - Orange
    "#FF6600", // XMR - Orange
    "#0A74E6", // XRP - Blue
    "#C2A633"  // DOGE - Yellow
  ];

  // Calculate USD values for each symbol
  const usdValues = symbols.map((sym) => {
    const wallet = wallets.find((w) => w.network.symbol === sym);
    if (!wallet) return 0;

    // Native token USD value
    const nativeUsd = wallet.balances?.[0]?.usd ?? 0;
    
    // USDT balance (if exists)
    const usdtBalance = parseFloat(
      wallet.balances?.find((b) => b.token?.symbol === "USDT")?.amount ?? "0"
    ) || 0;

    return nativeUsd + usdtBalance;
  });

  // Calculate total and percentages
  const totalUsd = usdValues.reduce((a, b) => a + b, 0);
  const series = totalUsd > 0 
    ? usdValues.map((v) => (v / totalUsd) * 100) 
    : usdValues.map(() => 0);

  /* ===============================================
     APEX CHARTS OPTIONS
  =============================================== */
  const options: ApexOptions = {
    chart: {
      type: "donut",
      background: "transparent",
      toolbar: { show: false }
    },
    labels: symbols,
    colors: colors,
    dataLabels: { 
      enabled: false 
    },
    stroke: { 
      show: false 
    },
    legend: { 
      show: false // Custom legend below
    },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            name: { 
              show: false 
            },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: 800,
              color: "#FFF",
              formatter: () => ""
            },
            total: {
              show: true,
              label: "Total",
              color: "#9CA3AF",
              fontSize: "12px",
              fontWeight: 400,
              formatter: () => `$${totalUsd.toFixed(2)}`
            }
          }
        }
      }
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val, opts) => {
          const idx = opts.seriesIndex ?? 0;
          const usd = usdValues[idx] ?? 0;
          return `$${usd.toFixed(2)} (${val.toFixed(1)}%)`;
        }
      }
    }
  };

  const isLoading = loading || !mounted;

  /* ===============================================
     RENDER
  =============================================== */
  return (
    <div
      className="
        group rounded-2xl p-px transition-all duration-300"
    >
      <div className="h-full rounded-2xl border border-gray-300 dark:border-gray-900 bg-gray-50 dark:bg-[#1A1730] backdrop-blur-xl p-4 sm:p-5 md:p-6 transition-all duration-300 flex flex-col">

        {/* HEADER */}
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Portfolio Assets
        </h3>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex flex-1 flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            
            {/* Chart Skeleton */}
            <div className="flex justify-center items-center">
              <CircleSkeleton />
            </div>

            {/* Legend Skeleton */}
            <div className="flex flex-col gap-2 sm:gap-3 w-full md:min-w-[150px] md:max-w-[200px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-7 sm:h-8 w-full" />
              ))}
            </div>
          </div>
        ) : (
          /* LOADED STATE */
          <div className="flex flex-1 flex-col md:flex-row items-center justify-center gap-4 md:gap-6 lg:gap-8">

            {/* CHART - Responsive sizes */}
            <div className="flex justify-center items-center notranslate">
              
              {/* Mobile: 160px */}
              <div className="block md:hidden">
                <ReactApexChart
                  options={options}
                  series={series}
                  type="donut"
                  height={160}
                  width={160}
                />
              </div>

              {/* Tablet: 180px */}
              <div className="hidden md:block lg:hidden">
                <ReactApexChart
                  options={options}
                  series={series}
                  type="donut"
                  height={180}
                  width={180}
                />
              </div>

              {/* Desktop: 220px */}
              <div className="hidden lg:block">
                <ReactApexChart
                  options={options}
                  series={series}
                  type="donut"
                  height={220}
                  width={220}
                />
              </div>
            </div>

            {/* LEGEND - Custom with amounts */}
            <div className="flex flex-col gap-2 w-full md:min-w-[150px] md:max-w-[200px]">
              {symbols.map((symbol, index) => {
                const usd = usdValues[index];
                const perc = series[index];

                // Only show coins with balance
                if (usd === 0) return null;

                return (
                  <div
                    key={symbol}
                    className="flex items-center gap-2 sm:gap-3 group hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-lg px-2 py-1.5 sm:py-2 transition-colors cursor-pointer"
                  >
                    {/* Color Dot */}
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colors[index] }}
                    />

                    {/* Symbol and Amount */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wide">
                        {symbol}
                      </span>
                      <span className="text-gray-900 dark:text-white text-xs sm:text-sm font-semibold notranslate truncate">
                        ${usd.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>

                    {/* Percentage */}
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-medium flex-shrink-0 tabular-nums">
                      {perc.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
