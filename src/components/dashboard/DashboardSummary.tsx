"use client";

import React from "react";
import BalanceCard from "./BalanceCard";
import CryptoCard from "./CryptoCard";
import { SiSolana, SiTether } from "react-icons/si";

const TronIcon = ({ className = "text-[#FF4747] w-4 h-4" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 24 24"
        className={className}
    >
        <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
    </svg>
);

const DashboardSummary = () => (
  <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
    <BalanceCard />
    {/* TRON */}
    <CryptoCard
        title="TRX-USD"
        subtitle="Tron USD"
        value="$0.00"
        sub="$0.00"
        change="-10.4%"
        changeAbs="-125.05%"
        color="#FF060A" // 🔴 Official Tron Red
        iconBg="bg-[#FFECEC]"
        icon={<TronIcon className="text-[#FF060A] size-6" />}
        data={[12, 18, 20, 16, 14, 12, 10]}
    />

    {/* SOLANA */}
    <CryptoCard
        title="SOL-USD"
        subtitle="Solana USD"
        value="$0.00"
        sub="$0.00"
        change="+9.25%"
        changeAbs="+182.10%"
        color="#14F195" // ✅ Solana neon green
        iconBg="bg-[#E8FFF9]"
        icon={<SiSolana className="text-[#14F195] size-6" />}
        data={[10, 12, 15, 18, 21, 24, 26]}
    />

    {/* USDT */}
    <CryptoCard
        title="USDT"
        subtitle="Tether"
        value="$0.00"
        sub="$0.00"
        change="+7.05%"
        changeAbs="+12.10%"
        color="#26A17B" // ✅ Official Tether green
        iconBg="bg-[#E6F9F3]"
        icon={<SiTether className="text-[#26A17B] size-6" />}
        data={[8, 10, 12, 14, 16, 18, 20]}
    />
  </div>
);

export default DashboardSummary;
