// src/lib/bridge/tronUsdtToSolana.ts
import TronWeb from "tronweb";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";

/**
 * 🔹 Constants
 */
const TRON_USDT_CONTRACT = process.env.TRON_TESTNET_USDT_CONTRACT!;  // e.g. "TXYZ..."
const SOLANA_USDT_MINT   = new PublicKey(process.env.USDT_MINT_SOL!); // e.g. "Es9vMFr..."
const SOLANA_RPC         = process.env.SOLANA_DEVNET_RPC!;

/**
 * 🔒 Step 1: Lock USDT (TRC-20) on Tron
 */
export async function lockTronUsdt({
  tronPrivateKey,
  vaultAddress,
  amount,
}: {
  tronPrivateKey: string;
  vaultAddress: string;
  amount: number; // USDT amount
}) {

    const tronWeb = new TronWeb({
        fullHost: process.env.TRON_NILE_RPC!,
        headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
        privateKey: tronPrivateKey,
    });

  const fromAddr = tronWeb.address.fromPrivateKey(tronPrivateKey);
  console.log(`🔒 Locking ${amount} USDT (TRC-20) from ${fromAddr} → vault ${vaultAddress}`);

  const contract = await tronWeb.contract().at(TRON_USDT_CONTRACT);
  const tx = await contract.transfer(vaultAddress, tronWeb.toSun(amount)).send();

  console.log("✅ USDT locked TX:", tx);
  return { txHash: tx };
}

/**
 * 🪙 Step 2: Mint USDT (SPL) on Solana to user
 */
export async function mintSolanaUsdt({
  bridgePrivateKeyBase58,
  solToAddress,
  amount,
}: {
  bridgePrivateKeyBase58: string;
  solToAddress: string;
  amount: number;
}) {
  const conn = new Connection(SOLANA_RPC, "confirmed");
  const secret = bs58.decode(bridgePrivateKeyBase58);
  const bridgeKeypair = Keypair.fromSecretKey(secret);

  const mint = SOLANA_USDT_MINT;
  const userPubkey = new PublicKey(solToAddress);
  const userAta = await getAssociatedTokenAddress(mint, userPubkey);
  const bridgeAta = await getAssociatedTokenAddress(mint, bridgeKeypair.publicKey);

  const tx = new Transaction();

  // Ensure user ATA exists
  const userInfo = await conn.getAccountInfo(userAta);
  if (!userInfo) {
    tx.add(createAssociatedTokenAccountInstruction(
      bridgeKeypair.publicKey,
      userAta,
      userPubkey,
      mint
    ));
  }

  const decimals = 6; // USDT
  const lamports = BigInt(Math.floor(amount * 10 ** decimals));
  tx.add(
    createTransferInstruction(
      bridgeAta,
      userAta,
      bridgeKeypair.publicKey,
      lamports
    )
  );

  const sig = await sendAndConfirmTransaction(conn, tx, [bridgeKeypair]);
  console.log("✅ Minted USDT on Solana:", sig);
  return { txHash: sig };
}

/**
 * 🔄 Combined TRX → SOL USDT Bridge Flow
 */
export async function bridgeTronUsdtToSolana({
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

    // 2️⃣ Mint USDT (SPL)
    const solTx = await mintSolanaUsdt({
      bridgePrivateKeyBase58: solBridgePrivateKeyBase58,
      solToAddress,
      amount,
    });

    console.log("✅ Bridge TRX → SOL USDT completed!");
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
