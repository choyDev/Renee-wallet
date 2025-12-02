
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import WeeklyLineChart from "@/components/admin/charts/WeeklyLineChart";
import MonthlyBarChart from "@/components/admin/charts/MonthlyBarChart";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const d = await res.json();

      d.todayFloat = Number((Math.random() * 5000 + 100).toFixed(2));

      setData(d);
    })();
  }, []);

  if (!data) return <DashboardSkeleton />;

  return (
    /* ✔ FIX: removed min-h-screen and pb-10 */
    <div className="space-y-6 p-4 md:p-6 text-gray-900 dark:text-white">

      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      {/* TOP 4 CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={data.totalUsers} />
        <StatCard title="KYC Pending" value={data.kycPending} />
        <StatCard title="Total Transactions" value={data.totalTx} />
        <StatCard title="Today Float (USD)" value={data.todayFloat} />
      </div>

      {/* 2 CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card className="bg-gray-50 border border-gray-300 backdrop-blur">
          <CardHeader className="pb-10">
            <CardTitle className="text-md font-semibold">Weekly Crypto Float Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[400px]">
              <WeeklyLineChart />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border border-gray-300 backdrop-blur">
          <CardHeader className="pb-10">
            <CardTitle className="text-md font-semibold">Monthly Crypto Float Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[400px]">
              <MonthlyBarChart />
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}

function StatCard({ title, value }: any) {
  return (
    <Card className="bg-gray-50 border border-gray-300 backdrop-blur hover:bg-white/10 transition-all">
      <CardHeader>
        <CardTitle className="text-md">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    /* ✔ FIX: removed min-h-screen and pb-10 */
    <div className="space-y-6 p-4 md:p-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-white/5 rounded-lg" />
        <div className="h-72 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

