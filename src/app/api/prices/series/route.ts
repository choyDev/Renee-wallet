import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Series = Array<[number, number]>; // [timestamp_ms, price_usd]

// tiny in-memory cache
const CACHE = new Map<string, { expires: number; data: Series }>();
const TTL_MS = 60_000;

const ASSET_TO_BINANCE: Record<string, string> = {
  bitcoin: "BTCUSDT",
  ethereum: "ETHUSDT",
  solana: "SOLUSDT",
  tron: "TRXUSDT",
  ripple: "XRPUSDT",
  dogecoin: "DOGEUSDT",
  monero: "XMRUSDT",
  tether: "USDTUSDT", // handled specially
};

function cacheKey(asset: string, days: string) { return `${asset}::${days}`; }
function putCache(key: string, data: Series) { CACHE.set(key, { expires: Date.now() + TTL_MS, data }); }
function getCache(key: string): Series | null {
  const hit = CACHE.get(key);
  return hit && hit.expires > Date.now() ? hit.data : null;
}

function normalizeDays(d: string | null) {
  if (!d) return "1";
  const s = d.toLowerCase();
  if (s === "ytd" || s === "max") return s;
  // allow numeric strings too
  if (/^\d+$/.test(s)) return s;
  // fallback to common set
  const allowed = new Set(["1","7","14","30","90","180","365","max"]);
  return allowed.has(s) ? s : "1";
}

function ytdUnixRange(): { fromSec: number; toSec: number } {
  const now = new Date();
  const jan1 = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0));
  return { fromSec: Math.floor(jan1.getTime() / 1000), toSec: Math.floor(Date.now() / 1000) };
}

function chooseBinanceIntervalByDays(nDays: number) {
  if (nDays <= 1)  return { interval: "5m",  limit: 288 };
  if (nDays <= 7)  return { interval: "30m", limit: 336 };
  if (nDays <= 14) return { interval: "1h",  limit: 336 };
  if (nDays <= 30) return { interval: "2h",  limit: 360 };
  if (nDays <= 90) return { interval: "6h",  limit: 360 };
  if (nDays <= 180)return { interval: "12h", limit: 360 };
  // 181–366 (YTD): daily
  return { interval: "1d", limit: Math.min(nDays, 1000) };
}

async function fetchCGSeriesDays(asset: string, days: string, signal?: AbortSignal): Promise<Series> {
  const url = `https://api.coingecko.com/api/v3/coins/${asset}/market_chart?vs_currency=usd&days=${days}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (process.env.CG_API_KEY) headers["x-cg-demo-api-key"] = process.env.CG_API_KEY!;
  const r = await fetch(url, { cache: "no-store", headers, signal });
  const text = await r.text();
  if (!r.ok) throw new Error(`CG ${r.status} ${text.slice(0,120)}`);
  const j = JSON.parse(text);
  const prices: [number, number][] = Array.isArray(j?.prices) ? j.prices : [];
  if (!prices.length) throw new Error("CG empty");
  return prices;
}

async function fetchCGSeriesYTD(asset: string, signal?: AbortSignal): Promise<Series> {
  const { fromSec, toSec } = ytdUnixRange();
  const url = `https://api.coingecko.com/api/v3/coins/${asset}/market_chart/range?vs_currency=usd&from=${fromSec}&to=${toSec}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (process.env.CG_API_KEY) headers["x-cg-demo-api-key"] = process.env.CG_API_KEY!;
  const r = await fetch(url, { cache: "no-store", headers, signal });
  const text = await r.text();
  if (!r.ok) throw new Error(`CG ${r.status} ${text.slice(0,120)}`);
  const j = JSON.parse(text);
  const prices: [number, number][] = Array.isArray(j?.prices) ? j.prices : [];
  if (!prices.length) throw new Error("CG empty");
  return prices;
}

async function fetchBinanceSeriesDays(asset: string, days: string, signal?: AbortSignal): Promise<Series> {
  if (asset === "tether") {
    const now = Date.now(); const out: Series = [];
    for (let i=60;i>=0;i--) out.push([now - i*60_000, 1]);
    return out;
  }
  const symbol = ASSET_TO_BINANCE[asset];
  if (!symbol || symbol === "USDTUSDT") throw new Error("No Binance symbol");
  const base = process.env.BINANCE_API_BASE || "https://api.binance.com";
  const nDays = days === "max" ? 1000 : Math.max(1, parseInt(days, 10) || 1);
  const { interval, limit } = chooseBinanceIntervalByDays(nDays);
  const url = `${base}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const r = await fetch(url, { cache: "no-store", signal, headers: { accept: "application/json" } });
  const text = await r.text();
  if (!r.ok) throw new Error(`Binance ${r.status} ${text.slice(0,120)}`);
  const arr = JSON.parse(text);
  if (!Array.isArray(arr) || !arr.length) throw new Error("Binance empty");
  return arr.map((k: any[]) => [Number(k[0]), parseFloat(k[4])]);
}

async function fetchBinanceSeriesYTD(asset: string, signal?: AbortSignal): Promise<Series> {
  const symbol = ASSET_TO_BINANCE[asset];
  if (!symbol || symbol === "USDTUSDT") throw new Error("No Binance symbol");
  const base = process.env.BINANCE_API_BASE || "https://api.binance.com";
  const { fromSec, toSec } = ytdUnixRange();
  const nDays = Math.max(1, Math.ceil((toSec - fromSec) / 86400));
  const { interval, limit } = chooseBinanceIntervalByDays(nDays);
  // Binance supports startTime / endTime (ms), but limit caps results;
  // YTD < 366 so 1d + limit=nDays is fine.
  const url = `${base}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const r = await fetch(url, { cache: "no-store", signal, headers: { accept: "application/json" } });
  const text = await r.text();
  if (!r.ok) throw new Error(`Binance ${r.status} ${text.slice(0,120)}`);
  const arr = JSON.parse(text);
  if (!Array.isArray(arr) || !arr.length) throw new Error("Binance empty");
  return arr.map((k: any[]) => [Number(k[0]), parseFloat(k[4])]);
}

function synthesizeFromLast(last: Series | null): Series {
  const now = Date.now();
  const base = last && last.length ? last[last.length - 1][1] : 1;
  const out: Series = [];
  for (let i = 60; i >= 0; i--) out.push([now - i * 60_000, base]);
  return out;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asset = (searchParams.get("asset") || "bitcoin").toLowerCase().trim();
  const days  = normalizeDays(searchParams.get("days"));

  const key = cacheKey(asset, days);
  const cached = getCache(key);
  if (cached) {
    return NextResponse.json({ prices: cached }, {
      headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=60" },
    });
  }

  let series: Series | null = null;
  try {
    if (days === "ytd") {
      // precise YTD range
      try {
        series = await fetchCGSeriesYTD(asset);
      } catch {
        series = await fetchBinanceSeriesYTD(asset);
      }
    } else {
      // normal days route
      try {
        series = await fetchCGSeriesDays(asset, days);
      } catch {
        series = await fetchBinanceSeriesDays(asset, days);
      }
    }
  } catch {
    const stale = CACHE.get(key)?.data ?? null;
    series = synthesizeFromLast(stale);
  }

  putCache(key, series!);
  return NextResponse.json(
    { prices: series },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } }
  );
}
