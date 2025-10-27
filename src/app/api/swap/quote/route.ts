import { NextResponse } from "next/server";
const TronWeb = require("tronweb");
import { ethers } from "ethers";
import { ETH, TRON } from "@/lib/swap-constants";
import { SUNSWAP_V2_ROUTER_ABI } from "@/lib/tron-abis";
import { PublicKey } from "@solana/web3.js";
import { IS_TEST } from "@/lib/swap-constants";
// import { pickDevnetStableMint } from "@/lib/jupiter";

export const runtime = "nodejs";

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
                console.warn("[JUP devnet] trying stable", DEVNET_STABLES);
                return NextResponse.json(
                    { error: "No tradable stable found on devnet right now. Try again later or switch to mainnet." },
                    { status: 400 }
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

        if (chain === "TRX") {
            if (!TRON.ROUTER || !TRON.USDT) {
                return NextResponse.json({ error: "TRX swap disabled on testnet (no SunSwap liquidity)" }, { status: 400 });
            }
            const tronWeb = new TronWeb({ fullHost: TRON.RPC }); // no pk needed for view calls
            const router = await tronWeb.contract(SUNSWAP_V2_ROUTER_ABI, TRON.ROUTER);
            const WTRX = await router.WETH().call(); // base58 string

            const amtNum = Number(amount || "0");
            if (!amtNum || amtNum <= 0) return NextResponse.json({ error: "amount required" }, { status: 400 });

            // Units: TRX uses "sun" (1e6); USDT has 6 decimals
            const path = side === "USDT->NATIVE" ? [TRON.USDT, WTRX] : [WTRX, TRON.USDT];
            const inRaw = side === "USDT->NATIVE"
                ? tronWeb.toBigNumber(Math.round(amtNum * 1e6))   // USDT 6dp
                : tronWeb.toBigNumber(Math.round(amtNum * 1e6));  // TRX  6dp (sun)

            const amounts = await router.getAmountsOut(inRaw, path).call();
            const outRaw = tronWeb.toBigNumber(amounts[amounts.length - 1]);
            const minRaw = outRaw.minus(outRaw.times(slippageBps).div(10_000));

            const amountOut = side === "USDT->NATIVE"
                ? (Number(outRaw.toString()) / 1e6).toString() // TRX
                : (Number(outRaw.toString()) / 1e6).toString(); // USDT

            const minOut = side === "USDT->NATIVE"
                ? (Number(minRaw.toString()) / 1e6).toString()
                : (Number(minRaw.toString()) / 1e6).toString();

            return NextResponse.json({ ok: true, chain: "TRX", side, amountIn: amount, amountOut, minOut, slippageBps });
        }

        return NextResponse.json({ error: "Unsupported chain" }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
    }
}
