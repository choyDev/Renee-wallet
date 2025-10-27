// src/lib/bridge/solanaToTron.ts

import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
  } from "@solana/web3.js";
  import TronWeb from "tronweb";
  
  /**
   * 🔒 Step 1: Lock SOL in Solana vault
   */
  export async function lockSolana({
    privateKeyBase64,
    vaultAddress,
    amountSol,
  }: {
    privateKeyBase64: string;
    vaultAddress: string;
    amountSol: number;
  }) {
    const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
    const secret = Uint8Array.from(Buffer.from(privateKeyBase64, "base64"));
    const keypair = Keypair.fromSecretKey(secret);
  
    const balance = await conn.getBalance(keypair.publicKey);
    const lamportsNeeded = Math.floor(amountSol * LAMPORTS_PER_SOL);
  
    if (balance < lamportsNeeded) {
      throw new Error(
        `Insufficient SOL balance: ${(balance / LAMPORTS_PER_SOL).toFixed(
          4
        )} SOL available, need ${amountSol} SOL`
      );
    }
  
    console.log(
      `🔒 Locking ${amountSol} SOL from ${keypair.publicKey.toBase58()} → ${vaultAddress}`
    );
  
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new PublicKey(vaultAddress),
        lamports: lamportsNeeded,
      })
    );
  
    const sig = await sendAndConfirmTransaction(conn, tx, [keypair]);
    console.log("✅ SOL locked on-chain:", sig);
    return { txHash: sig };
  }
  
  /**
   * 🪙 Step 2: Send equivalent TRX natively (no wrapped token)
   */
  export async function sendNativeTrx({
    privateKey,
    toAddress,
    amountTrx,
  }: {
    privateKey: string;
    toAddress: string;
    amountTrx: number;
  }) {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_NILE_RPC!,
      privateKey,
    });
  
    // ✅ Derive and verify sender address
    const sender = tronWeb.address.fromPrivateKey(privateKey);
    if (!tronWeb.isAddress(sender)) {
      throw new Error(`Invalid derived sender address: ${sender}`);
    }
    if (!tronWeb.isAddress(toAddress)) {
      throw new Error(`Invalid recipient address: ${toAddress}`);
    }
  
    // ✅ Convert to SUN (integer)
    const sunAmount = Math.floor(Number(tronWeb.toSun(amountTrx)));
  
    console.log(`🚀 Sending ${amountTrx} TRX (${sunAmount} sun) from ${sender} → ${toAddress}`);
  
    // ✅ Send transaction (no "Invalid origin" now)
    const tx = await tronWeb.trx.sendTransaction(toAddress, sunAmount);
  
    if (!tx?.result) {
      throw new Error(`TRX transfer failed: ${JSON.stringify(tx)}`);
    }
  
    console.log("✅ TRX sent successfully:", tx.txid);
    return { txHash: tx.txid };
  }
  
  /**
   * 🔄 Step 3: Combined SOL→TRX bridge flow (native only)
   */
  export async function bridgeSolanaToTron({
    solPrivateKey,
    tronPrivateKey,
    solVault,
    tronToAddress,
    solAmount,
    tronAmount,
  }: {
    solPrivateKey: string;
    tronPrivateKey: string;
    solVault: string;
    tronToAddress: string;
    solAmount: number;
    tronAmount: number;
  }) {
    try {
      // 1️⃣ Lock SOL on Solana
      const lockTx = await lockSolana({
        privateKeyBase64: solPrivateKey,
        vaultAddress: solVault,
        amountSol: solAmount,
      });
  
      // 2️⃣ Send equivalent TRX
      const trxTx = await sendNativeTrx({
        privateKey: tronPrivateKey,
        toAddress: tronToAddress,
        amountTrx: tronAmount,
      });
  
      return {
        status: "completed",
        fromTxHash: lockTx.txHash,
        toTxHash: trxTx.txHash,
      };
    } catch (err: any) {
      console.error("bridgeSolanaToTron error:", err);
      return { status: "failed", error: err.message };
    }
  }
  