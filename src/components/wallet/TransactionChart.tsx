
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

/* -------------------------------------------------------
   Modern Beautiful Shimmer Skeleton
------------------------------------------------------- */
const shimmerCSS = `
@keyframes shimmer { 
  100% { transform: translateX(100%); } 
}
.animate-shimmer {
  animation: shimmer 1.4s infinite;
  transform: translateX(-100%);
}
`;

if (typeof window !== "undefined" && !document.getElementById("shimmer-style-thc")) {
  const style = document.createElement("style");
  style.id = "shimmer-style-thc";
  style.innerHTML = shimmerCSS;
  document.head.appendChild(style);
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-300/30 dark:bg-white/10 rounded-md ${className}`}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r 
        from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
  );
}

/* ------------------------------------------------------- */

interface TransactionData {
  label: string;
  earning: number;
  spending: number;
}

export default function TransactionHistoryChart() {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState("All Time");

  const [totalAmount, setTotalAmount] = useState(0);
  const [chartData, setChartData] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  /* Mount delay for smooth UI */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  /* ===========================================================
      FETCH TRANSACTIONS
  =========================================================== */
  useEffect(() => {
    if (!mounted) return;

    const load = async () => {
      setLoading(true);

      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return setLoading(false);

        const userId = JSON.parse(storedUser).id;

        const res = await fetch(`/api/transaction?userId=${userId}`, { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) throw new Error();

        if (data.transactions) {
          const filtered = filterByPeriod(data.transactions, period);
          const processed = processPeriod(filtered, period);
          setChartData(processed);

          const total = filtered.reduce(
            (sum: number, tx: any) => sum + Math.abs(parseFloat(tx.amount) || 0),
            0
          );
          setTotalAmount(total);
        }
      } catch {
        setChartData([]);
        setTotalAmount(0);
      }

      setLoading(false);
    };

    load();
  }, [mounted, period]);

  /* ===========================================================
      FILTER FUNCTIONS
  =========================================================== */

  const filterByPeriod = (txs: any[], p: string) => {
    if (p === "All Time") return txs;

    const now = new Date();
    let start: Date;

    if (p === "This Week") {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
    } else if (p === "This Month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
    }

    return txs.filter((tx) => {
      const d = new Date(tx.createdAt);
      return d >= start && d <= now;
    });
  };

  const processPeriod = (txs: any[], p: string) => {
    if (p === "This Week") return processWeek(txs);
    if (p === "This Month") return processMonth(txs);
    return processYear(txs);
  };

  const processWeek = (txs: any[]) => {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const res: TransactionData[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const label = names[d.getDay()];
      const ds = d.toDateString();

      const list = txs.filter((tx) => new Date(tx.createdAt).toDateString() === ds);
      let earning = 0,
        spending = 0;

      list.forEach((tx) => {
        const amt = Math.abs(parseFloat(tx.amount) || 0);
        if (tx.direction === "RECEIVED") earning += amt;
        else spending += amt;
      });

      res.push({ label, earning, spending });
    }
    return res;
  };

  const processMonth = (txs: any[]) => {
    const now = new Date();
    const days = now.getDate();
    const res: TransactionData[] = [];

    for (let d = 1; d <= days; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), d);
      const ds = date.toDateString();

      const list = txs.filter((tx) => new Date(tx.createdAt).toDateString() === ds);

      let earning = 0,
        spending = 0;

      list.forEach((tx) => {
        const amt = Math.abs(parseFloat(tx.amount) || 0);
        if (tx.direction === "RECEIVED") earning += amt;
        else spending += amt;
      });

      res.push({ label: d.toString(), earning, spending });
    }

    return res;
  };

  const processYear = (txs: any[]) => {
    const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const map: any = {};

    m.forEach((x) => (map[x] = { earning: 0, spending: 0 }));

    txs.forEach((tx) => {
      const d = new Date(tx.createdAt);
      const key = m[d.getMonth()];
      const amt = Math.abs(parseFloat(tx.amount) || 0);

      if (tx.direction === "RECEIVED") map[key].earning += amt;
      else map[key].spending += amt;
    });

    return m.map((x) => ({
      label: x,
      earning: map[x].earning,
      spending: map[x].spending,
    }));
  };

  /* ===========================================================
      CHART OPTIONS
  =========================================================== */

  const series = [
    { name: "Earning", data: chartData.map((x) => x.earning) },
    { name: "Spending", data: chartData.map((x) => x.spending) },
  ];

  const options: ApexOptions = {
    chart: {
      type: "area",
      id: "tx-chart",
      background: "transparent",
      toolbar: { show: false },
      animations: { enabled: true },
    },
    colors: ["#A855F7", "#06B6D4"],
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.5, opacityTo: 0.1 },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "rgba(255,255,255,0.08)",
      strokeDashArray: 3,
    },
    xaxis: {
      categories: chartData.map((x) => x.label),
      labels: {
        style: { colors: "#9CA3AF", fontSize: "11px" },
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#9CA3AF", fontSize: "11px" },
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)),
      },
    },
    legend: {
      show: true,
      position: "top",
      labels: { colors: "#9CA3AF" },
      markers: { size: 7 },
    },
  };

  /* ===========================================================
      RESPONSIVE RENDER
  =========================================================== */

  return (
    <div
    className="
      group rounded-2xl p-px transition-all duration-300 
    "
    >

      <div className="
        h-full rounded-2xl border border-gray-300 dark:border-gray-900
        bg-gray-50 dark:bg-[#1A1730] backdrop-blur-xl 
        p-5 sm:p-6 lg:p-8 flex flex-col
      ">

        {/* ---------------- HEADER ---------------- */}
        {loading ? (
          <div className="w-full">
            <Skeleton className="h-5 w-40 mb-3" />
            <Skeleton className="h-7 w-48 mb-4" />
            <Skeleton className="h-8 w-32" />
          </div>
        ) : (
          <div className="flex items-start justify-between mb-4">

            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Transactions Overview
              </h3>

              <div className="
                text-2xl sm:text-3xl lg:text-4xl font-bold 
                text-gray-900 dark:text-white notranslate
              ">
                ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Period Selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              disabled={loading}
              className="
                px-3 py-1.5 text-sm rounded-lg 
                bg-white/50 dark:bg-[#1A1F36] 
                border border-gray-300 dark:border-white/20 
                text-gray-900 dark:text-white 
                outline-none cursor-pointer
              "
            >
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
              <option value="All Time">All Time</option>
            </select>
          </div>
        )}

        {/* ---------------- CHART ---------------- */}
        <div className="flex-1 flex items-center justify-center min-h-[200px] sm:min-h-[220px] lg:min-h-[250px]">

          {loading ? (
            <Skeleton className="w-full h-[220px] sm:h-[240px] lg:h-[260px] rounded-xl" />
          ) : (
            <div className="w-full h-full">
              <ReactApexChart
                options={options}
                series={series}
                type="area"
                height="100%"
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
