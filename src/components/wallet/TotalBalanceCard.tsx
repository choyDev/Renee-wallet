
"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import CountUp from "react-countup";

/* ------------------------------------------------------------------
   ⭐ Modern Shimmer Skeleton Loader
------------------------------------------------------------------- */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-300/30 dark:bg-white/10 rounded-md ${className}`}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r 
        from-transparent via-white/40 dark:via-white/5 to-transparent" />
    </div>
  );
}

// keyframes once globally
if (typeof window !== "undefined" && !document.getElementById("shimmer-style-tb")) {
  const css = `
    @keyframes shimmer { 100% { transform: translateX(100%) } }
    .animate-shimmer { animation: shimmer 1.4s infinite; transform: translateX(-100%); }
  `;
  const style = document.createElement("style");
  style.id = "shimmer-style-tb";
  style.innerHTML = css;
  document.head.appendChild(style);
}

export default function TotalBalanceCard() {
  const [total, setTotal] = useState<number | null>(null);
  const [inflow, setInflow] = useState<number | null>(null);
  const [outflow, setOutflow] = useState<number | null>(null);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  /* ------------------------------------------------------------------
     Fetch Wallet + Transaction Summary
  ------------------------------------------------------------------- */
  useEffect(() => {
    const fetchSummary = async () => {
      const storedUser = localStorage.getItem("user");
      const userId = storedUser ? JSON.parse(storedUser).id : null;
      if (!userId) return;

      /* LOAD BALANCE */
      try {
        const res = await fetch(`/api/wallets/balances?userId=${userId}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (data.wallets) {
          const totalBalance = data.wallets.reduce((sum: number, w: any) => {
            const nativeUsd = Number(w.balances?.[0]?.usd ?? 0);
            const usdt = w.balances?.find((b: any) => b.token?.symbol === "USDT");
            const usdtUsd = parseFloat(usdt?.amount ?? "0") || 0;
            return sum + nativeUsd + usdtUsd;
          }, 0);

          setTotal(totalBalance);
        }
      } catch (err) {
        console.error("Balance fetch error", err);
      }

      /* LOAD TRANSACTIONS */
      try {
        const trRes = await fetch(`/api/transaction?userId=${userId}`, {
          cache: "no-store",
        });
        const tr = await trRes.json();

        if (tr.transactions) {
          let inflowSum = 0;
          let outflowSum = 0;

          tr.transactions.forEach((tx: any) => {
            const amt = Math.abs(parseFloat(tx.amount) || 0);
            if (tx.direction === "RECEIVED") inflowSum += amt;
            if (tx.direction === "SENT") outflowSum += amt;
          });

          setInflow(inflowSum);
          setOutflow(outflowSum);
        }
      } catch (err) {
        console.error("Transaction fetch error", err);
      }
    };

    fetchSummary();
  }, []);

  const loading = total === null || inflow === null || outflow === null;

  /* ------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------- */
  return (
    <div className="rounded-2xl p-px bg-gradient-to-br from-purple-500/40 
        via-transparent to-cyan-500/40 h-full">
      
      <div className="
        h-full rounded-2xl border border-white/10 
        bg-white/80 dark:bg-[#121726]/80 backdrop-blur-xl 
        p-6 sm:p-8 lg:p-10 shadow-md flex flex-col justify-between
        transition-all duration-300
      ">

        {/* ------------------ DATE ------------------ */}
        <div className="text-gray-900 dark:text-gray-300 
            text-base sm:text-lg lg:text-xl font-medium">
          {loading ? <Skeleton className="w-40 h-6" /> : dateLabel}
        </div>

        {/* ------------------ TOTAL BALANCE ------------------ */}
        <div className="mt-6 mb-8 sm:mb-12 lg:mb-16">
          <span className="text-gray-500 dark:text-gray-400 
              text-sm sm:text-base">
            Total Balance
          </span>

          {loading ? (
            <Skeleton className="mt-4 w-56 h-12 sm:w-72 sm:h-14" />
          ) : (
            <div className="
              text-5xl sm:text-6xl lg:text-7xl 
              font-extrabold bg-gradient-to-r from-purple-300 to-cyan-300 
              bg-clip-text text-transparent mt-3 sm:mt-4 leading-tight notranslate
            ">
              <CountUp
                start={0}
                end={total!}
                duration={2.0}
                decimals={2}
                separator=","
                prefix="$"
              />
            </div>
          )}
        </div>

        {/* ------------------ INFLOW / OUTFLOW ------------------ */}
        <div className="space-y-5 sm:space-y-6 mt-4">

          {/* INFLOW */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="w-6 h-6 text-green-400" />
              <span className="text-gray-800 dark:text-gray-300 text-base sm:text-lg">
                Inflow
              </span>
            </div>
            {loading ? (
              <Skeleton className="w-20 sm:w-28 h-6" />
            ) : (
              <span className="text-green-400 font-semibold text-lg sm:text-2xl">
                +${inflow!.toFixed(2)}
              </span>
            )}
          </div>

          {/* OUTFLOW */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowDownLeft className="w-6 h-6 text-red-400" />
              <span className="text-gray-800 dark:text-gray-300 text-base sm:text-lg">
                Outflow
              </span>
            </div>
            {loading ? (
              <Skeleton className="w-20 sm:w-28 h-6" />
            ) : (
              <span className="text-red-400 font-semibold text-lg sm:text-2xl">
                -${outflow!.toFixed(2)}
              </span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
