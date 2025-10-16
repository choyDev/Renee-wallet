
"use client";

import React, { useState, ReactElement  } from "react";
import { createPortal } from "react-dom";
import {
  FaPaypal,
  FaUniversity,
  FaCreditCard,
  FaTimes,
  FaCheckCircle
} from "react-icons/fa";
import { SiSolana } from "react-icons/si";

// Custom Tron Icon
const TronIcon = ({ className = "text-[#FF4747] w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

type NetworkKey = "Solana" | "Tron";

interface WalletInfo {
  label: string;
  address: string;
  icon: ReactElement;
}

const wallets: Record<NetworkKey, WalletInfo> = {
  Solana: {
    label: "SOL Wallet",
    address: "7XT9 **** 9A02",
    icon: <SiSolana className="text-[#14F195] w-6 h-6" />,
  },
  Tron: {
    label: "TRX Wallet",
    address: "5HT2 **** N9A5",
    icon: <TronIcon className="text-[#FF4747] w-6 h-6" />,
  },
};

export default function DepositPage() {
  const [selectedCoin, setSelectedCoin] = useState("SOL");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkKey>("Solana");
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState("");
  const [showModal, setShowModal] = useState(false);

  const coins = [
    {
      symbol: "SOL",
      name: "Solana Wallet",
      icon: <SiSolana className="text-[#14F195] w-6 h-6" />,
      lastOrder: "Oct 10, 2025",
    },
    {
      symbol: "TRX",
      name: "Tron Wallet",
      icon: <TronIcon className="text-[#FF4747] w-6 h-6" />,
      lastOrder: "Sep 28, 2025",
    },
  ];

  const paymentMethods = [
    { id: "paypal", label: "PayPal", icon: <FaPaypal className="text-[#2563EB] text-xl" /> },
    { id: "bank", label: "Bank Transfer", icon: <FaUniversity className="text-[#2563EB] text-xl" /> },
    { id: "card", label: "Credit / Debit Card", icon: <FaCreditCard className="text-[#2563EB] text-xl" /> },
  ];

  const handleContinue = () => {
    if (amount && payment) setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const selectedWallet = wallets[selectedNetwork];

  return (
    <div className="relative">
      {/* ===== Deposit Section ===== */}
      <div className="max-w-2xl mx-auto p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121B2E] shadow-sm">
        <h1 className="text-center text-2xl font-bold text-gray-800 dark:text-white mb-8">
          What do you want to deposit?
        </h1>

        {/* ===== Choose Coin ===== */}
        <div className="mb-6">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Choose what you want to deposit
        </p>

        <div className="space-y-3">
          {coins.map((coin) => (
            <button
              key={coin.symbol}
              onClick={() => setSelectedCoin(coin.symbol)}
              className={`flex items-center justify-between w-full px-5 py-4 rounded-xl border transition
                ${
                  selectedCoin === coin.symbol
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1A2235]"
                }`}
            >
              <div className="flex items-center gap-3">
                {coin.icon}
                <div className="text-left">
                  <p
                    className={`font-semibold ${
                      selectedCoin === coin.symbol
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-800 dark:text-white"
                    }`}
                  >
                    {coin.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last Deposit: {coin.lastOrder}
                  </p>
                </div>
              </div>
              {selectedCoin === coin.symbol && (
                <FaCheckCircle className="text-blue-500 text-lg" />
              )}
            </button>
          ))}
        </div>
      </div>

        {/* ===== Amount Input ===== */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Amount to Deposit
          </p>
          <div className="flex items-center border rounded-xl border-gray-200 dark:border-gray-700 overflow-hidden">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 px-4 py-3 bg-transparent text-gray-800 dark:text-white outline-none"
            />
            <div className="flex items-center gap-2 px-4 py-3 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1A2235]">
              <span className="font-medium text-gray-700 dark:text-gray-300">{selectedCoin}</span>
              <span className="text-gray-400">/ TRY</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Minimum: 100.00 TRY
          </p>
        </div>

        {/* ===== Payment Method ===== */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Payment Method
          </p>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPayment(method.id)}
                className={`flex items-center justify-between w-full px-5 py-4 rounded-xl border transition ${
                  payment === method.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1A2235]"
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-gray-800 dark:text-white">
                  <span
                    className={`w-4 h-4 rounded-full border-2 ${
                      payment === method.id
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-400 dark:border-gray-500"
                    }`}
                  />
                  {method.label}
                </span>
                {method.icon}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Continue Button ===== */}
        <button
          onClick={handleContinue}
          disabled={!amount || !payment}
          className={`w-full py-3 rounded-xl font-semibold text-white transition ${
            amount && payment
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Continue to Deposit
        </button>
      </div>

      {/* ===== Confirm Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 ">
          <div className="w-[90%] sm:w-[480px] bg-white dark:bg-[#121B2E] rounded-2xl shadow-lg p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FaTimes size={18} />
            </button>

            <h2 className="text-center text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Confirm Order
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-1">
              You are about to deposit{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{amount}</span>{" "}
              {selectedCoin} via{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {selectedNetwork}
              </span>{" "}
              network using{" "}
              <span className="font-semibold capitalize text-blue-600 dark:text-blue-400">
                {payment}
              </span>
              .
            </p>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mb-6">
              Exchange rate example: 1 {selectedCoin} = 180 TRY
            </p>

            {/* ===== Pay with / Total ===== */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 mb-5">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Pay with</span>
                <div className="flex items-center gap-2 text-gray-800 dark:text-white capitalize">
                  {payment}
                  {payment === "paypal" && <FaPaypal className="text-[#2563EB]" />}
                  {payment === "bank" && <FaUniversity className="text-[#2563EB]" />}
                  {payment === "card" && <FaCreditCard className="text-[#2563EB]" />}
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${(Number(amount) * 180).toFixed(2)} TRY
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              * Our transaction fee is included.{" "}
              <a
                href="#"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                See transaction fee
              </a>
              .
            </p>

            {/* ===== Static Wallet (no dropdown / no Add Wallet) ===== */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Your {selectedNetwork} Wallet
              </p>
              <div className="flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#1A2235]">
                <div className="flex items-center gap-3">
                  {selectedWallet.icon}
                  <div>
                    <p className="text-gray-800 dark:text-white font-medium">
                      {selectedWallet.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedWallet.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Buttons ===== */}
            <button
              onClick={() => alert("Deposit confirmed!")}
              className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition mb-3"
            >
              Confirm the Order
            </button>
            <button
              onClick={handleCloseModal}
              className="w-full py-3 rounded-xl font-semibold text-red-500 hover:text-red-600 transition"
            >
              Cancel Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
