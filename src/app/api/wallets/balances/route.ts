// app/api/wallets/balances/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ethers } from "ethers";

// Force Node runtime (TronWeb needs Node APIs), and don't cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// tiny helper: live prices only in prod (avoid rate limits in dev)
async function getUsdPrices(symbols: ("SOL"|"TRX"|"ETH"|"BTC")[]) {
  const idMap: Record<string,string> = { SOL:"solana", TRX:"tron", ETH:"ethereum", BTC:"bitcoin" };
  const ids = [...new Set(symbols.map(s => idMap[s]).filter(Boolean))].join(",");
  if (!ids) return { SOL:0, TRX:0, ETH:0, BTC:0 };
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { cache: "no-store" }
    );
    const j = await res.json();
    return {
      SOL: j.solana?.usd ?? 0,
      TRX: j.tron?.usd ?? 0,
      ETH: j.ethereum?.usd ?? 0,
      BTC: j.bitcoin?.usd ?? 0,
    };
  } catch {
    return { SOL:0, TRX:0, ETH:0, BTC:0 };
  }
}

async function getSolBalance(rpcUrl: string, address: string) {
  const conn = new Connection(rpcUrl, "confirmed");
  const lamports = await conn.getBalance(new PublicKey(address));
  return lamports / LAMPORTS_PER_SOL; // SOL
}

async function getTrxBalance(rpcUrl: string, address: string) {
  // dynamic import so it never runs on Edge
  const mod: any = await import("tronweb");
  const TronWeb = mod.default || mod;
  const tronWeb = new TronWeb({
    fullHost: rpcUrl,
    headers: process.env.TRONGRID_API_KEY
      ? { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY }
      : undefined,
  });
  const sun = await tronWeb.trx.getBalance(address);
  return sun / 1_000_000; // TRX
}

async function getEthBalance(address: string) {
  const rpc = process.env.CHAIN_ENV === "testnet" ? process.env.ETH_RPC_TESTNET! : process.env.ETH_RPC_MAINNET!;
  const provider = new ethers.JsonRpcProvider(rpc);
  const wei = await provider.getBalance(address);
  return Number(ethers.formatEther(wei)); // ETH
}

async function getBtcBalance(address: string) {
  const base = process.env.CHAIN_ENV === "testnet" ? process.env.BTC_API_TESTNET! : process.env.BTC_API_MAINNET!;
  const r = await fetch(`${base}/address/${address}`, { cache: "no-store" });
  if (!r.ok) return 0;
  const j = await r.json();
  const cs = j?.chain_stats || {};
  const confirmed = (cs.funded_txo_sum ?? 0) - (cs.spent_txo_sum ?? 0); // sats
  return confirmed / 1e8; // BTC
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get("userId"));
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const wallets = await prisma.wallet.findMany({
      where: { userId },
      include: { network: true },
    });

    // If no wallets, still return JSON (avoid empty body)
    if (!wallets.length) {
      return NextResponse.json({ wallets: [] }, { status: 200 });
    }

    const symbols = Array.from(new Set(wallets.map(w => w.network.symbol as "SOL"|"TRX"|"ETH"|"BTC")));
    const prices = await getUsdPrices(symbols, /* live flag not needed here since you already have USE_LIVE_PRICES=true */);

    const enriched = await Promise.all(
      wallets.map(async (w) => {
        let native = 0;
        try {
          if (w.network.symbol === "SOL") {
            native = await getSolBalance(w.network.rpcUrl, w.address);        // your existing
          } else if (w.network.symbol === "TRX") {
            native = await getTrxBalance(w.network.rpcUrl, w.address);        // your existing (REST)
          } else if (w.network.symbol === "ETH") {
            native = await getEthBalance(w.address);
          } else if (w.network.symbol === "BTC") {
            native = await getBtcBalance(w.address);
          }
        } catch (e) {
          console.error("Balance fetch error", {
            network: w.network.name,
            address: w.address,
            err: (e as any)?.message,
          });
        }

        const usdPrice =
          prices[(w.network.symbol as "SOL" | "TRX") ?? "SOL"] ?? 0;
        const usd = Number((usdPrice * native).toFixed(2));

        return {
          id: w.id,
          address: w.address,
          network: {
            name: w.network.name,
            symbol: w.network.symbol,
            explorerUrl: (w as any).network?.explorerUrl ?? null,
          },
          balances: [
            {
              token: {
                symbol: w.network.symbol,
                name: w.network.symbol === "SOL" ? "Solana" : "Tron",
              },
              amount: native.toString(),
              usd,
            },
          ],
        };
      })
    );

    return NextResponse.json({ wallets: enriched }, { status: 200 });
  } catch (e: any) {
    // In dev, it's helpful to return the message so the client can log it
    const msg =
      process.env.NODE_ENV !== "production"
        ? e?.message || "Internal error"
        : "Internal error";
    console.error("API /wallets/balances failed:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
