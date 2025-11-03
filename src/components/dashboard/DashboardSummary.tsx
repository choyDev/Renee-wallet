/// components/dashboard/DashboardSummary.tsx
"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
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
import { useRouter } from "next/navigation";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

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

      return {
        key,
        title: `${key}-USD`,
        subtitle: label,
        value,
        sub,
        color, // sparkline
        icon,
        path,
      };
    };

    return [
      makeCard("TRX", "Tron", <TronIcon className="text-[#FF060A] size-6" />, "#FF060A", "/wallet/trx"),
      makeCard("SOL", "Solana", <SiSolana className="text-[#14F195] size-6" />, "#14F195", "/wallet/sol"),
      makeCard("ETH", "Ethereum", <SiEthereum className="text-[#627EEA] size-6" />, "#627EEA", "/wallet/eth"),
      makeCard("BTC", "Bitcoin", <SiBitcoin className="text-[#F7931A] size-6" />, "#F7931A", "/wallet/btc"),
      makeCard("XMR", "Monero", <FaMonero className="text-[#FF6600] size-6" />, "#FF6600"),
      makeCard("XRP", "Ripple", <SiRipple className="text-[#006097] size-6" />, "#006097"),
      makeCard("DOGE", "Dogecoin", <SiDogecoin className="text-[#C2A633] size-6" />, "#C2A633"),
      // USDT standalone (no native)
      // {
      //   key: "USDT",
      //   title: "USDT",
      //   subtitle: "Tether",
      //   value: fmtUSD(Number(getWallet("USDT")?.balances?.[0]?.usd ?? 0)),
      //   sub: `${getWallet("USDT")?.balances?.[0]?.amount ?? "0"} USDT`,
      //   color: "#26A17B",
      //   icon: <SiTether className="text-[#26A17B] size-6" />,
      //   path: undefined,
      // },
    ];
  }, [wallets]);

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
    // small timeout helps when parent sizes settle
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
            // Keep sliding in ONE direction, one-by-one, forever
            loop={true}
            autoplay={{
              delay: 1000,                             // 1s interval
              disableOnInteraction: false,              // pause while user drags
              stopOnLastSlide: false,
              waitForTransition: true,
              // pauseOnMouseEnter: false,
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
                    sub={c.sub}                         // supports \n if you added whitespace-pre-line
                    change="+0.00%"
                    changeAbs="+0.00%"
                    color={c.color}                     // per-coin graph color
                    accentColor={CARD_COLOR}            // unified shell accent
                    iconBg={CARD_ICON_BG}
                    icon={c.icon}
                    data={[8, 10, 12, 14, 16, 18, 20]}       // replace with real series if you have them
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