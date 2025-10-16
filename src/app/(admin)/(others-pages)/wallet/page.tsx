"use client";

import React from "react";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import WalletNetworkCard from "@/components/wallet/WalletNetworkCard";
// import WalletRecentActivity from "@/components/wallet/WalletRecentActivity";


export default function WalletOverviewPage() {
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
          color="#E11D48"
          gradient="from-pink-500 to-pink-400"
        />
        <WalletNetworkCard
          name="Solana"
          symbol="SOL"
          tokenAmount="0"
          usdAmount="0.00"
          color="#8B5CF6"
          gradient="from-purple-600 to-purple-400"
        />
      </div>

      {/* ===== Recent Activity ===== */}
      {/* <WalletRecentActivity /> */}
    </div>
  );
}
