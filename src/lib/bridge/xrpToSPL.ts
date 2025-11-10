// src/lib/bridge/xrpToSpl.ts

import { Client, Wallet } from "xrpl";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from "@solana/spl-token";
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
        {
          Memo: { MemoData: Buffer.from(memo, "utf8").toString("hex") },
        },
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
      throw new Error(`XRP lock failed: ${txResult}`);

    console.log(`✅ Locked ${amountXrp} XRP | TX: ${explorer}/transactions/${txHash}`);
    return { txHash };
  } catch (err: any) {
    console.error("lockXrpToVault error:", err);
    throw new Error(err.message || "Failed to lock XRP");
  }
}

/* ===========================================================
   💸 2️⃣ Send SPL-USDT (Bridge → Solana User)
=========================================================== */
async function sendSplUsdt({
  bridgePrivateKeyBase58,
  solToAddress,
  amountUsdt,
}: {
  bridgePrivateKeyBase58: string;
  solToAddress: string;
  amountUsdt: number;
}) {
  try {
    const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
    const bridgeKeypair = Keypair.fromSecretKey(bs58.decode(bridgePrivateKeyBase58));
    const mint = new PublicKey(process.env.USDT_MINT_SOL!);
    const toPub = new PublicKey(solToAddress);

    const bridgeATA = await getAssociatedTokenAddress(mint, bridgeKeypair.publicKey);
    const toATA = await getAssociatedTokenAddress(mint, toPub);

    const tx = new Transaction();
    const lamports = BigInt(Math.floor(amountUsdt * 10 ** 6)); // 6 decimals

    const toInfo = await conn.getAccountInfo(toATA);
    if (!toInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          bridgeKeypair.publicKey,
          toATA,
          toPub,
          mint
        )
      );
    }

    tx.add(
      createTransferInstruction(bridgeATA, toATA, bridgeKeypair.publicKey, lamports)
    );

    const sig = await sendAndConfirmTransaction(conn, tx, [bridgeKeypair]);
    console.log(`✅ Sent ${amountUsdt} SPL-USDT → ${solToAddress} | TX: ${sig}`);
    return { txHash: sig };
  } catch (err: any) {
    console.error("sendSplUsdt error:", err);
    throw new Error(err.message || "Failed to send SPL-USDT");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge: XRP → SPL-USDT
=========================================================== */
export async function bridgeXrpToSpl({
  xrpUserSeed,
  xrpVaultAddress,
  solBridgePrivateKeyBase58,
  solToAddress,
  amountXrp,
  amountUsdt,
}: {
  xrpUserSeed: string;
  xrpVaultAddress: string;
  solBridgePrivateKeyBase58: string;
  solToAddress: string;
  amountXrp: number;
  amountUsdt: number;
}) {
  try {
    console.log(`🔹 Starting XRP → SPL-USDT bridge for ${amountXrp} XRP`);

    // 1️⃣ Lock XRP on XRPL
    const xrpTx = await lockXrpToVault({
      userSeed: xrpUserSeed,
      vaultAddress: xrpVaultAddress,
      amountXrp,
      memo: "Bridge XRP→SPL-USDT",
    });

    // 2️⃣ Send SPL-USDT
    const solTx = await sendSplUsdt({
      bridgePrivateKeyBase58: solBridgePrivateKeyBase58,
      solToAddress,
      amountUsdt,
    });

    console.log("✅ Bridge XRP → SPL-USDT completed!");
    return {
      status: "completed",
      fromTxHash: xrpTx.txHash,
      toTxHash: solTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeXrpToSpl error:", err);
    return { status: "failed", error: err.message };
  }
}
