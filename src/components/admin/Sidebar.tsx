"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Receipt,
  Repeat,
  Settings,
  Wallet,
  LogOut,
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const nav = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "KYC", href: "/admin/kyc", icon: ShieldCheck },
    { name: "Transactions", href: "/admin/transactions", icon: Receipt },
    { name: "Swap Monitor", href: "/admin/swap", icon: Repeat },
    { name: "Assets", href: "/admin/assets", icon: Wallet },
    { name: "Fee Settings", href: "/admin/settings/fees", icon: Settings },
  ];

  return (
    <aside
      className={`h-screen bg-black/40 border-r border-white/10 backdrop-blur-xl transition-all duration-200 flex flex-col
      ${collapsed ? "w-[70px]" : "w-[230px]"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <span className="text-lg font-semibold tracking-wide text-white">
            Admin Panel
          </span>
        )}
        <button
          className="text-gray-400 hover:text-white transition"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition
                ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
