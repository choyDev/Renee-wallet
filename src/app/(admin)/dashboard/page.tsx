
"use client";

import React, {useEffect} from "react";
import TokensTable from "@/components/dashboard/TokensTable";
import RecentActivityTable from "@/components/dashboard/RecentActivityTable";
import DashboardStats from "@/components/dashboard/DashboardStats";
import WalletIcons from "@/components/dashboard/WalletIcons";
import BridgeCard from "@/components/dashboard/BridgeCard";
import PortfolioBreakdown from "@/components/dashboard/PortofolioBreakdown";

export default function Dashboard() {

  return (
    <div
      className="
        min-h-screen p-6 transition-all
      "
    >
      <div className="max-w-[1900px] mx-auto">

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Overview
          </h2>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">

          {/* Dashboard Stats */}
          <div className="xl:col-span-2 h-full">
            <DashboardStats />
          </div>

          {/* Wallet Icons */}
          <div className="xl:col-span-7 h-full">
            <div
              className="
                rounded-2xl p-px
              "
            >
              <div
                className="
                  rounded-2xl p-4 h-full flex flex-col

                  /* Light mode card */
                  bg-white border
                  /* Dark mode card */
                  dark:bg-[#1A1F36]/80
                  dark:border-gray-700
                  dark:backdrop-blur-xl
                "
              >
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                  Wallets
                </h3>

                <WalletIcons />
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="xl:col-span-3 xl:row-span-2">
            <RecentActivityTable />
          </div>

          {/* TokensTable */}
          <div className="xl:col-span-3">
            <TokensTable />
          </div>

          {/* Portfolio Breakdown */}
          <div className="xl:col-span-2">
            <PortfolioBreakdown />
          </div>

          {/* Bridge Card */}
          <div className="xl:col-span-4">
            <BridgeCard />
          </div>

        </div>
      </div>
    </div>
  );
}
