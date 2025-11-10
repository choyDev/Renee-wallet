"use client";

import React, { useEffect } from "react";

import { useSidebar } from "@/context/SidebarContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";

import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";

import "swiper/css";

function getUserId(): string | null {
  try {
    const domUserId = (typeof document !== "undefined" && document.body?.dataset?.userId) || null;
    if (domUserId) return domUserId;
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    const id = obj?.id ?? obj?.userId ?? obj?.uid;
    if (id == null) return null;
    return typeof id === "number" ? String(id) : String(id);
  } catch {
    return null;
  }
}

function WalletBadgesHydrator({ refreshMs = 60_000 }: { refreshMs?: number }) {
  const { setWalletBadgesBulk } = useSidebar() as any;

  useEffect(() => {
    let timer: number | undefined;
    let abort = new AbortController();

    async function load() {
      try {
        const userId = getUserId();
        if (!userId) return;
        const url = `/api/wallets/totals?userId=${encodeURIComponent(userId)}`;
        const res = await fetch(url, { signal: abort.signal, cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as Record<string, number>;
        if (typeof setWalletBadgesBulk === "function") setWalletBadgesBulk(json);
      } catch {
        // ignore transient errors
      }
    }

    load();
    // timer = window.setInterval(load, Math.max(10_000, refreshMs));

    // const onStorage = (e: StorageEvent) => {
    //   if (e.key === "user") load();
    // };
    // window.addEventListener("storage", onStorage);

    // return () => {
    //   if (timer) window.clearInterval(timer);
    //   window.removeEventListener("storage", onStorage);
    //   abort.abort();
    // };
  }, [setWalletBadgesBulk, refreshMs]);

  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <WalletBadgesHydrator />
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </SidebarProvider>
    </ThemeProvider>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
