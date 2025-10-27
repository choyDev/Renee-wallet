import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureWalletsForUser } from "@/lib/wallet";

export async function POST(req: Request) {
  try {
    const { userId, kycType } = await req.json();

    const kycTypeEnum = kycType.toUpperCase();

    if (!userId || !kycType) {
      return NextResponse.json({ error: "Missing userId or kycType" }, { status: 400 });
    }

    console.log(`🧾 Starting KYC verification for user ${userId} (${kycType})...`);

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let kyc = await prisma.kycverification.findFirst({ where: { userId: user.id } });

    if (kyc) {
      kyc = await prisma.kycverification.update({
        where: { id: kyc.id },
        data: { type: kycTypeEnum, verified: true },
      });
    } else {
      kyc = await prisma.kycverification.create({
        data: { userId: user.id, type: kycTypeEnum, verified: true },
      });
    }

    console.log(` KYC verified for user ${user.id}`);

    //  Generate blockchain wallets
    const wallets = await ensureWalletsForUser(user.id);

    console.log(` Wallets created for user ${user.id}: ${wallets.length}`);

    return NextResponse.json({
      message: "KYC verified and wallets created successfully",
      kyc,
      wallets: wallets.map(w => ({
        id: w.id,
        address: w.address,
        network: w.network.name,
        symbol: w.network.symbol,
      })),
    });
  } catch (error) {
    console.error("❌ KYC Verify Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
