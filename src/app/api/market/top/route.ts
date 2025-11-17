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
  sparkline7d?: number[];
};

const TTL_MS = 60_000;

// CoinGecko id mapping for your requested coins
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  TRX: "tron",
  XRP: "ripple",
  XMR: "monero",
  DOGE: "dogecoin",
  USDT: "tether",
};

// simple in-memory cache per Vercel/Node process
type CacheShape = { ts: number; data: Row[] };
const g = globalThis as any;
g.__MARKET_TOP_CACHE ??= new Map<string, CacheShape>();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // NEW: exact symbols mode (e.g. TRX,ETH,XMR,SOL,BTC,XRP,DOGE,USDT)
    const symbolsParam = searchParams.get("symbols");

    // Legacy explicit ids mode (CoinGecko ids)
    const idsParam = searchParams.get("ids");

    // Fallback: top N by market cap
    const limitParam = searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitParam || 4) || 4, 1), 10); // 1..10

    const cacheKey = symbolsParam
      ? `symbols:${symbolsParam.toUpperCase()}`
      : idsParam
        ? `ids:${idsParam.toLowerCase()}`
        : `top:${limit}`;

    const now = Date.now();
    const cached: CacheShape | undefined = g.__MARKET_TOP_CACHE.get(cacheKey);
    if (cached && now - cached.ts < TTL_MS) {
      return NextResponse.json({ updatedAt: cached.ts, items: cached.data });
    }

    let url: string;
    let orderSymbols: string[] | null = null; // keep requested order for symbols mode

    if (symbolsParam) {
      // --- Exact symbols mode ---
      const symbols = symbolsParam
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      // remember order to re-order CG results later
      orderSymbols = symbols.slice();

      // map symbols -> CoinGecko ids; ignore unknowns
      const ids = symbols.map((s) => SYMBOL_TO_ID[s]).filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json(
          { updatedAt: now, items: [] },
          { headers: { "cache-control": "public, max-age=15" } }
        );
      }

      url =
        `https://api.coingecko.com/api/v3/coins/markets` +
        `?vs_currency=usd&ids=${encodeURIComponent(ids.join(","))}` +
        `&price_change_percentage=24h,7d&sparkline=true&precision=full`;
    } else if (idsParam) {
      // --- Legacy explicit ids mode ---
      const ids = idsParam
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .join(",");

      url =
        `https://api.coingecko.com/api/v3/coins/markets` +
        `?vs_currency=usd&ids=${encodeURIComponent(ids)}` +
        `&price_change_percentage=24h,7d&sparkline=true&precision=full`;
    } else {
      // --- Top N mode by market cap ---
      url =
        `https://api.coingecko.com/api/v3/coins/markets` +
        `?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1` +
        `&price_change_percentage=24h,7d&sparkline=true&precision=full`;
    }

    const res = await fetch(url, { cache: "no-store", headers: { accept: "application/json" } });
    if (!res.ok) {
      if (cached) {
        return NextResponse.json({ updatedAt: cached.ts, items: cached.data });
      }
      return NextResponse.json({ updatedAt: now, items: [] }, { status: res.status });
    }

    const arr = (await res.json()) as any[];

    // Normalize one row
    const mapRow = (x: any): Row => ({
      id: String(x.id),
      symbol: String(x.symbol || "").toUpperCase(),
      name: String(x.name || ""),
      price: Number(x.current_price ?? 0),
      change24h: Number(
        x.price_change_percentage_24h_in_currency ??
        x.price_change_percentage_24h ??
        0
      ),
      change7d: Number(x.price_change_percentage_7d_in_currency ?? 0),
      marketCap: Number(x.market_cap ?? 0),
      sparkline7d: Array.isArray(x.sparkline_in_7d?.price) ? x.sparkline_in_7d.price : undefined,
    });

    let rows = arr.map(mapRow);

    // If symbols mode, re-order to match the requested symbols sequence
    if (symbolsParam && orderSymbols) {
      // Build a map from CG id or symbol to row for robust reordering
      const byId = new Map<string, Row>(rows.map((r) => [r.id, r]));
      const bySym = new Map<string, Row>(rows.map((r) => [r.symbol, r]));

      rows = orderSymbols
        .map((sym) => {
          const id = SYMBOL_TO_ID[sym];
          return (id && byId.get(id)) || bySym.get(sym) || null;
        })
        .filter((x): x is Row => Boolean(x));
    }

    g.__MARKET_TOP_CACHE.set(cacheKey, { ts: now, data: rows });
    return NextResponse.json({ updatedAt: now, items: rows }, { headers: { "cache-control": "public, max-age=15" } });
  } catch {
    return NextResponse.json({ updatedAt: Date.now(), items: [] }, { status: 200 });
  }
}
