// /src/app/api/swap/sol/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  Connection,
  Keypair,
  VersionedTransaction,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { decryptPrivateKey } from "@/lib/wallet";
import { SOL } from "@/lib/swap-constants";

import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import bs58 from "bs58";

export const runtime = "nodejs";

const IS_TEST = process.env.CHAIN_ENV !== "mainnet";
const WSOL = "So11111111111111111111111111111111111111112";

// Devnet: try these stables in order for quoting
const DEVNET_STABLES = [
  "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr", // USDC-Dev (often works)
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC devnet (sometimes disabled)
];

// Mainnet: keep using your constant (USDT) or switch to USDC mainnet if you prefer
const MAINNET_STABLE = (SOL as any).USDT_MINT as string; // "Es9vMFr..." from your swap-constants

const JUP_QUOTE = "https://lite-api.jup.ag/swap/v1/quote";
const JUP_SWAP = "https://lite-api.jup.ag/swap/v1";

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

/* ------------------------- Price helpers (30s cache) ------------------------ */
async function withTimeout<T>(p: Promise<T>, ms = 2500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await p;
  } finally {
    clearTimeout(t);
  }
}
async function pxJupiter() {
  const r = await withTimeout(fetch("https://price.jup.ag/v6/price?ids=SOL", { cache: "no-store" }));
  if (!r.ok) throw new Error("jup http");
  const j = await r.json();
  const v = Number(j?.data?.SOL?.price);
  if (!Number.isFinite(v) || v <= 0) throw new Error("jup parse");
  return v;
}
async function pxCoingecko() {
  const r = await withTimeout(
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", {
      cache: "no-store",
    })
  );
  if (!r.ok) throw new Error("cg http");
  const j = await r.json();
  const v = Number(j?.solana?.usd);
  if (!Number.isFinite(v) || v <= 0) throw new Error("cg parse");
  return v;
}
async function pxBinance() {
  const r = await withTimeout(fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT", { cache: "no-store" }));
  if (!r.ok) throw new Error("binance http");
  const j = await r.json();
  const v = Number(j?.price);
  if (!Number.isFinite(v) || v <= 0) throw new Error("binance parse");
  return v;
}
function median(a: number[]) {
  const b = a.slice().sort((x, y) => x - y);
  const m = Math.floor(b.length / 2);
  return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
}
let _px = { t: 0, v: 0 };
async function getSolUsd(): Promise<number> {
  const now = Date.now();
  if (now - _px.t < 30_000 && _px.v > 0) return _px.v;
  const vals: number[] = [];
  const out = await Promise.allSettled([pxJupiter(), pxCoingecko(), pxBinance()]);
  for (const r of out) if (r.status === "fulfilled" && Number.isFinite(r.value)) vals.push(r.value);
  if (!vals.length) throw new Error("No price sources");
  const v = median(vals);
  _px = { t: now, v };
  return v;
}

/* ---------------------- SPL transfer & devnet airdrop ---------------------- */
async function splTransfer(
  conn: Connection,
  fromSigner: Keypair,
  fromAta: PublicKey,
  toAta: PublicKey,
  owner: PublicKey,
  amountAtomic: bigint
) {
  const ix = createTransferInstruction(
    fromAta,
    toAta,
    owner,
    Number(amountAtomic), // safe while amounts are < 2^53 on devnet
    [],
    TOKEN_PROGRAM_ID
  );
  const tx = new Transaction().add(ix);
  tx.feePayer = fromSigner.publicKey;
  const sig = await conn.sendTransaction(tx, [fromSigner], { skipPreflight: false });
  await conn.confirmTransaction(sig, "confirmed");
  return sig;
}

const FEE_BUFFER = BigInt(300000);

async function ensureAirdrop(conn: Connection, who: PublicKey, min: bigint) {
  let bal = BigInt(await conn.getBalance(who));
  let tries = 0;
  while (bal < min && tries < 5) {
    try {
      const sig = await conn.requestAirdrop(who, LAMPORTS_PER_SOL);
      await conn.confirmTransaction(sig, "confirmed");
      bal = BigInt(await conn.getBalance(who));
    } catch {}
    tries++;
  }
  return bal;
}

/* ----------------------------- Demo swap path ------------------------------ */
async function demoSwapSolana(params: {
  side: "NATIVE->USDT" | "USDT->NATIVE";
  amount: string; // UI amount
  userKp: Keypair;
  conn: Connection;
}) {
  const { side, amount, userKp, conn } = params;

  const treasury = Keypair.fromSecretKey(
    bs58.decode(process.env.SOL_BRIDGE_PRIVATE_KEY_BASE58!)
  );

  const userPub = userKp.publicKey;
  const mint = new PublicKey(process.env.USDT_SOL_TESTNET!); // devnet mint you control
  const DECIMALS = 6;

  // Prepare ATAs (payer = treasury so user doesn’t pay rent)
  const userAta = await getOrCreateAssociatedTokenAccount(conn, treasury, mint, userPub);
  const treaAta = await getOrCreateAssociatedTokenAccount(conn, treasury, mint, treasury.publicKey);

  const ui = Number(amount);
  if (!isFinite(ui) || ui <= 0) throw new Error("Invalid amount");

  const solUsd = await getSolUsd();
  const txids: string[] = [];

  if (side === "NATIVE->USDT") {
    // User sends SOL; treasury sends priced USDT
    const wantLamports = BigInt(Math.round(ui * 1e9)); // SOL in (lamports)
    const wantTokens = BigInt(Math.round(ui * solUsd * 1e6)); // USDT out (6dp)

    // 1) user SOL -> treasury
    {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: userPub,
          toPubkey: treasury.publicKey,
          lamports: Number(wantLamports),
        })
      );
      tx.feePayer = userPub;
      const sig = await conn.sendTransaction(tx, [userKp], { skipPreflight: false });
      await conn.confirmTransaction(sig, "confirmed");
      txids.push(sig);
    }

    // 2) treasury USDT -> user (partial-fill if treasury short)
    const treaBal = await conn.getTokenAccountBalance(treaAta.address).catch(() => null);
    const avail = treaBal?.value?.amount ? BigInt(treaBal.value.amount) : BigInt(0);

    const tokenOut = avail >= wantTokens ? wantTokens : avail;
    if (tokenOut === BigInt(0)) {
      return {
        ok: false,
        error: "Treasury has no devnet USDT. Please fund treasury ATA first.",
      };
    }

    const sig2 = await splTransfer(
      conn,
      treasury,
      treaAta.address,
      userAta.address,
      treasury.publicKey,
      tokenOut
    );
    txids.push(sig2);

    return {
      ok: true,
      mode: "demo",
      filledIn: ui.toString(), // SOL in (UI)
      filledOut: (Number(tokenOut) / 1e6).toFixed(6), // USDT out (UI)
      price: solUsd,
      txids,
      explorerTx: `https://solscan.io/tx/${txids[txids.length - 1]}?cluster=devnet`,
    };
  } else {
    // User sends USDT; treasury sends priced SOL (airdrop SOL to treasury if needed)
    const wantLamports = BigInt(Math.round((ui / solUsd) * 1e9)); // SOL out
    const tokenIn = BigInt(Math.round(ui * 1e6)); // USDT in

    // Ensure treasury has SOL for fees and transfer
    const need = wantLamports + FEE_BUFFER;
    let treaLam = BigInt(await conn.getBalance(treasury.publicKey));
    if (treaLam < need) treaLam = await ensureAirdrop(conn, treasury.publicKey, need);

    const maxSend = treaLam > FEE_BUFFER ? treaLam - FEE_BUFFER : BigInt(0);
    if (maxSend === BigInt(0)) {
      return {
        ok: false,
        error: "Treasury has no SOL on devnet (airdrop failed). Try again.",
      };
    }

    const lamportsOut = wantLamports <= maxSend ? wantLamports : maxSend;

    // 1) user USDT -> treasury
    const sig1 = await splTransfer(
      conn,
      userKp,
      userAta.address,
      treaAta.address,
      userPub,
      tokenIn
    );

    // 2) treasury SOL -> user
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasury.publicKey,
        toPubkey: userPub,
        lamports: Number(lamportsOut),
      })
    );
    tx.feePayer = treasury.publicKey;
    const sig2 = await conn.sendTransaction(tx, [treasury], { skipPreflight: false });
    await conn.confirmTransaction(sig2, "confirmed");

    const outUi = Number(lamportsOut) / 1e9;

    return {
      ok: true,
      mode: "demo",
      filledIn: ui.toFixed(6), // USDT in (UI)
      filledOut: outUi.toFixed(9), // SOL out (UI)
      price: solUsd,
      partial: lamportsOut < wantLamports,
      txids: [sig1, sig2],
      explorerTx: `https://solscan.io/tx/${sig2}?cluster=devnet`,
    };
  }
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
    const inDecimals = side === "NATIVE->USDT" ? 9 : 6; // SOL 9dp, stable 6dp
    const amountInRaw = toAtomic(String(amount), inDecimals);

    // Try stables in order (devnet). Stop on first success or non-tradable failure.
    let chosenStable: string | null = null;
    let quoteJSON: any = null;

    for (const stable of stableCandidates) {
      const inputMint = side === "NATIVE->USDT" ? WSOL : stable;
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

    // If quote failed on devnet, do DemoSwap (price-based, no 1:1)
    if (!quoteJSON || !chosenStable) {
      if (IS_TEST) {
        const demo = await demoSwapSolana({
          side,
          amount: String(amount),
          userKp: kp,
          conn,
        });
        if ((demo as any).ok) return NextResponse.json(demo);
        return NextResponse.json(demo, { status: 400 });
      }
      return NextResponse.json({ error: "No tradable route found" }, { status: 400 });
    }

    // Build swap transaction from quote (Lite API) – mainnet (or devnet if available)
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
