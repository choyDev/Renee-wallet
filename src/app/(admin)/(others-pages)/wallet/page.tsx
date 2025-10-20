"use client";

import React, { useEffect, useState } from "react";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import WalletNetworkCard from "@/components/wallet/WalletNetworkCard";
// import WalletRecentActivity from "@/components/wallet/WalletRecentActivity";

interface WalletData {
  id: number;
  address: string;
  network: {
    name: string;
    symbol: string;
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

        setTronWallet(tron);
        setSolanaWallet(sol);
      } catch (err) {
        console.error("Error fetching wallet data:", err);
        // optional: show a toast/UI hint
      }
    };

    fetchWallets();
  }, []);


  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 space-y-6">
      <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
        Wallet Overview
      </h3>

      {/* ===== Balance + Actions ===== */}
      <WalletBalanceCard />

      {/* ===== Network Balances ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WalletNetworkCard
          name="Tron"
          symbol="TRX"
          tokenAmount={tronWallet?.balances?.[0]?.amount ?? "0"}
          usdAmount={(tronWallet?.balances?.[0]?.usd ?? 0).toFixed?.(2) ?? "0.00"}
          address={tronWallet?.address}
          explorerUrl={tronWallet?.network.explorerUrl}
        />

        <WalletNetworkCard
          name="Solana"
          symbol="SOL"
          tokenAmount={solanaWallet?.balances?.[0]?.amount ?? "0"}
          usdAmount={(solanaWallet?.balances?.[0]?.usd ?? 0).toFixed?.(2) ?? "0.00"}
          address={solanaWallet?.address}
          explorerUrl={solanaWallet?.network.explorerUrl}
        />
      </div>

      {/* ===== Recent Activity ===== */}
      {/* <WalletRecentActivity /> */}
    </div>
  );
}
