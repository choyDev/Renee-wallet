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

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

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
    // <div className="group rounded-2xl p-px bg-gradient-to-br from-brand-400/40 via-transparent to-purple-500/30">
    <div>
      {/* <div className="rounded-2xl border border-gray-200/60 dark:border-white/10
                      bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm
                      p-5 lg:p-6 space-y-6 shadow-sm transition-all duration-300 group-hover:shadow-md"> */}

        <div className="mb-5 mt-2 text-lg font-semibold text-gray-800 dark:text-white/90 flex justify-between items-center px-6">
          <p className="mt-3 font-semibold text-brand-500 dark:text-brand-400">
            Wallet Overview
          </p>
          <div className="rounded-xl p-px bg-gradient-to-r from-brand-500/50 to-cyan-500/40">
            <div className="rounded-xl border border-gray-200/60 dark:border-white/10
                            bg-white/80 dark:bg-[#0B1220]/80 px-3 py-1.5 tabular-nums">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Total Balance</span>
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                {usd(totalUsd)}
              </span>
            </div>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 items-stretch">
          <div className="h-full cursor-pointer" onClick={() => handleNavigate("/wallet/btc")}>
            <WalletNetworkCard
              name="Ethereum"
              symbol="ETH"
              tokenAmount={ethWallet?.balances?.[0]?.amount ?? "0"}
              usdAmount={(ethWallet?.balances?.[0]?.usd ?? 0).toFixed(2)}
              usdtTokenAmount={ethUSDT}
              address={ethWallet?.address}
              explorerUrl={ethWallet?.network.explorerUrl}
              chainId={ethWallet?.network.chainId ?? ""}
            // hairline on by default, all cards same DEFAULT_HAIRLINE
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
    // </div>
  );
}
