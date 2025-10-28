
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaQrcode,
  FaPaperPlane,
  FaExchangeAlt,
  FaDollarSign,
  FaCoins,
  FaLandmark,
  FaLink,
} from "react-icons/fa";
import { SiSolana, SiTether } from "react-icons/si";
import SendReceiveModal from "./modal/SendReceiveModal";
import SwapModal from "./modal/SwapModal";
import BridgeModal from "./modal/BridgeModal";

//  Tron Icon
// const TronIcon = ({ className = "text-[#FF4747] w-4 h-4" }) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     fill="currentColor"
//     viewBox="0 0 24 24"
//     className={className}
//   >
//     <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
//   </svg>
// );

type SymbolCode = "SOL" | "TRX" | "ETH" | "BTC";
type WalletBrief = { id: number; address: string };

export default function WalletBalanceCard(
  {
  walletsBySymbol = {},                          // <= NEW prop with safe default
}: {
  walletsBySymbol?: Partial<Record<SymbolCode, WalletBrief>>;
}
) {

  const [modalType, setModalType] = useState<"send" | "receive" | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const router = useRouter();

  // derive specific wallet briefs from the incoming map so these names exist below
  const solanaWallet = walletsBySymbol.SOL;
  const tronWallet = walletsBySymbol.TRX;
  const ethWallet = walletsBySymbol.ETH;

  const actions = [
    { label: "Receive", icon: <FaQrcode />, onClick: () => setModalType("receive") },
    { label: "Send", icon: <FaPaperPlane />, onClick: () => setModalType("send") },
    { label: "Swap", icon: <FaExchangeAlt />, onClick: () => setSwapOpen(true) },
    { label: "Bridge", icon: <FaLink />, onClick: () => setBridgeOpen(true) },
    // { label: "Buy", icon: <FaDollarSign />, onClick: () => router.push("wallet/deposit") },
  ];

  return (
    <>
      {/* <div className="grid grid-cols-1 lg:grid-cols-4 gap-6"> */}
        {/* ===== LEFT SIDE — BALANCE TABLE ===== */}
        {/* <div className="flex flex-col justify-between rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121B2E] shadow-sm overflow-hidden h-full">
          
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 px-5 py-4 bg-gray-50 dark:bg-[#0E1624]">
            <FaLandmark className="text-blue-500 text-lg" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Balances
            </h3>
          </div>

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
                  className="hover:bg-gray-50 dark:hover:bg-[#1A2235] transition notranslate"
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
        </div> */}
        
        <div className="flex flex-col justify-between h-full">
          <div className="grid grid-cols-4 gap-4 mt-auto">
            {actions
              .map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.onClick}
                  className="group flex flex-row gap-4 items-center justify-center w-full py-5 rounded-2xl
                           bg-white dark:bg-[#121B2E]
                           text-gray-700 dark:text-[#C7C9D1]
                           border border-gray-200 dark:border-gray-800
                           hover:bg-gray-50 dark:hover:bg-[#1A2235]
                           hover:border-blue-400 dark:hover:border-blue-500
                           transition-all duration-200 ease-in-out"
                >
                  <span className="text-2xl text-gray-500 dark:text-[#9B9FB5] group-hover:text-blue-500 transition-colors mb-1">
                    {btn.icon}
                  </span>
                  <span className="text-lg font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {btn.label}
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* <div className="flex flex-col justify-between rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121B2E] shadow-sm overflow-hidden h-full w-full lg:col-span-2">
          <div
            className="w-full rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden h-full
                       bg-white dark:bg-[#121B2E]
                       border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 dark:to-white/5 pointer-events-none" />

            <div className="bg-gray-800/10 dark:bg-white/10 rounded-full p-4 mb-4 backdrop-blur-sm">
              <FaCoins className="text-gray-700 dark:text-white text-3xl" />
            </div>

            <h2 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              ${totalUsd.toFixed(2)}
            </h2>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
              Total Wallet Balance
            </p>
          </div>
        </div> */}

        {/* <div className="flex flex-col justify-between h-full">
          <div className="grid grid-cols-1 gap-4 mt-auto">
            {actions
              .filter(a => a.label === "Swap" || a.label === "Bridge")
              .map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.onClick}
                  className="group flex flex-row gap-4 items-center justify-center w-full py-5 rounded-2xl
                           bg-white dark:bg-[#121B2E]
                           text-gray-700 dark:text-[#C7C9D1]
                           border border-gray-200 dark:border-gray-800
                           hover:bg-gray-50 dark:hover:bg-[#1A2235]
                           hover:border-blue-400 dark:hover:border-blue-500
                           transition-all duration-200 ease-in-out"
                >
                  <span className="text-2xl text-gray-500 dark:text-[#9B9FB5] group-hover:text-blue-500 transition-colors mb-1">
                    {btn.icon}
                  </span>
                  <span className="text-lg font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {btn.label}
                  </span>
                </button>
              ))}
          </div>
        </div> */}
      {/* </div>  */}

      {/* ====== MODALS ====== */}
      {modalType && (
        <SendReceiveModal
          type={modalType}
          onClose={() => setModalType(null)}
          walletsBySymbol={walletsBySymbol}           // <= pass down
        />
      )}
      {swapOpen && (
        <SwapModal
          onClose={() => setSwapOpen(false)}
          walletsBySymbol={{
            SOL: solanaWallet ? { id: solanaWallet.id, address: solanaWallet.address } : undefined,
            TRX: tronWallet ? { id: tronWallet.id, address: tronWallet.address } : undefined,
            ETH: ethWallet ? { id: ethWallet.id, address: ethWallet.address } : undefined,
          }}
        />
      )}
      {bridgeOpen && <BridgeModal onClose={() => setBridgeOpen(false)} />}
    </>
  );
}
