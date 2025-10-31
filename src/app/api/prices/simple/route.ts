import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CacheEntry = { data: any; exp: number };
const mem = new Map<string, CacheEntry>();

function getCache(key: string) {
  const v = mem.get(key);
  return v && v.exp > Date.now() ? v.data : null;
}
function setCache(key: string, data: any, ttlMs = 20_000) {
  mem.set(key, { data, exp: Date.now() + ttlMs });
}

// small fetch with timeout + retries
async function fetchJSON(url: string, opts: RequestInit = {}, retries = 2, timeoutMs = 4000) {
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal, headers: { accept: "application/json", ...(opts.headers||{}) } });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 300 * (i + 1))); // backoff
    }
  }
  throw new Error("unreachable");
}

function cgBase() {
  // Optional: put your own worker/proxy here to improve latency and set caching headers
  return process.env.NEXT_PUBLIC_CG_PROXY_URL || "https://api.coingecko.com/api/v3";
}

// Fallbacks if CoinGecko stalls (uses USDT or USD pairs)
async function fallbackPrices(ids: string[]) {
  const map: Record<string, string> = {
    bitcoin: "BTCUSDT",
    ethereum: "ETHUSDT",
    solana: "SOLUSDT",
    tron: "TRXUSDT",
  };
  const out: Record<string, { usd: number }> = {};
  // try Binance; if one symbol fails, we just skip it
  await Promise.all(ids.map(async (id) => {
    const sym = map[id];
    if (!sym) return;
    try {
      const j = await fetchJSON(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`, {}, 0, 3000);
      const px = Number(j?.price || 0);
      if (px) out[id] = { usd: px };
    } catch {}
  }));
  // as a last resort hardcode tether ~1
  if (ids.includes("tether")) out["tether"] = { usd: 1 };
  return out;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = (searchParams.get("ids") || "").trim();          // e.g. "bitcoin,ethereum,solana,tron,tether"
  const vs  = (searchParams.get("vs") || "usd").trim();        // e.g. "usd"
  if (!ids) return NextResponse.json({ error: "ids required" }, { status: 400 });

  const key = `simple:${ids}:${vs}`;
  const cached = getCache(key);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, max-age=5, stale-while-revalidate=30" }
    });
  }

  const url = `${cgBase()}/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=${encodeURIComponent(vs)}`;
  try {
    const data = await fetchJSON(url, {}, 1, 3500);
    setCache(key, data, 20_000);
    return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=5, stale-while-revalidate=30" } });
  } catch {
    const list = ids.split(",").map(s => s.trim()).filter(Boolean);
    const fb   = await fallbackPrices(list);
    if (Object.keys(fb).length) {
      setCache(key, fb, 15_000);
      return NextResponse.json(fb, { headers: { "Cache-Control": "public, max-age=5, stale-while-revalidate=30" } });
    }
    return NextResponse.json({ error: "price upstream unavailable" }, { status: 502 });
  }
}
