import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  id: string;
  symbol: string;     // e.g., BTC
  name: string;       // e.g., Bitcoin
  price: number;      // USD
  change24h: number;  // %
  change7d: number;   // %
  marketCap: number;  // USD
};

const TTL_MS = 60_000;

// simple in-memory cache per Vercel/Node process
type CacheShape = { ts: number; data: Row[] };
const g = globalThis as any;
g.__MARKET_TOP_CACHE ??= new Map<string, CacheShape>();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");          // optional: keep old behavior
    const limitParam = searchParams.get("limit");      // NEW
    const limit = Math.min(Math.max(Number(limitParam || 4) || 4, 1), 10); // 1..10

    const cacheKey = idsParam
      ? `ids:${idsParam.toLowerCase()}`
      : `top:${limit}`;

    const now = Date.now();
    const cached: CacheShape | undefined = g.__MARKET_TOP_CACHE.get(cacheKey);
    if (cached && now - cached.ts < TTL_MS) {
      return NextResponse.json({ updatedAt: cached.ts, items: cached.data });
    }

    let url: string;
    if (idsParam) {
      // explicit list mode (old behavior)
      const ids = idsParam
        .split(",")
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
        .join(",");
      url =
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&price_change_percentage=24h,7d`;
    } else {
      // NEW: top N by market cap
      url =
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&price_change_percentage=24h,7d`;
    }

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      if (cached) return NextResponse.json({ updatedAt: cached.ts, items: cached.data });
      return NextResponse.json({ updatedAt: now, items: [] }, { status: res.status });
    }

    const arr = (await res.json()) as any[];
    const rows: Row[] = arr.map((x) => ({
      id: String(x.id),
      symbol: String(x.symbol || "").toUpperCase(),
      name: String(x.name || ""),
      price: Number(x.current_price ?? 0),
      change24h: Number(x.price_change_percentage_24h_in_currency ?? x.price_change_percentage_24h ?? 0),
      change7d: Number(x.price_change_percentage_7d_in_currency ?? 0),
      marketCap: Number(x.market_cap ?? 0),
    }));

    g.__MARKET_TOP_CACHE.set(cacheKey, { ts: now, data: rows });
    return NextResponse.json({ updatedAt: now, items: rows });
  } catch {
    return NextResponse.json({ updatedAt: Date.now(), items: [] }, { status: 200 });
  }
}
