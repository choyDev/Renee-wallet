// src/lib/bridge/xrpToSol.ts

import { Client, Wallet } from "xrpl";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import bs58 from "bs58";

/* ===========================================================
   🔹 1️⃣ Lock native XRP (User → Bridge Vault)
=========================================================== */
async function lockXrpToVault({
  userSeed,
  vaultAddress,
  amountXrp,
  memo,
}: {
  userSeed: string;
  vaultAddress: string;
  amountXrp: number;
  memo?: string;
}) {
  try {
    const isTest = process.env.CHAIN_ENV === "testnet";
    const rpcUrl = isTest
      ? "wss://s.altnet.rippletest.net:51233"
      : "wss://xrplcluster.com";
    const explorer = isTest
      ? "https://testnet.xrpl.org"
      : "https://xrpscan.com";

    const client = new Client(rpcUrl);
    await client.connect();

    const wallet = Wallet.fromSeed(userSeed);
    const fromAddr = wallet.address;

    console.log(`🔒 Locking ${amountXrp} XRP from ${fromAddr} → vault ${vaultAddress}`);

    const accountInfo = await client.request({
      command: "account_info",
      account: fromAddr,
    });

    const sequence = accountInfo.result.account_data.Sequence;
    const ledgerIndex = accountInfo.result.ledger_current_index ?? 0;

    const tx: any = {
      TransactionType: "Payment",
      Account: fromAddr,
      Destination: vaultAddress,
      Amount: (BigInt(Math.floor(amountXrp * 1_000_000))).toString(),
      Fee: "12",
      Sequence: sequence,
      LastLedgerSequence: ledgerIndex + 10,
    };

    if (memo) {
      tx.Memos = [
        { Memo: { MemoData: Buffer.from(memo, "utf8").toString("hex") } },
      ];
    }

    const signed = wallet.sign(tx);
    const submit = await client.submitAndWait(signed.tx_blob);
    await client.disconnect();

    const result = submit.result;
    const txHash = result.hash;
    const txResult =
      typeof result.meta === "object" && "TransactionResult" in result.meta
        ? (result.meta as any).TransactionResult
        : "UNKNOWN";

    if (txResult !== "tesSUCCESS")
      throw new Error(`Lock failed: ${txResult}`);

    console.log(`✅ Locked ${amountXrp} XRP | TX: ${explorer}/transactions/${txHash}`);
    return { txHash };
  } catch (err: any) {
    console.error("lockXrpToVault error:", err);
    throw new Error(err.message || "Failed to lock XRP");
  }
}

/* ===========================================================
   💸 2️⃣ Send native SOL from Bridge → User
=========================================================== */
async function sendNativeSol({
  bridgePrivateKeyBase58,
  solToAddress,
  amountSol,
}: {
  bridgePrivateKeyBase58: string;
  solToAddress: string;
  amountSol: number;
}) {
  try {
    const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
    const secret = bs58.decode(bridgePrivateKeyBase58);
    const bridgeKeypair = Keypair.fromSecretKey(secret);
    const toPubkey = new PublicKey(solToAddress);

    const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
    const balance = await conn.getBalance(bridgeKeypair.publicKey);
    if (balance < lamports)
      throw new Error("Insufficient SOL balance in bridge vault");

    console.log(
      `🚀 Sending ${amountSol} SOL from ${bridgeKeypair.publicKey.toBase58()} → ${solToAddress}`
    );

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: bridgeKeypair.publicKey,
        toPubkey,
        lamports,
      })
    );

    const sig = await sendAndConfirmTransaction(conn, tx, [bridgeKeypair]);
    console.log(`✅ Sent SOL | TX: ${sig}`);
    return { txHash: sig };
  } catch (err: any) {
    console.error("sendNativeSol error:", err);
    throw new Error(err.message || "Failed to send SOL");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge: XRP → SOL
=========================================================== */
export async function bridgeXrpToSol({
  xrpUserSeed,
  xrpVaultAddress,
  solBridgePrivateKeyBase58,
  solToAddress,
  amountXrp,
  amountSol,
}: {
  xrpUserSeed: string;
  xrpVaultAddress: string;
  solBridgePrivateKeyBase58: string;
  solToAddress: string;
  amountXrp: number;
  amountSol: number;
}) {
  try {
    console.log(`🔹 Starting XRP → SOL bridge for ${amountXrp} XRP`);

    // 1️⃣ Lock XRP
    const xrpTx = await lockXrpToVault({
      userSeed: xrpUserSeed,
      vaultAddress: xrpVaultAddress,
      amountXrp,
      memo: "Bridge XRP→SOL",
    });

    // 2️⃣ Send SOL
    const solTx = await sendNativeSol({
      bridgePrivateKeyBase58: solBridgePrivateKeyBase58,
      solToAddress,
      amountSol,
    });

    console.log("✅ Bridge XRP → SOL completed!");
    return {
      status: "completed",
      fromTxHash: xrpTx.txHash,
      toTxHash: solTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeXrpToSol error:", err);
    return { status: "failed", error: err.message };
  }
}
