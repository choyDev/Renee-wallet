"use client";

import React, { useEffect, useState } from "react";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import WalletNetworkCard from "@/components/wallet/WalletNetworkCard";
// import WalletRecentActivity from "@/components/wallet/WalletRecentActivity";
import { useRouter } from "next/navigation";

interface WalletData {
  id: number;
  address: string;
  network: {
    name: string;
    symbol: string;
    chainId: string;
    explorerUrl?: string;
  };
  balances: {
    token: { symbol: string; name: string };
    amount: string;
    usd: number;
  }[];
}

export default function WalletOverviewPage() {
  const [tronWallet, setTronWallet] = useState<WalletData | null>(null);
  const [solanaWallet, setSolanaWallet] = useState<WalletData | null>(null);
  const [ethWallet, setEthWallet] = useState<WalletData | null>(null);
  const [btcWallet, setBtcWallet] = useState<WalletData | null>(null);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return;

        const res = await fetch(`/api/wallets/balances?userId=${userId}`, { cache: "no-store" });

        // Read text first so we can diagnose non-JSON / empty bodies
        const text = await res.text();
        let data: any = null;

        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          // Not JSON (e.g., HTML error page)
          throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
        }

        if (!res.ok) {
          throw new Error(data?.error || `Request failed with ${res.status}`);
        }

        const wallets: WalletData[] = data.wallets || [];
        const tron = wallets.find((w) => w.network.symbol === "TRX") || null;
        const sol = wallets.find((w) => w.network.symbol === "SOL") || null;
        const eth = wallets.find(w => w.network.symbol === "ETH") || null;
        const btc = wallets.find(w => w.network.symbol === "BTC") || null;

        setTronWallet(tron);
        setSolanaWallet(sol);
        setEthWallet(eth);
        setBtcWallet(btc);
      } catch (err) {
        console.error("Error fetching wallet data:", err);
        // optional: show a toast/UI hint
      }
    };

    fetchWallets();

    const handleRefresh = () => fetchWallets();
    window.addEventListener("wallet:refresh", handleRefresh);

    return () => window.removeEventListener("wallet:refresh", handleRefresh);

  }, []);

  const tronUSDT =
    tronWallet?.balances.find(b => b.token.symbol === "USDT")?.amount ?? "0";
  const solUSDT =
    solanaWallet?.balances.find(b => b.token.symbol === "USDT")?.amount ?? "0";
  const ethUSDT =
    ethWallet?.balances.find(b => b.token.symbol === "USDT")?.amount ?? "0"; // if you have ETH card
  
  const totalUsd =
    (tronWallet?.balances.reduce((sum, b) => sum + (b.usd || 0), 0) || 0) +
    (solanaWallet?.balances.reduce((sum, b) => sum + (b.usd || 0), 0) || 0) +
    (ethWallet?.balances.reduce((sum, b) => sum + (b.usd || 0), 0) || 0) +
    (btcWallet?.balances.reduce((sum, b) => sum + (b.usd || 0), 0) || 0);

  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const TotalUsd = Number(ethWallet?.balances?.[0]?.usd ?? "0")
    + Number(solanaWallet?.balances?.[0]?.usd ?? "0")
    + Number(tronWallet?.balances?.[0]?.usd ?? "0")
    + Number(btcWallet?.balances?.[0]?.usd ?? "0")
    + Number(ethUSDT ?? "0")
    + Number(solUSDT ?? "0")
    + Number(tronUSDT ?? "0");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 space-y-6">
      <div className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 flex justify-between items-center">
        Wallet Overview
        <p>TotalUsd:&nbsp;&nbsp;&nbsp;${TotalUsd.toFixed(2)}$</p>
      </div>

      {/* ===== Balance + Actions ===== */}
      {/* <WalletBalanceCard
        walletsBySymbol={{
          SOL: solanaWallet ? { id: solanaWallet.id, address: solanaWallet.address } : undefined,
          TRX: tronWallet ? { id: tronWallet.id, address: tronWallet.address } : undefined,
          ETH: ethWallet ? { id: ethWallet.id, address: ethWallet.address } : undefined,
          BTC: btcWallet ? { id: btcWallet.id, address: btcWallet.address } : undefined,
        }}
      />
      /> */}

      {/* ===== Network Balances ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        <div onClick={() => handleNavigate("/wallet/eth")} className="cursor-pointer">
          <WalletNetworkCard
            name="Ethereum"
            symbol="ETH"
            tokenAmount={ethWallet?.balances?.[0]?.amount ?? "0"}
            usdAmount={(ethWallet?.balances?.[0]?.usd ?? 0).toFixed(2)}
            usdtTokenAmount={ethUSDT}
            address={ethWallet?.address}
            explorerUrl={ethWallet?.network.explorerUrl}
            chainId={ethWallet?.network.chainId ?? ""}
          />
        </div>

        <div onClick={() => handleNavigate("/wallet/btc")} className="cursor-pointer grid">
          <WalletNetworkCard
            name="Bitcoin"
            symbol="BTC"
            tokenAmount={btcWallet?.balances?.[0]?.amount ?? "0"}
            usdAmount={(btcWallet?.balances?.[0]?.usd ?? 0).toFixed(2)}
            address={btcWallet?.address}
            explorerUrl={btcWallet?.network.explorerUrl}
            chainId={btcWallet?.network.chainId ?? ""}
          />
        </div>

        <div onClick={() => handleNavigate("/wallet/trx")} className="cursor-pointer">
          <WalletNetworkCard
            name="Tron"
            symbol="TRX"
            tokenAmount={tronWallet?.balances?.[0]?.amount ?? "0"}
            usdAmount={(tronWallet?.balances?.[0]?.usd ?? 0).toFixed(2)}
            usdtTokenAmount={tronUSDT}
            address={tronWallet?.address}
            explorerUrl={tronWallet?.network.explorerUrl}
            chainId={tronWallet?.network.chainId ?? ""}
          />
        </div>

        <div onClick={() => handleNavigate("/wallet/sol")} className="cursor-pointer">

          <WalletNetworkCard
            name="Solana"
            symbol="SOL"
            tokenAmount={solanaWallet?.balances?.[0]?.amount ?? "0"}
            usdAmount={(solanaWallet?.balances?.[0]?.usd ?? 0).toFixed(2)}
            usdtTokenAmount={solUSDT}
            address={solanaWallet?.address}
            explorerUrl={solanaWallet?.network.explorerUrl}
            chainId={solanaWallet?.network.chainId ?? ""}
          />
        </div>
      </div>

      {/* ===== Recent Activity ===== */}
      {/* <WalletRecentActivity /> */}
    </div>
  );
}
