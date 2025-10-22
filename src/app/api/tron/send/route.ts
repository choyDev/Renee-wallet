import { NextResponse } from "next/server";
import { prisma, } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { decryptPrivateKey } from "@/lib/wallet";
import TronWeb from "tronweb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// -----------------------------
// RPC / Explorer helpers
// -----------------------------
const CHAIN_ENV = process.env.CHAIN_ENV === "testnet" ? "testnet" : "mainnet";

const RPC_URL =
  CHAIN_ENV === "testnet"
    ? process.env.TRON_NILE_RPC || "https://nile.trongrid.io"
    : "https://api.trongrid.io";

const EXPLORER_BASE =
  CHAIN_ENV === "testnet"
    ? "https://nile.tronscan.org/#/transaction/"
    : "https://tronscan.org/#/transaction/";

// -----------------------------
// POST /api/tron/send
// -----------------------------
export async function POST(req: Request) {
  try {
    const { fromWalletId, to, amountTrx } = await req.json();

    if (!fromWalletId || !to || amountTrx === undefined) {
      return NextResponse.json(
        { error: "fromWalletId, to, amountTrx required" },
        { status: 400 }
      );
    }

    // 1️⃣ Find wallet
    const wallet = await prisma.wallet.findUnique({
      where: { id: Number(fromWalletId) },
      include: { network: true },
    });
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    if (wallet.network?.symbol !== "TRX") {
      return NextResponse.json({ error: "Wallet is not TRON" }, { status: 400 });
    }

    // 2️⃣ Decrypt private key
    if (!wallet.privateKeyEnc) {
      return NextResponse.json({ error: "Encrypted private key missing" }, { status: 400 });
    }
    const privateKey = decryptPrivateKey(wallet.privateKeyEnc);

    // 3️⃣ Init TronWeb instance
    const tronWeb = new TronWeb({
      fullHost: wallet.network.rpcUrl || RPC_URL,
      headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
      privateKey,
    });

    // 4️⃣ Validate recipient address
    if (!tronWeb.isAddress(to)) {
      return NextResponse.json({ error: "Invalid TRON address" }, { status: 400 });
    }

    // 5️⃣ Convert amount to SUN (1 TRX = 1e6 SUN)
    const sunAmount = Math.floor(Number(amountTrx) * 1_000_000);
    if (!Number.isFinite(sunAmount) || sunAmount <= 0) {
      return NextResponse.json({ error: "amountTrx must be > 0" }, { status: 400 });
    }

    // 6️⃣ Optional: check balance (requires privateKey)
    const balance = await tronWeb.trx.getBalance(wallet.address);
    if (balance < sunAmount) {
      return NextResponse.json(
        {
          error: `Insufficient funds: have ${(balance / 1_000_000).toFixed(
            6
          )} TRX, need ${(sunAmount / 1_000_000).toFixed(6)} TRX`,
        },
        { status: 400 }
      );
    }

    // 7️⃣ Build transaction
    const unsignedTx = await tronWeb.transactionBuilder.sendTrx(
      to,
      sunAmount,
      wallet.address
    );

    // 8️⃣ Sign + broadcast
    const signedTx = await tronWeb.trx.sign(unsignedTx, privateKey);
    const receipt = await tronWeb.trx.sendRawTransaction(signedTx);

    if (!receipt.result) {
      return NextResponse.json(
        { error: "Transaction broadcast failed", receipt },
        { status: 500 }
      );
    }

    let feeTrx = 0;
    try {
      await new Promise((r) => setTimeout(r, 1000)); // wait for indexing
      const txInfo = await tronWeb.trx.getTransactionInfo(receipt.txid);
      if (txInfo && typeof txInfo.fee === "number") {
        feeTrx = txInfo.fee / 1_000_000; // SUN → TRX
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch TRON fee:", err);
    }

    // 9️⃣ Prepare explorer + values
    const txid = receipt.txid || signedTx.txID;
    const explorerTx = `${EXPLORER_BASE}${txid}`;
    const trxAmount = Number(amountTrx);

    // 🔟 Store transaction in database
    await prisma.transaction.create({
      data: {
        userId: wallet.userId,
        walletId: wallet.id,
        tokenId: null, // TRX = native coin, no tokenId
        type: "TRANSFER",
        amount: new Prisma.Decimal(trxAmount),
        fee: new Prisma.Decimal(feeTrx),
        usdValue: new Prisma.Decimal(0), // optional - can update later
        txHash: txid,
        explorerUrl: explorerTx,
        status: "CONFIRMED",
        fromAddress: wallet.address,
        toAddress: to,
        direction: "SENT",
      },
    });

    

    return NextResponse.json({
      ok: true,
      txid,
      explorerTx,
      from: wallet.address,
      to,
      amountTrx: Number(amountTrx),
    });
  } catch (err: any) {
    console.error("TRX send failed:", err);
    const msg =
      process.env.NODE_ENV !== "production"
        ? err?.message || "Internal error"
        : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
