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
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from "@solana/spl-token";

/* ===========================================================
   🔹 1️⃣ Lock SPL-USDT on Solana (user → bridge vault)
   =========================================================== */
async function lockSolanaUsdt({
  userPrivateKey,
  vaultAddress,
  amount,
}: {
  userPrivateKey: string;
  vaultAddress: string;
  amount: number;
}) {
  const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");

  // ✅ Decode base64 64-byte Solana private key
  let secretKey: Uint8Array;
  try {
    const buffer = Buffer.from(userPrivateKey.trim(), "base64");
    secretKey = new Uint8Array(buffer);
    if (secretKey.length !== 64) {
      throw new Error(`Invalid Solana key length (${secretKey.length}), expected 64 bytes`);
    }
  } catch {
    throw new Error("Invalid Solana private key (must be base64-encoded 64-byte key)");
  }

  const userKeypair = Keypair.fromSecretKey(secretKey);
  const mint = new PublicKey(process.env.USDT_MINT_SOL!);
  const vaultPub = new PublicKey(vaultAddress);

  const userATA = await getAssociatedTokenAddress(mint, userKeypair.publicKey);
  const vaultATA = await getAssociatedTokenAddress(mint, vaultPub);

  const tx = new Transaction();
  const lamports = BigInt(Math.floor(amount * 10 ** 6)); // USDT has 6 decimals

  // Ensure vault ATA exists
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
  console.log("🔒 Locked SPL-USDT TX:", sig);
  return { txHash: sig };
}

/* ===========================================================
   🔹 2️⃣ Send native TRX from bridge vault → user wallet
   =========================================================== */
async function sendNativeTrx({
  tronPrivateKey,
  toAddress,
  amountTrx,
}: {
  tronPrivateKey: string;
  toAddress: string;
  amountTrx: number;
}) {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: tronPrivateKey,
  });

  const sender = tronWeb.address.fromPrivateKey(tronPrivateKey);
  if (!tronWeb.isAddress(sender)) throw new Error("Invalid sender TRX address");
  if (!tronWeb.isAddress(toAddress)) throw new Error("Invalid recipient TRX address");

  const sunAmount = Math.floor(Number(tronWeb.toSun(amountTrx)));

  console.log(`🚀 Sending ${amountTrx} TRX (${sunAmount} sun) from ${sender} → ${toAddress}`);

  const tx = await tronWeb.trx.sendTransaction(toAddress, sunAmount);
  if (!tx?.result) {
    throw new Error(`TRX transfer failed: ${JSON.stringify(tx)}`);
  }

  console.log("✅ TRX sent successfully:", tx.txid);
  return { txHash: tx.txid };
}

/* ===========================================================
   🔹 3️⃣ Combined Bridge Flow: SPL → TRX
   =========================================================== */
export async function bridgeSPLToTRX({
  solPrivateKey,
  solVault,
  tronBridgePrivateKey,
  tronToAddress,
  amountSolUsdt,
  amountTrx,
}: {
  solPrivateKey: string;
  solVault: string;
  tronBridgePrivateKey: string;
  tronToAddress: string;
  amountSolUsdt: number; // SPL USDT to lock
  amountTrx: number; // TRX to release
}) {
  try {
    console.log(`🔹 Starting SPL → TRX bridge for ${amountSolUsdt} USDT → ${amountTrx} TRX`);

    // 1️⃣ Lock SPL USDT
    const solTx = await lockSolanaUsdt({
      userPrivateKey: solPrivateKey,
      vaultAddress: solVault,
      amount: amountSolUsdt,
    });

    // 2️⃣ Send native TRX
    const trxTx = await sendNativeTrx({
      tronPrivateKey: tronBridgePrivateKey,
      toAddress: tronToAddress,
      amountTrx,
    });

    console.log("✅ Bridge SPL→TRX completed!");
    return {
      status: "completed",
      fromTxHash: solTx.txHash,
      toTxHash: trxTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeSPLToTRX error:", err);
    return { status: "failed", error: err.message };
  }
}
