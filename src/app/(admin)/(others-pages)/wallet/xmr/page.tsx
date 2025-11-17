// "use client";

// import React, { useEffect, useState } from "react";
// import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
// import {
//   AddressSection,
// } from "@/components/wallet/WalletNetworkCard";
// import CryptoPriceChart from "@/components/wallet/pricechart/CoinPriceChart";
// import TransactionTable from "@/components/transaction/transaction";
// import { SiMonero } from "react-icons/si";

// interface WalletData {
//   id: number;
//   address: string;
//   network: {
//     name: string;
//     symbol: string;
//     chainId: string;
//     explorerUrl?: string;
//   };
//   balances: {
//     token: { symbol: string; name: string };
//     amount: string;
//     usd: number;
//   }[];
// }

// export default function WalletOverviewPage() {
//   const [xmrWallet, setXmrWallet] = useState<WalletData | null>(null);
 
//   useEffect(() => {
//     const fetchWallets = async () => {
//       try {
//         const storedUser = localStorage.getItem("user");
//         const userId = storedUser ? JSON.parse(storedUser).id : null;
//         if (!userId) return;

//         const res = await fetch(`/api/wallets/balances?userId=${userId}`, { cache: "no-store" });

//         // Read text first so we can diagnose non-JSON / empty bodies
//         const text = await res.text();
//         let data: any = null;

//         try {
//           data = text ? JSON.parse(text) : null;
//         } catch {
//           // Not JSON (e.g., HTML error page)
//           throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
//         }

//         if (!res.ok) {
//           throw new Error(data?.error || `Request failed with ${res.status}`);
//         }

//         const wallets: WalletData[] = data.wallets || [];
      
//         const xmr = wallets.find(w => w.network.symbol === "XMR") || null;
  
//         setXmrWallet(xmr);

//       } catch (err) {
//         console.error("Error fetching wallet data:", err);
//         // optional: show a toast/UI hint
//       }
//     };

//     fetchWallets();

//   }, []);

  
//   const TotalUsd = Number(xmrWallet?.balances?.[0]?.usd ?? "0");

//   const usd = (n: number) =>
//     new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

//   return (
//     <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 space-y-5">
//       <div className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 flex justify-between items-center px-6">
//         <AddressSection
//           symbol="XMR"
//           address={xmrWallet?.address}
//           explorerUrl={xmrWallet?.network.explorerUrl}
//           chainId={xmrWallet?.network.chainId ?? ""}
//           className="justify-start gap-6"
//           textSize="base"
//         />
//       </div>

//       <div className="grid grid-cols-12 gap-4 items-stretch">
//         {/* LEFT: Chart */}
//         <section className="col-span-12 lg:col-span-8">
//           <div className="group relative h-full rounded-2xl p-px bg-gradient-to-br from-brand-400/40 via-transparent to-[#FF6600]/30">
//             <div className="h-full rounded-2xl border border-gray-200/60 dark:border-white/10 
//                           bg-white/70 dark:bg-[#110f20] bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)] backdrop-blur-sm 
//                           shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_10px_30px_-10px_rgba(0,0,0,0.35)]
//                           transition-all duration-300 group-hover:shadow-lg">
//               <div className="p-5 sm:p-6">
//                 <div className="mb-4 flex items-center justify-between">
//                   <h2 className="text-base sm:text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
//                     Market Overview
//                   </h2>
//                   <span className="text-xs text-gray-500 dark:text-gray-400">Last 24h</span>
//                 </div>

//                 {/* Give the chart room to breathe and a consistent height */}
//                 <div className="min-h-[360px]">
//                   <CryptoPriceChart initialAsset="XMR" hideAssetTabs />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* RIGHT: Wallet Summary */}
//         <aside className="col-span-12 lg:col-span-4">
//           <div className="flex h-full flex-col gap-4">
//             {/* Total Balance */}
//             <div className="h-full rounded-2xl p-px bg-gradient-to-r from-brand-500/50 to-cyan-500/40">
//               <div className="h-full flex flex-col rounded-2xl border border-gray-200/60 dark:border-white/10 
//                             bg-white/70 dark:bg-[#110f20] bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)] backdrop-blur-sm p-4 sm:p-5 
//                             shadow-sm transition-all duration-300 hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-500 dark:text-gray-400">Total Balance</span>
//                   <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
//                     USD
//                   </span>
//                 </div>
//                 <div className="h-full flex items-center mt-2 text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">
//                   {usd(TotalUsd)}
//                 </div>
//               </div>
//             </div>

//             {/* Asset cards */}
//             <div className="mt-auto grid grid-cols-1 gap-2 text-[15px] sm:text-base">  {/* base size for the section */}
              
//               <div className="group rounded-xl border border-gray-200/60 dark:border-white/10
//                   bg-white/70 dark:bg-[#110f20] bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)] backdrop-blur-sm p-4
//                   shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-4">
//                     <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-white/10 
//                         ring-1 ring-inset ring-black/5 dark:ring-white/10 
//                         flex items-center justify-center">
//                       <SiMonero className="w-7 h-7 text-[#FF6600]" />
//                     </div>
//                     <div>
//                       <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
//                         Monero
//                       </div>
//                       <div className="text-sm text-gray-500 dark:text-gray-400">XMR</div>
//                     </div>
//                   </div>

//                   <div className="text-right">
//                     <div className="text-base sm:text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
//                       XMR {xmrWallet?.balances?.[0]?.amount ?? "0"}
//                     </div>
//                     <div className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
//                       {usd(xmrWallet?.balances?.[0]?.usd ?? 0)}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//             </div>

//             {/* WalletBalanceCard pinned to bottom */}
//             <div className="mt-auto">
//               <WalletBalanceCard
//                 currentChain="XMR"
//                 walletsBySymbol={{
//                   XMR: xmrWallet ? { id: xmrWallet.id, address: xmrWallet.address } : undefined,
//                 }}
//               />
//             </div>
//           </div>
//         </aside>
//       </div>

//       <TransactionTable chain="XMR" />
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import {
  AddressSection,
} from "@/components/wallet/WalletNetworkCard";
import CryptoPriceChart from "@/components/wallet/pricechart/CoinPriceChart";
import TransactionTable from "@/components/transaction/transaction";
import { SiMonero } from "react-icons/si";
import { WalletOverviewSkeleton } from "@/components/skeleton/SkeletonLoaders";

interface WalletData {
  id: number;
  address: string;
  network: {
    name: string;
    symbol: string;
    chainId: string;
    explorerUrl?: string;
  };
  balances: {
    token: { symbol: string; name: string };
    amount: string;
    usd: number;
  }[];
}

export default function WalletOverviewPage() {

  const [xmrWallet, setXmrWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;

        if (!userId) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/wallets/balances?userId=${userId}`, {
          cache: "no-store",
        });

        const text = await res.text();
        let data: any = null;

        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          throw new Error(
            `Non-JSON response (${res.status}): ${text.slice(0, 200)}`
          );
        }

        if (!res.ok) {
          throw new Error(data?.error || `Request failed with ${res.status}`);
        }

        const wallets: WalletData[] = data.wallets || [];
        const xmr = wallets.find((w) => w.network.symbol === "XMR") || null;

        setXmrWallet(xmr);
      } catch (err) {
        console.error("Error fetching wallet data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWallets();
  }, []);

  const TotalUsd = Number(xmrWallet?.balances?.[0]?.usd ?? 0);

  const usd = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n);

  // -------------------------
  // SKELETON LOADING
  // -------------------------
  if (loading) {
    return <WalletOverviewSkeleton />;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 space-y-4 sm:space-y-5">

      {/* HEADER */}
      <div className="mb-3 sm:mb-5 text-base sm:text-lg font-semibold text-gray-800 dark:text-white/90 
                      px-2 sm:px-4 lg:px-6">
        <AddressSection
          symbol="XMR"
          address={xmrWallet?.address}
          explorerUrl={xmrWallet?.network.explorerUrl}
          chainId={xmrWallet?.network.chainId ?? ""}
          className="justify-start gap-3 sm:gap-6"
          textSize="sm"
        />
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-4 items-stretch">

        {/* LEFT: Price Chart */}
        <section className="col-span-1 lg:col-span-8">
          <div className="group relative h-full rounded-2xl p-px bg-gradient-to-br from-[#FF6600]/40 via-transparent to-[#FF8C42]/30">
            <div className="h-full rounded-2xl border border-gray-200/60 dark:border-white/10 
                            bg-white/70 dark:bg-[#110f20] bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)] backdrop-blur-sm 
                            shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_10px_30px_-10px_rgba(0,0,0,0.35)]
                            transition-all duration-300 group-hover:shadow-lg">

              <div className="p-4 sm:p-5 md:p-6">
                <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                    Market Overview
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Last 24h</span>
                </div>

                <div className="min-h-[280px] sm:min-h-[320px] md:min-h-[360px]">
                  <CryptoPriceChart initialAsset="XMR" hideAssetTabs />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* RIGHT: Summary */}
        <aside className="col-span-1 lg:col-span-4">
          <div className="flex h-full flex-col gap-3 sm:gap-4">

            {/* Total Balance */}
            <div className="rounded-2xl p-px bg-gradient-to-r from-[#FF6600]/50 to-cyan-500/40">
              <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 
                              bg-white/70 dark:bg-[#110f20] bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)] backdrop-blur-sm 
                              p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md">

                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Balance</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 
                                    text-gray-600 dark:text-gray-300">
                    USD
                  </span>
                </div>

                <div className="mt-2 text-xl sm:text-2xl md:text-3xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">
                  {usd(TotalUsd)}
                </div>
              </div>
            </div>

            {/* ASSET CARD → Only XMR */}
            <div className="grid grid-cols-1 gap-2 text-sm sm:text-[15px] md:text-base">

              <div className="group rounded-xl border border-gray-200/60 dark:border-white/10
                              bg-white/70 dark:bg-[#110f20] bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)] backdrop-blur-sm 
                              p-3 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">

                <div className="flex items-center justify-between gap-3">

                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gray-100 dark:bg-white/10
                                    ring-1 ring-inset ring-black/5 dark:ring-white/10 
                                    flex items-center justify-center flex-shrink-0">
                      <SiMonero className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#FF6600]" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
                        Monero
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">XMR</div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm sm:text-base md:text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                      {xmrWallet?.balances?.[0]?.amount ?? "0"}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                      {usd(xmrWallet?.balances?.[0]?.usd ?? 0)}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* SEND / RECEIVE SECTION */}
            <div className="mt-auto">
              <WalletBalanceCard
                currentChain="XMR"
                walletsBySymbol={{
                  XMR: xmrWallet
                    ? { id: xmrWallet.id, address: xmrWallet.address }
                    : undefined,
                }}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* TRANSACTIONS */}
      <TransactionTable chain="XMR" />

    </div>
  );
}
