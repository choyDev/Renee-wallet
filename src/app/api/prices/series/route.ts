import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CacheEntry = { data: any; exp: number };
const mem = new Map<string, CacheEntry>();
const get = (k: string) => (mem.get(k)?.exp || 0) > Date.now() ? mem.get(k)!.data : null;
const put = (k: string, d: any, ttl = 60_000) => mem.set(k, { data: d, exp: Date.now() + ttl });

async function fetchJSON(url: string, retries = 1, timeoutMs = 4500) {
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { accept: "application/json" } });
      clearTimeout(t);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(res => setTimeout(res, 400 * (i + 1)));
    }
  }
  throw new Error("unreachable");
}

const CG = () => process.env.NEXT_PUBLIC_CG_PROXY_URL || "https://api.coingecko.com/api/v3";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asset = (searchParams.get("asset") || "").trim();      // e.g. "solana"
  const days = Math.min(Number(searchParams.get("days") || "1"), 30); // clamp
  const interval = days <= 1 ? "minutely" : "hourly";

  if (!asset) return NextResponse.json({ error: "asset required" }, { status: 400 });

  const key = `series:${asset}:${days}:${interval}`;
  const cached = get(key);
  if (cached) {
    return NextResponse.json(cached, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
  }

  const url = `${CG()}/coins/${encodeURIComponent(asset)}/market_chart?vs_currency=usd&days=${days}&interval=${interval}`;
  try {
    const data = await fetchJSON(url, 1, 4500);
    // keep payload small: just prices array
    const out = { prices: data?.prices || [] };
    put(key, out, 60_000);
    return NextResponse.json(out, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
  } catch {
    // graceful degrade: return empty but 200, so UI can keep old chart
    return NextResponse.json({ prices: [] }, { status: 200 });
  }
}
