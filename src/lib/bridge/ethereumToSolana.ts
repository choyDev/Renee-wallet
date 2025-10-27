// src/lib/bridge/ethereumToSolana.ts
import { ethers } from "ethers";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import bs58 from "bs58"; // ✅ decode Base58 keys

/**
 * 🔒 Step 1: Lock ETH from user wallet into vault
 */
export async function lockEthForSol({
  ethPrivateKey,
  ethVault,
  ethAmount,
}: {
  ethPrivateKey: string;
  ethVault: string;
  ethAmount: number;
}) {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
  const userWallet = new ethers.Wallet(ethPrivateKey, provider);
  const value = ethers.parseEther(ethAmount.toFixed(18));

  console.log(`🔒 Locking ${ethAmount} ETH from ${userWallet.address} → vault ${ethVault}`);

  const tx = await userWallet.sendTransaction({ to: ethVault, value });
  const receipt = await tx.wait(1);
  if (!receipt) throw new Error("ETH lock failed (no receipt)");
  console.log("✅ ETH locked TX:", receipt.hash);
  return { txHash: receipt.hash };
}

/**
 * 🪙 Step 2: Mint SOL to user (bridge wallet → user)
 */
export async function mintSolToUser({
  solBridgePrivateKeyBase58,
  solToAddress,
  solAmount,
}: {
  solBridgePrivateKeyBase58: string;
  solToAddress: string;
  solAmount: number;
}) {
  const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");

  // ✅ Decode Base58 key (NOT Base64)
  const secret = bs58.decode(solBridgePrivateKeyBase58);
  const bridgeKeypair = Keypair.fromSecretKey(secret);

  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
  const toPubkey = new PublicKey(solToAddress);

  console.log(`🪙 Minting ${solAmount} SOL from ${bridgeKeypair.publicKey.toBase58()} → ${solToAddress}`);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: bridgeKeypair.publicKey,
      toPubkey,
      lamports,
    })
  );

  const sig = await sendAndConfirmTransaction(conn, tx, [bridgeKeypair]);
  console.log("✅ SOL minted TX:", sig);
  return { txHash: sig };
}

/**
 * 🔄 Combined ETH → SOL bridge flow
 */
export async function bridgeEthereumToSolana({
  ethPrivateKey,
  ethVault,
  solBridgePrivateKeyBase58,
  solToAddress,
  ethAmount,
  solAmount,
}: {
  ethPrivateKey: string;
  ethVault: string;
  solBridgePrivateKeyBase58: string;
  solToAddress: string;
  ethAmount: number;
  solAmount: number;
}) {
  try {
    // 1️⃣ Lock ETH from user wallet
    const ethTx = await lockEthForSol({
      ethPrivateKey,
      ethVault,
      ethAmount,
    });

    // 2️⃣ Mint SOL from bridge wallet
    const solTx = await mintSolToUser({
      solBridgePrivateKeyBase58,
      solToAddress,
      solAmount,
    });

    console.log("✅ Bridge ETH → SOL completed!");
    return {
      status: "completed",
      fromTxHash: ethTx.txHash,
      toTxHash: solTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeEthereumToSolana error:", err);
    return { status: "failed", error: err.message };
  }
}
