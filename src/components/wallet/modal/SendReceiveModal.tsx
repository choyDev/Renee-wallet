"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCopy } from "react-icons/fi";
import { SiSolana } from "react-icons/si";
import QRCode from "react-qr-code";
import { FaChevronDown } from "react-icons/fa";

/* Custom Tron Icon */
const TronIcon = ({ className = "w-4 h-4 text-[#FF4747]" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

interface Props {
  type: "send" | "receive";
  onClose: () => void;
}

const networks = [
  {
    label: "Solana",
    symbol: "SOL",
    color: "#14F195",
    address: "DEmtVE...EWW1Ck",
    icon: <SiSolana className="text-[#14F195] text-lg" />,
  },
  {
    label: "Tron",
    symbol: "TRX",
    color: "#FF4747",
    address: "TKE3Cd...yQ4yu7",
    icon: <TronIcon />,
  },
];

export default function SendReceiveModal({ type, onClose }: Props) {
  const [selectedNet, setSelectedNet] = useState(networks[0]);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden
                     bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]
                     border border-white/10 p-6"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 24 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition"
          >
            <FiX size={22} />
          </button>

          {/* Title */}
          <h2 className="text-xl font-semibold text-white mb-6 capitalize tracking-wide">
            {type === "send" ? "Send Crypto" : "Receive Crypto"}
          </h2>

          {/* Network Selector */}
          <div className="relative mb-6">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-white/10
                         bg-white/5 hover:bg-white/10 transition text-white font-medium"
            >
              <div className="flex items-center gap-2">
                {selectedNet.icon}
                <span>{selectedNet.label}</span>
              </div>
              <FaChevronDown
                className={`transition ${showDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showDropdown && (
              <div className="absolute mt-2 w-full bg-[#1e293b] border border-white/10 rounded-xl shadow-lg z-10">
                {networks.map((net) => (
                  <button
                    key={net.symbol}
                    onClick={() => {
                      setSelectedNet(net);
                      setShowDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left text-white hover:bg-white/10 transition"
                  >
                    {net.icon}
                    <span>{net.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          {type === "receive" ? (
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="bg-white p-3 rounded-xl">
                <QRCode value={selectedNet.address} size={150} />
              </div>

              <p className="text-sm text-gray-300">
                Your {selectedNet.label} Address
              </p>

              <div className="flex items-center justify-between bg-white/10 px-4 py-2 rounded-xl w-full text-sm text-gray-100 border border-white/10">
                <span>{selectedNet.address}</span>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(selectedNet.address)
                  }
                  className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 rounded-md text-xs font-semibold text-white hover:opacity-90 transition"
                >
                  <FiCopy size={14} />
                  Copy
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Recipient Address
                </label>
                <input
                  type="text"
                  placeholder="Enter recipient address"
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:opacity-90 transition"
              >
                Send Now
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
