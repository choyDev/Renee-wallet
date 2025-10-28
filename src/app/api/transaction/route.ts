import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get("userId"));
    const chain = searchParams.get("chain"); // 👈 optional chain filter

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // 1️⃣ Get user's wallets (optionally only for that chain)
    const walletFilter: any = { userId };
    if (chain) {
      walletFilter.network = { symbol: chain };
    }

    const userWallets = await prisma.wallet.findMany({
      where: walletFilter,
      select: { id: true, address: true, network: { select: { symbol: true } } },
    });

    const addresses = userWallets.map((w) => w.address);

    if (addresses.length === 0) {
      return NextResponse.json({ ok: true, transactions: [] });
    }

    // 2️⃣ Fetch transactions involving these addresses
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

    // 3️⃣ Format + direction logic
    const formatted = txs.map((tx) => {
      const isSent = addresses.includes(tx.fromAddress);
      const direction = isSent ? "SENT" : "RECEIVED";
      return {
        id: tx.id,
        txHash: tx.txHash,
        amount: tx.amount,
        fee: tx.fee?.toString(),
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
