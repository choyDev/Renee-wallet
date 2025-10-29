"use client";

import React, { useEffect, useState } from "react";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import {
  NativeAmountSection,
  UsdtAmountSection,
  AddressSection,
} from "@/components/wallet/WalletNetworkCard";
import TransactionTable from "@/components/transaction/transaction";
import CryptoPriceChart from "@/components/wallet/pricechart/CoinPriceChart";
import { SiEthereum, SiTether } from "react-icons/si";

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

        // inside fetchWallets, after: const data = text ? JSON.parse(text) : null;
        console.log("API wallets payload:", data.wallets);


        if (!res.ok) {
          throw new Error(data?.error || `Request failed with ${res.status}`);
        }

        const wallets: WalletData[] = data.wallets || [];
        const tron = wallets.find((w) => w.network.symbol === "TRX") || null;
        const sol = wallets.find((w) => w.network.symbol === "SOL") || null;
        const eth = wallets.find(w => w.network.symbol === "ETH") || null;
        const btc = wallets.find(w => w.network.symbol === "BTC") || null;

        setTronWallet(tron);
        setSolanaWallet(sol);
        setEthWallet(eth);
        setBtcWallet(btc);
      } catch (err) {
        console.error("Error fetching wallet data:", err);
        // optional: show a toast/UI hint
      }
    };

    fetchWallets();

  }, []);

  const ethUSDT =
    ethWallet?.balances.find(b => b.token.symbol === "USDT")?.amount ?? "0"; // if you have ETH card

  const TotalUsd = Number(ethWallet?.balances?.[0]?.usd ?? "0") + Number(ethUSDT ?? "0");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 space-y-5">
      <div className="mb-0 text-lg font-semibold text-gray-800 dark:text-white/90 flex justify-between items-center px-6">
        <AddressSection
          symbol="ETH"
          address={ethWallet?.address}
          explorerUrl={ethWallet?.network.explorerUrl}
          chainId={ethWallet?.network.chainId ?? ""}
          className="justify-start gap-6"
          textSize="base"
        />
        <div className="border border-brand-500 dark:border-brand-400 rounded-lg px-3 py-1.5">
          <p className="font-semibold text-brand-500 dark:text-brand-400">
            Total Balance:&nbsp;&nbsp;${TotalUsd.toFixed(2)}$
          </p>
        </div>
      </div>

      <div
        className="relative flex flex-row justify-between rounded-2xl p-6 border border-gray-200 dark:border-gray-700 
                 bg-white dark:bg-[#121B2E] shadow-sm hover:shadow-md transition-all duration-300"
      >
        <CryptoPriceChart initialAsset={"ETH"} hideAssetTabs />
      </div>

      {/* ===== Balance + Actions ===== */}
      <WalletBalanceCard
        currentChain="ETH"
        walletsBySymbol={{
          SOL: solanaWallet ? { id: solanaWallet.id, address: solanaWallet.address } : undefined,
          TRX: tronWallet ? { id: tronWallet.id, address: tronWallet.address } : undefined,
          ETH: ethWallet ? { id: ethWallet.id, address: ethWallet.address } : undefined,
          BTC: btcWallet ? { id: btcWallet.id, address: btcWallet.address } : undefined,
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        <div
          className="relative flex flex-row justify-between rounded-2xl p-6 border border-gray-200 dark:border-gray-700 
                 bg-white dark:bg-[#121B2E] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700">
                <SiEthereum className="text-[#627EEA] w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Ethereum</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">ETH</p>
              </div>
            </div>
          </div>
          <NativeAmountSection
            symbol="ETH"
            tokenAmount={ethWallet?.balances?.[0]?.amount ?? "0"}
            usdAmount={(ethWallet?.balances?.[0]?.usd ?? 0).toFixed(2)}
          />
        </div>
        <div
          className="relative flex flex-row justify-between rounded-2xl p-6 border border-gray-200 dark:border-gray-700 
                 bg-white dark:bg-[#121B2E] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700">
                <SiTether className="text-[#26A17B] w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">USDT</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">USDT (ERC20)</p>
              </div>
            </div>
          </div>
          <UsdtAmountSection
            usdtTokenAmount={ethUSDT}
          />
        </div>
      </div>

      <TransactionTable chain="ETH"/>
    </div>
  );
}
