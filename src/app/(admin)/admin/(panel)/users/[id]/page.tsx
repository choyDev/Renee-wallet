"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type AdminUser = {
  id: string;
  fullName?: string | null;
  email: string;
  walletAddress?: string | null;
  kycVerified: boolean;
  createdAt: string;
};

export default function UserDetail() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<AdminUser | null>(null);

  async function load() {
    const res = await fetch(`/api/admin/users/${userId}`);
    const data = await res.json();
    setUser(data);
  }

  useEffect(() => {
    load();
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">User Details</h1>

      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader>
          <CardTitle>{user.fullName || user.email}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p>Email: {user.email}</p>
          <p>Wallet: {user.walletAddress || "-"}</p>
          <p>KYC Status: {user.kycVerified ? "Verified" : "Pending"}</p>
          <p>Joined: {new Date(user.createdAt).toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
