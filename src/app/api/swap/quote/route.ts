import { NextResponse } from "next/server";
const TronWeb = require("tronweb");
import { ethers } from "ethers";
import { ETH, TRON } from "@/lib/swap-constants";
import { SUNSWAP_V2_ROUTER_ABI } from "@/lib/tron-abis";
import { PublicKey } from "@solana/web3.js";
import { IS_TEST } from "@/lib/swap-constants";
// import { pickDevnetStableMint } from "@/lib/jupiter";

export const runtime = "nodejs";

async function pxBinanceTRX() {
    const r = await withTimeout(fetch("https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT", { cache: "no-store" }));
    const j = await r.json(); const v = Number(j?.price); if (!Number.isFinite(v)) throw 0; return v;
}
async function pxCoingeckoTRX() {
    const r = await withTimeout(fetch("https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd", { cache: "no-store" }));
    const j = await r.json(); const v = Number(j?.tron?.usd); if (!Number.isFinite(v)) throw 0; return v;
}

let _px = { t: 0, v: 0 };
async function getTrxUsd(): Promise<number> {
    const now = Date.now();
    if (now - _px.t < 30_000 && _px.v > 0) return _px.v;
    const out = await Promise.allSettled([pxBinanceTRX(), pxCoingeckoTRX()]);
    const vals: number[] = out.filter(r => r.status === "fulfilled").map((r: any) => r.value);
    if (!vals.length) throw new Error("No TRX price");
    _px = { t: now, v: median(vals) };
    return _px.v;
}

type Body = {
    chain: "ETH" | "SOL" | "TRX";
    side: "USDT->NATIVE" | "NATIVE->USDT";
    amount: string; // user input, e.g. "10.5"
    slippageBps?: number; // e.g. 50 = 0.5%
    fromWalletId?: number; // optional, not needed for quote
};

const V2_ABI = [
    "function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)",
    "function getAmountsIn(uint amountOut, address[] memory path) external view returns (uint[] memory amounts)",
];

const WSOL = new PublicKey("So11111111111111111111111111111111111111112"); // correct mint
// const STABLE = new PublicKey(SOLCONST.USDT_MINT); // devnet=USDC, mainnet=USDT
// Devnet fallback list: first one that quotes wins
const DEVNET_STABLES = [
    "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr", // USDC-Dev (often works)
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC devnet (sometimes rejected)
];
// Mainnet stable (pick one)
const MAINNET_STABLE = process.env.USDT_SOL_MAINNET
    ?? "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"; // USDT mainnet

function toAtomic(h: string, d: number): bigint {
    const [i, f = ""] = String(h).trim().split(".");
    return BigInt((i || "0") + (f + "0".repeat(d)).slice(0, d));
}

function isTokenNotTradable(body: string) {
    return /TOKEN_NOT_TRADABLE/i.test(body);
}

async function jupQuote({
    inputMint, outputMint, amountAtomic, slippageBps, devnet
}: {
    inputMint: string; outputMint: string; amountAtomic: bigint;
    slippageBps: number; devnet: boolean;
}) {
    const base = "https://lite-api.jup.ag/swap/v1/quote";
    const qs = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amountAtomic.toString(),
        slippageBps: String(slippageBps),
        swapMode: "ExactIn",
    });
    if (devnet) qs.set("cluster", "devnet");

    const url = `${base}?${qs.toString()}`;
    const r = await fetch(url, { cache: "no-store" });
    const text = await r.text();
    return { ok: r.ok, text, url };
}

// ---- Robust SOL/USD spot price (median of multiple providers) ----
async function withTimeout<T>(p: Promise<T>, ms = 2500): Promise<T> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
        // @ts-ignore
        return await p;
    } finally {
        clearTimeout(t);
    }
}

async function fetchJupiter(): Promise<number> {
    const r = await withTimeout(fetch("https://price.jup.ag/v6/price?ids=SOL", { cache: "no-store" }));
    if (!r.ok) throw new Error("jup http");
    const j = await r.json();
    const v = Number(j?.data?.SOL?.price);
    if (!Number.isFinite(v) || v <= 0) throw new Error("jup parse");
    return v;
}

async function fetchCoinGecko(): Promise<number> {
    const r = await withTimeout(fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
        { cache: "no-store" }
    ));
    if (!r.ok) throw new Error("cg http");
    const j = await r.json();
    const v = Number(j?.solana?.usd);
    if (!Number.isFinite(v) || v <= 0) throw new Error("cg parse");
    return v;
}

async function fetchBinance(): Promise<number> {
    const r = await withTimeout(fetch(
        "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT",
        { cache: "no-store" }
    ));
    if (!r.ok) throw new Error("binance http");
    const j = await r.json();
    const v = Number(j?.price);
    if (!Number.isFinite(v) || v <= 0) throw new Error("binance parse");
    return v;
}

function median(nums: number[]): number {
    const a = nums.slice().sort((x, y) => x - y);
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

// Cache to reduce provider load & rate limits
let _solCache = { t: 0, v: 0 };
const PRICE_TTL_MS = 30_000;

async function getSolPriceUSDStrict(): Promise<number> {
    const now = Date.now();
    if (now - _solCache.t < PRICE_TTL_MS && _solCache.v > 0) return _solCache.v;

    const results: number[] = [];
    const tasks = [fetchJupiter(), fetchCoinGecko(), fetchBinance()];
    await Promise.allSettled(tasks).then((arr) => {
        for (const r of arr) if (r.status === "fulfilled" && Number.isFinite(r.value)) results.push(r.value);
    });

    if (!results.length) throw new Error("No price sources available");
    const v = median(results);
    _solCache = { t: now, v };
    return v;
}

export async function POST(req: Request) {
    try {
        // const body = await req.json().catch(() => ({}));
        const { chain, side, amount, slippageBps = 50 } = await req.json();

        if (!chain || !side || !amount) {
            return NextResponse.json({ error: "chain, side, amount required" }, { status: 400 });
        }

        if (chain === "ETH") {
            const provider = new ethers.JsonRpcProvider(ETH.RPC, { chainId: ETH.CHAIN_ID, name: ETH.CHAIN_ID === 1 ? "mainnet" : "sepolia" });
            const router = new ethers.Contract(ETH.ROUTER_V2, V2_ABI, provider);

            const path = side === "NATIVE->USDT" ? [ETH.WETH, ETH.USDT] : [ETH.USDT, ETH.WETH];
            const decimalsIn = side === "NATIVE->USDT" ? 18 : ETH.USDT_DECIMALS;
            const amtWei = ethers.parseUnits(amount, decimalsIn);

            const amounts = await router.getAmountsOut(amtWei, path);
            const outRaw = amounts[amounts.length - 1] as bigint;
            const outDecimals = side === "NATIVE->USDT" ? ETH.USDT_DECIMALS : 18;

            const minOut = outRaw - (outRaw * BigInt(slippageBps)) / BigInt(10_000);
            return NextResponse.json({
                ok: true,
                chain: "ETH",
                side,
                amountIn: amount,
                amountOut: ethers.formatUnits(outRaw, outDecimals),
                minOut: ethers.formatUnits(minOut, outDecimals),
                slippageBps,
                path,
            });
        }

        if (chain === "SOL") {
            const inDecimals = side === "NATIVE->USDT" ? 9 : 6;
            const amountInRaw = toAtomic(String(amount), inDecimals);

            const stableCandidates = IS_TEST ? DEVNET_STABLES : [MAINNET_STABLE];

            let usedStable: string | null = null;
            let resp: { ok: boolean; text: string; url: string } | null = null;

            for (const stable of stableCandidates) {
                const input = side === "NATIVE->USDT" ? WSOL.toBase58() : stable;
                const output = side === "NATIVE->USDT" ? stable : WSOL.toBase58();

                const r = await jupQuote({
                    inputMint: input,
                    outputMint: output,
                    amountAtomic: amountInRaw,
                    slippageBps,
                    devnet: IS_TEST,
                });

                if (r.ok) { usedStable = stable; resp = r; break; }
                if (!isTokenNotTradable(r.text)) {
                    console.error("[JUP quote FAIL]", r.url, r.text);
                    return NextResponse.json({ error: r.text || "Quote failed" }, { status: 400 });
                }
                // else TOKEN_NOT_TRADABLE → try next candidate
            }

            if (!resp || !usedStable) {
                if (IS_TEST) {
                    const ui = Number(amount);
                    if (!Number.isFinite(ui) || ui <= 0) {
                        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
                    }

                    // Always fetch a real price (median of Jupiter / CoinGecko / Binance).
                    const solUsd = await getSolPriceUSDStrict();

                    const out =
                        side === "NATIVE->USDT"
                            ? ui * solUsd           // SOL → USDT
                            : ui / solUsd;          // USDT → SOL

                    const slip = (slippageBps ?? 50) / 10_000;
                    const decs = side === "NATIVE->USDT" ? 6 : 9;

                    return NextResponse.json({
                        ok: true,
                        chain: "SOL",
                        side,
                        amountIn: String(amount),
                        amountOut: out.toFixed(decs),
                        minOut: (out * (1 - slip)).toFixed(decs),
                        route: null,              // signals demo quote to /api/swap/sol
                        mode: "demo-quote",
                        priceSource: "median(jupiter,coingecko,binance)"
                    });
                }

                // mainnet: still fail (we shouldn't fake quotes on mainnet)
                return NextResponse.json(
                    { error: "No tradable stable found on mainnet route." },
                    { status: 503 }
                );
            }

            const q = JSON.parse(resp.text);

            const outDecimals = side === "NATIVE->USDT" ? 6 : 9; // stable 6dp, SOL 9dp
            const amountOut = Number(q.outAmount) / 10 ** outDecimals;
            const minOut = Number(q.otherAmountThreshold) / 10 ** outDecimals;

            return NextResponse.json({
                ok: true,
                chain: "SOL",
                side,
                usedStableMint: usedStable,
                amountIn: String(amount),
                amountOut: amountOut.toString(),
                minOut: minOut.toString(),
                route: q, // keep for /api/swap/sol if you want to pass the quoteResponse
            });
        }

        // inside POST, replace the TRX branch
        if (chain === "TRX") {
            const amt = Number(amount);
            if (!Number.isFinite(amt) || amt <= 0) {
                return NextResponse.json({ error: "amount required" }, { status: 400 });
            }

            // TESTNET: price-based demo quote
            if (IS_TEST) {
                const px = await getTrxUsd(); // USDT per TRX
                const amountOut = side === "NATIVE->USDT" ? amt * px : amt / px;
                const minOut = amountOut * (1 - (slippageBps / 10_000));
                return NextResponse.json({
                    ok: true,
                    chain: "TRX",
                    side,
                    amountIn: amount,
                    amountOut: amountOut.toFixed(6),
                    minOut: minOut.toFixed(6),
                    slippageBps
                });
            }

            // MAINNET: use router (your existing SunSwap code)
            const tronWeb = new TronWeb({ fullHost: TRON.RPC });
            const router = await tronWeb.contract(SUNSWAP_V2_ROUTER_ABI, TRON.ROUTER);
            const WTRX = await router.WETH().call();
            const path = side === "USDT->NATIVE" ? [TRON.USDT, WTRX] : [WTRX, TRON.USDT];
            const inRaw = tronWeb.toBigNumber(Math.round(amt * 1e6));
            const amounts = await router.getAmountsOut(inRaw, path).call();
            const outRaw = tronWeb.toBigNumber(amounts[amounts.length - 1]);
            const minRaw = outRaw.minus(outRaw.times(slippageBps).div(10_000));
            const amountOut = Number(outRaw.toString()) / 1e6;
            const minOut = Number(minRaw.toString()) / 1e6;
            return NextResponse.json({ ok: true, chain: "TRX", side, amountIn: amount, amountOut, minOut, slippageBps });
        }

        return NextResponse.json({ error: "Unsupported chain" }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
    }
}
