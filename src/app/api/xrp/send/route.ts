import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { decryptPrivateKey } from "@/lib/wallet";
import { Client, Wallet, Payment } from "xrpl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ---------------------------
   Network Configuration
--------------------------- */
const CHAIN_ENV = process.env.CHAIN_ENV === "testnet" ? "testnet" : "mainnet";

const XRP_NET = {
  name: CHAIN_ENV === "testnet" ? "XRP (Testnet)" : "XRP",
  rpcUrl:
    CHAIN_ENV === "testnet"
      ? "wss://s.altnet.rippletest.net:51233"
      : "wss://xrplcluster.com",
  symbol: "XRP",
  explorerUrl:
    CHAIN_ENV === "testnet"
      ? "https://testnet.xrpl.org/transactions"
      : "https://xrpscan.com/tx",
};

/* ===========================================================
   MAIN SEND HANDLER
=========================================================== */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { fromWalletId, to, amountXrp, memo } = body as {
    fromWalletId: number;
    to: string;
    amountXrp: number | string;
    memo?: string;
  };

  if (!fromWalletId || !to || !amountXrp) {
    return NextResponse.json(
      { error: "fromWalletId, to, amountXrp required" },
      { status: 400 }
    );
  }

  let client: Client | null = null;

  try {
    // 1️⃣ Fetch wallet
    const walletRecord = await prisma.wallet.findUnique({
      where: { id: Number(fromWalletId) },
      include: { network: true },
    });

    if (!walletRecord)
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    if (walletRecord.network.symbol !== "XRP")
      return NextResponse.json({ error: "Not an XRP wallet" }, { status: 400 });

    const secret = decryptPrivateKey(walletRecord.privateKeyEnc!);
    const wallet = Wallet.fromSeed(secret);

    // 2️⃣ Connect to network
    client = new Client(XRP_NET.rpcUrl);
    await client.connect();

    // 3️⃣ Check balance
    const balanceDrops = await client.getXrpBalance(wallet.classicAddress);
    const sendDrops = Math.round(Number(amountXrp) * 1_000_000); // XRP → drops
    const feeDrops = 12; // 0.000012 XRP
    const currentBalanceDrops = Math.round(Number(balanceDrops) * 1_000_000);

    if (sendDrops <= 0)
      return NextResponse.json({ error: "Amount must be > 0" }, { status: 400 });
    if (currentBalanceDrops < sendDrops + feeDrops)
      return NextResponse.json(
        { error: "Insufficient XRP balance" },
        { status: 400 }
      );

    // 4️⃣ Build transaction (typed as Payment)
    const baseTx: Payment = {
      TransactionType: "Payment",
      Account: wallet.classicAddress,
      Amount: sendDrops.toString(),
      Destination: to,
      Memos: memo
        ? [
            {
              Memo: {
                MemoData: Buffer.from(memo, "utf8").toString("hex"),
              },
            },
          ]
        : undefined,
    };

    const prepared = (await client.autofill(baseTx)) as any;
    prepared.LastLedgerSequence = (prepared.LastLedgerSequence ?? 0) + 20;

    // 5️⃣ Sign and submit (with retry on tefMAX_LEDGER)
    const signed = wallet.sign(prepared);

    const submitTx = async () => {
      const res = (await client!.submitAndWait(signed.tx_blob)) as any;
      if (res.result.engine_result === "tefMAX_LEDGER") {
        console.warn("Transaction expired (tefMAX_LEDGER), retrying...");
        const retryPrepared = (await client!.autofill(baseTx)) as any;
        retryPrepared.LastLedgerSequence =
          (retryPrepared.LastLedgerSequence ?? 0) + 20;
        const retrySigned = wallet.sign(retryPrepared);
        return (await client!.submitAndWait(retrySigned.tx_blob)) as any;
      }
      return res;
    };

    const result = await submitTx();
    const txid: string = result.result.hash;
    const engineResult: string = result.result.engine_result;
    const engineMsg: string = result.result.engine_result_message;

    if (engineResult !== "tesSUCCESS") {
      throw new Error(`XRP send failed: ${engineResult} (${engineMsg})`);
    }

    const explorerTx = `${XRP_NET.explorerUrl}/${txid}`;

    // 6️⃣ Log transaction
    await prisma.transaction.create({
      data: {
        userId: walletRecord.userId,
        walletId: walletRecord.id,
        tokenId: null,
        type: "TRANSFER",
        amount: new Prisma.Decimal(Number(amountXrp)),
        usdValue: new Prisma.Decimal(0),
        fee: new Prisma.Decimal(feeDrops / 1_000_000),
        txHash: txid,
        explorerUrl: explorerTx,
        status: "CONFIRMED",
        fromAddress: wallet.classicAddress,
        toAddress: to,
        direction: "SENT",
      },
    });

    // 7️⃣ Respond
    return NextResponse.json({
      ok: true,
      txid,
      explorerTx,
      from: wallet.classicAddress,
      to,
      amountXrp: Number(amountXrp),
      feeXrp: feeDrops / 1_000_000,
    });
  } catch (e: any) {
    console.error("XRP send failed:", e);
    return NextResponse.json(
      { error: e?.message || "Internal error" },
      { status: 500 }
    );
  } finally {
    if (client) await client.disconnect();
  }
}
