import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { decryptPrivateKey } from "@/lib/wallet";
import { Client, Wallet } from "xrpl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function envs() {
  const isTest = process.env.CHAIN_ENV === "testnet";
  const rpcUrl = isTest
    ? "wss://s.altnet.rippletest.net:51233"
    : "wss://xrplcluster.com";
  const explorer = isTest
    ? "https://testnet.xrpl.org"
    : "https://xrpscan.com";
  return { isTest, rpcUrl, explorer };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fromWalletId, to, amountXrp, memo } = body as {
      fromWalletId: number;
      to: string;
      amountXrp: string | number;
      memo?: string;
    };

    if (!fromWalletId || !to || amountXrp === undefined)
      return NextResponse.json(
        { error: "fromWalletId, to, amountXrp required" },
        { status: 400 }
      );

    const { rpcUrl, explorer } = envs();

    // Load wallet
    const wallet = await prisma.wallet.findUnique({
      where: { id: Number(fromWalletId) },
      include: { network: true },
    });
    if (!wallet)
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    if (wallet.network?.symbol !== "XRP")
      return NextResponse.json({ error: "Wallet is not XRP" }, { status: 400 });

    const fromAddress = wallet.address;
    const secret = decryptPrivateKey(wallet.privateKeyEnc!);

    // Connect to XRPL node
    const client = new Client(rpcUrl);
    await client.connect();

    const accInfo = await client.request({
      command: "account_info",
      account: fromAddress,
    });

    const serverInfo = await client.request({ command: "server_info" });
    const baseFeeXrp =
      serverInfo.result.info?.validated_ledger?.base_fee_xrp ?? 0.00001;

    const sequence = accInfo.result.account_data.Sequence;
    const ledgerIndex = accInfo.result.ledger_current_index ?? 0;


    // Build TX
    const tx: any = {
      TransactionType: "Payment",
      Account: fromAddress,
      Destination: to,
      Amount: (Number(amountXrp) * 1_000_000).toString(), // drops
      Fee: (Number(baseFeeXrp) * 1_000_000).toString(),
      Sequence: sequence,
      LastLedgerSequence: ledgerIndex + 10,
    };

    if (memo) {
      tx.Memos = [
        {
          Memo: { MemoData: Buffer.from(memo, "utf8").toString("hex") },
        },
      ];
    }

    // Sign & broadcast
    const walletXrp = Wallet.fromSeed(secret);
    const signed = walletXrp.sign(tx);
    const submit = await client.submitAndWait(signed.tx_blob);
    await client.disconnect();

    const result = submit.result;
    const txHash = result.hash;
    const txMeta =
      result.meta && typeof result.meta === "object" ? (result.meta as any) : null;
    const txResult = txMeta?.TransactionResult ?? "UNKNOWN";
    const explorerTx = `${explorer}/transactions/${txHash}`;

    // Save DB record
    await prisma.transaction.create({
      data: {
        userId: wallet.userId,
        walletId: wallet.id,
        tokenId: null,
        type: "TRANSFER",
        amount: new Prisma.Decimal(Number(amountXrp)),
        usdValue: new Prisma.Decimal(0),
        fee: new Prisma.Decimal(Number(baseFeeXrp)),
        txHash,
        explorerUrl: explorerTx,
        status: txResult === "tesSUCCESS" ? "CONFIRMED" : "PENDING",
        fromAddress,
        toAddress: to,
        direction: "SENT",
      },
    });

    // Respond
    return NextResponse.json({
      ok: true,
      txid: txHash,
      explorerTx,
      from: fromAddress,
      to,
      amountXrp: Number(amountXrp),
      feeXrp: Number(baseFeeXrp),
      result: txResult,
    });
  } catch (e: any) {
    console.error("XRP send failed:", e);
    return NextResponse.json(
      { error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}
