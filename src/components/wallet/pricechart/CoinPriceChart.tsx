// "use client";

// import React from "react";
// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";
// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/wallet/pricechart/card";
// import { Button } from "@/components/wallet/pricechart/button";

// // --- Types
// export type RangeKey = "1D" | "7D" | "1M" | "3M" | "6M" | "1Y" | "YTD" | "MAX";
// export type AssetKey = "BTC" | "ETH" | "XMR" | "SOL" | "TRX" | "XRP" | "DOGE";

// type Point = { t: number; date: Date; price: number };

// type Asset = { key: AssetKey; name: string; cgId: string };

// export const ASSETS: Asset[] = [
//   { key: "BTC", name: "Bitcoin", cgId: "bitcoin" },
//   { key: "ETH", name: "Ethereum", cgId: "ethereum" },
//   { key: "XMR", name: "Monero", cgId: "monero" },
//   { key: "SOL", name: "Solana", cgId: "solana" },
//   { key: "TRX", name: "Tron", cgId: "tron" },
//   { key: "XRP", name: "XRP", cgId: "ripple" },
//   { key: "DOGE", name: "Dogecoin", cgId: "dogecoin" },
// ];

// // color classes per asset (light/dark friendly Tailwind colors)
// export const COLOR_CLASS: Record<AssetKey, string> = {
//   TRX: "text-rose-500",
//   SOL: "text-emerald-400",
//   ETH: "text-indigo-300",
//   BTC: "text-amber-500",
//   XMR: "text-[#FF6600]",
//   XRP: "text-[#25A768]",
//   DOGE: "text-[#C2A633]",
// };

// // --- Utilities
// const usd = new Intl.NumberFormat(undefined, {
//   style: "currency",
//   currency: "USD",
//   currencyDisplay: "narrowSymbol",
//   maximumFractionDigits: 2,
// });

// function formatCompactUSD(n: number) {
//   if (n < 1) return usd.format(n);
//   return new Intl.NumberFormat(undefined, {
//     notation: "compact",
//     style: "currency",
//     currency: "USD",
//     currencyDisplay: "narrowSymbol",
//     maximumFractionDigits: 2,
//   }).format(n);
// }

// function formatXAxis(date: Date, range: RangeKey) {
//   const opts: Intl.DateTimeFormatOptions =
//     range === "1D"
//       ? { hour: "2-digit", minute: "2-digit" }
//       : range === "7D" || range === "1M"
//         ? { month: "short", day: "numeric" }
//         : range === "3M" || range === "6M" || range === "1Y" || range === "YTD"
//           ? { month: "short", day: "numeric" }
//           : { year: "numeric", month: "short" };
//   return date.toLocaleString(undefined, opts);
// }

// function rangeToDays(range: RangeKey) {
//   switch (range) {
//     case "1D": return "1";
//     case "7D": return "7";
//     case "1M": return "30";
//     case "3M": return "90";
//     case "6M": return "180";
//     case "1Y": return "365";
//     case "YTD": return "ytd";
//     case "MAX": return "max";
//     default: return "1";
//   }
// }

// // in‑memory cache to reduce API hits and avoid UI errors on fast toggles
// const CACHE = new Map<string, Point[]>();

// function cacheKey(asset: Asset, range: RangeKey) {
//   return `${asset.key}-${range}`;
// }

// function isAbortError(e: unknown) {
//   return (
//     (e as any)?.name === "AbortError" ||
//     (typeof (e as any)?.message === "string" && (e as any).message.toLowerCase().includes("abort"))
//   );
// }

// async function fetchWithRetry(url: string, signal?: AbortSignal, tries = 3): Promise<Response> {
//   let lastErr: any;
//   for (let i = 0; i < tries; i++) {
//     try {
//       const res = await fetch(url, {
//         signal,
//         cache: "no-store",
//         headers: { accept: "application/json" },
//       });
//       if (res.status === 429 || res.status >= 500) {
//         lastErr = new Error(`HTTP ${res.status}`);
//       } else if (!res.ok) {
//         throw new Error(`HTTP ${res.status}`);
//       } else {
//         return res;
//       }
//     } catch (e) {
//       if (isAbortError(e)) throw e; // propagate abort
//       lastErr = e;
//     }
//     // backoff with jitter
//     const base = 300 * Math.pow(2, i);
//     await new Promise((r) => setTimeout(r, base + Math.random() * 200));
//   }
//   throw lastErr ?? new Error("Request failed");
// }

// async function fetchCoinGecko(asset: Asset, range: RangeKey, signal?: AbortSignal): Promise<Point[]> {
//   const days = rangeToDays(range);
//   const url = `/api/prices/series?asset=${asset.cgId}&days=${days}`;
//   const res = await fetchWithRetry(url, signal);
//   if (!res.ok) throw new Error(`series ${res.status}`);
//   const j = await res.json();
//   const prices: [number, number][] = Array.isArray(j.prices) ? j.prices : [];
//   if (!prices.length) throw new Error("series empty");
//   return prices.map(([t, p]) => ({ t, date: new Date(t), price: p }));
// }

// function percentChange(from: number, to: number) {
//   if (!from) return 0;
//   return ((to - from) / from) * 100;
// }

// // ---- Color resolution helpers (fix white cursor/dot in light mode)
// function useResolvedCssColor(cls: string, property: "color" | "backgroundColor" = "color", fallback = "#000") {
//   const [val, setVal] = React.useState(fallback);
//   React.useEffect(() => {
//     const el = document.createElement("span");
//     el.className = cls;
//     el.style.position = "absolute";
//     el.style.pointerEvents = "none";
//     el.style.opacity = "0";
//     document.body.appendChild(el);
//     const style = getComputedStyle(el);
//     const c = property === "color" ? style.color : style.backgroundColor;
//     document.body.removeChild(el);
//     if (c) setVal(c);
//   }, [cls, property]);
//   return val;
// }

// // Custom tooltip
// function PriceTooltip({ active, payload }: any) {
//   if (!active || !payload || !payload.length) return null;
//   const p = payload[0].payload as Point;
//   return (
//     <div className="rounded-xl border bg-background/90 backdrop-blur px-3 py-2 shadow-md">
//       <div className="text-xs text-muted-foreground text-black dark:text-white">{p.date.toLocaleString()}</div>
//       <div className="mt-1 text-sm font-medium text-black dark:text-white">{usd.format(p.price)}</div>
//     </div>
//   );
// }

// export function assetFromKey(k: string): Asset | undefined {
//   return ASSETS.find((a) => a.key === (k?.toUpperCase() as AssetKey));
// }

// // Main, reusable chart component
// export default function CryptoPriceChart({
//   initialAsset,
//   hideAssetTabs = false,
// }: {
//   initialAsset?: AssetKey;
//   hideAssetTabs?: boolean;
// }) {
//   const initial = React.useMemo(() => assetFromKey(initialAsset || "") || ASSETS[0], [initialAsset]);
//   const [asset, setAsset] = React.useState<Asset>(initial);
//   const [range, setRange] = React.useState<RangeKey>("1D");
//   const [data, setData] = React.useState<Point[] | null>(null);
//   const [loading, setLoading] = React.useState(true);
//   const [error, setError] = React.useState<string | null>(null);
//   const [stale, setStale] = React.useState(false);
//   const [hoverPrice, setHoverPrice] = React.useState<number | null>(null);
//   const [hoverTime, setHoverTime] = React.useState<Date | null>(null);

//   const strokeColor = useResolvedCssColor(COLOR_CLASS[asset.key]);

//   React.useEffect(() => {
//     const key = cacheKey(asset, range);
//     const ctrl = new AbortController();

//     // optimistic cache fill
//     const cached = CACHE.get(key);
//     if (cached) {
//       setData(cached);
//       setLoading(false);
//       setStale(false);
//     } else {
//       setLoading(true);
//     }

//     setError(null);

//     const timer = setTimeout(() => {
//       fetchCoinGecko(asset, range, ctrl.signal)
//         .then((d) => {
//           CACHE.set(key, d);
//           setData(d);
//           setStale(false);
//           setError(null);
//           setLoading(false);
//         })
//         .catch((e) => {
//           if (isAbortError(e)) return;
//           // if cache exists, stay quiet and mark stale; otherwise show a friendly error
//           if (cached) {
//             setStale(true);
//             setError(null);
//             setLoading(false);
//           } else {
//             setError("Could not load data. Please try again.");
//             setLoading(false);
//           }
//         });
//     }, 220); // debounce rapid toggles

//     return () => {
//       clearTimeout(timer);
//       ctrl.abort();
//     };
//   }, [asset, range]);

//   const last = data?.[data.length - 1];
//   const first = data?.[0];
//   const price = hoverPrice ?? last?.price ?? 0;
//   const asOf = hoverTime ?? last?.date ?? null;

//   const deltaPct = first && last ? percentChange(first.price, price) : 0;
//   const deltaAbs = first && last ? price - first.price : 0;

//   const colorClass = COLOR_CLASS[asset.key];

//   return (
//     <Card className="w-full">
//       <CardHeader className="pb-2">
//         <div className="flex flex-wrap items-center justify-between gap-3 text-black/80 dark:text-white/80">
//           <div>
//             <CardTitle className="text-xl">{asset.name} price</CardTitle>
//             {/* <CardDescription>
//               {asset.key} · Source: CoinGecko · USD{stale ? " · showing cached" : ""}
//             </CardDescription> */}
//           </div>
//           <div className="flex items-center gap-2">
//             {!hideAssetTabs && (
//               <div className="flex rounded-full bg-muted p-1">
//                 {ASSETS.map((a) => (
//                   <Button
//                     key={a.key}
//                     size="sm"
//                     variant={a.key === asset.key ? "default" : "ghost"}
//                     className={`h-8 rounded-full px-3 text-xs transition-all ${a.key === asset.key
//                       ? "is-selected shadow ring-2 ring-offset-2 ring-offset-background ring-current hover:scale-[1.02] hover:shadow-lg"
//                       : "hover:bg-muted/80"
//                       }`}
//                     onClick={() => setAsset(a)}
//                     aria-pressed={a.key === asset.key}
//                   >
//                     {a.key}
//                   </Button>
//                 ))}
//               </div>
//             )}
//             <div className="flex rounded-full bg-black/10 dark:bg-black p-1">
//               {(["1D", "7D", "1M", "3M", "6M", "1Y", "YTD", "MAX"] as RangeKey[]).map((r) => (
//                 <Button
//                   key={r}
//                   size="sm"
//                   variant={r === range ? "default" : "ghost"}
//                   className={`h-8 rounded-full px-3 text-xs transition-all ${r === range
//                     ? "is-selected shadow bg-brand-300 dark:bg-brand-500 hover:scale-[1.02] hover:shadow-lg"
//                     : "hover:bg-muted/80"
//                     }`}
//                   onClick={() => setRange(r)}
//                   aria-pressed={r === range}
//                 >
//                   {r}
//                 </Button>
//               ))}
//             </div>
//           </div>
//         </div>
//       </CardHeader>

//       <CardContent>
//         {/* Price header */}
//         <div className="flex flex-wrap items-end justify-between gap-3 pb-2">
//           <div className="flex items-end gap-3">
//             <div className="text-3xl font-semibold leading-none tracking-tight">
//               {price ? usd.format(price) : "—"}
//             </div>
//             {asOf && (
//               <div className="pb-1 text-xs text-muted-foreground">
//                 {hoverTime ? "at " : "as of "}
//                 {asOf.toLocaleString()}
//               </div>
//             )}
//           </div>
//           <div className={`text-sm font-medium ${deltaPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
//             {deltaPct >= 0 ? "+" : ""}
//             {deltaPct.toFixed(2)}% ({deltaAbs >= 0 ? "+" : ""}
//             {usd.format(Math.abs(deltaAbs))})
//           </div>
//         </div>

//         {/* Chart area */}
//         <div className="h-[320px] w-full">
//           {error && (
//             <div className="flex h-full items-center justify-center text-sm text-rose-600">
//               {error}
//             </div>
//           )}
//           {loading && !error && <div className="h-full animate-pulse rounded-xl bg-muted/50" />}
//           {!loading && !error && data && (
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart
//                 data={data}
//                 onMouseMove={(state: any) => {
//                   const p = (state?.activePayload?.[0]?.payload) as Point | undefined;
//                   if (p) {
//                     setHoverPrice(p.price);
//                     setHoverTime(p.date);
//                   }
//                 }}
//                 onMouseLeave={() => {
//                   setHoverPrice(null);
//                   setHoverTime(null);
//                 }}
//                 margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
//               >
//                 {/* <CartesianGrid strokeDasharray="3 3" className="stroke-muted" /> */}
//                 <XAxis
//                   dataKey={(d: Point) => d.date}
//                   tickFormatter={(value) => formatXAxis(new Date(value), range)}
//                   minTickGap={32}
//                   axisLine={false}
//                   tickLine={false}
//                 />
//                 <YAxis
//                   width={70}
//                   tickFormatter={(v) => formatCompactUSD(Number(v))}
//                   axisLine={false}
//                   tickLine={false}
//                   domain={["auto", "auto"]}
//                 />
//                 <Tooltip cursor={{ stroke: strokeColor, strokeOpacity: 0.6 }} content={<PriceTooltip />} />
//                 <defs>
//                   <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="0%" stopColor={strokeColor} stopOpacity={0.6} />
//                     <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
//                   </linearGradient>
//                 </defs>

//                 <Area
//                   type="monotone"
//                   dataKey="price"
//                   strokeWidth={2}
//                   stroke={strokeColor}
//                   fill="url(#chartGradient)"
//                   className={colorClass}
//                   activeDot={{ r: 5, className: "fill-black dark:fill-white", stroke: "none" }}
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           )}
//         </div>

//         {/* Footer */}
//         {/* <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
//           <span>
//             Data shown for <span className="font-medium">{range}</span>. Hover to inspect values. Source: CoinGecko.
//           </span>
//           {last && <span>Last updated {last.date.toLocaleTimeString()}.</span>}
//         </div> */}
//       </CardContent>
//     </Card>
//   );
// }

// // Optional: simple page wrapper for Next.js app router
// // Example usage in app/prices/[asset]/page.tsx
// export function CryptoChartPage({ assetKey }: { assetKey: AssetKey }) {
//   return (
//     <div className="max-w-5xl mx-auto p-6">
//       <CryptoPriceChart initialAsset={assetKey} hideAssetTabs />
//     </div>
//   );
// }


"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/wallet/pricechart/card";
import { Button } from "@/components/wallet/pricechart/button";

// --- Types
export type RangeKey = "1D" | "7D" | "1M" | "3M" | "6M" | "1Y" | "YTD" | "MAX";
export type AssetKey = "BTC" | "ETH" | "XMR" | "SOL" | "TRX" | "XRP" | "DOGE";

type Point = { t: number; date: Date; price: number };
type Asset = { key: AssetKey; name: string; cgId: string };

export const ASSETS: Asset[] = [
  { key: "BTC", name: "Bitcoin", cgId: "bitcoin" },
  { key: "ETH", name: "Ethereum", cgId: "ethereum" },
  { key: "XMR", name: "Monero", cgId: "monero" },
  { key: "SOL", name: "Solana", cgId: "solana" },
  { key: "TRX", name: "Tron", cgId: "tron" },
  { key: "XRP", name: "XRP", cgId: "ripple" },
  { key: "DOGE", name: "Dogecoin", cgId: "dogecoin" },
];

export const COLOR_CLASS: Record<AssetKey, string> = {
  TRX: "text-rose-500",
  SOL: "text-emerald-400",
  ETH: "text-indigo-300",
  BTC: "text-amber-500",
  XMR: "text-[#FF6600]",
  XRP: "text-[#25A768]",
  DOGE: "text-[#C2A633]",
};

// --- Utilities
const usd = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 2,
});

function formatCompactUSD(n: number) {
  if (n < 1) return usd.format(n);
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatXAxis(date: Date, range: RangeKey) {
  const opts: Intl.DateTimeFormatOptions =
    range === "1D"
      ? { hour: "2-digit", minute: "2-digit" }
      : range === "7D" || range === "1M"
        ? { month: "short", day: "numeric" }
        : range === "3M" || range === "6M" || range === "1Y" || range === "YTD"
          ? { month: "short", day: "numeric" }
          : { year: "numeric", month: "short" };
  return date.toLocaleString(undefined, opts);
}

function rangeToDays(range: RangeKey) {
  switch (range) {
    case "1D": return "1";
    case "7D": return "7";
    case "1M": return "30";
    case "3M": return "90";
    case "6M": return "180";
    case "1Y": return "365";
    case "YTD": return "ytd";
    case "MAX": return "max";
    default: return "1";
  }
}

const CACHE = new Map<string, Point[]>();

function cacheKey(asset: Asset, range: RangeKey) {
  return `${asset.key}-${range}`;
}

function isAbortError(e: unknown) {
  return (
    (e as any)?.name === "AbortError" ||
    (typeof (e as any)?.message === "string" && (e as any).message.toLowerCase().includes("abort"))
  );
}

async function fetchWithRetry(url: string, signal?: AbortSignal, tries = 3): Promise<Response> {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        signal,
        cache: "no-store",
        headers: { accept: "application/json" },
      });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}`);
      } else if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      } else {
        return res;
      }
    } catch (e) {
      if (isAbortError(e)) throw e;
      lastErr = e;
    }
    const base = 300 * Math.pow(2, i);
    await new Promise((r) => setTimeout(r, base + Math.random() * 200));
  }
  throw lastErr ?? new Error("Request failed");
}

async function fetchCoinGecko(asset: Asset, range: RangeKey, signal?: AbortSignal): Promise<Point[]> {
  const days = rangeToDays(range);
  const url = `/api/prices/series?asset=${asset.cgId}&days=${days}`;
  const res = await fetchWithRetry(url, signal);
  if (!res.ok) throw new Error(`series ${res.status}`);
  const j = await res.json();
  const prices: [number, number][] = Array.isArray(j.prices) ? j.prices : [];
  if (!prices.length) throw new Error("series empty");
  return prices.map(([t, p]) => ({ t, date: new Date(t), price: p }));
}

function percentChange(from: number, to: number) {
  if (!from) return 0;
  return ((to - from) / from) * 100;
}

function useResolvedCssColor(cls: string, property: "color" | "backgroundColor" = "color", fallback = "#000") {
  const [val, setVal] = React.useState(fallback);
  React.useEffect(() => {
    const el = document.createElement("span");
    el.className = cls;
    el.style.position = "absolute";
    el.style.pointerEvents = "none";
    el.style.opacity = "0";
    document.body.appendChild(el);
    const style = getComputedStyle(el);
    const c = property === "color" ? style.color : style.backgroundColor;
    document.body.removeChild(el);
    if (c) setVal(c);
  }, [cls, property]);
  return val;
}

// Custom tooltip - Responsive
function PriceTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload as Point;
  return (
    <div className="rounded-lg sm:rounded-xl border bg-background/90 backdrop-blur 
                    px-2 py-1.5 sm:px-3 sm:py-2 shadow-md">
      <div className="text-[10px] sm:text-xs text-muted-foreground text-black dark:text-white">
        {p.date.toLocaleString()}
      </div>
      <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-black dark:text-white">
        {usd.format(p.price)}
      </div>
    </div>
  );
}

export function assetFromKey(k: string): Asset | undefined {
  return ASSETS.find((a) => a.key === (k?.toUpperCase() as AssetKey));
}

// Main component - FULLY RESPONSIVE
export default function CryptoPriceChart({
  initialAsset,
  hideAssetTabs = false,
}: {
  initialAsset?: AssetKey;
  hideAssetTabs?: boolean;
}) {
  const initial = React.useMemo(() => assetFromKey(initialAsset || "") || ASSETS[0], [initialAsset]);
  const [asset, setAsset] = React.useState<Asset>(initial);
  const [range, setRange] = React.useState<RangeKey>("1D");
  const [data, setData] = React.useState<Point[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stale, setStale] = React.useState(false);
  const [hoverPrice, setHoverPrice] = React.useState<number | null>(null);
  const [hoverTime, setHoverTime] = React.useState<Date | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  const strokeColor = useResolvedCssColor(COLOR_CLASS[asset.key]);

  React.useEffect(() => {
    const newAsset = assetFromKey(initialAsset || "") || ASSETS[0];
    setAsset(newAsset);
  }, [initialAsset]);
  

  // Detect mobile
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    const key = cacheKey(asset, range);
    const ctrl = new AbortController();

    const cached = CACHE.get(key);
    if (cached) {
      setData(cached);
      setLoading(false);
      setStale(false);
    } else {
      setLoading(true);
    }

    setError(null);

    const timer = setTimeout(() => {
      fetchCoinGecko(asset, range, ctrl.signal)
        .then((d) => {
          CACHE.set(key, d);
          setData(d);
          setStale(false);
          setError(null);
          setLoading(false);
        })
        .catch((e) => {
          if (isAbortError(e)) return;
          if (cached) {
            setStale(true);
            setError(null);
            setLoading(false);
          } else {
            setError("Could not load data. Please try again.");
            setLoading(false);
          }
        });
    }, 220);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [asset, range]);

  const last = data?.[data.length - 1];
  const first = data?.[0];
  const price = hoverPrice ?? last?.price ?? 0;
  const asOf = hoverTime ?? last?.date ?? null;

  const deltaPct = first && last ? percentChange(first.price, price) : 0;
  const deltaAbs = first && last ? price - first.price : 0;

  const colorClass = COLOR_CLASS[asset.key];

  return (
    <Card className="w-full">
      {/* HEADER - Fully Responsive */}
      <CardHeader className="pb-2 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6">
        <div className="flex flex-col gap-3 sm:gap-4 text-black/80 dark:text-white/80">
          
          {/* Title */}
          <CardTitle className="text-base sm:text-lg md:text-xl">
            {asset.name} price
          </CardTitle>

          {/* Controls - Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            
            {/* Asset Tabs */}
            {!hideAssetTabs && (
              <div className="w-full sm:w-auto">
                {/* Mobile: Grid */}
                <div className="grid grid-cols-4 sm:hidden gap-1 p-1 rounded-lg bg-muted">
                  {ASSETS.map((a) => (
                    <Button
                      key={a.key}
                      size="sm"
                      variant={a.key === asset.key ? "default" : "ghost"}
                      className={`h-8 rounded-lg px-2 text-xs font-medium transition-all touch-manipulation
                        ${a.key === asset.key
                          ? "shadow ring-2 ring-offset-1 ring-offset-background ring-current"
                          : "hover:bg-muted/80"
                        }`}
                      onClick={() => setAsset(a)}
                    >
                      {a.key}
                    </Button>
                  ))}
                </div>

                {/* Desktop: Row */}
                <div className="hidden sm:flex rounded-full bg-muted p-1">
                  {ASSETS.map((a) => (
                    <Button
                      key={a.key}
                      size="sm"
                      variant={a.key === asset.key ? "default" : "ghost"}
                      className={`h-8 rounded-full px-3 text-xs transition-all
                        ${a.key === asset.key
                          ? "shadow ring-2 ring-offset-2 ring-offset-background ring-current hover:scale-[1.02]"
                          : "hover:bg-muted/80"
                        }`}
                      onClick={() => setAsset(a)}
                    >
                      {a.key}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Range Buttons */}
            <div className="w-full sm:w-auto sm:flex-1 sm:max-w-md">
              {/* Mobile: 4×2 Grid */}
              <div className="grid grid-cols-4 sm:hidden gap-1 p-1 rounded-lg bg-black/10 dark:bg-black">
                {(["1D", "7D", "1M", "3M", "6M", "1Y", "YTD", "MAX"] as RangeKey[]).map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={r === range ? "default" : "ghost"}
                    className={`h-8 rounded-lg px-2 text-[10px] font-medium transition-all touch-manipulation
                      ${r === range ? "shadow bg-brand-300 dark:bg-brand-500" : "hover:bg-muted/80"}`}
                    onClick={() => setRange(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>

              {/* Desktop: Single Row */}
              <div className="hidden sm:flex rounded-full bg-black/10 dark:bg-black p-1 flex-wrap md:flex-nowrap">
                {(["1D", "7D", "1M", "3M", "6M", "1Y", "YTD", "MAX"] as RangeKey[]).map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={r === range ? "default" : "ghost"}
                    className={`h-8 rounded-full px-3 text-xs transition-all
                      ${r === range ? "shadow bg-brand-300 dark:bg-brand-500 hover:scale-[1.02]" : "hover:bg-muted/80"}`}
                    onClick={() => setRange(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-4 md:px-6">
        {/* Price Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 pb-3 sm:pb-4">
          
          {/* Price */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-3">
            <div className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-none tracking-tight tabular-nums dark:text-gray-100">
              {price ? usd.format(price) : "—"}
            </div>
            {asOf && (
              <div className="text-[10px] sm:text-xs text-muted-foreground sm:pb-1 dark:text-gray-100">
                {hoverTime ? "at " : "as of "}
                {asOf.toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>

          {/* Delta */}
          <div className={`text-xs sm:text-sm md:text-base font-medium tabular-nums
            ${deltaPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(2)}%
            <span className="hidden sm:inline">
              {" "}({deltaAbs >= 0 ? "+" : ""}{usd.format(Math.abs(deltaAbs))})
            </span>
          </div>
        </div>

        {/* Chart - Responsive Height */}
        <div className="h-[180px] sm:h-[280px] md:h-[260px] lg:h-[300px] w-full">
          {error && (
            <div className="flex h-full items-center justify-center text-xs sm:text-sm text-rose-600 dark:text-rose-400 px-4 text-center">
              {error}
            </div>
          )}
          
          {loading && !error && (
            <div className="h-full animate-pulse rounded-lg sm:rounded-xl bg-muted/50" />
          )}
          
          {!loading && !error && data && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                onMouseMove={(state: any) => {
                  const p = (state?.activePayload?.[0]?.payload) as Point | undefined;
                  if (p) {
                    setHoverPrice(p.price);
                    setHoverTime(p.date);
                  }
                }}
                onMouseLeave={() => {
                  setHoverPrice(null);
                  setHoverTime(null);
                }}
                margin={{ top: 10, right: isMobile ? 8 : 12, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey={(d: Point) => d.date}
                  tickFormatter={(value) => formatXAxis(new Date(value), range)}
                  minTickGap={isMobile ? 50 : 32}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: isMobile ? 10 : 12, fill: 'currentColor' }}
                  className="text-gray-500 dark:text-gray-400"
                />
                
                <YAxis
                  width={isMobile ? 50 : 70}
                  tickFormatter={(v) => formatCompactUSD(Number(v))}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tick={{ fontSize: isMobile ? 10 : 12, fill: 'currentColor' }}
                  className="text-gray-500 dark:text-gray-400"
                />
                
                <Tooltip 
                  cursor={{ stroke: strokeColor, strokeOpacity: 0.6, strokeWidth: isMobile ? 1 : 2 }} 
                  content={<PriceTooltip />} 
                />
                
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <Area
                  type="monotone"
                  dataKey="price"
                  strokeWidth={isMobile ? 1.5 : 2}
                  stroke={strokeColor}
                  fill="url(#chartGradient)"
                  className={colorClass}
                  activeDot={{ 
                    r: isMobile ? 4 : 5, 
                    className: "fill-black dark:fill-white", 
                    stroke: "none" 
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CryptoChartPage({ assetKey }: { assetKey: AssetKey }) {
  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6">
      <CryptoPriceChart initialAsset={assetKey} hideAssetTabs />
    </div>
  );
}