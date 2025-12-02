import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.feeSetting.findMany();
  const fees: any = {};
  rows.forEach((r) => (fees[r.key] = Number(r.value)));
  return NextResponse.json(fees);
}

export async function POST(req: Request) {
  const body = await req.json();

  for (const key of Object.keys(body)) {
    await prisma.feeSetting.upsert({
      where: { key },
      update: { value: body[key] },
      create: { key, value: body[key] },
    });
  }

  return NextResponse.json({ success: true });
}
