"use client";

import React from "react";
import { SiTether } from "react-icons/si";

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
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white/90">$0.00</h3>
      <p className="text-[15px] text-gray-600 dark:text-gray-400 mt-1.5">$0.00</p>
    </div>

    <div className="flex justify-between items-center mt-5">
      <span className="text-gray-500 dark:text-gray-400 text-sm">+102.15%</span>
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8FFF9] text-[#10B981] dark:bg-[#10B981]/20 dark:text-[#10B981]">
        +15.6%
      </span>
    </div>
  </div>
);

export default BalanceCard;
