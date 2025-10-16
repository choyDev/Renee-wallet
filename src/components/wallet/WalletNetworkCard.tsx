

"use client";

import { useState } from "react";
import {
  FaQrcode,
  FaRegCopy,
  FaExternalLinkAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { SiSolana, SiTether } from "react-icons/si";
import QRCode from "react-qr-code";

// ✅ Custom Tron Icon
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

interface Props {
  name: string;
  symbol: string;
  tokenAmount: string; // e.g. "1.254"
  usdAmount: string; // e.g. "250.00"
  color: string;
  gradient: string;
  address?: string;
  explorerUrl?: string;
}

export default function WalletNetworkCard({
  name,
  symbol,
  tokenAmount,
  usdAmount,
  color,
  gradient,
  address,
  explorerUrl,
}: Props) {
  const [showQR, setShowQR] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  // ✅ Default addresses
  const resolvedAddress =
    address ||
    (symbol === "SOL"
      ? "DEmtVE53LwkY6F4Jt4DDAqF6xR5CGb87wEe7MBEWW1Ck"
      : symbol === "TRX"
      ? "TKE3CdkfeTXd3BEGACWrA6tFv2DryQ4yu7"
      : "USDT-ADDRESS-PLACEHOLDER");

  const maskedAddress = `${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-6)}`;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(resolvedAddress);
    alert("✅ Address copied to clipboard!");
  };

  const toggleQR = () => setShowQR(!showQR);
  const toggleAddress = () => setShowAddress(!showAddress);

  const getIcon = () => {
    if (symbol === "SOL")
      return <SiSolana className="text-[#14F195] w-6 h-6" />;
    if (symbol === "TRX") return <TronIcon />;
    if (symbol === "USDT")
      return <SiTether className="text-[#50AF95] w-6 h-6" />;
    return null;
  };

  return (
    <div
      className={`relative rounded-2xl p-6 border border-gray-200 dark:border-gray-700 bg-gradient-to-br ${gradient} shadow-lg transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1`}
    >
      {/* ---- HEADER ---- */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            <p className="text-xs text-gray-200">{symbol} Network</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-white/80">
          <button onClick={toggleQR} className="hover:text-white transition" title="Show QR">
            <FaQrcode />
          </button>
          <button onClick={copyAddress} className="hover:text-white transition" title="Copy Address">
            <FaRegCopy />
          </button>
          <button
            onClick={toggleAddress}
            className="hover:text-white transition"
            title={showAddress ? "Hide Address" : "Show Address"}
          >
            {showAddress ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      {/* ---- BALANCE ---- */}
      <div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-white drop-shadow-sm">
            {tokenAmount} {symbol}
          </p>
          <p className="text-base text-gray-100 opacity-80">
            ≈ ${parseFloat(usdAmount).toLocaleString()}
          </p>
        </div>
        <p className="text-xs text-gray-200 mt-1">Available Balance</p>
      </div>

      {/* ---- ADDRESS ---- */}
      <div className="mt-5 flex items-center justify-between text-xs text-white/90">
        <p className="truncate">
          {showAddress ? resolvedAddress : maskedAddress}
        </p>

        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-200 hover:text-blue-100"
          >
            <FaExternalLinkAlt className="w-3 h-3" />
            View
          </a>
        )}
      </div>

      {/* ---- QR POPUP ---- */}
      {showQR && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
          <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 px-8 py-6 rounded-2xl shadow-2xl w-[250px]">
            <div className="flex items-center justify-center mb-4">
              <QRCode value={resolvedAddress} size={150} />
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-200 text-center break-all mb-4">
              {resolvedAddress}
            </p>

            <button
              onClick={toggleQR}
              className="px-5 py-1.5 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
