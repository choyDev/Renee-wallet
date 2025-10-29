import { NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// Small helper to build absolute origin for internal fetches (works locally & on Vercel)
function getOrigin(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

type WalletData = {
  id: number;
  address: string;
  network: { name: string; symbol: string; chainId: string; explorerUrl?: string };
  balances: { token: { symbol: string; name: string }; amount: string; usd: number }[];
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const totals = {
    "/wallet/btc": await totalUsd("BTC", userId, req),
    "/wallet/eth": await totalUsd("ETH", userId, req),
    "/wallet/sol": await totalUsd("SOL", userId, req),
    "/wallet/trx": await totalUsd("TRX", userId, req),
    "/wallet/xrp": await totalUsd("XRP", userId, req),
    "/wallet/xmr": await totalUsd("XMR", userId, req),
    "/wallet/doge": await totalUsd("DOGE", userId, req),
  };

  return NextResponse.json(totals, { headers: { "cache-control": "no-store" } });
}

/**
 * Server-side total for one chain:
 *  totalUsd = native_usd + usdt_usd (fallback to usdt_amount if usd missing)
 */
async function totalUsd(sym: string, userId: string, req: Request): Promise<number> {
  try {
    const origin = getOrigin(req);
    // Reuse your existing balances endpoint used by the client
    const res = await fetch(
      `${origin}/api/wallets/balances?userId=${encodeURIComponent(userId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return 0;

    const json = await res.json();
    const wallets: WalletData[] = json?.wallets ?? [];

    const wallet = wallets.find(
      (w) => w?.network?.symbol?.toUpperCase() === sym.toUpperCase()
    );
    if (!wallet) return 0;

    const native = wallet.balances.find(
      (b) => b?.token?.symbol?.toUpperCase() === sym.toUpperCase()
    );
    const usdt = wallet.balances.find(
      (b) => b?.token?.symbol?.toUpperCase() === "USDT"
    );

    const nativeUsd = Number(native?.usd ?? 0);
    // Prefer USDT.usd if your API provides it; otherwise treat amount as USD ~ 1:1
    const usdtUsd = Number(
      (usdt?.usd ?? (usdt?.amount ? parseFloat(usdt.amount) : 0)) || 0
    );

    const total = nativeUsd + usdtUsd;
    return Number.isFinite(total) ? Number(total.toFixed(2)) : 0;
  } catch {
    return 0;
  }
}
