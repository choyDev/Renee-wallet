"use client";

import React, { useEffect, useState } from "react";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import {
  NativeAmountSection,
  UsdtAmountSection,
  AddressSection,
  TronIcon
} from "@/components/wallet/WalletNetworkCard";
import CryptoPriceChart from "@/components/wallet/pricechart/CoinPriceChart";
import TransactionTable from "@/components/transaction/transaction";
import { SiDogecoin } from "react-icons/si";

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
  const [tronWallet, setTronWallet] = useState<WalletData | null>(null);
  const [solanaWallet, setSolanaWallet] = useState<WalletData | null>(null);
  const [ethWallet, setEthWallet] = useState<WalletData | null>(null);
  const [btcWallet, setBtcWallet] = useState<WalletData | null>(null);
  const [dogeWallet, setDogeWallet] = useState<WalletData | null>(null);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return;

        const res = await fetch(`/api/wallets/balances?userId=${userId}`, { cache: "no-store" });

        // Read text first so we can diagnose non-JSON / empty bodies
        const text = await res.text();
        let data: any = null;

        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          // Not JSON (e.g., HTML error page)
          throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
        }

        if (!res.ok) {
          throw new Error(data?.error || `Request failed with ${res.status}`);
        }

        const wallets: WalletData[] = data.wallets || [];
        const tron = wallets.find((w) => w.network.symbol === "TRX") || null;
        const sol = wallets.find((w) => w.network.symbol === "SOL") || null;
        const eth = wallets.find(w => w.network.symbol === "ETH") || null;
        const btc = wallets.find(w => w.network.symbol === "BTC") || null;
        const doge = wallets.find(w => w.network.symbol === "DOGE") || null;
      
        setTronWallet(tron);
        setSolanaWallet(sol);
        setEthWallet(eth);
        setBtcWallet(btc);
        setDogeWallet(doge);
      } catch (err) {
        console.error("Error fetching wallet data:", err);
        // optional: show a toast/UI hint
      }
    };

    fetchWallets();

  }, []);


  const TotalUsd = Number(dogeWallet?.balances?.[0]?.usd ?? "0");

  const usd = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 space-y-5">
      <div className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 flex justify-between items-center px-6">
        <AddressSection
          symbol="DOGE"
          address={dogeWallet?.address}
          explorerUrl={dogeWallet?.network.explorerUrl}
          chainId={dogeWallet?.network.chainId ?? ""}
          className="justify-start gap-6"
          textSize="base"
        />
      </div>

      <div className="grid grid-cols-12 gap-4 items-stretch">
        {/* LEFT: Chart */}
        <section className="col-span-12 lg:col-span-8">
          <div className="group relative h-full rounded-2xl p-px bg-gradient-to-br from-brand-400/40 via-transparent to-[#EF4444]/30">
            <div className="h-full rounded-2xl border border-gray-200/60 dark:border-white/10 
                          bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm 
                          shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_10px_30px_-10px_rgba(0,0,0,0.35)]
                          transition-all duration-300 group-hover:shadow-lg">
              <div className="p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                    Market Overview
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Last 24h</span>
                </div>

                {/* Give the chart room to breathe and a consistent height */}
                <div className="min-h-[360px]">
                  <CryptoPriceChart initialAsset="DOGE" hideAssetTabs />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: Wallet Summary */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="flex h-full flex-col gap-4">
            {/* Total Balance */}
            <div className="rounded-2xl p-px bg-gradient-to-r from-brand-500/50 to-cyan-500/40">
              <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 
                            bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm p-4 sm:p-5 
                            shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Balance</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                    USD
                  </span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">
                  {usd(TotalUsd)}
                </div>
              </div>
            </div>

            {/* Asset cards */}
            <div className="grid grid-cols-1 gap-2 text-[15px] sm:text-base">  {/* base size for the section */}
              {/* TRX */}
              <div className="group rounded-xl border border-gray-200/60 dark:border-white/10
                  bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm p-4
                  shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-white/10 
                        ring-1 ring-inset ring-black/5 dark:ring-white/10 
                        flex items-center justify-center">
                     <SiDogecoin className="w-7 h-7 text-[#C2A633]" />
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Dogecoin
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">DOGE</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base sm:text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                      DOGE {dogeWallet?.balances?.[0]?.amount ?? "0"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                      {usd(dogeWallet?.balances?.[0]?.usd ?? 0)}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* WalletBalanceCard pinned to bottom */}
            <div className="mt-auto">
              <WalletBalanceCard
                currentChain="DOGE"
                walletsBySymbol={{
                  SOL: solanaWallet ? { id: solanaWallet.id, address: solanaWallet.address } : undefined,
                  TRX: tronWallet ? { id: tronWallet.id, address: tronWallet.address } : undefined,
                  ETH: ethWallet ? { id: ethWallet.id, address: ethWallet.address } : undefined,
                  BTC: btcWallet ? { id: btcWallet.id, address: btcWallet.address } : undefined,
                  DOGE: dogeWallet ? { id: dogeWallet.id, address: dogeWallet.address } : undefined,
                }}
              />
            </div>
          </div>
        </aside>
      </div>

      <TransactionTable chain="DOGE" />
    </div>
  );
}
