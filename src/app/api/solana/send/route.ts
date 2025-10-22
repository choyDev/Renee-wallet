import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { decryptPrivateKey } from "@/lib/wallet";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function rpcFor(chainId: string, fallback: string) {
  // Simple env override if you want to force devnet/mainnet
  const env = process.env.CHAIN_ENV === "testnet" ? "testnet" : "mainnet";
  if (env === "testnet") {
    return process.env.SOLANA_DEVNET_RPC || "https://api.devnet.solana.com";
  }
  // mainnet
  return process.env.SOLANA_MAINNET_RPC || fallback || "https://api.mainnet-beta.solana.com";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fromWalletId, to, amountSol, memo } = body as {
      fromWalletId: number;
      to: string;
      amountSol: string | number;
      memo?: string;
    };

    if (!fromWalletId || !to || amountSol === undefined) {
      return NextResponse.json({ error: "fromWalletId, to, amountSol required" }, { status: 400 });
    }

    // 1) Load wallet + network (must be Solana)
    const wallet = await prisma.wallet.findUnique({
      where: { id: Number(fromWalletId) },
      include: { network: true },
    });
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    if (!wallet.network || wallet.network.symbol !== "SOL") {
      return NextResponse.json({ error: "Wallet is not Solana" }, { status: 400 });
    }

    // 2) Validate destination address
    let toPub: PublicKey;
    try {
      toPub = new PublicKey(to);
    } catch {
      return NextResponse.json({ error: "Invalid destination address" }, { status: 400 });
    }

    // 3) Decrypt secret key (we stored base64(secretKey))
    if (!wallet.privateKeyEnc) {
      return NextResponse.json({ error: "Encrypted private key missing" }, { status: 400 });
    }
    const base64Secret = decryptPrivateKey(wallet.privateKeyEnc); // => base64
    const secretBytes = Buffer.from(base64Secret, "base64");
    const keypair = Keypair.fromSecretKey(new Uint8Array(secretBytes));

    // 4) Connect
    const rpc = rpcFor(wallet.network.chainId, wallet.network.rpcUrl);
    const connection = new Connection(rpc, "confirmed");

    // 5) Build transaction (transfer + optional memo)
    const lamports = Math.round(Number(amountSol) * LAMPORTS_PER_SOL);
    if (!Number.isFinite(lamports) || lamports <= 0) {
      return NextResponse.json({ error: "amountSol must be > 0" }, { status: 400 });
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
    const tx = new Transaction({ feePayer: keypair.publicKey, recentBlockhash: blockhash });

    tx.add(SystemProgram.transfer({ fromPubkey: keypair.publicKey, toPubkey: toPub, lamports }));

    if (memo) {
      // SPL Memo Program
      const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
      tx.add(new TransactionInstruction({ keys: [], programId: MEMO_PROGRAM_ID, data: Buffer.from(memo) }));
    }

    // 6) Check balance incl. fee
    const fromBal = await connection.getBalance(keypair.publicKey, "confirmed");
    const feeLamports = (await connection.getFeeForMessage(tx.compileMessage(), "confirmed")).value ?? 5000;
    if (fromBal < lamports + feeLamports) {
      return NextResponse.json(
        { error: `Insufficient funds: have ${(fromBal / LAMPORTS_PER_SOL).toFixed(9)} SOL, need ~${((lamports + feeLamports) / LAMPORTS_PER_SOL).toFixed(9)} SOL` },
        { status: 400 }
      );
    }

    // 7) Sign & send
    tx.sign(keypair);
    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    // 8) Confirm
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

    // optional explorer
    const clusterParam = wallet.network.chainId === "devnet" ? "?cluster=devnet" : "";
    const explorerTx = `https://solscan.io/tx/${signature}${clusterParam}`;

    const feeSol = feeLamports / LAMPORTS_PER_SOL;

    // 🧾 Store transaction in database
    await prisma.transaction.create({
      data: {
        userId: wallet.userId,
        walletId: wallet.id,
        tokenId: null, // SOL = native token
        type: "TRANSFER",
        amount: new Prisma.Decimal(Number(amountSol)),
        fee: new Prisma.Decimal(feeSol),
        usdValue: new Prisma.Decimal(0), // can update later via price API
        txHash: signature,
        explorerUrl: explorerTx,
        status: "CONFIRMED",
        fromAddress: keypair.publicKey.toBase58(),
        toAddress: toPub.toBase58(),
        direction: "SENT",
      },
    });

    return NextResponse.json({
      ok: true,
      signature,
      explorerTx,
      from: keypair.publicKey.toBase58(),
      to: toPub.toBase58(),
      amountSol: Number(amountSol),
      feeLamports,
    });
  } catch (e: any) {
    console.error("SOL send failed:", e);
    const msg = process.env.NODE_ENV !== "production" ? e?.message || "Internal error" : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
