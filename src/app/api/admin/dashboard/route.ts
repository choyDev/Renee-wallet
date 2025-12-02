import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalUsers = await prisma.user.count();

    const kycPending = await prisma.kycverification.count({
      where: { verified: false },
    });

    const totalTx = await prisma.transaction.count();

    return NextResponse.json({
      totalUsers,
      kycPending,
      totalTx,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Dashboard error" }, { status: 500 });
  }
}
