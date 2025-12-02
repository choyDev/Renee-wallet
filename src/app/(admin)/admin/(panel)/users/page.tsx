"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 20;

  async function load() {
    const res = await fetch("/api/admin/users/list", {
      method: "POST",
      body: JSON.stringify({ page, limit, search }),
    });

    const data = await res.json();
    setList(data.users);
    setTotal(data.total);
  }

  useEffect(() => {
    load();
  }, [page]);

  async function onSearch(e: any) {
    e.preventDefault();
    setPage(1);
    await load();
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Users</h1>

      <form onSubmit={onSearch} className="flex gap-2 mb-4">
        <Input
          placeholder="Search by email, name or wallet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-black/20 text-white"
        />
        <Button type="submit">Search</Button>
      </form>

      <Card className="bg-white/5 border-white/10 backdrop-blur">
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto w-full">
          <table className="w-full text-left">
            <thead className="text-gray-300 text-sm">
              <tr>
                <th className="py-2">User</th>
                <th>Email</th>
                <th>Wallet</th>
                <th>KYC</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {list.map((u: any) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="py-3">{u.fullName || "-"}</td>
                  <td>{u.email}</td>
                  <td className="text-xs">{u.walletAddress}</td>
                  <td className={u.kycVerified ? "text-green-400" : "text-yellow-300"}>
                    {u.kycVerified ? "Verified" : "Pending"}
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-blue-400 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <Button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              variant="outline"
            >
              Prev
            </Button>

            <span className="text-sm text-gray-300">
              Page {page} of {totalPages}
            </span>

            <Button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
