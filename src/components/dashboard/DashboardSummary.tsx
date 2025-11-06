/// components/dashboard/DashboardSummary.tsx
"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import CryptoCard from "./CryptoCard";
import {
  SiSolana,
  SiTether,
  SiEthereum,
  SiBitcoin,
  SiXrp,
  SiDogecoin,
} from "react-icons/si";
import { FaMonero } from "react-icons/fa";
import { useRouter } from "next/navigation";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css"; // ← ensure Swiper base styles are loaded

const CARD_COLOR = "#3B82F6";        // shared hairline for card shells
const CARD_ICON_BG = "bg-[#EEF2FF]"; // shared light chip background

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

/** ------- NEW: market data for change %, change $ and sparkline ------- */
type MarketRow = { pct: number; abs: number; spark: number[] };
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  TRX: "tron",
  XRP: "ripple",
  XMR: "monero",
  DOGE: "dogecoin",
};

export default function DashboardSummary() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const router = useRouter();

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
  const getNative = (symbol: string) => {
    const w = getWallet(symbol);
    const b = w?.balances?.[0];
    return { amount: b?.amount ?? "0", usd: Number(b?.usd ?? 0) };
  };
  const getUsdtOnChain = (symbol: string) => {
    const w = getWallet(symbol);
    const b = w?.balances?.find((x) => x.token.symbol === "USDT");
    return { amount: b?.amount ?? "0", usd: Number(b?.usd ?? 0) };
  };
  const fmtUSD = (n: number) => `$${n.toFixed(2)}`;
  const fmtAbsUSD = (n: number) => `${n >= 0 ? "+" : "-"}$${Math.abs(n).toFixed(2)}`;

  /** ------- NEW: fetch market data (CoinGecko) for change%/abs and sparkline ------- */
  const [market, setMarket] = useState<Record<string, MarketRow>>({});

  useEffect(() => {
    let abort = new AbortController();

    async function loadMarket() {
      try {
        const ids = Object.values(SYMBOL_TO_ID).join(",");
        const url =
          `https://api.coingecko.com/api/v3/coins/markets` +
          `?vs_currency=usd&ids=${ids}` +
          `&sparkline=true&price_change_percentage=24h&precision=full`;
        const res = await fetch(url, { signal: abort.signal, cache: "no-store" });
        if (!res.ok) return;

        const json = await res.json();
        // json[i]: { id, current_price, price_change_24h, price_change_percentage_24h, sparkline_in_7d: { price: [] } }
        const symById = Object.fromEntries(Object.entries(SYMBOL_TO_ID).map(([sym, id]) => [id, sym]));
        const next: Record<string, MarketRow> = {};
        for (const row of json as any[]) {
          const sym = symById[row.id];
          if (!sym) continue;
          next[sym] = {
            pct: Number(row.price_change_percentage_24h ?? 0),
            abs: Number(row.price_change_24h ?? 0),
            spark: Array.isArray(row.sparkline_in_7d?.price) ? row.sparkline_in_7d.price : [],
          };
        }
        setMarket(next);
      } catch (e) {
        // ignore transient errors/rate limits
      }
    }

    loadMarket();
    const t = window.setInterval(loadMarket, 45_000); // refresh every 45s

    return () => {
      abort.abort();
      window.clearInterval(t);
    };
  }, []);

  // Build all cards (values + sub with USDT line where present)
  const cards = useMemo(() => {
    const makeCard = (
      key: string,
      label: string,
      icon: React.ReactNode,
      color: string,
      path?: string
    ) => {
      // native+USDT combined USD for native L1s, otherwise just native
      const native = getNative(key);
      const usdt = getUsdtOnChain(key);
      const combinedUsd = native.usd + usdt.usd;
      const value = fmtUSD(isNaN(combinedUsd) ? 0 : combinedUsd);
      const sub =
        Number(usdt.amount) > 0 ? `${native.amount} ${key}\n${usdt.amount} USDT` : `${native.amount} ${key}`;

      // ------- NEW: real change%, change$, and sparkline data -------
      const m = market[key];
      const changePct = m?.pct ?? 0;
      const changeAbs = m?.abs ?? 0;
      const series = m?.spark && m.spark.length ? m.spark : [0, 0, 0, 0, 0, 0, 0];

      return {
        key,
        title: `${key}-USD`,
        subtitle: label,
        value,
        sub,
        color, // sparkline color
        icon,
        path,
        // only these three fields changed to real market data:
        change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
        changeAbs: fmtAbsUSD(changeAbs),
        data: series,
      };
    };

    return [
      makeCard("TRX", "Tron", <TronIcon className="text-[#FF060A] size-6" />, "#FF060A", "/wallet/trx"),
      makeCard("SOL", "Solana", <SiSolana className="text-[#14F195] size-6" />, "#14F195", "/wallet/sol"),
      makeCard("ETH", "Ethereum", <SiEthereum className="text-[#627EEA] size-6" />, "#627EEA", "/wallet/eth"),
      makeCard("BTC", "Bitcoin", <SiBitcoin className="text-[#F7931A] size-6" />, "#F7931A", "/wallet/btc"),
      makeCard("XMR", "Monero", <FaMonero className="text-[#FF6600] size-6" />, "#FF6600"),
      makeCard("XRP", "XRP", <SiXrp className="text-[#25A768] size-6" />, "#25A768"),
      makeCard("DOGE", "Dogecoin", <SiDogecoin className="text-[#C2A633] size-6" />, "#C2A633"),
      // USDT standalone (no native) — still commented as in your code
    ];
  }, [wallets, market]); // ← include market so cards update when new data arrives

  const swiperRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  // Mount-only render to avoid SSR mismatch / FOUC
  useEffect(() => {
    setMounted(true);
  }, []);

  // After mount or when card count changes, force an update and restart autoplay
  useEffect(() => {
    if (!mounted) return;
    const sw = swiperRef.current;
    const t = setTimeout(() => {
      sw?.update?.();
      sw?.autoplay?.start?.();
    }, 0);
    return () => clearTimeout(t);
  }, [mounted, cards.length]);

  return (
    <div className="col-span-12">
      {/* prevent flash by hiding until mounted */}
      <div className={mounted ? "opacity-100 transition-opacity" : "opacity-0"}>
        {mounted && (
          <Swiper
            modules={[Autoplay]}
            onSwiper={(sw) => (swiperRef.current = sw)}
            // --- Core behavior ---
            slidesPerView={4}
            slidesPerGroup={1}
            spaceBetween={24}
            speed={500}
            loop={true}
            autoplay={{
              delay: 1000,
              disableOnInteraction: false,
              stopOnLastSlide: false,
              waitForTransition: true,
            }}
            // --- Drag / touch feel ---
            allowTouchMove
            simulateTouch
            grabCursor
            resistanceRatio={0.75}
            threshold={6}
            // --- Stability ---
            observer
            observeParents
            updateOnWindowResize
            // Resume autoplay after drag ends
            onAutoplayStop={() => swiperRef.current?.autoplay?.start()}
            className="w-full"
          >
            {cards.map((c) => (
              <SwiperSlide key={`card-${c.key}`} className="!h-auto">
                <div
                  className={c.path ? "cursor-pointer h-full" : "h-full"}
                  onClick={() => c.path && router.push(c.path!)}
                >
                  <CryptoCard
                    title={c.title}
                    subtitle={c.subtitle}
                    value={c.value}
                    sub={c.sub}
                    change={c.change}         
                    changeAbs={c.changeAbs}  
                    color={c.color}         
                    accentColor={CARD_COLOR}
                    iconBg={CARD_ICON_BG}
                    icon={c.icon}
                    data={c.data}         
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </div>
  );
}
