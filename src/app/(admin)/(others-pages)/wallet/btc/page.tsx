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
import { SiBitcoin } from "react-icons/si";

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

        if (!res.ok) {
          throw new Error(data?.error || `Request failed with ${res.status}`);
        }

        const wallets: WalletData[] = data.wallets || [];
        const tron = wallets.find((w) => w.network.symbol === "TRX") || null;
        const sol  = wallets.find((w) => w.network.symbol === "SOL") || null;
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

    const TotalUsd = Number(btcWallet?.balances?.[0]?.usd?? "0");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 space-y-5">
      <div className="mb-0 text-lg font-semibold text-gray-800 dark:text-white/90 flex justify-between items-center">
        <AddressSection
          symbol="BTC"
          address={btcWallet?.address}
          explorerUrl={btcWallet?.network.explorerUrl}
          chainId={btcWallet?.network.chainId ?? ""}
          className="justify-start gap-6"
          textSize="base"
        />
        <p>TotalUsd:&nbsp;&nbsp;&nbsp;${TotalUsd.toFixed(2)}$</p>
      </div>

      <div className="max-w-5xl mx-auto p-5">
        <CryptoPriceChart initialAsset={"BTC"} hideAssetTabs />
      </div>

      {/* ===== Balance + Actions ===== */}
      <WalletBalanceCard
        currentChain="BTC"
        walletsBySymbol={{
          SOL: solanaWallet ? { id: solanaWallet.id, address: solanaWallet.address } : undefined,
          TRX: tronWallet ? { id: tronWallet.id, address: tronWallet.address } : undefined,
          ETH: ethWallet ? { id: ethWallet.id, address: ethWallet.address } : undefined,
          BTC: btcWallet ? { id: btcWallet.id, address: btcWallet.address } : undefined,
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 justify-center">
          <div className="md:col-span-2 flex justify-center">

        <div
          className="relative flex flex-row justify-between rounded-2xl p-6 border border-gray-200 dark:border-gray-700 
                 bg-white dark:bg-[#121B2E] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 
                 w-full md:w-1/2"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700">
                <SiBitcoin className="text-[#F7931A] w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Bitcoin</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">BTC</p>
              </div>
            </div>
          </div>
          <NativeAmountSection
            symbol="BTC"
            tokenAmount={btcWallet?.balances?.[0]?.amount ?? "0"}
            usdAmount={(btcWallet?.balances?.[0]?.usd ?? 0).toFixed(2)}
          />
        </div>
        </div>
      </div>

        <TransactionTable chain="BTC"/>
      
    </div>
  );
}
