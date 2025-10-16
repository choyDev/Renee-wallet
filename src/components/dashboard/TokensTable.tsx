"use client";

import React from "react";
import { FaBitcoin, FaEthereum } from "react-icons/fa";
import { SiSolana, SiTether } from "react-icons/si";

const TronIcon = ({ className = "text-[#FF4747] w-4 h-4" }) => (
  <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className={className}
  >
      <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

const TokensTable = () => {
  const tokens = [
    {
      name: "TRX (Tron)",
      icon: <TronIcon className="w-5 h-5 text-[#FF060A] text-xl" />,
      price: "$63,245.02",
      change24h: "-19.43%",
      change7d: "+46.12%",
      marketCap: "7.57321 BTC",
    },
    {
      name: "ETH (Ethereum)",
      icon: <FaEthereum className="text-[#4B70C6] text-xl" />,
      price: "$4,743.47",
      change24h: "-10.32%",
      change7d: "+14.39%",
      marketCap: "1.23450 BTC",
    },
    {
      name: "SOL (Solana)",
      icon: <SiSolana className="text-[#AB47BC] text-xl" />,
      price: "$6,843.43",
      change24h: "+23.12%",
      change7d: "-6.12%",
      marketCap: "0.12000 BTC",
    },
    {
      name: "USDT (Tether)",
      icon: <SiTether className="text-[#2F80ED] text-xl" />,
      price: "$5,531.32",
      change24h: "-2.42%",
      change7d: "-2.32%",
      marketCap: "1.45257 BTC",
    },
  ];

  return (
    <div className="h-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121B2E] p-6 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-semibold text-gray-800 dark:text-white/90 text-lg">
          Today Top Market
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm rounded-lg">
          <thead>
            <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Price</th>
              <th className="text-left py-3 px-4">24h Change</th>
              <th className="text-left py-3 px-4">7d Change</th>
              <th className="text-left py-3 px-4">Market Cap</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
              >
                <td className="py-4 px-4 flex items-center gap-2 font-medium text-gray-800 dark:text-white/90">
                  {t.icon}
                  <span>{t.name}</span>
                </td>
                <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                  {t.price}
                </td>
                <td
                  className={`py-4 px-4 font-semibold ${
                    t.change24h.startsWith("+")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {t.change24h}
                </td>
                <td
                  className={`py-4 px-4 font-semibold ${
                    t.change7d.startsWith("+")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {t.change7d}
                </td>
                <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                  {t.marketCap}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokensTable;
