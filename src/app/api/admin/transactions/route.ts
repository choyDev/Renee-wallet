import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = 10; // ✅ static 10 per page
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { txHash: { contains: search, mode: "insensitive" } },
        { fromAddress: { contains: search, mode: "insensitive" } },
        { toAddress: { contains: search, mode: "insensitive" } }
      ];
    }

    const total = await prisma.transaction.count({ where });

    const txs = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        wallet: { include: { network: true } }
      }
    });

    // Map address → user lookup
    const addresses = [
      ...txs.map((t) => t.fromAddress),
      ...txs.map((t) => t.toAddress)
    ].filter(Boolean);

    const userWallets = await prisma.wallet.findMany({
      where: { address: { in: addresses } },
      include: { user: true }
    });

    const userByAddress: Record<string, any> = {};
    userWallets.forEach((w) => {
      userByAddress[w.address] = w.user;
    });

    const formatted = txs.map((tx) => ({
      id: tx.id,
      txHash: tx.txHash,
      amount: tx.amount,
      fee: tx.fee?.toString(),
      token: tx.tokenId ? "USDT" : tx.wallet?.network?.symbol || "UNKNOWN",
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      fromUser: userByAddress[tx.fromAddress] ?? null,
      toUser: userByAddress[tx.toAddress] ?? null,
      createdAt: tx.createdAt,
      status: tx.status
    }));

    return NextResponse.json({
      ok: true,
      transactions: formatted,
      total,
      page,
      limit
    });

  } catch (err) {
    console.error("ADMIN TX FETCH ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
