import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { decryptPrivateKey } from "@/lib/wallet";
import TronWeb from "tronweb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// -----------------------------
// Network config
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

// USDT TRC-20 contract address
const USDT_CONTRACT =
  CHAIN_ENV === "testnet"
    ? process.env.TRON_TESTNET_USDT_CONTRACT || "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf" // fake or test
    : "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj"; // Mainnet official

// -----------------------------
// POST /api/tron/send-usdt
// -----------------------------
export async function POST(req: Request) {
  try {
    const { fromWalletId, to, amountUsdt } = await req.json();

    if (!fromWalletId || !to || !amountUsdt) {
      return NextResponse.json(
        { error: "fromWalletId, to, amountUsdt required" },
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

    // 4️⃣ Validate destination
    if (!tronWeb.isAddress(to)) {
      return NextResponse.json({ error: "Invalid TRON address" }, { status: 400 });
    }

    // 5️⃣ Get USDT contract
    const contract = await tronWeb.contract().at(USDT_CONTRACT);

    // 6️⃣ Convert amount → USDT decimals (6)
    const usdtAmount = Math.floor(Number(amountUsdt) * 1_000_000);
    if (usdtAmount <= 0) {
      return NextResponse.json({ error: "Invalid amountUsdt" }, { status: 400 });
    }

    // 7️⃣ Estimate TRX for energy fee
    const balance = await tronWeb.trx.getBalance(wallet.address);
    if (balance < 1_000_000) {
      return NextResponse.json({ error: "Insufficient TRX to pay energy fee" }, { status: 400 });
    }

    // 8️⃣ Call contract transfer
    const tx = await contract.transfer(to, usdtAmount).send({
      feeLimit: 20_000_000, // 20 TRX max fee cap
    });

    // tx returns transaction hash
    const txid = tx;
    const explorerTx = `${EXPLORER_BASE}${txid}`;

    // 9️⃣ Wait + get fee
    let feeTrx = 0;
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const info = await tronWeb.trx.getTransactionInfo(txid);
      if (info && typeof info.fee === "number") feeTrx = info.fee / 1_000_000;
    } catch (err) {
      console.warn("⚠️ Could not fetch fee:", err);
    }

    // 🔟 Store in database
    await prisma.transaction.create({
      data: {
        userId: wallet.userId,
        walletId: wallet.id,
        tokenId: null, // could link to your Token model
        type: "TRANSFER",
        amount: new Prisma.Decimal(Number(amountUsdt)),
        fee: new Prisma.Decimal(feeTrx),
        usdValue: new Prisma.Decimal(0),
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
      amountUsdt: Number(amountUsdt),
      feeTrx,
    });
  } catch (err: any) {
    console.error("TRON USDT send failed:", err);
    const msg =
      process.env.NODE_ENV !== "production"
        ? err?.message || "Internal error"
        : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
