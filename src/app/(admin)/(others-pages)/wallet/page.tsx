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
        if (!userId) {
          console.warn("⚠️ No user_id found in localStorage");
          return;
        }

        const response = await fetch(`/api/wallets?userId=${userId}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Failed to fetch wallets");

        const wallets: WalletData[] = data.wallets || [];

        // ✅ Filter Tron & Solana networks
        const tron = wallets.find((w) => w.network.symbol === "TRX") || null;
        const solana = wallets.find((w) => w.network.symbol === "SOL") || null;

        setTronWallet(tron);
        setSolanaWallet(solana);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
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
          tokenAmount="0"
          usdAmount="0.00"
          address={tronWallet?.address}
          explorerUrl={tronWallet?.network.explorerUrl}
        />
        <WalletNetworkCard
          name="Solana"
          symbol="SOL"
          tokenAmount="0"
          usdAmount="0.00"
          address={solanaWallet?.address}
          explorerUrl={solanaWallet?.network.explorerUrl}
        />
      </div>

      {/* ===== Recent Activity ===== */}
      {/* <WalletRecentActivity /> */}
    </div>
  );
}
