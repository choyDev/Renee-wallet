"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface WalletData {
  id: number;
  address: string;
  network: { name: string; symbol: string };
  balances: { token: { symbol: string; name: string }; amount: string; usd: number }[];
}

export default function PortfolioAssets() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100); // delay ensures container sized
    return () => clearTimeout(timer);
  }, []);

  const symbols = ["TRX", "SOL", "ETH", "BTC", "XMR", "XRP", "DOGE"];
  const usdValues = symbols.map((sym) => {
    const wallet = wallets.find((w) => w.network.symbol === sym);
    if (!wallet) return 0;

    const usdValue = wallet.balances?.[0]?.usd ?? 0;
    const usdtBalance = parseFloat(wallet.balances?.find((b) => b.token?.symbol === "USDT")?.amount ?? "0") || 0;

    return usdValue + usdtBalance;
  });
  const totalUsd = usdValues.reduce((a, b) => a + b, 0);
  const series = totalUsd > 0 ? usdValues.map((v) => (v / totalUsd) * 100) : usdValues.map(() => 0);

  const options: ApexOptions = {
    chart: { type: "donut", background: "transparent" },
    labels: symbols,
    colors: ["#FF060A", "#14F195", "#627EEA", "#F7931A", "#FF6600", "#006097", "#C2A633"],
    dataLabels: { enabled: false },
    stroke: { show: false },
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      labels: { colors: undefined }, // auto switch light/dark
      fontSize: "13px",
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            name: { show: true, fontSize: "14px" },
            value: {
              show: true,
              fontSize: "18px",
              fontWeight: 700,
              formatter: (val) => `${parseFloat(val).toFixed(1)}%`,
            },
            total: {
              show: true,
              label: "Total",
              fontSize: "14px",
              formatter: () => `$${totalUsd.toFixed(2)}`,
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val, opts) => {
          const idx = opts.seriesIndex ?? 0;
          const usd = usdValues[idx] ?? 0;
          return `$${usd.toFixed(2)} (${val.toFixed(1)}%)`;
        },
      },
      theme: undefined, // auto
    },
    responsive: [{ breakpoint: 640, options: { chart: { height: 240 } } }],
  };

  return (
    <div className="rounded-2xl p-px bg-gradient-to-br from-brand-500/40 via-transparent to-cyan-500/40 h-full">
      <div className="h-full rounded-2xl border border-gray-200/60 dark:border-white/10
                      bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm p-6 shadow-sm
                      transition-all duration-300 hover:shadow-md flex flex-col">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Portfolio Assets</h3>
        <div className="flex justify-center items-center flex-1 notranslate">
          {mounted && (
            <ReactApexChart options={options} series={series} type="donut" height={280} />
          )}
        </div>
      </div>
    </div>
  );
}
