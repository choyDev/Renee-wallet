import { NextResponse } from "next/server";

export const revalidate = 30;          // revalidate server cache every 30s
export const dynamic = "force-dynamic";

type CGItem = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  sparkline_in_7d?: { price: number[] };
};

const IDS_BY_SYMBOL: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  TRX: "tron",
  XRP: "ripple",
  XMR: "monero",
  DOGE: "dogecoin",
};

export async function GET() {
  const ids = Object.values(IDS_BY_SYMBOL).join(",");
  const url =
    `https://api.coingecko.com/api/v3/coins/markets` +
    `?vs_currency=usd&ids=${ids}` +
    `&sparkline=true&price_change_percentage=1h,24h,7d&precision=full`;

  try {
    const res = await fetch(url, {
      // small cache to be nice to CG, but still fresh
      next: { revalidate: 30 },
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      // If rate-limited or error, return empty payload but 200
      return NextResponse.json({ items: [] }, { headers: { "cache-control": "public, max-age=15" } });
    }

    const data = (await res.json()) as CGItem[];

    // map back to our symbols
    const symbolById = Object.fromEntries(Object.entries(IDS_BY_SYMBOL).map(([sym, id]) => [id, sym]));
    const items = data.map((d) => ({
      symbol: symbolById[d.id] ?? d.symbol?.toUpperCase(),
      price: Number(d.current_price ?? 0),
      changeAbs24h: Number(d.price_change_24h ?? 0),
      changePct24h: Number(d.price_change_percentage_24h ?? 0),
      sparkline7d: d.sparkline_in_7d?.price ?? [],
    }));

    return NextResponse.json({ items }, { headers: { "cache-control": "public, max-age=15" } });
  } catch {
    return NextResponse.json({ items: [] }, { headers: { "cache-control": "public, max-age=15" } });
  }
}
