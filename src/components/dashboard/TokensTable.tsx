"use client";

import React, { useEffect, useState } from "react";
import { FaEthereum } from "react-icons/fa";
import { SiSolana, SiTether, SiBitcoin, SiBinance, SiXrp, SiDogecoin, SiCardano } from "react-icons/si";
import { FaMonero } from "react-icons/fa";

const TronIcon = ({ className = "text-[#FF4747] w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

type Row = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
};

function Icon({ symbol, id }: { symbol: string; id: string }) {
  switch (symbol) {
    case "BTC": return <SiBitcoin className="text-[#F7931A] text-xl" />;
    case "ETH": return <FaEthereum className="text-[#627EEA] text-xl" />;
    case "SOL": return <SiSolana className="text-[#14F195] text-xl" />;
    case "USDT": return <SiTether className="text-[#26A17B] text-xl" />;
    case "BNB": return <SiBinance className="text-[#F0B90B] text-xl" />;
    case "XRP": return <SiXrp className="text-[#0A74E6] text-xl" />;
    case "DOGE": return <SiDogecoin className="text-[#C2A633] text-xl" />;
    case "ADA": return <SiCardano className="text-[#0033AD] text-xl" />;
    case "TRX": return <TronIcon className="w-5 h-5 text-[#FF060A]" />;
    case "XMR": return <FaMonero className="text-[#FF6600] text-xl" />;
    default: return <span className="inline-block w-5 h-5 rounded bg-gray-300 dark:bg-gray-700" />;
  }
}

const fmtUSD = (n: number) =>
  n >= 1_000_000_000
    ? `$${(n / 1_000_000_000).toFixed(2)}B`
    : n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(2)}K`
        : `$${n.toFixed(2)}`;

const fmtPrice = (n: number) =>
  n >= 1 ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${n.toFixed(6)}`;

const badgeClass = (val: number) =>
  val >= 0 ? "bg-green-500/10 text-green-600 dark:text-green-400"
    : "bg-red-500/10 text-red-600 dark:text-red-400";

export default function TokensTable() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  // Instant paint from cache if available
  useEffect(() => {
    try {
      const cached = localStorage.getItem("market:top:cap4");
      if (cached) {
        const { items, updatedAt } = JSON.parse(cached);
        if (Array.isArray(items)) {
          setRows(items);
          setUpdatedAt(updatedAt ?? null);
        }
      }
    } catch { }
  }, []);

  // Fetch top 4 by market cap
  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      try {
        const SYMBOLS_8 = ["TRX", "ETH", "XMR", "SOL", "BTC", "XRP", "DOGE", "USDT"] as const;
        const r = await fetch(
          `/api/market/top?symbols=${encodeURIComponent(SYMBOLS_8.join(","))}`,
          { signal: ctrl.signal, cache: "no-store" }
        );
        const j = await r.json();
        if (Array.isArray(j.items)) {
          setRows(j.items);
          setUpdatedAt(j.updatedAt ?? Date.now());
          try { localStorage.setItem("market:top:cap4", JSON.stringify({ items: j.items, updatedAt: Date.now() })); } catch { }
        }
      } catch { }
    }
    load();
    const t = setInterval(load, 6_000_000);
    return () => { ctrl.abort(); clearInterval(t); };
  }, []);

  return (
    <div className="rounded-2xl p-px bg-gradient-to-br from-brand-500/40 via-transparent to-cyan-500/40">
      <div className="h-full rounded-2xl border border-gray-200/60 dark:border-white/10
                      bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm p-6 shadow-sm
                      transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Today Top Market</h3>
          {updatedAt && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Updated {new Date(updatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[15px] tabular-nums">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200/60 dark:border-gray-700/50 text-sm">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Price</th>
                <th className="text-left py-3 px-4">24h</th>
                <th className="text-left py-3 px-4">7d</th>
                <th className="text-left py-3 px-4">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? Array.from({ length: 4 }, () => null)).map((row, i) => {
                const skeleton = !row;
                const symbol = row?.symbol ?? "";
                const name = row?.name ?? "";
                const price = row?.price ?? 0;
                const c24 = row?.change24h ?? 0;
                const c7 = row?.change7d ?? 0;
                const mcap = row?.marketCap ?? 0;

                return (
                  <tr key={i} className="border-b border-gray-100/70 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-[#1A2235]/40 transition">
                    <td className="py-4 px-4 flex items-center gap-2 font-medium text-gray-900 dark:text-white notranslate">
                      {skeleton ? <span className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700" /> : <Icon symbol={symbol} id={row!.id} />}
                      <span className={skeleton ? "w-40 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" : ""}>
                        {!skeleton && `${symbol} (${name})`}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                      {skeleton ? <span className="inline-block w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /> : fmtPrice(price)}
                    </td>
                    <td className="py-4 px-4">
                      {skeleton ? (
                        <span className="inline-block w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass(c24)}`}>
                          {c24 >= 0 ? `+${c24.toFixed(2)}%` : `${c24.toFixed(2)}%`}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {skeleton ? (
                        <span className="inline-block w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass(c7)}`}>
                          {c7 >= 0 ? `+${c7.toFixed(2)}%` : `${c7.toFixed(2)}%`}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                      {skeleton ? <span className="inline-block w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /> : fmtUSD(mcap)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
