
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface WalletData {
  id: number;
  address: string;
  network: { name: string; symbol: string };
  balances: { token: { symbol: string; name: string }; amount: string; usd: number }[];
}

const PortfolioAssets = () => {
  const [wallets, setWallets] = useState<WalletData[]>([]);

  // --- Fetch wallet balances from API ---
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return;

        const res = await fetch(`/api/wallets/balances?userId=${userId}`, { cache: "no-store" });
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
        setWallets(data.wallets || []);
      } catch (err) {
        console.error("Error loading wallet balances:", err);
      }
    };
    fetchBalances();
  }, []);

  // --- Extract values safely ---
  const symbols = ["TRX", "SOL", "ETH", "BTC", "XMR", "XRP", "DOGE", "USDT"];

  const usdValues = symbols.map((sym) => {
    const w = wallets.find((w) => w.network.symbol === sym);
    return w?.balances?.[0]?.usd ?? 0;
  });

  // Calculate total and percentages
  const totalUsd = usdValues.reduce((a, b) => a + b, 0);
  const series = totalUsd > 0 ? usdValues.map((v) => (v / totalUsd) * 100) : usdValues.map(() => 0);

  // --- Chart Options ---
  const options: ApexOptions = {
    chart: {
      type: "donut",
      background: "transparent",
    },
    labels: symbols,
    colors: [
      "#FF060A", // TRX
      "#14F195", // SOL
      "#627EEA", // ETH
      "#F7931A", // BTC
      "#FF6600", // XMR
      "#006097", // XRP
      "#C2A633", // DOGE
      "#26A17B", // USDT
    ],
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      labels: { colors: "#A0AEC0" },
      fontSize: "13px",
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            name: { show: true, fontSize: "16px", color: "#A0AEC0" },
            value: {
              show: true,
              fontSize: "18px",
              fontWeight: 600,
              formatter: (val) => `${parseFloat(val).toFixed(1)}%`,
            },
            total: {
              show: true,
              label: "Total",
              fontSize: "16px",
              color: "#64748B",
              formatter: () => `$${totalUsd.toFixed(2)}`,
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val, opts) => {
          const sym = symbols[opts.seriesIndex];
          const usd = usdValues[opts.seriesIndex] ?? 0;
          return `$${usd.toFixed(2)} (${val.toFixed(1)}%)`;
        },
      },
      theme: "dark",
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: { height: 240 },
          legend: { position: "bottom" },
        },
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#121B2E] p-6 shadow-sm flex flex-col justify-between h-full">
      <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">
        Portfolio Assets
      </h3>

      <div className="flex justify-center flex-1 items-center notranslate">
        <ReactApexChart
          options={options}
          series={series}
          type="donut"
          height={280}
        />
      </div>
    </div>
  );
};

export default PortfolioAssets;
