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

        setTronWallet(tron);
        setSolanaWallet(sol);
        setEthWallet(eth);
        setBtcWallet(btc);

        // ⬇️ compute & push per-chain totals immediately
        const entries: Record<string, number> = {};
        for (const w of wallets) {
          const path = PATH_BY_SYMBOL[w.network.symbol?.toUpperCase() ?? ""];
          if (path) entries[path] = totalForWallet(w);
        }
        setWalletBadgesBulk(entries);
        try {
          localStorage.setItem("wallet_badges", JSON.stringify(entries));
        } catch {}
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
    (btcWallet?.balances.reduce((sum, b) => sum + (b.usd || 0), 0) || 0);

  const router = useRouter();
  const handleNavigate = (path: string) => router.push(path);

  return (
    <div>
      <div className="mb-5 mt-2 text-lg font-semibold text-gray-800 dark:text-white/90 flex justify-between items-center px-6">
        <p className="mt-3 font-semibold text-brand-500 dark:text-brand-400">
          Wallet Overview
        </p>
        <div className="rounded-xl p-px bg-gradient-to-r from-brand-500/50 to-cyan-500/40">
          <div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/80 dark:bg-[#0B1220]/80 px-3 py-1.5 tabular-nums">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
              Total Balance
            </span>
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              {usd(totalUsd)}
            </span>
          </div>
        </div>
      </div>

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

        {/* duplicates kept as in your snippet; remove if not needed */}
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
      </div>
    </div>
  );
}
