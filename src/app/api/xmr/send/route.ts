import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callXmrOnce } from "@/lib/xmrRpcPool";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fromWalletId, to, amountXmr, paymentId } = body;

    if (!fromWalletId || !to || !amountXmr)
      return NextResponse.json({ error: "fromWalletId, to, amountXmr required" }, { status: 400 });

    const wallet = await prisma.wallet.findUnique({
      where: { id: Number(fromWalletId) },
      include: { network: true },
    });
    if (!wallet || wallet.network.symbol !== "XMR")
      return NextResponse.json({ error: "Wallet not found or not XMR" }, { status: 400 });

    const meta = wallet.meta ? JSON.parse(wallet.meta) : null;
    if (!meta?.walletName || !meta?.walletPassword)
      return NextResponse.json({ error: "Missing wallet meta" }, { status: 400 });

    const atomic = Math.round(Number(amountXmr) * 1e12);

    // Use pooled RPC
    const result = await callXmrOnce(meta.walletName, meta.walletPassword, "transfer", {
      destinations: [{ address: to, amount: atomic }],
      priority: 0,
      ring_size: 11,
      payment_id: paymentId || undefined,
    });

    const txHash = result.tx_hash || result.tx_hash_list?.[0];

    // Log TX
    await prisma.transaction.create({
      data: {
        userId: wallet.userId,
        walletId: wallet.id,
        type: "TRANSFER",
        tokenId: null,
        amount: new Prisma.Decimal(Number(amountXmr)),
        usdValue: new Prisma.Decimal(0),
        fee: new Prisma.Decimal(0),
        txHash,
        explorerUrl: wallet.network.explorerUrl
          ? `${wallet.network.explorerUrl}/tx/${txHash}`
          : null,
        status: "CONFIRMED",
        fromAddress: wallet.address,
        toAddress: to,
        direction: "SENT",
      },
    });

    return NextResponse.json({
      ok: true,
      txHash,
      explorerTx: wallet.network.explorerUrl
        ? `${wallet.network.explorerUrl}/tx/${txHash}`
        : null,
    });
  } catch (err: any) {
    console.error("❌ XMR send failed:", err.message);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
