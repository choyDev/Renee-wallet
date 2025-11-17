
"use client";

import React, { useEffect, useState } from "react";
import { FaEthereum } from "react-icons/fa";
import { SiSolana, SiBitcoin, SiXrp, SiDogecoin } from "react-icons/si";
import { FaMonero } from "react-icons/fa";

const TronIcon = ({ className = "text-red-500 w-5 h-5" }) => (
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

function Icon({ symbol }: { symbol: string }) {
  switch (symbol) {
    case "BTC": return <SiBitcoin className="text-[#F7931A] w-5 h-5" />;
    case "ETH": return <FaEthereum className="text-[#627EEA] w-5 h-5" />;
    case "SOL": return <SiSolana className="text-[#14F195] w-5 h-5" />;
    case "XRP": return <SiXrp className="text-[#0A74E6] w-5 h-5" />;
    case "DOGE": return <SiDogecoin className="text-[#C2A633] w-5 h-5" />;
    case "TRX": return <TronIcon className="w-5 h-5 text-[#FF060A]" />;
    case "XMR": return <FaMonero className="text-[#FF6600] w-5 h-5" />;
    default:
      return <span className="inline-block w-5 h-5 rounded bg-gray-300 dark:bg-gray-700" />;
  }
}

const fmtPrice = (n: number) =>
  n >= 1 ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${n.toFixed(6)}`;

export default function TokensTable() {
  const [rows, setRows] = useState<Row[] | null>(null);

  // Load from cache
  useEffect(() => {
    try {
      const cached = localStorage.getItem("market:top:all7");
      if (cached) {
        const { items } = JSON.parse(cached);
        if (Array.isArray(items)) setRows(items);
      }
    } catch {}
  }, []);

  // Fetch latest
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const SYMBOLS_7 = ["TRX", "ETH", "XMR", "SOL", "BTC", "XRP", "DOGE"] as const;

        const r = await fetch(
          `/api/market/top?symbols=${encodeURIComponent(SYMBOLS_7.join(","))}`,
          { signal: controller.signal, cache: "no-store" }
        );

        const data = await r.json();

        if (Array.isArray(data.items)) {
          setRows(data.items);
          localStorage.setItem(
            "market:top:all7",
            JSON.stringify({ items: data.items, updatedAt: Date.now() })
          );
        }
      } catch {}
    }

    load();
    const timer = setInterval(load, 60_000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  const displayRows = rows ?? Array.from({ length: 7 }, () => null);

  return (
    <div className="
      rounded-2xl p-px 
      bg-gradient-to-br from-purple-500/30 via-transparent to-cyan-500/30
      h-full
    ">
      <div className="
        h-full rounded-2xl p-6 shadow-sm flex flex-col transition-all duration-300
        bg-white border border-gray-200
        dark:bg-[#1A1F36]/80 dark:border-white/5 dark:backdrop-blur-xl
      ">
        
        {/* Header */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
          Markets
        </h3>

        {/* Centered table */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[340px] space-y-2 mx-auto">

            {displayRows.map((row, i) => {
              const skeleton = !row;
              const symbol = row?.symbol ?? "";
              const price = row?.price ?? 0;
              const c24 = row?.change24h ?? 0;

              return (
                <div
                  key={i}
                  className="
                    flex items-center justify-between p-2.5 rounded-xl border transition-all
                    bg-gray-50 border-gray-200 hover:bg-gray-100
                    dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10
                  "
                >
                  {/* LEFT: Icon + price */}
                  <div className="flex items-center gap-3 min-w-[120px]">
                    {skeleton ? (
                      <span className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                        <Icon symbol={symbol} />
                      </div>
                    )}

                    <div>
                      {skeleton ? (
                        <>
                          <div className="w-10 h-3 rounded bg-gray-300 dark:bg-gray-700 animate-pulse mb-1" />
                          <div className="w-16 h-2 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {symbol}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {fmtPrice(price)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: 24h change */}
                  <div className="text-right">
                    {skeleton ? (
                      <div className="w-14 h-3 rounded bg-gray-300 dark:bg-gray-700 animate-pulse ml-auto" />
                    ) : (
                      <p className={`text-sm font-bold ${c24 >= 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                        {c24 >= 0 ? "+" : ""}{c24.toFixed(2)}%
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </div>
    </div>
  );
}
