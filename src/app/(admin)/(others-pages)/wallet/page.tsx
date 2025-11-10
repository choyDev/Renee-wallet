"use client";

import React, { useEffect, useState } from "react";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import WalletNetworkCard from "@/components/wallet/WalletNetworkCard";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

const PATH_BY_SYMBOL: Record<string, string> = {
  BTC: "/wallet/btc",
  ETH: "/wallet/eth",
  SOL: "/wallet/sol",
  TRX: "/wallet/trx",
  XRP: "/wallet/xrp",
  XMR: "/wallet/xmr",
  DOGE: "/wallet/doge",
};

function totalForWallet(w: WalletData): number {
  const native = w.balances.find(
    (b) => b.token.symbol.toUpperCase() === w.network.symbol.toUpperCase()
  );
  const nativeUsd = Number(native?.usd ?? 0);
  const usdt = w.balances.find((b) => b.token.symbol.toUpperCase() === "USDT");
  const usdtUsd = Number(usdt?.usd ?? (usdt?.amount ? parseFloat(usdt.amount) : 0));
  return +(nativeUsd + usdtUsd).toFixed(2);
}

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
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);

export default function WalletOverviewPage() {
  const [tronWallet, setTronWallet] = useState<WalletData | null>(null);
  const [solanaWallet, setSolanaWallet] = useState<WalletData | null>(null);
  const [ethWallet, setEthWallet] = useState<WalletData | null>(null);
  const [btcWallet, setBtcWallet] = useState<WalletData | null>(null);
  const [xrpWallet, setXrpWallet] = useState<WalletData | null>(null);
  const [xmrWallet, setXmrWallet] = useState<WalletData | null>(null);
  const [dogeWallet, setDogeWallet] = useState<WalletData | null>(null);
  
  const { setWalletBadgesBulk } = useSidebar() as any;

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return;

        const res = await fetch(`/api/wallets/balances?userId=${userId}`, {
          cache: "no-store",
        });

        const text = await res.text();
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
        }
        if (!res.ok) throw new Error(data?.error || `Request failed with ${res.status}`);

        const wallets: WalletData[] = data.wallets || [];
        const tron = wallets.find((w) => w.network.symbol === "TRX") || null;
        const sol = wallets.find((w) => w.network.symbol === "SOL") || null;
        const eth = wallets.find((w) => w.network.symbol === "ETH") || null;
        const btc = wallets.find((w) => w.network.symbol === "BTC") || null;
        const xrp = wallets.find((w) => w.network.symbol === "XRP") || null;
        const xmr = wallets.find((w) => w.network.symbol === "XMR") || null;
        const doge = wallets.find((w) => w.network.symbol === "DOGE") || null;

        setTronWallet(tron);
        setSolanaWallet(sol);
        setEthWallet(eth);
        setBtcWallet(btc);
        setXrpWallet(xrp);
        setXmrWallet(xmr);
        setDogeWallet(doge);

        // ⬇️ compute & push per-chain totals immediately
        const entries: Record<string, number> = {};
        for (const w of wallets) {
          const path = PATH_BY_SYMBOL[w.network.symbol?.toUpperCase() ?? ""];
          if (path) entries[path] = totalForWallet(w);
        }
        setWalletBadgesBulk(entries);
        try {
          localStorage.setItem("wallet_badges", JSON.stringify(entries));
        } catch { }
      } catch (err) {
        console.error("Error fetching wallet data:", err);
      }
    };

    fetchWallets();

    const handleRefresh = () => fetchWallets();
    window.addEventListener("wallet:refresh", handleRefresh);
    return () => window.removeEventListener("wallet:refresh", handleRefresh);
  }, [setWalletBadgesBulk]);

  const tronUSDT =
    tronWallet?.balances.find((b) => b.token.symbol === "USDT")?.amount ?? "0";
  const solUSDT =
    solanaWallet?.balances.find((b) => b.token.symbol === "USDT")?.amount ?? "0";
  const ethUSDT =
    ethWallet?.balances.find((b) => b.token.symbol === "USDT")?.amount ?? "0";

  const totalUsd =
    (tronWallet?.balances.reduce((sum, b) => sum + (b.usd || 0), 0) || 0) +
    (solanaWallet?.balances.reduce((sum, b) => sum + (b.usd || 0), 0) || 0) +
    (ethWallet?.balances.reduce((sum, b) => sum + (b.usd || 0), 0) || 0) +
    (btcWallet?.balances.reduce((sum, b) => sum + (b.usd || 0), 0) || 0)+
    (xrpWallet?.balances.reduce((sum, b) => sum + (b.usd || 0), 0) || 0)+
    (xmrWallet?.balances.reduce((sum, b) => sum + (b.usd || 0), 0) || 0)+
    (dogeWallet?.balances.reduce((sum, b) => sum + (b.usd || 0), 0) || 0);

  const router = useRouter();
  const handleNavigate = (path: string) => router.push(path);

  return (
    <div>
      <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 mt-0 text-lg font-semibold text-gray-800 dark:text-white/90 px-6 sm:px-9 pt-1">
        {/* Wallet Overview (Left / Top on mobile) */}
        <p className="mb-4 sm:mb-0 sm:mt-8 font-semibold text-brand-500 dark:text-brand-400 text-center sm:text-left">
          Wallet Overview
        </p>

        {/* Total Balance (Centered) */}
        <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-auto flex justify-center sm:justify-normal">
          <div className="rounded-xl p-[8px] bg-gradient-to-r from-brand-500/50 to-cyan-500/40 w-[90%] sm:w-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/80 dark:bg-[#0B1220]/80 px-6 sm:px-10 py-2.5 tabular-nums">
              <span className="text-base sm:text-xl text-gray-500 dark:text-gray-400">
                Total Balance
              </span>
              <span className="mt-1 sm:mt-0 sm:ml-3 text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {usd(totalUsd)}
              </span>
            </div>
          </div>
        </div>
        {/* <div className="h-full rounded-2xl p-px bg-gradient-to-r from-brand-500/50 to-cyan-500/40 w-1/4">
          <div className="h-full flex flex-col rounded-2xl border border-gray-200/60 dark:border-white/10 
                            bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm p-4 sm:p-5 
                            shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Balance</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                USD
              </span>
            </div>
            <div className="h-full flex items-center mt-2 text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">
              {usd(totalUsd)}
            </div>
          </div>
        </div> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 items-stretch p-2">
        <div className="h-full cursor-pointer" onClick={() => handleNavigate("/wallet/eth")}>
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

        <div onClick={() => handleNavigate("/wallet/btc")} className="cursor-pointer">
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

        {/* duplicates kept as in your snippet; remove if not needed */}
        <div onClick={() => handleNavigate("/wallet/xrp")} className="cursor-pointer">
          <WalletNetworkCard
            name="XRP Ledger"
            symbol="XRP"
            tokenAmount={xrpWallet?.balances?.[0]?.amount ?? "0"}
            usdAmount={(xrpWallet?.balances?.[0]?.usd ?? 0).toFixed(2)}
            address={xrpWallet?.address}
            explorerUrl={xrpWallet?.network.explorerUrl}
            chainId={xrpWallet?.network.chainId ?? ""}
          />
        </div>

        <div onClick={() => handleNavigate("/wallet/xmr")} className="cursor-pointer">
          <WalletNetworkCard
            name="Monero"
            symbol="XMR"
            tokenAmount={xmrWallet?.balances?.[0]?.amount ?? "0"}
            usdAmount={(xmrWallet?.balances?.[0]?.usd ?? 0).toFixed(2)}
            address={xmrWallet?.address}
            explorerUrl={xmrWallet?.network.explorerUrl}
            chainId={xmrWallet?.network.chainId ?? ""}
          />
        </div>

        <div onClick={() => handleNavigate("/wallet/doge")} className="cursor-pointer">
          <WalletNetworkCard
            name="Dogecoin"
            symbol="DOGE"
            tokenAmount={dogeWallet?.balances?.[0]?.amount ?? "0"}
            usdAmount={(dogeWallet?.balances?.[0]?.usd ?? 0).toFixed(2)}
            address={dogeWallet?.address}
            explorerUrl={dogeWallet?.network.explorerUrl}
            chainId={dogeWallet?.network.chainId ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
