import { NextResponse } from "next/server";
import { convertRate, SymbolKey } from "@/lib/bridge/rate";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from") as SymbolKey | null;
  const to = url.searchParams.get("to") as SymbolKey | null;
  const amount = parseFloat(url.searchParams.get("amount") || "0");

  // 🔹 Validate query params
  const validSymbols: SymbolKey[] = ["SOL", "ETH", "TRX", "BTC", "USDT"];
  if (!from || !to || !validSymbols.includes(from) || !validSymbols.includes(to)) {
    return NextResponse.json({ error: "Invalid or missing 'from'/'to' parameter" }, { status: 400 });
  }

  // 🔹 Calculate conversion
  const { fromUSD, toAmount } = await convertRate(from, to, amount);

  return NextResponse.json({
    from,
    to,
    amount,
    fromUSD,
    toAmount,
    fee: "0.001",
  });
}
