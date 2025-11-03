"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CryptoCardProps {
  title: string;
  subtitle: string;
  value: string;
  sub: string;
  change: string;
  changeAbs: string;
  color: string;
  accentColor?: string;
  iconBg: string;
  icon: React.ReactNode;
  data: number[];
}

export default function CryptoCard({
  title,
  subtitle,
  value,
  sub,
  change,
  changeAbs,
  color,
  accentColor,
  iconBg,
  icon,
  data,
}: CryptoCardProps) {
  const positive = change.trim().startsWith("+");

  const options: ApexOptions = {
    chart: { type: "area", sparkline: { enabled: true }, animations: { enabled: true } },
    stroke: { curve: "smooth", width: 2 },
    colors: [color], // <- graph stays per-coin
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.06, stops: [0, 85, 100] } },
    grid: { show: false }, dataLabels: { enabled: false },
    tooltip: { enabled: false }, yaxis: { show: false },
    xaxis: { labels: { show: false }, axisTicks: { show: false }, axisBorder: { show: false } },
  };
  const series = [{ data }];

  const accent = accentColor ?? "#3B82F6"; // fallback shared brand
  const hairline = `linear-gradient(135deg, ${normalizeToAlpha(accent, 0.35)}, transparent)`;

  return (
    <div className="group rounded-2xl p-px" style={{ background: hairline }}>
      <div className="h-full rounded-2xl border border-gray-200/60 dark:border-white/10
                      bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm
                      shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="p-5 sm:p-6 flex flex-col h-full">
          <div className="flex items-center gap-3">
            <div className={`flex justify-center items-center h-11 w-11 rounded-xl ${iconBg}
                            dark:bg-white/10 ring-1 ring-inset ring-black/5 dark:ring-white/10`}>
              {icon}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white text-[15px] truncate">{subtitle}</h4>
              {/* <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p> */}
            </div>
          </div>

          {/* values */}
          <div className="mt-5">
            <h3 className="text-3xl sm:text-4xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">
              {value}
            </h3>
            {/* Reserve up to 2 lines of ~19px each (tailwind text-[15px]) */}
            <div className="mt-1.5 min-h-[40px]">
              <p className="text-[15px] text-gray-600 dark:text-gray-400 tabular-nums whitespace-pre-line">
                {sub}
              </p>
            </div>
          </div>


          <div className="mt-5 flex items-center justify-between">
            <span className={`text-sm font-medium ${positive ? "text-green-500" : "text-red-500"}`}>{changeAbs}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums
                              ${positive ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
              {change}
            </span>
          </div>

          <div className="h-[70px] w-full mt-5 pb-2 pointer-events-none">
            <ReactApexChart options={options} series={series} type="area" height={72} />
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeToAlpha(hex: string, alpha: number) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return `color-mix(in srgb, ${hex} ${Math.round(alpha * 100)}%, transparent)`;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
