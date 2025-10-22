import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/transactions
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get("userId"));
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // 1️⃣ Fetch all transactions related to user wallets (sent or received)
    const userWallets = await prisma.wallet.findMany({
      where: { userId },
      select: { id: true, address: true },
    });
    const addresses = userWallets.map(w => w.address);

    const txs = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromAddress: { in: addresses } },
          { toAddress: { in: addresses } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        wallet: { include: { network: true } },
      },
    });

    // 2️⃣ Compute direction dynamically
    const formatted = txs.map(tx => {
      const isSent = addresses.includes(tx.fromAddress);
      const direction = isSent ? "SENT" : "RECEIVED";
      return {
        id: tx.id,
        txHash: tx.txHash,
        amount: tx.amount,
        fee: tx.fee,
        token: tx.tokenId ? "USDT" : tx.wallet?.network?.symbol || "UNKNOWN",
        type: tx.type,
        direction,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        explorerUrl: tx.explorerUrl,
        createdAt: tx.createdAt,
        status: tx.status,
      };
    });

    return NextResponse.json({ ok: true, transactions: formatted });
  } catch (err: any) {
    console.error("Fetch transactions failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
