"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "react-qr-code";
import {
  FaQrcode,
  FaRegCopy,
  FaExternalLinkAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { SiSolana, SiTether, SiEthereum, SiBitcoin } from "react-icons/si";

//  Tron Icon
export const TronIcon = ({ className = "text-[#FF4747] w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

export type ChainSym = "BTC" | "ETH" | "TRX" | "SOL";
export type ChainIdLike = string | number | null | undefined;

// ----------------------------
// Env & helpers
// ----------------------------
const PUBLIC_CHAIN_ENV = (process.env.NEXT_PUBLIC_CHAIN_ENV ?? "mainnet").toLowerCase();

export function normalizeChainId(id: ChainIdLike): string {
  if (id == null) return "";
  return typeof id === "number" ? String(id) : String(id);
}

export function isTestnet(id: ChainIdLike): boolean {
  if (id == null) return PUBLIC_CHAIN_ENV !== "mainnet"; // fallback to env
  if (typeof id === "number") return id !== 1; // EVM: 1 = mainnet
  const s = normalizeChainId(id).toLowerCase();
  // cover Solana + Tron + common EVM testnets
  return /(devnet|testnet|sepolia|goerli|holesky|amoy|mumbai|nile|shasta|bsc-testnet|base-sepolia|arbitrum-sepolia)/.test(s);
}

function trimEndSlash(u: string) {
  return u.replace(/\/+$/, "");
}

export function buildExplorerAddressUrl(opts: {
  symbol: ChainSym;
  address?: string;
  chainId: string; // e.g. "testnet" | "sepolia" | "devnet" | "mainnet" | "mainnet-beta" | "shasta"
  explorerUrl?: string | null; // from DB (optional)
}) {
  const { symbol, address, chainId, explorerUrl } = opts;
  if (!address) return undefined;

  switch (symbol) {
    case "BTC": {
      const base = explorerUrl && /blockstream\.info/.test(explorerUrl)
        ? trimEndSlash(explorerUrl)
        : isTestnet(chainId)
          ? "https://blockstream.info/testnet"
          : "https://blockstream.info";
      return `${base}/address/${address}`;
    }
    case "ETH": {
      const base = explorerUrl && /etherscan\.io/.test(explorerUrl)
        ? trimEndSlash(explorerUrl)
        : isTestnet(chainId)
          ? "https://sepolia.etherscan.io"
          : "https://etherscan.io";
      return `${base}/address/${address}`;
    }
    case "TRX": {
      const id = normalizeChainId(chainId);
      const base = /nile/i.test(id)
        ? "https://nile.tronscan.org/#/address"
        : /shasta/i.test(id)
          ? "https://shasta.tronscan.org/#/address"
          : isTestnet(id)
            ? "https://nile.tronscan.org/#/address"
            : "https://tronscan.org/#/address";
      return `${base}/${address}`;
    }
    case "SOL": {
      const id = normalizeChainId(chainId);
      const cluster = /devnet/i.test(id)
        ? "devnet"
        : /testnet/i.test(id)
          ? "testnet"
          : isTestnet(id)
            ? "devnet"
            : "";
      const base = "https://solscan.io/address";
      return `${base}/${address}${cluster ? `?cluster=${cluster}` : ""}`;
    }
  }
}

// ----------------------------
// Small helpers
// ----------------------------
function formatUSD(nLike: string | number) {
  const n = typeof nLike === "string" ? parseFloat(nLike) : nLike;
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getNetworkIcon(symbol: ChainSym) {
  switch (symbol) {
    case "SOL":
      return <SiSolana className="text-[#14F195] w-6 h-6" />;
    case "TRX":
      return <TronIcon />;
    case "ETH":
      return <SiEthereum className="text-[#627EEA] w-6 h-6" />;
    case "BTC":
      return <SiBitcoin className="text-[#F7931A] w-6 h-6" />;
  }
}

// =====================================================================
// 1) Native token amount section (exported)
// =====================================================================
export type NativeAmountSectionProps = {
  symbol: ChainSym;
  tokenAmount: string; // formatted string ok
  usdAmount: string | number; // will be formatted
};

export function NativeAmountSection({ symbol, tokenAmount, usdAmount }: NativeAmountSectionProps) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {tokenAmount} {symbol}
        </p>
        <p className="text-base text-gray-500 dark:text-gray-400">≈ ${formatUSD(usdAmount)}</p>
      </div>
      {/* <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available Balance</p> */}
    </div>
  );
}

// =====================================================================
// 2) USDT amount section (exported)
// =====================================================================
export type UsdtAmountSectionProps = {
  usdtTokenAmount?: string | null;
};

export function UsdtAmountSection({ usdtTokenAmount }: UsdtAmountSectionProps) {
  const show = usdtTokenAmount != null && Number(usdtTokenAmount) >= 0;
  if (!show) return null;
  return (
    <div className="mt-2">
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{usdtTokenAmount} USDT</p>
      {/* <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available Balance</p> */}
    </div>
  );
}

// =====================================================================
// 3) Address section (exported)
// =====================================================================
export type AddressSectionProps = {
  symbol: ChainSym;
  address?: string;
  explorerUrl?: string | null;
  chainId: string;
  textSize?: "xs" | "sm" | "base" | "lg" | "xl";
  className?: string;
  addressTextClassName?: string;
};

export function AddressSection({ symbol, address, explorerUrl, chainId, textSize = "xs", className, addressTextClassName, }: AddressSectionProps) {
  const [showQR, setShowQR] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  const resolvedAddress = address?.trim() || "Address not available";
  const maskedAddress =
    resolvedAddress !== "Address not available"
      ? `${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-6)}`
      : resolvedAddress;

  const viewHref = buildExplorerAddressUrl({ symbol, address, explorerUrl, chainId });
  const canView = !!viewHref;

  const copyAddress = async () => {
    if (!address) return alert("⚠️ No address to copy.");
    await navigator.clipboard.writeText(resolvedAddress);
    alert(" Address copied to clipboard!");
  };

  return (
    <div className="mb-4 mt-5">
      {/* Row */}
      <div
        className={`flex items-center justify-between text-gray-600 dark:text-gray-300 ${textSize === "xl"
          ? "text-xl"
          : textSize === "lg"
            ? "text-lg"
            : textSize === "base"
              ? "text-base"
              : textSize === "sm"
                ? "text-sm"
                : "text-xs"
          } ${className ?? ""}`}
      >
        <p className={`truncate ${addressTextClassName ?? "text-brand-500 dark:text-brand-400"}`}>{showAddress ? resolvedAddress : maskedAddress}</p>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQR(true)}
              className="hover:text-blue-500 transition"
              title="Show QR"
              disabled={!address}
            >
              <FaQrcode />
            </button>
            <button
              onClick={copyAddress}
              className="hover:text-blue-500 transition"
              title="Copy Address"
              disabled={!address}
            >
              <FaRegCopy />
            </button>
            <button
              onClick={() => setShowAddress((p) => !p)}
              className="hover:text-blue-500 transition"
              title={showAddress ? "Hide Address" : "Show Address"}
              disabled={!address}
            >
              {showAddress ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <a
            href={canView ? viewHref : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-brand-500 dark:text-brand-400 hover:underline ${!canView ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
              }`}
            aria-disabled={!canView}
          >
            <FaExternalLinkAlt className="w-3 h-3" />
            View
          </a>
        </div>
      </div>

      {/* QR popup */}
      {showQR && address && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
          <div className="flex flex-col items-center justify-center bg-white dark:bg-[#121B2E] px-8 py-6 rounded-2xl shadow-2xl w-[250px]">
            <div className="flex items-center justify-center mb-4">
              <QRCode value={resolvedAddress} size={150} />
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-200 text-center break-all mb-4">
              {resolvedAddress}
            </p>

            <button
              onClick={() => setShowQR(false)}
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

// =====================================================================
// 4) Full card (composed) — default export
// =====================================================================
export type WalletNetworkCardProps = {
  name: string;
  symbol: ChainSym;
  address?: string;
  explorerUrl?: string | null;
  chainId: string;
  tokenAmount: string;
  usdAmount: string; // formatted or number-like
  usdtTokenAmount?: string;
};

export default function WalletNetworkCard({
  name,
  symbol,
  address,
  explorerUrl,
  chainId,
  tokenAmount,
  usdAmount,
  usdtTokenAmount,
}: WalletNetworkCardProps) {
  return (
    <div
      className="relative flex flex-col justify-between rounded-2xl p-6 border border-gray-200 dark:border-gray-700 
                 bg-white dark:bg-[#121B2E] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
    >
      {/* HEADER */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700">
            {getNetworkIcon(symbol)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{symbol} Network</p>
          </div>
        </div>
      </div>

      {/* BALANCES */}
      <NativeAmountSection symbol={symbol} tokenAmount={tokenAmount} usdAmount={usdAmount} />
      <UsdtAmountSection usdtTokenAmount={usdtTokenAmount} />

      {/* ADDRESS */}
      <AddressSection symbol={symbol} address={address} explorerUrl={explorerUrl} chainId={chainId} />
    </div>
  );
}
