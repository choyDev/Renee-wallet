import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeBridge } from "@/lib/bridge/executeBridge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log(body)
    const { fromUser, fromChain, toChain, fromToken, toToken, amount } = body;
    

    // 🔹 1) Basic validation
    if (!fromUser || !fromChain || !toChain || !fromToken || !toToken || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(body);
    // 🔹 2) Run bridge execution logic
    const result = await executeBridge({
      fromUser: Number(fromUser),
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount: Number(amount),
    });

    console.log(result);

    // 🔹 3) Return response
    if (result.status === "failed") {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bridge: result.db,
      message: "Bridge completed successfully",
    });
  } catch (err: any) {
    console.error("bridge/transfer error:", err);
    return NextResponse.json(
      { error: err.message || "Bridge transfer failed" },
      { status: 500 }
    );
  }
}
