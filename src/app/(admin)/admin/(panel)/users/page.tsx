"use client";

import { useEffect, useState } from "react";

export default function UsersPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit);

  // Skeleton Loader
  const Skeleton = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-white/10 rounded ${className}`} />
  );

  // Badges
  const Badge = ({ text, color }: { text: string; color: "green" | "yellow" | "gray" }) => {
    const colors: any = {
      green: "bg-green-600 text-white",
      yellow: "bg-yellow-400 text-black",
      gray: "bg-gray-500 text-white",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
        {text}
      </span>
    );
  };

  // Action Icons
  const ActionIcon = ({
    type,
    onClick,
  }: {
    type: "approve" | "delete";
    onClick: () => void;
  }) => {
    if (type === "approve") {
      return (
        <span
          className="text-green-500 cursor-pointer text-lg hover:scale-110 transition"
          onClick={onClick}
        >
          ✔
        </span>
      );
    }
    return (
      <span
        className="text-red-500 cursor-pointer text-lg hover:scale-110 transition"
        onClick={onClick}
      >
        ✖
      </span>
    );
  };

  // User Avatar
  const Avatar = ({ name }: { name: string }) => {
    const initials = name
      ? name
          .split(" ")
          .map((x) => x[0])
          .join("")
          .toUpperCase()
      : "?";

    return (
      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white font-semibold">
        {initials}
      </div>
    );
  };

  async function load() {
    setLoading(true);

    const res = await fetch("/api/admin/users/list", {
      method: "POST",
      body: JSON.stringify({ page, limit }),
    });

    const data = await res.json();
    setList(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [page, limit]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Users</h1>

      {/* TABLE */}
      <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 shadow-sm dark:bg-[#1A1730] dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-600 text-sm border-b border-gray-200 dark:text-gray-300 dark:border-gray-800">
                <th className="py-3">Avatar</th>
                <th>Name</th>
                <th>Email</th>
                <th>KYC</th>
                <th>Approved</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="text-sm text-gray-800 dark:text-gray-200">

              {/* Loading */}
              {loading &&
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-gray-200 dark:border-gray-800">
                    <td className="py-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                    </td>
                    <td><Skeleton className="w-24 h-4" /></td>
                    <td><Skeleton className="w-32 h-4" /></td>
                    <td><Skeleton className="w-20 h-4" /></td>
                    <td><Skeleton className="w-20 h-4" /></td>
                    <td><Skeleton className="w-20 h-4" /></td>
                    <td></td>
                  </tr>
                ))}

              {/* Real Data Rows */}
              {!loading &&
                list.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                  >
                    {/* Avatar */}
                    <td className="py-4">
                      <Avatar name={u.full_name || u.email} />
                    </td>

                    {/* NAME */}
                    <td className="font-medium">{u.full_name || "-"}</td>

                    {/* EMAIL */}
                    <td className="text-gray-600 dark:text-gray-400">{u.email}</td>

                    {/* KYC STATUS */}
                    <td>
                      {u.kycVerified ? (
                        <Badge text="Verified" color="green" />
                      ) : (
                        <Badge text="Pending" color="yellow" />
                      )}
                    </td>

                    {/* ADMIN APPROVAL STATUS */}
                    <td>
                      {u.adminApproved ? (
                        <Badge text="Approved" color="green" />
                      ) : (
                        <Badge text="Pending" color="gray" />
                      )}
                    </td>

                    {/* JOINED DATE */}
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>

                    {/* ACTIONS */}
                    <td className="flex items-center justify-end gap-6 pr-2 py-4">

                      <ActionIcon
                        type="approve"
                        onClick={() => alert("Admin approve for " + u.id)}
                      />
                      <ActionIcon
                        type="delete"
                        onClick={() => alert("Delete user " + u.id)}
                      />
                    </td>

                  </tr>
                ))}

              {/* No Users */}
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500 dark:text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border rounded bg-white text-gray-700 border-gray-300 disabled:opacity-40 dark:bg-[#1A1730] dark:text-gray-300 dark:border-gray-700"
          >
            Prev
          </button>

          <span className="text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border rounded bg-white text-gray-700 border-gray-300 disabled:opacity-40 dark:bg-[#1A1730] dark:text-gray-300 dark:border-gray-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
