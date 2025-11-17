
// "use client";

// import React from "react";
// import DashboardSummary from "@/components/dashboard/DashboardSummary";
// import PortfolioAssets from "@/components/dashboard/PortfolioAssets";
// import TotalBalanceCard from "@/components/wallet/TotalBalanceCard";
// import TransactionHistoryChart from "@/components/wallet/TransactionChart";

// export default function Dashboard() {
//   return (
//     <div className="min-h-screen p-6 transition-all">
//       <div className="max-w-[1900px] mx-auto">
        
//         {/* Overview Title */}
//         <div className="mb-6">
//           <h2 className="text-2xl font-bold text-white">Wallet Overview</h2>
//         </div>
        
//         {/* Top Row: Total Balance + Portfolio (Equal Height) */}
//         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
//           <TotalBalanceCard />
//           <PortfolioAssets />
//           <TransactionHistoryChart />
//         </div>

//         {/* Bottom: Wallet Card Slider */}
//         <DashboardSummary />

//       </div>
//     </div>
//   );
// }

"use client";

import React from "react";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import PortfolioAssets from "@/components/dashboard/PortfolioAssets";
import TotalBalanceCard from "@/components/wallet/TotalBalanceCard";
import TransactionHistoryChart from "@/components/wallet/TransactionChart";

export default function Dashboard() {
  return (
    <div className="min-h-screen p-4 sm:p-6 transition-all">
      <div className="w-full max-w-[1900px] mx-auto">

        {/* TITLE */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Wallet Overview
          </h2>
        </div>

        {/* TOP ROW — FULLY RESPONSIVE */}
        <div className="
          grid grid-cols-1 
          lg:grid-cols-2 
          xl:grid-cols-3 
          gap-4 sm:gap-6
          mb-6
        "
        >
          {/* On mobile: full width */}
          {/* On tablet: 2 cols */}
          {/* On desktop: 3 cols */}
          <TotalBalanceCard />
          <PortfolioAssets />
          <TransactionHistoryChart />
        </div>

        {/* BOTTOM — SLIDER */}
        <div className="mt-4 sm:mt-6">
          <DashboardSummary />
        </div>

      </div>
    </div>
  );
}
