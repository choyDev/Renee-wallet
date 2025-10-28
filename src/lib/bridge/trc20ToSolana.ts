// src/lib/bridge/tronUsdtToSolana.ts
import TronWeb from "tronweb";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";

const TRON_USDT_CONTRACT = process.env.TRON_TESTNET_USDT_CONTRACT!;
const SOLANA_RPC = process.env.SOLANA_DEVNET_RPC!;

/** 🔒 Lock TRC20 USDT on Tron */
export async function lockTronUsdt({ tronPrivateKey, vaultAddress, amount }: {
  tronPrivateKey: string;
  vaultAddress: string;
  amount: number;
}) {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    privateKey: tronPrivateKey,
  });

  const fromAddr = tronWeb.address.fromPrivateKey(tronPrivateKey);
  console.log(`🔒 Locking ${amount} USDT from ${fromAddr} → ${vaultAddress}`);

  const contract = await tronWeb.contract().at(TRON_USDT_CONTRACT);
  const tx = await contract.transfer(vaultAddress, tronWeb.toSun(amount)).send();

  console.log("✅ USDT locked TX:", tx);
  return { txHash: tx };
}

/** 💸 Send native SOL to user */
export async function sendSolToUser({
  bridgePrivateKeyBase58,
  solToAddress,
  amountSol,
}: {
  bridgePrivateKeyBase58: string;
  solToAddress: string;
  amountSol: number;
}) {
  const connection = new Connection(SOLANA_RPC, "confirmed");
  const bridgeKey = Keypair.fromSecretKey(bs58.decode(bridgePrivateKeyBase58));
  const toPubkey = new PublicKey(solToAddress);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: bridgeKey.publicKey,
      toPubkey,
      lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
    })
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [bridgeKey]);
  console.log(`✅ Sent ${amountSol} SOL to ${solToAddress} — Tx: ${sig}`);
  return { txHash: sig };
}

/** 🔄 Combined TRX → SOL Bridge Flow */
export async function bridgeTRC20ToSPL({
  tronPrivateKey,
  tronVault,
  solBridgePrivateKeyBase58,
  solToAddress,
  amount,
}: {
  tronPrivateKey: string;
  tronVault: string;
  solBridgePrivateKeyBase58: string;
  solToAddress: string;
  amount: number;
}) {
  try {
    // 1️⃣ Lock USDT (TRC-20)
    const tronTx = await lockTronUsdt({
      tronPrivateKey,
      vaultAddress: tronVault,
      amount,
    });

    // 2️⃣ Send SOL equivalent to user
    const solAmount = amount / 10; // example conversion rate
    const solTx = await sendSolToUser({
      bridgePrivateKeyBase58: solBridgePrivateKeyBase58,
      solToAddress,
      amountSol: solAmount,
    });

    console.log("✅ Bridge TRC20 USDT → SOL completed!");
    return {
      status: "completed",
      fromTxHash: tronTx.txHash,
      toTxHash: solTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeTronUsdtToSolana error:", err);
    return { status: "failed", error: err.message };
  }
}
