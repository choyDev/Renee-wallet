import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { page = 1, limit = 20, search = "" } = await req.json();

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { fullName: { contains: search, mode: "insensitive" } },
            { walletAddress: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      where,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.user.count({ where });

    return NextResponse.json({
      users,
      total,
      page,
      limit,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}
