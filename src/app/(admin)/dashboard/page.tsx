

"use client";

import React from "react";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import TokensTable from "@/components/dashboard/TokensTable";
import PortfolioAssets from "@/components/dashboard/PortfolioAssets";
import RecentActivityTable from "@/components/dashboard/RecentActivityTable";

/**
 * ============================================================
 *  🪙 Main Dashboard Page
 * ============================================================
 * - Displays:
 *   1. Summary cards (balance + key coins)
 *   2. Top market tokens
 *   3. Portfolio asset chart
 *   4. Recent transaction activities
 * ------------------------------------------------------------
 */

export default function Dashboard() {
  return (
    <div className="grid grid-cols-12 gap-6 p-6 bg-gray-50 dark:bg-[#0E1624] min-h-screen transition-all">
      {/* ===== 1️⃣ Summary Section ===== */}
      <DashboardSummary />

      {/* ===== 2️⃣ Tokens + Portfolio Section ===== */}
      <div className="col-span-12 flex flex-col xl:flex-row gap-6">
        <div className="xl:w-[65%]">
          <TokensTable />
        </div>
        <div className="xl:w-[35%]">
          <PortfolioAssets />
        </div>
      </div>

      {/* ===== 3️⃣ Recent Activity Section ===== */}
      <div className="col-span-12">
        <RecentActivityTable />
      </div>
    </div>
  );
}






