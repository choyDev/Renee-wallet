

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SiSolana,
  SiEthereum,
  SiBitcoin,
  SiXrp,
  SiDogecoin,
} from "react-icons/si";
import { FaMonero } from "react-icons/fa";

const TronIcon = ({ className = "w-10 h-10" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

interface WalletData {
  id: number;
  address: string;
  network: { name: string; symbol: string };
  balances: {
    token: { symbol: string; name: string };
    amount: string;
    usd: number;
  }[];
}

export default function WalletIcons() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return;

        const res = await fetch(`/api/wallets/balances?userId=${userId}`, { cache: "no-store" });
        const data = await res.json();
        setWallets(data.wallets || []);
      } catch (err) {
        console.error("Error loading wallets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallets();
  }, []);

  const walletsConfig = [
    { symbol: "ETH", name: "Ethereum", icon: <SiEthereum className="w-10 h-10" />, color: "#627EEA", path: "/wallet/eth" },
    { symbol: "BTC", name: "Bitcoin", icon: <SiBitcoin className="w-10 h-10" />, color: "#F7931A", path: "/wallet/btc" },
    { symbol: "SOL", name: "Solana", icon: <SiSolana className="w-10 h-10" />, color: "#14F195", path: "/wallet/sol" },
    { symbol: "TRX", name: "Tron", icon: <TronIcon className="w-10 h-10" />, color: "#FF060A", path: "/wallet/trx" },
    { symbol: "XMR", name: "Monero", icon: <FaMonero className="w-10 h-10" />, color: "#FF6600", path: "/wallet/xmr" },
    { symbol: "XRP", name: "XRP", icon: <SiXrp className="w-10 h-10" />, color: "#0A74E6", path: "/wallet/xrp" },
    { symbol: "DOGE", name: "Dogecoin", icon: <SiDogecoin className="w-10 h-10" />, color: "#C2A633", path: "/wallet/doge" },
  ];

  const getWalletBalance = (symbol: string) => {
    const wallet = wallets.find((w) => w.network.symbol === symbol);
    if (!wallet) return "0.0000";
    return parseFloat(wallet.balances?.[0]?.amount ?? "0").toFixed(4);
  };

  return (
    <div
      className="
        grid gap-3
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-4
        lg:grid-cols-5
        xl:grid-cols-7
        2xl:grid-cols-7
      "
    >
      {walletsConfig.map((config) => {
        const balance = getWalletBalance(config.symbol);
        const hasPath = !!config.path;

        return (
          <div
            key={config.symbol}
            onClick={() => hasPath && !loading && router.push(config.path!)}
            className={`group ${hasPath ? "cursor-pointer" : ""}`}
          >
            <div
              className="
                rounded-xl p-4 backdrop-blur-sm
                transition-all duration-300
                flex flex-col items-center justify-center
                h-full min-h-[200px]

                /* LIGHT MODE */
                bg-gray-30 border border-gray-300

                /* DARK MODE */
                dark:bg-white/5 dark:border-white/10

                hover:border-purple-500/30
                hover:bg-gray-100 dark:hover:bg-white/10
              "
            >
              {/* ICON */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 mb-3"
                style={{
                  backgroundColor: `${config.color}15`,
                  border: `2px solid ${config.color}40`,
                }}
              >
                <div style={{ color: config.color }}>{config.icon}</div>
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {config.symbol}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {config.name}
                </p>

                {loading ? (
                  <div className="w-16 h-4 bg-gray-300 dark:bg-white/10 rounded animate-pulse mx-auto mt-2" />
                ) : (
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-2 notranslate">
                    {balance}
                  </p>
                )}
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}



