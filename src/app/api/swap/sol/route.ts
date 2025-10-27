import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Connection, Keypair, VersionedTransaction, PublicKey } from "@solana/web3.js";
import { decryptPrivateKey } from "@/lib/wallet";
import { SOL } from "@/lib/swap-constants";

export const runtime = "nodejs";

const IS_TEST = process.env.CHAIN_ENV !== "mainnet";
const WSOL = "So11111111111111111111111111111111111111112";

// Devnet: try these stables in order
const DEVNET_STABLES = [
  "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr", // USDC-Dev (often works)
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC devnet (sometimes disabled)
];

// Mainnet: keep using your constant (USDT) or switch to USDC mainnet if you prefer
const MAINNET_STABLE = (SOL as any).USDT_MINT as string; // "Es9vMFr..." from your swap-constants

const JUP_QUOTE = "https://lite-api.jup.ag/swap/v1/quote";
const JUP_SWAP  = "https://lite-api.jup.ag/swap/v1";

function toAtomic(human: string, decimals: number): bigint {
  const [ints, frac = ""] = String(human).trim().split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt((ints || "0") + padded);
}

function isTokenNotTradable(body: string) {
  return /TOKEN_NOT_TRADABLE/i.test(body);
}

async function jupQuoteOnce(params: {
  inputMint: string;
  outputMint: string;
  amountAtomic: bigint;
  slippageBps: number;
  devnet: boolean;
}) {
  const qs = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amountAtomic.toString(),
    slippageBps: String(params.slippageBps),
    swapMode: "ExactIn",
  });
  if (params.devnet) qs.set("cluster", "devnet");

  const url = `${JUP_QUOTE}?${qs.toString()}`;
  const r = await fetch(url, { cache: "no-store" });
  const text = await r.text();
  return { ok: r.ok, text, url };
}

export async function POST(req: Request) {
  try {
    const { fromWalletId, side, amount, slippageBps = 50 } = await req.json();

    if (!fromWalletId || !side || !amount) {
      return NextResponse.json({ error: "fromWalletId, side, amount required" }, { status: 400 });
    }

    const w = await prisma.wallet.findUnique({
      where: { id: Number(fromWalletId) },
      include: { network: true },
    });
    if (!w || w.network.symbol !== "SOL") {
      return NextResponse.json({ error: "Not a Solana wallet" }, { status: 400 });
    }

    const conn = new Connection(SOL.RPC, "confirmed");

    // decode base64 secretKey from DB
    const secretB64 = Buffer.from(decryptPrivateKey(w.privateKeyEnc!), "base64");
    const kp = Keypair.fromSecretKey(secretB64);

    // Decide which stable mint to use for this environment
    const stableCandidates = IS_TEST ? DEVNET_STABLES : [MAINNET_STABLE];

    // Build input/output mints and amount in atomic units
    const inDecimals  = side === "NATIVE->USDT" ? 9 : 6; // SOL 9dp, stable 6dp
    const amountInRaw = toAtomic(String(amount), inDecimals);

    // Try stables in order (devnet). Stop on first success or non-tradable failure.
    let chosenStable: string | null = null;
    let quoteJSON: any = null;

    for (const stable of stableCandidates) {
      const inputMint  = side === "NATIVE->USDT" ? WSOL   : stable;
      const outputMint = side === "NATIVE->USDT" ? stable : WSOL;

      const resp = await jupQuoteOnce({
        inputMint,
        outputMint,
        amountAtomic: amountInRaw,
        slippageBps,
        devnet: IS_TEST,
      });

      if (resp.ok) {
        chosenStable = stable;
        quoteJSON = JSON.parse(resp.text);
        break;
      }

      if (!isTokenNotTradable(resp.text)) {
        // Some other error; surface it
        console.error("[JUP quote FAIL]", resp.url, resp.text);
        return NextResponse.json({ error: resp.text || "Quote failed" }, { status: 400 });
      }

      // TOKEN_NOT_TRADABLE -> try next candidate
    }

    if (!quoteJSON || !chosenStable) {
      return NextResponse.json(
        { error: "No tradable stable available right now on this cluster. Try again later or switch to mainnet." },
        { status: 400 }
      );
    }

    // Build swap transaction from quote (Lite API)
    const swapUrl = IS_TEST ? `${JUP_SWAP}?cluster=devnet` : JUP_SWAP;
    const swapRes = await fetch(swapUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quoteJSON,
        userPublicKey: kp.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: null,
      }),
    });

    const swapText = await swapRes.text();
    if (!swapRes.ok) {
      console.error("[JUP swap FAIL]", swapUrl, swapText);
      return NextResponse.json({ error: swapText || "Swap build failed" }, { status: 400 });
    }

    const { swapTransaction } = JSON.parse(swapText);
    if (!swapTransaction) {
      return NextResponse.json({ error: "Missing swapTransaction" }, { status: 500 });
    }

    // Sign + send
    const vt = VersionedTransaction.deserialize(Buffer.from(swapTransaction, "base64"));
    vt.sign([kp]);
    const sig = await conn.sendTransaction(vt, { maxRetries: 3 });
    await conn.confirmTransaction(sig, "confirmed");

    return NextResponse.json({
      ok: true,
      signature: sig,
      explorerTx: `https://solscan.io/tx/${sig}${IS_TEST ? "?cluster=devnet" : ""}`,
    });
  } catch (e: any) {
    console.error("[SOL swap fatal]", e);
    return NextResponse.json({ error: e?.message || "Swap failed" }, { status: 500 });
  }
}
