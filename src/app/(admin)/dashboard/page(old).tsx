"use client";

import React from "react";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import TokensTable from "@/components/dashboard/TokensTable(old)";
import PortfolioAssets from "@/components/dashboard/PortfolioAssets";
import RecentActivityTable from "@/components/dashboard/RecentActivityTable(old)";

export default function Dashboard() {
  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-[#0E1624] transition-all">
      <div className="grid grid-cols-12 gap-6">

        {/* 1) Tokens + Portfolio */}
        <div className="col-span-12 flex flex-col xl:flex-row gap-6 items-stretch">
          <div className="xl:w-[35%]">
            <PortfolioAssets />
          </div>
          <div className="xl:w-[65%]">
            <TokensTable />
          </div>
        </div>

        {/* 2) Summary first for quick glance */}
        <DashboardSummary />

        {/* 3) Recent Activity */}
        <div className="col-span-12">
          <RecentActivityTable />
        </div>
      </div>
    </div>
  );
}


