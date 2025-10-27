import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const wallets = await prisma.wallet.findMany({
      where: { userId: Number(userId) },
      include: {
        network: true,
      },
    });

    return NextResponse.json({ wallets });
  } catch (err: any) {
    console.error("Error fetching wallets:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
