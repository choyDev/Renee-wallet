import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ethers, Contract } from "ethers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
type ChainSym = "SOL" | "TRX" | "ETH" | "BTC";
type TokenSym = ChainSym | "USDT" | "USDC";

type BalanceRow = {
  token: { symbol: TokenSym; name: string; address?: string | null; decimals?: number };
  amount: string; // human units (e.g., "1.2345")
  usd: number;    // fiat value rounded/trimmed at server
};

const CHAIN_ENV = process.env.CHAIN_ENV === "mainnet" ? "mainnet" : "testnet";

// ---- USDT map by chain/env ----
const USDT_ADDR = {
  ETH: CHAIN_ENV === "mainnet" ? process.env.USDT_ETH_MAINNET : process.env.USDT_ETH_TESTNET,
  TRX: CHAIN_ENV === "mainnet" ? process.env.USDT_TRX_MAINNET : process.env.USDT_TRX_TESTNET,
  SOL: CHAIN_ENV === "mainnet" ? process.env.USDT_SOL_MAINNET : process.env.USDT_SOL_TESTNET, // may be blank on devnet
} as const;

// ---- Minimal ABIs ----
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const TRC20_ABI = [
  { name: "balanceOf", type: "function", constant: true, stateMutability: "View", inputs: [{ name: "_owner", type: "address" }], outputs: [{ name: "balance", type: "uint256" }] },
  { name: "decimals",  type: "function", constant: true, stateMutability: "View", inputs: [], outputs: [{ name: "", type: "uint8" }] },
];

// ---- Prices (native + 1.0 for USDT) ----
async function getUsdPrices(symbols: ("SOL"|"TRX"|"ETH"|"BTC")[]) {
  const idMap: Record<string,string> = { SOL:"solana", TRX:"tron", ETH:"ethereum", BTC:"bitcoin" };
  const ids = [...new Set(symbols.map(s => idMap[s]).filter(Boolean))].join(",");
  if (!ids) return { SOL:0, TRX:0, ETH:0, BTC:0, USDT:1 };
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, { cache: "no-store" });
    // const res = await fetch(`/api/prices/simple?ids=${ids}&vs=usd`, { cache: "no-store" });
    const j = await res.json();
    return {
      SOL: j.solana?.usd ?? 0,
      TRX: j.tron?.usd ?? 0,
      ETH: j.ethereum?.usd ?? 0,
      BTC: j.bitcoin?.usd ?? 0,
      USDT: 1,
    };
  } catch {
    return { SOL:0, TRX:0, ETH:0, BTC:0, USDT:1 };
  }
}

// ---- Native balances ----
async function getSolBalance(rpcUrl: string, address: string) {
  const conn = new Connection(rpcUrl, "confirmed");
  const lamports = await conn.getBalance(new PublicKey(address));
  return lamports / LAMPORTS_PER_SOL;
}

async function getTrxBalance(rpcUrl: string, address: string) {
  const mod: any = await import("tronweb");
  const TronWeb = mod.default || mod;
  const tronWeb = new TronWeb({
    fullHost: rpcUrl,
    headers: process.env.TRONGRID_API_KEY ? { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY } : undefined,
  });
  const sun = await tronWeb.trx.getBalance(address);
  return sun / 1_000_000;
}

async function getEthBalance(address: string) {
  const rpc = CHAIN_ENV === "testnet" ? process.env.ETH_RPC_TESTNET! : process.env.ETH_RPC_MAINNET!;
  const provider = new ethers.JsonRpcProvider(rpc);
  const wei = await provider.getBalance(address);
  return Number(ethers.formatEther(wei));
}

async function getBtcBalance(address: string) {
  const base = CHAIN_ENV === "testnet" ? process.env.BTC_API_TESTNET! : process.env.BTC_API_MAINNET!;
  const r = await fetch(`${base}/address/${address}`, { cache: "no-store" });
  if (!r.ok) return 0;
  const j = await r.json();
  const cs = j?.chain_stats || {};
  const confirmed = (cs.funded_txo_sum ?? 0) - (cs.spent_txo_sum ?? 0);
  return confirmed / 1e8;
}

// ---- USDT token balances ----
async function getErc20Balance(address: string, tokenAddr: string) {
  const rpc = CHAIN_ENV === "testnet" ? process.env.ETH_RPC_TESTNET! : process.env.ETH_RPC_MAINNET!;
  const provider = new ethers.JsonRpcProvider(rpc);
  const c = new Contract(tokenAddr, ERC20_ABI, provider);
  const [raw, dec] = await Promise.all([c.balanceOf(address), c.decimals().catch(() => 6)]);
  return Number(ethers.formatUnits(raw, dec));
}

async function getTrc20Balance(rpcUrl: string, ownerBase58: string, tokenBase58: string) {
  const mod: any = await import("tronweb");
  const TronWeb = mod.default || mod;

  const tronWeb = new TronWeb({
    fullHost: rpcUrl, // e.g. https://nile.trongrid.io
    headers: process.env.TRONGRID_API_KEY
      ? { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY }
      : undefined,
  });

  // � set origin (owner_address) for triggerconstantcontract
  tronWeb.setAddress(ownerBase58);

  // (optional) if you want to be explicit:
  // const ownerHex = tronWeb.address.toHex(ownerBase58);

  // Get contract instance
  let c: any;
  try {
    // node-known ABI path
    c = await tronWeb.contract().at(tokenBase58);
  } catch (e1) {
    // fallback: minimal ABI
    const TRC20_ABI = [
      { name: "balanceOf", type: "function", constant: true, stateMutability: "View", inputs: [{ name: "_owner", type: "address" }], outputs: [{ name: "balance", type: "uint256" }] },
      { name: "decimals",  type: "function", constant: true, stateMutability: "View", inputs: [], outputs: [{ name: "", type: "uint8" }] },
    ];
    c = await tronWeb.contract(TRC20_ABI, tokenBase58);
  }

  // call with base58 is fine once default address is set
  const [raw, dec] = await Promise.all([
    c.balanceOf(ownerBase58).call(),      // owner_address now present
    c.decimals().call().catch(() => 6),
  ]);

  const rawStr = typeof raw === "string" ? raw : raw?.toString?.() ?? "0";
  return Number(rawStr) / 10 ** Number(dec);
}

async function getSplTokenBalance(rpcUrl: string, owner: string, mint: string) {
  const conn = new Connection(rpcUrl, "confirmed");
  const res = await conn.getParsedTokenAccountsByOwner(new PublicKey(owner), { mint: new PublicKey(mint) });
  if (!res.value.length) return 0;
  // pick the first account for this mint
  const info: any = res.value[0].account.data.parsed.info.tokenAmount;
  // uiAmountString is best for precision
  const val = (info?.uiAmountString ?? info?.uiAmount ?? "0").toString();
  return Number(val);
}

// ---- API handler ----
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get("userId"));
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const wallets = await prisma.wallet.findMany({ where: { userId }, include: { network: true } });
    if (!wallets.length) return NextResponse.json({ wallets: [] });

    const chainSymbols = Array.from(
      new Set(wallets.map((w) => w.network.symbol as ChainSym))
    );
    const prices = await getUsdPrices(chainSymbols);
    console.log("Fetched prices:", prices);

    const enriched = await Promise.all(
      wallets.map(async (w) => {
        const net = w.network.symbol as ChainSym;

        let native = 0;
        let usdt = 0;

        try {
          if (net === "SOL") {
            native = await getSolBalance(w.network.rpcUrl, w.address);
            const mint = USDT_ADDR.SOL;
            if (mint) usdt = await getSplTokenBalance(w.network.rpcUrl, w.address, mint);
          } else if (net === "TRX") {
            native = await getTrxBalance(w.network.rpcUrl, w.address);
            const trc20 = USDT_ADDR.TRX;
            if (trc20) usdt = await getTrc20Balance(w.network.rpcUrl, w.address, trc20);
          } else if (net === "ETH") {
            native = await getEthBalance(w.address);
            const erc20 = USDT_ADDR.ETH;
            if (erc20) usdt = await getErc20Balance(w.address, erc20);
          } else if (net === "BTC") {
            native = await getBtcBalance(w.address);
            usdt = 0; // none on BTC
          }
        } catch (e: any) {
          console.error("Balance fetch error", {
            network: w.network.name,
            address: w.address,
            // err: (e as any)?.message,
            err: e?.message ?? e?.error ?? e, 
          });
        }

        const nativeUsd = Number(((prices[net] ?? 0) * native).toFixed(2));

        // IMPORTANT: type the array with BalanceRow[] so "USDT" is allowed
        const balances: BalanceRow[] = [
          {
            token: { symbol: net as TokenSym, name: w.network.name },
            amount: native.toString(),
            usd: nativeUsd,
          },
        ];

        // Append USDT row when we have a configured token address (skip on BTC)
        if (net !== "BTC" && USDT_ADDR[net as "ETH" | "TRX" | "SOL"]) {
          balances.push({
            token: {
              symbol: "USDT",
              name: "Tether USD",
              address: USDT_ADDR[net as "ETH" | "TRX" | "SOL"]!,
            },
            amount: usdt.toString(),
            usd: Number((prices.USDT * usdt).toFixed(2)),
          });
        }

        return {
          id: w.id,
          address: w.address,
          network: {
            name: w.network.name,
            symbol: w.network.symbol,
            explorerUrl: w.network.explorerUrl ?? null,
            chainId: w.network.chainId,
          },
          balances,
        };
      })
    );

    return NextResponse.json({ wallets: enriched });
  } catch (e: any) {
    console.error("API /wallets/balances failed:", e);
    return NextResponse.json({ error: process.env.NODE_ENV !== "production" ? e?.message || "Internal error" : "Internal error" }, { status: 500 });
  }
}
