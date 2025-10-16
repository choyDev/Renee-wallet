
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaQrcode,
  FaPaperPlane,
  FaExchangeAlt,
  FaDollarSign,
  FaMoneyBillWave,
  FaLandmark, // bank icon
  FaLink,
} from "react-icons/fa";
import { SiSolana, SiTether } from "react-icons/si";
import SendReceiveModal from "./modal/SendReceiveModal";
import SwapModal from "./modal/SwapModal";
import BridgeModal from "./modal/BridgeModal";

// Custom Tron Icon
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

export default function WalletBalanceCard() {
  const [modalType, setModalType] = useState<"send" | "receive" | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const router = useRouter();
  const balances = [
    {
      name: "Solana",
      symbol: "SOL",
      amount: "0.00",
      icon: <SiSolana className="text-[#14F195]" />,
    },
    {
      name: "Tron",
      symbol: "TRX",
      amount: "0.00",
      icon: <TronIcon />,
    },
    {
      name: "Tether",
      symbol: "USDT",
      amount: "0.00",
      icon: <SiTether className="text-[#50AF95]" />,
    },
  ];

  const actions = [
    { label: "Receive", icon: <FaQrcode />, onClick: () => setModalType("receive") },
    { label: "Send", icon: <FaPaperPlane />, onClick: () => setModalType("send") },
    { label: "Swap", icon: <FaExchangeAlt />, onClick: () => setSwapOpen(true) },
    { label: "Bridge", icon: <FaLink />, onClick: () => setBridgeOpen(true) },
    { label: "Buy", icon: <FaDollarSign />,onClick: () => router.push("wallet/deposit") },
  ];

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ===== LEFT SIDE — BALANCE TABLE ===== */}
      <div className="flex flex-col justify-between rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121B2E] shadow-sm overflow-hidden h-full">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 px-5 py-4 bg-gray-50 dark:bg-[#0E1624]">
          <FaLandmark className="text-blue-500 text-lg" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Balances
          </h3>
        </div>

        {/* Table */}
        <table className="w-full text-sm text-gray-700 dark:text-gray-300 flex-grow">
          <thead>
            <tr className="bg-gray-100 dark:bg-[#1C2436] text-gray-600 dark:text-gray-400">
              <th className="text-left px-5 py-3 font-semibold">Currency</th>
              <th className="text-left px-5 py-3 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((b, i) => (
              <tr
                key={i}
                className={`hover:bg-gray-50 dark:hover:bg-[#1A2235] transition ${
                  i % 2 === 1 ? "bg-gray-50 dark:bg-[#141B2B]" : ""
                }`}
              >
                <td className="px-5 py-3 flex items-center gap-2 font-medium">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700">
                    {b.icon}
                  </div>
                  <span>{b.symbol}</span>
                </td>
                <td className="px-5 py-3 text-gray-800 dark:text-gray-100">
                  {b.amount} {b.symbol}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t border-gray-200 dark:border-gray-700">
              <td className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">
                Est. Total
              </td>
              <td className="px-5 py-3 font-bold text-gray-900 dark:text-white">
                0.00 USD
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ===== RIGHT SIDE — TOTAL BALANCE CARD + BUTTONS ===== */}
      <div className="flex flex-col justify-between h-full">
        {/* ---- Total Balance Card ---- */}
        <div
          className="w-full rounded-2xl shadow-[0_8px_25px_rgba(37,99,235,0.25)]
                     p-8 flex flex-col items-center justify-center text-center relative overflow-hidden h-full
                     bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 
                     dark:from-[#2563EB] dark:via-[#1E40AF] dark:to-[#1E3A8A]
                     text-white transition-colors duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />

          {/* 💵 Cash Icon */}
          <div className="bg-white/20 rounded-full p-4 mb-4 backdrop-blur-sm">
            <FaMoneyBillWave className="text-white text-3xl" />
          </div>

          <h2 className="text-5xl font-extrabold tracking-tight drop-shadow-md">
            $0.00
          </h2>
          <p className="text-sm font-medium text-white/90 mt-2">
            Total Wallet Balance
          </p>
          <p className="text-xs text-white/70 mt-1">
            Across Solana, Tron & USDT
          </p>
        </div>

        {/* ---- Action Button Group ---- */}
        <div className="grid grid-cols-5 gap-4 mt-5">
          {actions.map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              className="group flex flex-col items-center justify-center w-full py-5 rounded-2xl
                       bg-gray-100 dark:bg-[#1C2333] text-gray-700 dark:text-[#C7C9D1]
                       border border-gray-200 dark:border-gray-700
                       hover:bg-blue-50 dark:hover:bg-[#242C42] hover:border-blue-400 dark:hover:border-blue-500
                       transition-all duration-200 ease-in-out"
            >
              <span className="text-2xl text-gray-500 dark:text-[#9B9FB5] group-hover:text-blue-500 transition-colors mb-1">
                {btn.icon}
              </span>
              <span className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {btn.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* ====== MODAL ====== */}
    {modalType && (
      <SendReceiveModal type={modalType} onClose={() => setModalType(null)} />
    )}
    {swapOpen && <SwapModal onClose={() => setSwapOpen(false)} />}
    {bridgeOpen && <BridgeModal onClose={() => setBridgeOpen(false)} />}
    </>
  );
}
