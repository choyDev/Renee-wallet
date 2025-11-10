// src/lib/bridge/splToXrp.ts

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
  import { Client, Wallet } from "xrpl";
  import bs58 from "bs58";
  
  /* ===========================================================
     🔒 1️⃣ Lock SPL-USDT on Solana (User → Bridge Vault)
  =========================================================== */
  async function lockSplUsdt({
    userPrivateKeyBase64,
    vaultAddress,
    amountUsdt,
  }: {
    userPrivateKeyBase64: string;
    vaultAddress: string;
    amountUsdt: number;
  }) {
    try {
      const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
      const secret = Buffer.from(userPrivateKeyBase64, "base64");
      if (secret.length !== 64) throw new Error("Invalid Solana private key (must be 64 bytes base64)");
  
      const userKeypair = Keypair.fromSecretKey(Uint8Array.from(secret));
      const mint = new PublicKey(process.env.USDT_MINT_SOL!);
      const vaultPub = new PublicKey(vaultAddress);
  
      const userATA = await getAssociatedTokenAddress(mint, userKeypair.publicKey);
      const vaultATA = await getAssociatedTokenAddress(mint, vaultPub);
  
      const tx = new Transaction();
      const lamports = BigInt(Math.floor(amountUsdt * 10 ** 6)); // USDT decimals = 6
  
      const vaultInfo = await conn.getAccountInfo(vaultATA);
      if (!vaultInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            userKeypair.publicKey,
            vaultATA,
            vaultPub,
            mint
          )
        );
      }
  
      tx.add(
        createTransferInstruction(userATA, vaultATA, userKeypair.publicKey, lamports)
      );
  
      const sig = await sendAndConfirmTransaction(conn, tx, [userKeypair]);
      console.log(`🔒 Locked ${amountUsdt} SPL-USDT from ${userKeypair.publicKey.toBase58()} → ${vaultAddress} | TX: ${sig}`);
      return { txHash: sig };
    } catch (err: any) {
      console.error("lockSplUsdt error:", err);
      throw new Error(err.message || "Failed to lock SPL-USDT");
    }
  }
  
  /* ===========================================================
     💸 2️⃣ Send native XRP (Bridge → User)
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
  
      const accInfo = await client.request({
        command: "account_info",
        account: fromAddress,
      });
      const sequence = accInfo.result.account_data.Sequence;
      const ledgerIndex = accInfo.result.ledger_current_index ?? 0;
  
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
  
      if (txResult !== "tesSUCCESS")
        throw new Error(`XRP send failed: ${txResult}`);
  
      console.log(`✅ Sent ${amountXrp} XRP to ${toAddress} | TX: ${explorer}/transactions/${txHash}`);
      return { txHash };
    } catch (err: any) {
      console.error("sendXrpFromBridge error:", err);
      throw new Error(err.message || "Failed to send XRP");
    }
  }
  
  /* ===========================================================
     🔄 3️⃣ Combined Bridge: SPL-USDT → XRP
  =========================================================== */
  export async function bridgeSplToXrp({
    solUserPrivateKey,
    solVaultAddress,
    xrpBridgeSeed,
    xrpToAddress,
    amountUsdt,
    amountXrp,
  }: {
    solUserPrivateKey: string;
    solVaultAddress: string;
    xrpBridgeSeed: string;
    xrpToAddress: string;
    amountUsdt: number;
    amountXrp: number;
  }) {
    try {
      console.log(`🔹 Starting SPL-USDT → XRP bridge for ${amountUsdt} USDT`);
  
      // Step 1️⃣ Lock SPL-USDT on Solana
      const solTx = await lockSplUsdt({
        userPrivateKeyBase64: solUserPrivateKey,
        vaultAddress: solVaultAddress,
        amountUsdt,
      });
  
      // Step 2️⃣ Send XRP
      const xrpTx = await sendXrpFromBridge({
        bridgeSeed: xrpBridgeSeed,
        toAddress: xrpToAddress,
        amountXrp,
        memo: `Bridge SPL→XRP ${solTx.txHash}`,
      });
  
      console.log("✅ Bridge SPL-USDT → XRP completed!");
      return {
        status: "completed",
        fromTxHash: solTx.txHash,
        toTxHash: xrpTx.txHash,
      };
    } catch (err: any) {
      console.error("bridgeSplToXrp error:", err);
      return { status: "failed", error: err.message };
    }
  }
  