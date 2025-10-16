"use client";

import React from "react";
import {
  FaBitcoin,
  FaEthereum,
  FaQrcode,
  FaPaperPlane,
} from "react-icons/fa";
import { SiTether, SiSolana } from "react-icons/si";
import { BsCurrencyBitcoin } from "react-icons/bs";

const RecentActivityTable = () => {
  const activities = [
    {
      coin: "USDT",
      transaction: "Withdraw USDT",
      amount: "$653.10",
      id: "#14525156",
      date: "Jun 10, 2024",
      status: "Completed",
      fee: "7.57321 BTC",
    },
    {
      coin: "BTC",
      transaction: "Deposit BTC",
      amount: "$542.05",
      id: "#03483195",
      date: "Jun 15, 2024",
      status: "Declined",
      fee: "1.23450 BTC",
    },
    {
      coin: "BTC",
      transaction: "Deposit BTC",
      amount: "$456.10",
      id: "#8520097",
      date: "Jun 18, 2024",
      status: "Pending",
      fee: "0.12000 BTC",
    },
    {
      coin: "SOL",
      transaction: "Withdraw USDT",
      amount: "$759.10",
      id: "#00078867",
      date: "Jun 20, 2024",
      status: "Completed",
      fee: "0.49867 BTC",
    },
  ];

  const getIcon = (coin: string) => {
    switch (coin) {
      case "BTC":
        return <FaBitcoin className="text-[#F7931A] w-5 h-5" />;
      case "ETH":
        return <FaEthereum className="text-[#4B70C6] w-5 h-5" />;
      case "USDT":
        return <SiTether className="text-[#50AF95] w-5 h-5" />;
      case "SOL":
        return <SiSolana className="text-[#14F195] w-5 h-5" />;
      default:
        return <BsCurrencyBitcoin className="text-gray-400 w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Declined":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121B2E] p-6 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-5 text-lg">
        Recent Activities
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm rounded-lg">
          <thead>
            <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4">Coin</th>
              <th className="text-left py-3 px-4">Transaction</th>
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Fees</th>
            </tr>
          </thead>

          <tbody>
            {activities.map((a, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1A2235]/40 transition"
              >
                <td className="py-4 px-4 flex items-center gap-2 font-medium text-gray-800 dark:text-white/90">
                  {getIcon(a.coin)}
                  <span>{a.coin}</span>
                </td>

                <td className="py-4 px-4">
                  <span className="font-semibold text-gray-800 dark:text-white/90 mr-1">
                    {a.amount}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {a.transaction}
                  </span>
                </td>

                <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                  {a.id}
                </td>

                <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                  {a.date}
                </td>

                <td className="py-4 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      a.status
                    )}`}
                  >
                    {a.status}
                  </span>
                </td>

                <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                  {a.fee}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentActivityTable;
