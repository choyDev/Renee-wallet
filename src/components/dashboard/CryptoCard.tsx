
"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CryptoCardProps {
  title?: string;
  subtitle?: string;
  value?: string;
  sub?: string;
  change?: string;
  changeAbs?: string;
  color?: string;
  accentColor?: string;
  iconBg?: string;
  icon?: React.ReactNode;
  data?: number[];
  loading?: boolean;
}

/* ------------------------------------------
   ⭐ SHIMMER SKELETON COMPONENT
------------------------------------------- */
const shimmer =
  "animate-pulse bg-gray-300/30 dark:bg-white/10 rounded-lg";

/* ------------------------------------------
   ⭐ SKELETON CARD UI
------------------------------------------- */
function CryptoCardSkeleton() {
  return (
    <div
      className="group rounded-2xl p-px"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.1), transparent)",
      }}
    >
      <div className="h-full rounded-2xl border border-gray-200/60 dark:border-white/10
                      bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm
                      shadow-sm p-5 sm:p-6 flex flex-col">

        {/* TOP: icon + title */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-11 w-11 ${shimmer}`} />
          <div className="flex flex-col gap-2 flex-1">
            <div className={`h-4 w-24 ${shimmer}`} />
          </div>
        </div>

        {/* main value */}
        <div className={`h-9 w-40 mb-4 ${shimmer}`} />

        {/* sub values */}
        <div className="flex flex-col gap-2 mb-4">
          <div className={`h-4 w-32 ${shimmer}`} />
          <div className={`h-4 w-20 ${shimmer}`} />
        </div>

        {/* pct + absolute */}
        <div className="flex items-center justify-between mt-3 mb-4">
          <div className={`h-4 w-20 ${shimmer}`} />
          <div className={`h-4 w-12 ${shimmer}`} />
        </div>

        {/* chart */}
        <div className={`h-[100px] w-full mt-2 ${shimmer}`} />
      </div>
    </div>
  );
}

/* ------------------------------------------
   ⭐ MAIN CARD
------------------------------------------- */
export default function CryptoCard({
  subtitle,
  value,
  sub,
  change,
  changeAbs,
  color = "#3B82F6",
  accentColor,
  iconBg = "bg-[#EEF2FF]",
  icon,
  data = [],
  loading = false,
}: CryptoCardProps) {
  if (loading) return <CryptoCardSkeleton />;

  const positive = change?.trim().startsWith("+");

  /* ------------------------------------------
      Responsive Sparkline Chart Options
  ------------------------------------------- */
  const options: ApexOptions = {
    chart: { type: "area", sparkline: { enabled: true }, animations: { enabled: true } },
    stroke: { curve: "smooth", width: 2 },
    colors: [color],
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0.06, stops: [0, 80, 100] },
    },
    grid: { show: false }, dataLabels: { enabled: false },
    tooltip: { enabled: false },
    yaxis: { show: false },
    xaxis: { labels: { show: false }, axisTicks: { show: false }, axisBorder: { show: false } },
  };

  const series = [{ data }];

  const accent = accentColor ?? "#3B82F6";

  const hairline = `linear-gradient(135deg, ${normalizeToAlpha(accent, 0.35)}, transparent)`;

  return (
    <div
      className="group rounded-2xl p-px transition-all duration-300"
      style={{ background: hairline }}
    >
      <div className="h-full rounded-2xl border border-gray-200/60 dark:border-white/10
                      bg-white/80 dark:bg-[#0B1220]/80 backdrop-blur-xl
                      shadow-sm transition-all duration-300 hover:shadow-md">

        <div className="p-4 sm:p-5 md:p-6 flex flex-col h-full">

          {/* ------------------------------------ */}
          {/* TITLE + ICON — fully responsive       */}
          {/* ------------------------------------ */}
          <div className="flex items-center gap-3">
            <div
              className={`flex justify-center items-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl ${iconBg}
                          dark:bg-white/10 ring-1 ring-black/5 dark:ring-white/10`}
            >
              {icon}
            </div>

            <h4 className="font-semibold text-[14px] sm:text-[15px] text-gray-900 dark:text-white truncate">
              {subtitle}
            </h4>
          </div>

          {/* ------------------------------------ */}
          {/* VALUE AREA — responsive text size     */}
          {/* ------------------------------------ */}
          <div className="mt-3 sm:mt-4">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              {value}
            </h3>

            {/* Sub-lines */}
            <div className="mt-2 min-h-[40px] px-2 sm:px-3">
              <p className="text-[13px] sm:text-[15px] text-gray-600 dark:text-gray-400 whitespace-pre-line leading-tight">
                {sub}
              </p>
            </div>
          </div>

          {/* ------------------------------------ */}
          {/* PRICE CHANGE ROW                     */}
          {/* ------------------------------------ */}
          <div className="mt-2.5 flex items-center justify-between">
            <span
              className={`text-sm sm:text-base font-medium ${positive ? "text-green-500" : "text-red-500"}`}
            >
              {changeAbs}
            </span>

            <span
              className={`px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-semibold
                ${positive
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
            >
              {change}
            </span>
          </div>

          {/* ------------------------------------ */}
          {/* SPARKLINE — responsive height        */}
          {/* ------------------------------------ */}
          <div className="h-[90px] sm:h-[100px] w-full mt-2 pb-1 pointer-events-none">
            <ReactApexChart
              options={options}
              series={series}
              type="area"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------
   HELPERS
------------------------------------------- */
function normalizeToAlpha(hex: string, alpha: number) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return `rgba(255,255,255,${alpha})`;

  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
