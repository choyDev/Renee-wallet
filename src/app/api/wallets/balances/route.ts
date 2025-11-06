import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ethers, Contract } from "ethers";
import { Client } from "xrpl";
import { decryptPrivateKey } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
type ChainSym = "SOL" | "TRX" | "ETH" | "BTC" | "DOGE" | "XRP" | "XMR";
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
type Prices = { SOL:number; TRX:number; ETH:number; BTC:number; DOGE:number; XRP:number; XMR:number; USDT:number };

const PRICE_CACHE = new Map<string, { exp: number; data: Prices }>();
const TTL_MS = 30_000; // 30s is fine for spot prices

export async function getUsdPrices(symbols: ("SOL"|"TRX"|"ETH"|"BTC"|"DOGE"|"XRP"|"XMR")[]): Promise<Prices> {
  const idMap: Record<string,string> = { SOL:"solana", TRX:"tron", ETH:"ethereum", BTC:"bitcoin", DOGE: "dogecoin", XRP:"ripple", XMR:"monero",};
  const idsArr = [...new Set(symbols.map(s => idMap[s]).filter(Boolean))];
  const key = idsArr.sort().join(",");
  if (!key) return { SOL:0, TRX:0, ETH:0, BTC:0, DOGE:0, XRP:0, XMR:0, USDT:1 };

  const cached = PRICE_CACHE.get(key);
  if (cached && cached.exp > Date.now()) return cached.data;

  // 1) Try CoinGecko
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(key)}&vs_currencies=usd`;
    const headers: Record<string,string> = { accept: "application/json" };
    if (process.env.CG_API_KEY) headers["x-cg-demo-api-key"] = process.env.CG_API_KEY!;
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) throw new Error(`cg ${res.status}`);
    const j = await res.json();
    const out: Prices = {
      SOL: j.solana?.usd ?? 0,
      TRX: j.tron?.usd ?? 0,
      ETH: j.ethereum?.usd ?? 0,
      BTC: j.bitcoin?.usd ?? 0,
      DOGE: j.dogecoin?.usd ?? 0,
      XRP: j.ripple?.usd ?? 0,
      XMR: j.monero?.usd ?? 0,
      USDT: 1,
    };
    PRICE_CACHE.set(key, { exp: Date.now() + TTL_MS, data: out });
    return out;
  } catch {}

  // 2) Fallback to Binance spot (close) prices
  const syms = { SOL:"SOLUSDT", TRX:"TRXUSDT", ETH:"ETHUSDT", BTC:"BTCUSDT" } as const;
  const out: Prices = { SOL:0, TRX:0, ETH:0, BTC:0, DOGE:0, XRP:0, XMR:0, USDT:1 };
  await Promise.all((Object.keys(syms) as Array<keyof typeof syms>).map(async k => {
    try {
      const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${syms[k]}`, { cache: "no-store" });
      const j = await r.json();
      out[k] = j?.price ? Number(j.price) : 0;
    } catch {}
  }));
  PRICE_CACHE.set(key, { exp: Date.now() + TTL_MS, data: out });
  return out;
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

// ---- DOGE balance ----
async function getDogeBalance(address: string) {
  const base =
    CHAIN_ENV === "testnet"
      ? "https://doge-electrs-testnet-demo.qed.me"
      : "https://dogechain.info/api";

  try {
    // Fetch address info
    const res = await fetch(`${base}/address/${address}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
    const data = await res.json();

    // Electrs-style API
    if (data.chain_stats) {
      const { funded_txo_sum = 0, spent_txo_sum = 0 } = data.chain_stats;
      return (funded_txo_sum - spent_txo_sum) / 1e8;
    }

    // Legacy Dogechain.info API fallback
    if (data.balance) return Number(data.balance);

    return 0;
  } catch (e) {
    console.error("DOGE balance fetch error:", e);
    return 0;
  }
}

async function getXrpBalance(address: string) {
  const rpc = CHAIN_ENV === "testnet"
    ? "wss://s.altnet.rippletest.net:51233"
    : "wss://xrplcluster.com";
  const client = new Client(rpc);
  await client.connect();
  const res = await client.request({ command: "account_info", account: address });
  await client.disconnect();
  return Number(res.result.account_data.Balance ?? 0) / 1_000_000;
}

async function getXmrBalance(rpcUrl: string, walletFile: string, encPassword: string) {

  const password = decryptPrivateKey(encPassword);
  console.log("password: ", password);
  const filename = walletFile;
  
  try {
    // Close any previously opened wallet (safety)
    try {
      await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "0",
          method: "close_wallet",
        }),
      });
      await new Promise((r) => setTimeout(r, 1000));
    } catch {}

    // Open the user's wallet
    const openRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "0",
        method: "open_wallet",
        params: { filename, password },
      }),
    });
    const openJson = await openRes.json();
    if (openJson.error) throw new Error(openJson.error.message);

    await new Promise((r) => setTimeout(r, 1000));

    // Get balance
    const balRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "0",
        method: "get_balance",
        params: { account_index: 0 },
      }),
    });
    const j = await balRes.json();
    console.log(j);
    if (j.error) throw new Error(j.error.message);

    // 4️⃣ Close wallet to free file lock
    await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "0",
        method: "close_wallet",
      }),
    });

    // 5️⃣ Convert atomic units (1 XMR = 1e12)
    const total = (j.result?.balance ?? 0) / 1e12;
    const unlocked = (j.result?.unlocked_balance ?? 0) / 1e12;
    return unlocked > 0 ? unlocked : total;
  } catch (err: any) {
    console.error("XMR balance fetch error:", err.message);
    return 0;
  }
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
          } else if (net === "DOGE") {
            native = await getDogeBalance(w.address);
          } else if (net === "XRP") {
            native = await getXrpBalance(w.address);
          } else if (net === "XMR") {
            const filename = w.meta;
            if (filename) {
              native = await getXmrBalance(w.network.rpcUrl, filename, w.privateKeyEnc);
            } else {
              console.warn(`⚠️ No filename found for Monero wallet of user ${userId}`);
              native = 0;
            }
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
