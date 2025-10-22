
"use client";

import React, { useEffect, useState } from "react";
import CryptoCard from "./CryptoCard";
import {
  SiSolana,
  SiTether,
  SiEthereum,
  SiBitcoin,
  SiRipple,
  SiDogecoin,
} from "react-icons/si";
import { FaMonero } from "react-icons/fa";

// Custom Tron Icon
const TronIcon = ({ className = "text-[#FF4747] w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

// Wallet structure
interface WalletData {
  id: number;
  address: string;
  network: { name: string; symbol: string };
  balances: { token: { symbol: string; name: string }; amount: string; usd: number }[];
}

export default function DashboardSummary() {
  const [wallets, setWallets] = useState<WalletData[]>([]);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return;

        const res = await fetch(`/api/wallets/balances?userId=${userId}`, { cache: "no-store" });
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
        setWallets(data.wallets || []);
      } catch (err) {
        console.error("Error loading wallet balances:", err);
      }
    };
    fetchWallets();
  }, []);

  const getWallet = (symbol: string) => wallets.find((w) => w.network.symbol === symbol);
  const getAmount = (symbol: string) => getWallet(symbol)?.balances?.[0]?.amount ?? "0";
  const getUsd = (symbol: string) => (getWallet(symbol)?.balances?.[0]?.usd ?? 0).toFixed(2);

  return (
    <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* 🔴 TRON */}
      <CryptoCard
        title="TRX-USD"
        subtitle="Tron"
        value={`$${getUsd("TRX")}`}
        sub={`${getAmount("TRX")} TRX`}
        change="-0.4%"
        changeAbs="-0.25%"
        color="#FF060A"
        iconBg="bg-[#FFECEC]"
        icon={<TronIcon className="text-[#FF060A] size-6" />}
        data={[12, 18, 20, 16, 14, 12, 10]}
      />

      {/* 🟢 SOLANA */}
      <CryptoCard
        title="SOL-USD"
        subtitle="Solana"
        value={`$${getUsd("SOL")}`}
        sub={`${getAmount("SOL")} SOL`}
        change="+9.25%"
        changeAbs="+182.10%"
        color="#14F195"
        iconBg="bg-[#E8FFF9]"
        icon={<SiSolana className="text-[#14F195] size-6" />}
        data={[10, 12, 15, 18, 21, 24, 26]}
      />

      {/* 🔵 ETHEREUM */}
      <CryptoCard
        title="ETH-USD"
        subtitle="Ethereum"
        value={`$${getUsd("ETH")}`}
        sub={`${getAmount("ETH")} ETH`}
        change="+5.12%"
        changeAbs="+97.32%"
        color="#627EEA"
        iconBg="bg-[#EEF2FF]"
        icon={<SiEthereum className="text-[#627EEA] size-6" />}
        data={[8, 9, 10, 12, 13, 14, 15]}
      />

      {/* 🟠 BITCOIN */}
      <CryptoCard
        title="BTC-USD"
        subtitle="Bitcoin"
        value={`$${getUsd("BTC")}`}
        sub={`${getAmount("BTC")} BTC`}
        change="+3.84%"
        changeAbs="+56.43%"
        color="#F7931A"
        iconBg="bg-[#FFF4E5]"
        icon={<SiBitcoin className="text-[#F7931A] size-6" />}
        data={[20, 22, 23, 25, 24, 23, 26]}
      />

      {/* 🟧 MONERO */}
      <CryptoCard
        title="XMR-USD"
        subtitle="Monero"
        value={`$${getUsd("XMR")}`}
        sub={`${getAmount("XMR")} XMR`}
        change="+1.76%"
        changeAbs="+14.22%"
        color="#FF6600"
        iconBg="bg-[#FFF1E6]"
        icon={<FaMonero className="text-[#FF6600] size-6" />}
        data={[6, 7, 8, 7, 8, 9, 10]}
      />

      {/* 💜 XRP */}
      <CryptoCard
        title="XRP-USD"
        subtitle="Ripple"
        value={`$${getUsd("XRP")}`}
        sub={`${getAmount("XRP")} XRP`}
        change="+2.58%"
        changeAbs="+27.40%"
        color="#006097"
        iconBg="bg-[#E8F3F9]"
        icon={<SiRipple className="text-[#006097] size-6" />}
        data={[7, 9, 10, 9, 11, 12, 13]}
      />

      {/* 🟡 DOGECOIN */}
      <CryptoCard
        title="DOGE-USD"
        subtitle="Dogecoin"
        value={`$${getUsd("DOGE")}`}
        sub={`${getAmount("DOGE")} DOGE`}
        change="+4.32%"
        changeAbs="+33.22%"
        color="#C2A633"
        iconBg="bg-[#FFFBEA]"
        icon={<SiDogecoin className="text-[#C2A633] size-6" />}
        data={[5, 7, 8, 9, 11, 10, 12]}
      />

      {/* 💚 USDT */}
      <CryptoCard
        title="USDT"
        subtitle="Tether"
        value={`$${getUsd("USDT")}`}
        sub={`${getAmount("USDT")} USDT`}
        change="+0.00%"
        changeAbs="+0.00%"
        color="#26A17B"
        iconBg="bg-[#E6F9F3]"
        icon={<SiTether className="text-[#26A17B] size-6" />}
        data={[8, 10, 12, 14, 16, 18, 20]}
      />
    </div>
  );
}
