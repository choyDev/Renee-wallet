"use client";

import React, { useState } from "react";
import CryptoPriceChart, { ASSETS, AssetKey } from "@/components/wallet/pricechart/CoinPriceChart";

export default function DashboardChainChart() {
  const CHAIN_OPTIONS: { label: string; key: AssetKey }[] = [
    { label: "BTC", key: "BTC" },
    { label: "ETH", key: "ETH" },
    { label: "SOL", key: "SOL" },
    { label: "TRX", key: "TRX" },
    { label: "XMR", key: "XMR" },
    { label: "XRP", key: "XRP" },
    { label: "DOGE", key: "DOGE" },
  ];

  const [selectedChain, setSelectedChain] = useState<AssetKey>("BTC");

  return (
    <div
      className="
        rounded-2xl p-px 
      "
    >
      <div
        className="
          rounded-2xl p-6 shadow-sm h-full flex flex-col gap-4
          bg-gray-50 border border-gray-300
          dark:bg-[#1A1730] dark:border-gray-900 dark:backdrop-blur-xl
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Price Chart
          </h3>

          {/* Chain dropdown */}
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value as AssetKey)}
            className="
              text-sm rounded-lg px-3 py-2
              bg-gray-50 border border-gray-300
              dark:bg-[#1A1730] dark:border-gray-800
              text-gray-800 dark:text-gray-300
              focus:outline-none
            "
          >
            {CHAIN_OPTIONS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Chart */}
        <div className="w-full">
          <CryptoPriceChart initialAsset={selectedChain} hideAssetTabs />
        </div>
      </div>
    </div>
  );
}
