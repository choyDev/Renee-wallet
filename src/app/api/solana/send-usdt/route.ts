import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { decryptPrivateKey } from "@/lib/wallet";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

//  USDT mint addresses
const USDT_MINTS = {
  devnet: "4GGCyYz3eqmKeSfvP86nDfYRAJK2gaTEWVcchxYsDhLJ", // Devnet (unofficial test)
  mainnet: "Es9vMFrzaCERbXqzQDvBaxK3fTAvqUyF7jEihQYjPz8A", // Mainnet official
};

function rpcFor(chainId: string, fallback: string) {
  const env = process.env.CHAIN_ENV === "testnet" ? "testnet" : "mainnet";
  return env === "testnet"
    ? process.env.SOLANA_DEVNET_RPC || "https://api.devnet.solana.com"
    : process.env.SOLANA_MAINNET_RPC || fallback || "https://api.mainnet-beta.solana.com";
}

export async function POST(req: Request) {
  try {
    const { fromWalletId, to, amountUsdt } = await req.json();

    if (!fromWalletId || !to || !amountUsdt)
      return NextResponse.json({ error: "fromWalletId, to, amountUsdt required" }, { status: 400 });

    // 1️⃣ Get wallet & network
    const wallet = await prisma.wallet.findUnique({
      where: { id: Number(fromWalletId) },
      include: { network: true },
    });

    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    if (!wallet.network || wallet.network.symbol !== "SOL")
      return NextResponse.json({ error: "Wallet is not Solana" }, { status: 400 });

    // 2️⃣ Setup RPC connection
    const rpc = rpcFor(wallet.network.chainId, wallet.network.rpcUrl);
    const connection = new Connection(rpc, "confirmed");

    // 3️⃣ Load keypair
    const base64Secret = decryptPrivateKey(wallet.privateKeyEnc);
    const secretBytes = Buffer.from(base64Secret, "base64");
    const keypair = Keypair.fromSecretKey(new Uint8Array(secretBytes));
    const fromPubkey = keypair.publicKey;

    // 4️⃣ Validate destination
    let toPubkey: PublicKey;
    try {
      toPubkey = new PublicKey(to);
    } catch {
      return NextResponse.json({ error: "Invalid destination address" }, { status: 400 });
    }

    // 5️⃣ Get mint & token accounts
    const mint = new PublicKey(
      process.env.CHAIN_ENV === "testnet" ? USDT_MINTS.devnet : USDT_MINTS.mainnet
    );

    const fromTokenAddr = await getAssociatedTokenAddress(mint, fromPubkey);
    const toTokenAddr = await getAssociatedTokenAddress(mint, toPubkey);

    const instructions = [];

    // Ensure destination token account exists
    try {
      await getAccount(connection, toTokenAddr);
    } catch {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          fromPubkey,
          toTokenAddr,
          toPubkey,
          mint
        )
      );
    }

    // 6️⃣ Transfer tokens (amount in smallest unit, USDT = 6 decimals)
    const amount = BigInt(Math.floor(Number(amountUsdt) * 1_000_000));
    instructions.push(
      createTransferInstruction(fromTokenAddr, toTokenAddr, fromPubkey, amount)
    );

    const tx = new Transaction().add(...instructions);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = fromPubkey;
    tx.sign(keypair);

    const raw = tx.serialize();
    const signature = await connection.sendRawTransaction(raw);
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

    const feeLamports =
      (await connection.getFeeForMessage(tx.compileMessage(), "confirmed")).value ?? 5000;
    const feeSol = feeLamports / LAMPORTS_PER_SOL;

    const explorerTx = `https://solscan.io/tx/${signature}${
      wallet.network.chainId === "devnet" ? "?cluster=devnet" : ""
    }`;

    // 7️⃣ Save to database
    await prisma.transaction.create({
      data: {
        userId: wallet.userId,
        walletId: wallet.id,
        tokenId: null, // optional: could link to Token model
        type: "TRANSFER",
        amount: new Prisma.Decimal(Number(amountUsdt)),
        fee: new Prisma.Decimal(feeSol),
        usdValue: new Prisma.Decimal(0),
        txHash: signature,
        explorerUrl: explorerTx,
        status: "CONFIRMED",
        fromAddress: fromPubkey.toBase58(),
        toAddress: toPubkey.toBase58(),
        direction: "SENT",
      },
    });

    return NextResponse.json({
      ok: true,
      txid: signature,
      explorerTx,
      from: fromPubkey.toBase58(),
      to: toPubkey.toBase58(),
      amountUsdt: Number(amountUsdt),
      feeSol,
    });
  } catch (e: any) {
    console.error("USDT send failed:", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
