
"use client";

import dynamic from "next/dynamic";
import React from "react";
import { ApexOptions } from "apexcharts";
import { FaBitcoin, FaEthereum } from "react-icons/fa";
import { SiSolana, SiTether } from "react-icons/si";
import { BsCurrencyBitcoin } from "react-icons/bs";
import Badge from "@/components/ui/badge/Badge"

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

/* ============================================================
   MAIN DASHBOARD COMPONENT
============================================================ */
export default function Dashboard() {
  return (
    <div className="grid grid-cols-12 gap-6 p-6 bg-gray-50 dark:bg-[#0E1624] min-h-screen transition-all">
      {/* ===== Top Summary Cards ===== */}
      <DashboardSummary />

      {/* ===== Tokens + Portfolio Assets ===== */}
      <div className="col-span-12 flex flex-col xl:flex-row gap-6">
        <div className="xl:w-[65%]">
          <TokensTable />
        </div>
        <div className="xl:w-[35%]">
          <PortfolioAssets />
        </div>
      </div>

      {/* ===== Recent Activities ===== */}
      <div className="col-span-12">
        <RecentActivityTable />
      </div>
    </div>
  );
}

const DashboardSummary = () => (
    <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <BalanceCard />
      <CryptoCard
        title="BTC-USD"
        subtitle="Bitcoin USD"
        value="$455.81"
        sub="$821.85"
        change="-10.4%"
        changeAbs="-125.05%"
        color="#EF4444"
        iconBg="bg-[#FFF2F0]"
        icon={<FaBitcoin className="text-orange-500 size-6" />}
        data={[12, 18, 20, 16, 14, 12, 10]}
      />
      <CryptoCard
        title="SOL-USD"
        subtitle="Solana USD"
        value="$581.85"
        sub="$581.85"
        change="+9.25%"
        changeAbs="+182.10%"
        color="#10B981"
        iconBg="bg-[#E8FFF9]"
        icon={<SiSolana className="text-[#14F195] size-6" />}
        data={[10, 12, 15, 18, 21, 24, 26]}
      />
      <CryptoCard
        title="ETH-USD"
        subtitle="Ethereum USD"
        value="$1,125.85"
        sub="$1,125.85"
        change="+7.05%"
        changeAbs="+12.10%"
        color="#3B82F6"
        iconBg="bg-[#E8F4FF]"
        icon={<FaEthereum className="text-[#4B70C6] size-6" />}
        data={[8, 10, 12, 14, 16, 18, 20]}
      />
    </div>
)

/* 💰 Estimated Balance Card */
const BalanceCard = () => (
  <div className="rounded-2xl bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-none p-6 transition-all hover:shadow-lg">
    <div className="flex items-center gap-3">
      <div className="flex justify-center items-center w-12 h-12 rounded-xl bg-[#E8F4FF] dark:bg-[#1F2A44]">
        <SiTether className="text-[#0057FF] dark:text-[#5CA9FF] size-6" />
      </div>
      <h4 className="font-semibold text-gray-700 dark:text-white/90 text-[15px]">
        Estimated Balance
      </h4>
    </div>

    <div className="mt-5">
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white/90">$125,821</h3>
      <p className="text-[15px] text-gray-600 dark:text-gray-400 mt-1.5">$821.85</p>
    </div>

    <div className="flex justify-between items-center mt-5">
      <span className="text-gray-500 dark:text-gray-400 text-sm">+102.15%</span>
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8FFF9] text-[#10B981] dark:bg-[#10B981]/20 dark:text-[#10B981]">
        +15.6%
      </span>
    </div>
  </div>
);

/* 📈 Crypto Card */
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`flex justify-center items-center w-12 h-12 rounded-xl ${iconBg} dark:bg-[#1F2A44]`}>
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-gray-700 dark:text-white/90 text-[15px]">
            {title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>

      {/* Values */}
      <div className="mt-5">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white/90">{value}</h3>
        <p className="text-[15px] text-gray-600 dark:text-gray-400 mt-1.5">{sub}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center mt-5">
        <span
          className={`text-sm font-medium ${
            positive ? "text-green-500" : "text-red-500"
          }`}
        >
          {changeAbs}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            positive
              ? "bg-[#E8FFF9] text-[#10B981] dark:bg-[#10B981]/20 dark:text-[#10B981]"
              : "bg-[#FFF2F0] text-[#EF4444] dark:bg-[#EF4444]/20 dark:text-[#F87171]"
          }`}
        >
          {change}
        </span>
      </div>

      {/* Chart */}
      <div className="h-[70px] w-full mt-5 pb-2">
        <ReactApexChart options={options} series={series} type="area" height={70} />
      </div>
    </div>
  );
};

/* ============================================================
   2️⃣ TOKENS TABLE
============================================================ */
const TokensTable = () => {
  const tokens = [
    {
      name: "BTC (Bitcoin)",
      icon: <FaBitcoin className="text-[#F7931A] text-xl" />,
      price: "$63,245.02",
      change24h: "-19.43%",
      change7d: "+46.12%",
      marketCap: "7.57321 BTC",
    },
    {
      name: "ETH (Ethereum)",
      icon: <FaEthereum className="text-[#4B70C6] text-xl" />,
      price: "$4,743.47",
      change24h: "-10.32%",
      change7d: "+14.39%",
      marketCap: "1.23450 BTC",
    },
    {
      name: "SOL (Solana)",
      icon: <SiSolana className="text-[#AB47BC] text-xl" />,
      price: "$6,843.43",
      change24h: "+23.12%",
      change7d: "-6.12%",
      marketCap: "0.12000 BTC",
    },
    {
      name: "USDT (Tether)",
      icon: <SiTether className="text-[#2F80ED] text-xl" />,
      price: "$5,531.32",
      change24h: "-2.42%",
      change7d: "-2.32%",
      marketCap: "1.45257 BTC",
    },
  ];

  return (
    <div className="h-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121B2E] p-6 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-semibold text-gray-800 dark:text-white/90 text-lg">
          Today Top Market
        </h3>
        <button className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition">
          All Market
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm rounded-lg">
          <thead>
            <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Price</th>
              <th className="text-left py-3 px-4">24h Change</th>
              <th className="text-left py-3 px-4">7d Change</th>
              <th className="text-left py-3 px-4">Market Cap</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
              >
                <td className="py-4 px-4 flex items-center gap-2 font-medium text-gray-800 dark:text-white/90">
                  {t.icon}
                  <span>{t.name}</span>
                </td>
                <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {t.price}
                </td>
                <td
                  className={`py-4 px-4 font-semibold ${
                    t.change24h.startsWith("+")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {t.change24h}
                </td>
                <td
                  className={`py-4 px-4 font-semibold ${
                    t.change7d.startsWith("+")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {t.change7d}
                </td>
                <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                  {t.marketCap}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================================
   3️⃣ PORTFOLIO ASSETS CHART
============================================================ */
const PortfolioAssets = () => {
  const options: ApexOptions = {
    labels: ["USDT", "TRX", "SOL", "ETH"],
    colors: ["#10B981", "#EF4444", "#6366F1", "#3B82F6"],
    legend: { show: true, position: "bottom" },
    dataLabels: { enabled: false },
    stroke: { show: false },
    plotOptions: { pie: { donut: { size: "75%" } } },
  };
  const series = [40, 25, 20, 15];

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

/* ============================================================
   4️⃣ RECENT ACTIVITY TABLE
============================================================ */
const RecentActivityTable = () => {
  const activities = [
    {
      coin: "USDT",
      transaction: "Withdraw USDT",
      amount: "$653.10",
      id: "#14525156",
      date: "Jun 10, 2024",
      status: "Completed",
      fee: "7.57321 BTC",
    },
    {
      coin: "BTC",
      transaction: "Deposit BTC",
      amount: "$542.05",
      id: "#03483195",
      date: "Jun 15, 2024",
      status: "Declined",
      fee: "1.23450 BTC",
    },
    {
      coin: "BTC",
      transaction: "Deposit BTC",
      amount: "$456.10",
      id: "#8520097",
      date: "Jun 18, 2024",
      status: "Pending",
      fee: "0.12000 BTC",
    },
    {
      coin: "SOL",
      transaction: "Withdraw USDT",
      amount: "$759.10",
      id: "#00078867",
      date: "Jun 20, 2024",
      status: "Completed",
      fee: "0.49867 BTC",
    },
  ];

  const getIcon = (coin: string) => {
    switch (coin) {
      case "BTC":
        return <FaBitcoin className="text-[#F7931A] size-5" />;
      case "ETH":
        return <FaEthereum className="text-[#4B70C6] size-5" />;
      case "USDT":
        return <SiTether className="text-[#2F80ED] size-5" />;
      case "SOL":
        return <SiSolana className="text-[#AB47BC] size-5" />;
      default:
        return <BsCurrencyBitcoin className="text-gray-400 size-5" />;
    }
  };

  const getBadgeColor = (status: string) => {
    if (status === "Completed") return "success";
    if (status === "Pending") return "warning";
    return "error";
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121B2E] p-6 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-5 text-lg">
        Recent Activities
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm rounded-lg">
          <thead>
            <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4">Coin</th>
              <th className="text-left py-3 px-4">Transaction</th>
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Fees</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
              >
                <td className="py-4 px-4 flex items-center gap-2 font-medium text-gray-800 dark:text-white/90">
                  {getIcon(a.coin)}
                  <span>{a.coin}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="font-semibold text-gray-800 dark:text-white/90 mr-1">
                    {a.amount}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {a.transaction}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-500 dark:text-gray-400">{a.id}</td>
                <td className="py-4 px-4 text-gray-500 dark:text-gray-400">{a.date}</td>
                <td className="py-4 px-4">
                  <Badge size="sm" color={getBadgeColor(a.status)}>
                    {a.status}
                  </Badge>
                </td>
                <td className="py-4 px-4 text-gray-500 dark:text-gray-400">{a.fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};








