"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const PortfolioAssets = () => {
  const options: ApexOptions = {
    labels: ["USDT", "TRX", "SOL"],
    colors: ["#10B981", "#EF4444", "#6366F1",],
    legend: { show: true, position: "bottom", labels: { colors: "#A0AEC0" } },
    dataLabels: { enabled: false },
    stroke: { show: false },
    plotOptions: { pie: { donut: { size: "75%" } } },
    tooltip: {
      y: { formatter: (val) => `${val}%` },
      theme: "dark",
    },
  };

  const series = [40, 25, 20];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#121B2E] p-6 shadow-sm flex flex-col justify-between h-full">
      <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">
        Portfolio Assets
      </h3>
      <div className="flex justify-center flex-1 items-center">
        <ReactApexChart options={options} series={series} type="donut" height={260} />
      </div>
    </div>
  );
};

export default PortfolioAssets;
