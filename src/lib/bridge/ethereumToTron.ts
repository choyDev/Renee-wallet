// src/lib/bridge/ethereumToTron.ts
import { ethers } from "ethers";
import TronWeb from "tronweb";

/**
 * 🔒 Step 1: Lock ETH from user's wallet into bridge vault
 * The user's own ETH balance will decrease here.
 */
export async function lockEthForTrx({
  ethPrivateKey,
  ethVault,
  ethAmount,
}: {
  ethPrivateKey: string; // user’s private key (decrypted)
  ethVault: string;      // bridge vault address
  ethAmount: number;     // amount of ETH to lock
}) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
    const userWallet = new ethers.Wallet(ethPrivateKey, provider);

    const value = ethers.parseEther(ethAmount.toFixed(18));

    console.log(`🔒 Locking ${ethAmount} ETH from ${userWallet.address} → vault ${ethVault}`);

    // Send ETH from user to vault
    const tx = await userWallet.sendTransaction({
      to: ethVault,
      value,
    });

    const receipt = await tx.wait(1);
    if (!receipt) throw new Error("ETH lock failed (no receipt)");

    console.log("✅ ETH locked TX:", receipt.hash);
    return { txHash: receipt.hash };
  } catch (err: any) {
    console.error("lockEthForTrx error:", err);
    throw new Error(err.message || "Failed to lock ETH");
  }
}

/**
 * 🪙 Step 2: Mint (send) TRX to the user from bridge wallet
 * Bridge wallet performs this mint step on Tron.
 */
export async function mintTrxToUser({
  trxPrivateKey,
  toAddress,
  trxAmount,
}: {
  trxPrivateKey: string;
  toAddress: string;
  trxAmount: number;
}) {
  try {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_NILE_RPC!,
      privateKey: trxPrivateKey,
    });

    const sender = tronWeb.address.fromPrivateKey(trxPrivateKey);
    const sunAmount = Math.floor(tronWeb.toSun(trxAmount));

    console.log(`🪙 Minting ${trxAmount} TRX (${sunAmount} sun) from ${sender} → ${toAddress}`);

    // Send TRX to user
    const tx = await tronWeb.trx.sendTransaction(toAddress, sunAmount);

    if (!tx?.result) {
      throw new Error(`TRX mint failed: ${JSON.stringify(tx)}`);
    }

    console.log("✅ TRX minted successfully:", tx.txid);
    return { txHash: tx.txid };
  } catch (err: any) {
    console.error("mintTrxToUser error:", err);
    throw new Error(err.message || "Failed to mint TRX");
  }
}

/**
 * 🔄 Combined ETH → TRX Bridge flow
 */
export async function bridgeEthereumToTron({
  ethPrivateKey,
  ethVault,
  trxPrivateKey,
  trxToAddress,
  ethAmount,
  trxAmount,
}: {
  ethPrivateKey: string; // user's decrypted ETH private key
  ethVault: string;      // ETH vault address
  trxPrivateKey: string; // bridge TRX private key
  trxToAddress: string;  // user's TRX wallet address
  ethAmount: number;
  trxAmount: number;
}) {
  try {
    // 1️⃣ Lock ETH from user wallet
    const ethTx = await lockEthForTrx({
      ethPrivateKey,
      ethVault,
      ethAmount,
    });

    // 2️⃣ Mint TRX from bridge wallet
    const trxTx = await mintTrxToUser({
      trxPrivateKey,
      toAddress: trxToAddress,
      trxAmount,
    });

    console.log("✅ Bridge completed successfully!");
    return {
      status: "completed",
      fromTxHash: ethTx.txHash,
      toTxHash: trxTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeEthereumToTron error:", err);
    return { status: "failed", error: err.message };
  }
}
