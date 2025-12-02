import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const totalUsers = await prisma.user.count();

        const kycPending = await prisma.kycverification.count({
            where: { verified: false },
        });

        const totalTx = await prisma.transaction.count();

        const fiatAgg = await prisma.fiatdeposit.aggregate({
            _sum: {
                convertedUSDT: true,
            },
        });

        const totalFiatUSDT = fiatAgg._sum.convertedUSDT || 0;

        const last7days = await prisma.transaction.groupBy({
            by: ["createdAt"],
            _count: {
                _all: true,       
            },
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        const chart = last7days.map((item) => ({
            date: item.createdAt,
            count: item._count._all, 
        }));

        return NextResponse.json({
            totalUsers,
            kycPending,
            totalTx,
            totalFiatUSDT,
            chart,
        });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Dashboard error" }, { status: 500 });
    }
}
