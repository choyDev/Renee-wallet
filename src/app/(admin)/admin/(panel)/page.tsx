"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import DashboardChart from "@/components/admin/DashboardChart";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const d = await res.json();
      setData(d);
    })();
  }, []);

  if (!data) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold mb-4">Dashboard Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={data.totalUsers} />
        <StatCard title="Pending KYC" value={data.kycPending} />
        <StatCard title="Total Transactions" value={data.totalTx} />
        <StatCard
          title="Fiat → USDT Total"
          value={Number(data.totalFiatUSDT).toLocaleString()}
        />
      </div>

      {/* Chart */}
      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader>
          <CardTitle>Last 7 Days Activity</CardTitle>
        </CardHeader>

        <CardContent>
          <DashboardChart data={data.chart} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: any) {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white/5 rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-white/5 rounded-lg" />
    </div>
  );
}
