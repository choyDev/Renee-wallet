
// "use client";

// import React, { useEffect, useRef, useMemo, useState } from "react";
// import CryptoCard from "./CryptoCard";
// import {
//   SiSolana,
//   SiEthereum,
//   SiBitcoin,
//   SiXrp,
//   SiDogecoin,
// } from "react-icons/si";
// import { FaMonero } from "react-icons/fa";
// import { useRouter } from "next/navigation";
// import { Swiper, SwiperSlide } from "swiper/react";
// import { Autoplay } from "swiper/modules";
// import "swiper/css";

// const CARD_COLOR = "#3B82F6";
// const CARD_ICON_BG = "bg-[#EEF2FF]";

// const TronIcon = ({ className = "text-[#FF4747] w-4 h-4" }) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     fill="currentColor"
//     viewBox="0 0 24 24"
//     className={className}
//   >
//     <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
//   </svg>
// );

// interface WalletData {
//   id: number;
//   address: string;
//   network: { name: string; symbol: string };
//   balances: {
//     token: { symbol: string; name: string };
//     amount: string;
//     usd: number;
//   }[];
// }

// type MarketRow = { pct: number; abs: number; spark: number[] };

// const SYMBOL_TO_ID: Record<string, string> = {
//   BTC: "bitcoin",
//   ETH: "ethereum",
//   SOL: "solana",
//   TRX: "tron",
//   XRP: "ripple",
//   XMR: "monero",
//   DOGE: "dogecoin",
// };

// export default function DashboardSummary() {
//   const [wallets, setWallets] = useState<WalletData[]>([]);
//   const [market, setMarket] = useState<Record<string, MarketRow>>({});
//   const [loading, setLoading] = useState(true); // 🌟 NEW
//   const [mounted, setMounted] = useState(false);

//   const router = useRouter();

//   // ----------------------------------------------------
//   // LOAD WALLETS
//   // ----------------------------------------------------
//   useEffect(() => {
//     const fetchWallets = async () => {
//       try {
//         setLoading(true); // start skeleton

//         const storedUser = localStorage.getItem("user");
//         const userId = storedUser ? JSON.parse(storedUser).id : null;
//         if (!userId) return;

//         const res = await fetch(`/api/wallets/balances?userId=${userId}`, {
//           cache: "no-store",
//         });

//         const text = await res.text();
//         const data = text ? JSON.parse(text) : {};

//         if (!res.ok)
//           throw new Error(data?.error || `Request failed: ${res.status}`);

//         setWallets(data.wallets || []);
//       } catch (err) {
//         console.error("Error loading wallet balances:", err);
//       } finally {
//         setLoading(false); // stop skeleton
//       }
//     };

//     fetchWallets();
//   }, []);

//   // ----------------------------------------------------
//   // LOAD MARKET PRICES
//   // ----------------------------------------------------
//   useEffect(() => {
//     let abort = new AbortController();

//     async function loadMarket() {
//       try {
//         const ids = Object.values(SYMBOL_TO_ID).join(",");
//         const url =
//           `https://api.coingecko.com/api/v3/coins/markets` +
//           `?vs_currency=usd&ids=${ids}` +
//           `&sparkline=true&price_change_percentage=24h&precision=full`;

//         const res = await fetch(url, {
//           signal: abort.signal,
//           cache: "no-store",
//         });
//         if (!res.ok) return;

//         const json = await res.json();

//         const symById = Object.fromEntries(
//           Object.entries(SYMBOL_TO_ID).map(([sym, id]) => [id, sym])
//         );

//         const next: Record<string, MarketRow> = {};

//         for (const row of json) {
//           const sym = symById[row.id];
//           if (!sym) continue;

//           next[sym] = {
//             pct: Number(row.price_change_percentage_24h ?? 0),
//             abs: Number(row.price_change_24h ?? 0),
//             spark: Array.isArray(row.sparkline_in_7d?.price)
//               ? row.sparkline_in_7d.price
//               : [],
//           };
//         }

//         setMarket(next);
//       } catch (e) {
//         // ignore
//       }
//     }

//     loadMarket();
//     const t = setInterval(loadMarket, 45000);

//     return () => {
//       abort.abort();
//       clearInterval(t);
//     };
//   }, []);

//   // ----------------------------------------------------
//   // CARD BUILDING
//   // ----------------------------------------------------
//   const getWallet = (symbol: string) =>
//     wallets.find((w) => w.network.symbol === symbol);

//   const getNative = (symbol: string) => {
//     const w = getWallet(symbol);
//     const b = w?.balances?.[0];
//     return { amount: b?.amount ?? "0", usd: Number(b?.usd ?? 0) };
//   };

//   const getUsdt = (symbol: string) => {
//     const w = getWallet(symbol);
//     const b = w?.balances?.find((x) => x.token.symbol === "USDT");
//     return { amount: b?.amount ?? "0", usd: Number(b?.usd ?? 0) };
//   };

//   const fmtUSD = (n: number) => `$${n.toFixed(2)}`;
//   const fmtAbsUSD = (n: number) =>
//     `${n >= 0 ? "+" : "-"}$${Math.abs(n).toFixed(2)}`;

//   const cards = useMemo(() => {
//     const make = (
//       key: string,
//       label: string,
//       icon: React.ReactNode,
//       color: string,
//       path?: string
//     ) => {
//       const native = getNative(key);
//       const usdt = getUsdt(key);
//       const totalUsd = native.usd + usdt.usd;

//       const m = market[key];
//       const pct = m?.pct ?? 0;
//       const abs = m?.abs ?? 0;
//       const spark = m?.spark && m.spark.length ? m.spark : [0, 0, 0, 0, 0];

//       return {
//         key,
//         title: `${key}-USD`,
//         subtitle: label,
//         value: fmtUSD(totalUsd),
//         sub:
//           Number(usdt.amount) > 0
//             ? `${native.amount} ${key}\n${usdt.amount} USDT`
//             : `${native.amount} ${key}`,
//         color,
//         icon,
//         path,
//         change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
//         changeAbs: fmtAbsUSD(abs),
//         data: spark,
//         iconBg: CARD_ICON_BG,
//         accentColor: CARD_COLOR,
//       };
//     };

//     return [
//       make("TRX", "Tron", <TronIcon />, "#FF060A", "/wallet/trx"),
//       make("SOL", "Solana", <SiSolana className="text-[#14F195] size-6" />, "#14F195", "/wallet/sol"),
//       make("ETH", "Ethereum", <SiEthereum className="text-[#627EEA] size-6" />, "#627EEA", "/wallet/eth"),
//       make("BTC", "Bitcoin", <SiBitcoin className="text-[#F7931A] size-6" />, "#F7931A", "/wallet/btc"),
//       make("XMR", "Monero", <FaMonero className="text-[#FF6600] size-6" />, "#FF6600"),
//       make("XRP", "XRP", <SiXrp className="text-[#0A74E6] size-6" />, "#0A74E6"),
//       make("DOGE", "Dogecoin", <SiDogecoin className="text-[#C2A633] size-6" />, "#C2A633"),
//     ];
//   }, [wallets, market]);

//   // ----------------------------------------------------
//   // SWIPER INIT
//   // ----------------------------------------------------
//   const swiperRef = useRef<any>(null);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     if (!mounted) return;
//     swiperRef.current?.update?.();
//     swiperRef.current?.autoplay?.start?.();
//   }, [mounted, cards.length]);

//   // ----------------------------------------------------
//   // RENDER
//   // ----------------------------------------------------
//   return (
//     <div className="col-span-12">
//       <div className={mounted ? "opacity-100 transition-opacity" : "opacity-0"}>
//         {mounted && (
//           <Swiper
//             modules={[Autoplay]}
//             onSwiper={(sw) => (swiperRef.current = sw)}
//             loop
//             speed={500}
//             autoplay={{ delay: 2000, disableOnInteraction: false }}
//             spaceBetween={16}
//             observer
//             observeParents
//             grabCursor
//             allowTouchMove
//             simulateTouch
//             breakpoints={{
//               320: { slidesPerView: 1.2, spaceBetween: 12 },
//               480: { slidesPerView: 2, spaceBetween: 14 },
//               640: { slidesPerView: 2.5, spaceBetween: 16 },
//               768: { slidesPerView: 3, spaceBetween: 18 },
//               1024: { slidesPerView: 4, spaceBetween: 24 },
//             }}
//             className="w-full"
//           >
//             {/* ----------------------------------------------------
//                 SHOW SKELETON CARDS WHILE LOADING
//                ---------------------------------------------------- */}
//             {loading
//               ? Array.from({ length: 7 }).map((_, i) => (
//                   <SwiperSlide key={`skeleton-${i}`}>
//                     <CryptoCard loading={true} />
//                   </SwiperSlide>
//                 ))
//               : // ----------------------------------------------------
//                 // SHOW REAL CARDS
//                 // ----------------------------------------------------
//                 cards.map((c) => {
//                   // ⬅ Remove key from props before spreading
//                   const { key, ...rest } = c;
                
//                   return (
//                     <SwiperSlide key={`card-${key}`}>
//                       <div
//                         className={c.path ? "cursor-pointer h-full" : "h-full"}
//                         onClick={() => c.path && router.push(c.path!)}
//                       >
//                         <CryptoCard {...rest} />   {/* ⬅ No `key` inside props now */}
//                       </div>
//                     </SwiperSlide>
//                   );
//                 })                
//               }
//           </Swiper>
//         )}
//       </div>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import CryptoCard from "./CryptoCard";
import {
  SiSolana,
  SiEthereum,
  SiBitcoin,
  SiXrp,
  SiDogecoin,
} from "react-icons/si";
import { FaMonero } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const CARD_COLOR = "#3B82F6";
const CARD_ICON_BG = "bg-[#EEF2FF]";

const TronIcon = ({ className = "text-[#FF4747] w-4 h-4" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

interface WalletData {
  id: number;
  address: string;
  network: { name: string; symbol: string };
  balances: {
    token: { symbol: string; name: string };
    amount: string;
    usd: number;
  }[];
}

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
  const [market, setMarket] = useState<Record<string, MarketRow>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  /* -----------------------------------------------------
        LOAD WALLETS
  ------------------------------------------------------ */
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setLoading(true);

        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return;

        const res = await fetch(`/api/wallets/balances?userId=${userId}`, {
          cache: "no-store",
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (!res.ok) throw new Error(data?.error || "Request failed");

        setWallets(data.wallets || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWallets();
  }, []);

  /* -----------------------------------------------------
        LOAD MARKET PRICES
  ------------------------------------------------------ */
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

        const idToSym = Object.fromEntries(
          Object.entries(SYMBOL_TO_ID).map(([sym, id]) => [id, sym])
        );

        const next: Record<string, MarketRow> = {};

        for (const row of json) {
          const sym = idToSym[row.id];
          if (!sym) continue;

          next[sym] = {
            pct: Number(row.price_change_percentage_24h ?? 0),
            abs: Number(row.price_change_24h ?? 0),
            spark: Array.isArray(row.sparkline_in_7d?.price)
              ? row.sparkline_in_7d.price
              : [0, 0, 0, 0, 0],
          };
        }

        setMarket(next);
      } catch (_) {}
    }

    loadMarket();
    const t = setInterval(loadMarket, 45000);

    return () => {
      clearInterval(t);
      abort.abort();
    };
  }, []);

  /* -----------------------------------------------------
        BUILD CARDS
  ------------------------------------------------------ */
  const getWallet = (symbol: string) =>
    wallets.find((w) => w.network.symbol === symbol);

  const getNative = (symbol: string) => {
    const w = getWallet(symbol);
    const b = w?.balances?.[0];
    return { amount: b?.amount ?? "0", usd: Number(b?.usd ?? 0) };
  };

  const getUSDT = (symbol: string) => {
    const w = getWallet(symbol);
    const b = w?.balances?.find((x) => x.token.symbol === "USDT");
    return { amount: b?.amount ?? "0", usd: Number(b?.usd ?? 0) };
  };

  const fmtUSD = (n: number) => `$${n.toFixed(2)}`;
  const fmtAbsUSD = (n: number) =>
    `${n >= 0 ? "+" : "-"}$${Math.abs(n).toFixed(2)}`;

  const cards = useMemo(() => {
    const create = (
      key: string,
      label: string,
      icon: React.ReactNode,
      color: string,
      path?: string
    ) => {
      const native = getNative(key);
      const usdt = getUSDT(key);
      const total = native.usd + usdt.usd;

      const m = market[key];
      const pct = m?.pct ?? 0;
      const abs = m?.abs ?? 0;

      return {
        key,
        title: `${key}-USD`,
        subtitle: label,
        value: fmtUSD(total),
        sub:
          Number(usdt.amount) > 0
            ? `${native.amount} ${key}\n${usdt.amount} USDT`
            : `${native.amount} ${key}`,
        color,
        icon,
        path,
        change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        changeAbs: fmtAbsUSD(abs),
        data: m?.spark ?? [0, 0, 0, 0],
        iconBg: CARD_ICON_BG,
        accentColor: CARD_COLOR,
      };
    };

    return [
      create("TRX", "Tron", <TronIcon />, "#FF060A", "/wallet/trx"),
      create("SOL", "Solana", <SiSolana className="text-[#14F195] size-6" />, "#14F195", "/wallet/sol"),
      create("ETH", "Ethereum", <SiEthereum className="text-[#627EEA] size-6" />, "#627EEA", "/wallet/eth"),
      create("BTC", "Bitcoin", <SiBitcoin className="text-[#F7931A] size-6" />, "#F7931A", "/wallet/btc"),
      create("XMR", "Monero", <FaMonero className="text-[#FF6600] size-6" />, "#FF6600"),
      create("XRP", "XRP", <SiXrp className="text-[#0A74E6] size-6" />, "#0A74E6"),
      create("DOGE", "Dogecoin", <SiDogecoin className="text-[#C2A633] size-6" />, "#C2A633"),
    ];
  }, [wallets, market]);

  /* -----------------------------------------------------
        SWIPER RESPONSIVE INIT
  ------------------------------------------------------ */
  const swiperRef = useRef<any>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    swiperRef.current?.update?.();
    swiperRef.current?.autoplay?.start?.();
  }, [mounted, cards.length]);

  /* -----------------------------------------------------
        RENDER
  ------------------------------------------------------ */
  return (
    <div className="w-full">
      <Swiper
        modules={[Autoplay]}
        onSwiper={(sw) => (swiperRef.current = sw)}
        loop
        speed={600}
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        spaceBetween={12}
        className="w-full"
        breakpoints={{
          320: { slidesPerView: 1.1, spaceBetween: 12 },
          390: { slidesPerView: 1.3 },
          480: { slidesPerView: 1.7, spaceBetween: 14 },
          640: { slidesPerView: 2.3, spaceBetween: 16 },
          768: { slidesPerView: 2.8, spaceBetween: 18 },
          1024: { slidesPerView: 3.6, spaceBetween: 20 },
          1440: { slidesPerView: 4.2, spaceBetween: 24 },
        }}
      >
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <SwiperSlide key={`sk-${i}`} className="!h-auto">
                <CryptoCard loading />
              </SwiperSlide>
            ))
          : cards.map((c) => {
              const { key, ...rest } = c;
              return (
                <SwiperSlide key={`card-${key}`} className="!h-auto">
                  <div
                    className="h-full cursor-pointer"
                    onClick={() => c.path && router.push(c.path)}
                  >
                    <CryptoCard {...rest} />
                  </div>
                </SwiperSlide>
              );
            })}
      </Swiper>
    </div>
  );
}
