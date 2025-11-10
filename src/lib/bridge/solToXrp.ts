// src/lib/bridge/solToXrp.ts

import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
  } from "@solana/web3.js";
  import { Client, Wallet } from "xrpl";
  
  /* ===========================================================
     🔒 1️⃣ Lock SOL on Solana (User → Bridge Vault)
  =========================================================== */
  async function lockSolana({
    privateKeyBase64,
    vaultAddress,
    amountSol,
  }: {
    privateKeyBase64: string;
    vaultAddress: string;
    amountSol: number;
  }) {
    try {
      const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
      const secret = Uint8Array.from(Buffer.from(privateKeyBase64, "base64"));
      const keypair = Keypair.fromSecretKey(secret);
      const userAddr = keypair.publicKey.toBase58();
  
      const balance = await conn.getBalance(keypair.publicKey);
      const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
  
      if (balance < lamports)
        throw new Error(
          `Insufficient SOL balance. ${(balance / LAMPORTS_PER_SOL).toFixed(
            4
          )} SOL available`
        );
  
      console.log(`🔒 Locking ${amountSol} SOL from ${userAddr} → ${vaultAddress}`);
  
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: new PublicKey(vaultAddress),
          lamports,
        })
      );
  
      const sig = await sendAndConfirmTransaction(conn, tx, [keypair]);
      console.log("✅ Locked SOL TX:", sig);
      return { txHash: sig };
    } catch (err: any) {
      console.error("lockSolana error:", err);
      throw new Error(err.message || "Failed to lock SOL");
    }
  }
  
  /* ===========================================================
     💸 2️⃣ Send native XRP from Bridge Vault → User
  =========================================================== */
  async function sendXrpFromBridge({
    bridgeSeed,
    toAddress,
    amountXrp,
    memo,
  }: {
    bridgeSeed: string;
    toAddress: string;
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
  
      const wallet = Wallet.fromSeed(bridgeSeed);
      const fromAddress = wallet.address;
  
      const accountInfo = await client.request({
        command: "account_info",
        account: fromAddress,
      });
  
      const sequence = accountInfo.result.account_data.Sequence;
      const ledgerIndex = accountInfo.result.ledger_current_index ?? 0;
  
      const tx: any = {
        TransactionType: "Payment",
        Account: fromAddress,
        Destination: toAddress,
        Amount: (BigInt(Math.floor(amountXrp * 1_000_000))).toString(), // drops
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
  
      if (txResult !== "tesSUCCESS") {
        throw new Error(`XRP send failed: ${txResult}`);
      }
  
      console.log(`✅ Sent ${amountXrp} XRP to ${toAddress} | TX: ${explorer}/transactions/${txHash}`);
      return { txHash };
    } catch (err: any) {
      console.error("sendXrpFromBridge error:", err);
      throw new Error(err.message || "Failed to send XRP");
    }
  }
  
  /* ===========================================================
     🔄 3️⃣ Combined Bridge: SOL → XRP
  =========================================================== */
  export async function bridgeSolToXrp({
    solPrivateKey,
    solVaultAddress,
    xrpBridgeSeed,
    xrpToAddress,
    amountSol,
    amountXrp,
  }: {
    solPrivateKey: string;
    solVaultAddress: string;
    xrpBridgeSeed: string;
    xrpToAddress: string;
    amountSol: number;
    amountXrp: number;
  }) {
    try {
      console.log(`🔹 Starting SOL → XRP bridge for ${amountSol} SOL`);
  
      // Step 1️⃣ Lock SOL
      const solTx = await lockSolana({
        privateKeyBase64: solPrivateKey,
        vaultAddress: solVaultAddress,
        amountSol,
      });
  
      // Step 2️⃣ Send XRP
      const xrpTx = await sendXrpFromBridge({
        bridgeSeed: xrpBridgeSeed,
        toAddress: xrpToAddress,
        amountXrp,
        memo: `Bridge SOL→XRP ${solTx.txHash}`,
      });
  
      console.log("✅ Bridge SOL → XRP completed!");
      return {
        status: "completed",
        fromTxHash: solTx.txHash,
        toTxHash: xrpTx.txHash,
      };
    } catch (err: any) {
      console.error("bridgeSolToXrp error:", err);
      return { status: "failed", error: err.message };
    }
  }
  