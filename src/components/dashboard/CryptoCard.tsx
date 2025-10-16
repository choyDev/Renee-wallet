"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CryptoCardProps {
  title: string;
  subtitle: string;
  value: string;
  sub: string;
  change: string;
  changeAbs: string;
  color: string;
  iconBg: string;
  icon: React.ReactNode;
  data: number[];
}

const CryptoCard = ({
  title,
  subtitle,
  value,
  sub,
  change,
  changeAbs,
  color,
  iconBg,
  icon,
  data,
}: CryptoCardProps) => {
  const positive = change.startsWith("+");

  const options: ApexOptions = {
    chart: { type: "area", sparkline: { enabled: true } },
    stroke: { curve: "smooth", width: 2 },
    colors: [color],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    tooltip: { enabled: false },
  };
  const series = [{ data }];

  return (
    <div className="rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-none p-6 transition-all hover:shadow-lg flex flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className={`flex justify-center items-center w-12 h-12 rounded-xl ${iconBg} dark:bg-[#1F2A44]`}>
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-gray-700 dark:text-white/90 text-[15px]">{title}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white/90">{value}</h3>
        <p className="text-[15px] text-gray-600 dark:text-gray-400 mt-1.5">{sub}</p>
      </div>

      <div className="flex justify-between items-center mt-5">
        <span className={`text-sm font-medium ${positive ? "text-green-500" : "text-red-500"}`}>{changeAbs}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${positive ? "bg-[#E8FFF9] text-[#10B981]" : "bg-[#FFF2F0] text-[#EF4444]"}`}>
          {change}
        </span>
      </div>

      <div className="h-[70px] w-full mt-5 pb-2">
        <ReactApexChart options={options} series={series} type="area" height={70} />
      </div>
    </div>
  );
};

export default CryptoCard;
