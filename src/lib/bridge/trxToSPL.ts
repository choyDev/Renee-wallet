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
import bs58 from "bs58";

/* ===========================================================
   🔹 1️⃣ Lock native TRX (User → Vault)
   =========================================================== */
async function lockTrx({
  tronPrivateKey,
  vaultAddress,
  amountTrx,
}: {
  tronPrivateKey: string;
  vaultAddress: string;
  amountTrx: number;
}) {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: tronPrivateKey,
  });

  const fromAddr = tronWeb.address.fromPrivateKey(tronPrivateKey);
  const sunAmount = Math.floor(Number(tronWeb.toSun(amountTrx)));

  console.log(`🔒 Locking ${amountTrx} TRX from ${fromAddr} → ${vaultAddress}`);

  const tx = await tronWeb.trx.sendTransaction(vaultAddress, sunAmount);
  if (!tx?.result)
    throw new Error(`TRX lock failed: ${JSON.stringify(tx, null, 2)}`);

  console.log("✅ Locked TRX TX:", tx.txid);
  return { txHash: tx.txid };
}

/* ===========================================================
   🔹 2️⃣ Send SPL-USDT (Bridge → User)
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
  const connection = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
  const bridgeKeypair = Keypair.fromSecretKey(bs58.decode(bridgePrivateKeyBase58));

  const mint = new PublicKey(process.env.USDT_MINT_SOL!);
  const userPubkey = new PublicKey(solToAddress);
  const bridgePubkey = bridgeKeypair.publicKey;

  const userATA = await getAssociatedTokenAddress(mint, userPubkey);
  const bridgeATA = await getAssociatedTokenAddress(mint, bridgePubkey);

  const tx = new Transaction();
  const lamports = BigInt(Math.floor(amountUsdt * 10 ** 6));

  // Ensure user's ATA exists
  const userInfo = await connection.getAccountInfo(userATA);
  if (!userInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        bridgePubkey,
        userATA,
        userPubkey,
        mint
      )
    );
  }

  tx.add(createTransferInstruction(bridgeATA, userATA, bridgePubkey, lamports));

  const sig = await sendAndConfirmTransaction(connection, tx, [bridgeKeypair]);
  console.log("✅ Sent SPL-USDT TX:", sig);
  return { txHash: sig };
}

/* ===========================================================
   🔹 3️⃣ Combined Bridge: TRX → SPL-USDT
   =========================================================== */
export async function bridgeTRXToSPLUSDT({
  tronPrivateKey,
  tronVaultAddress,
  solBridgePrivateKeyBase58,
  solToAddress,
  amountTrx,
  amountUsdt,
}: {
  tronPrivateKey: string;
  tronVaultAddress: string;
  solBridgePrivateKeyBase58: string;
  solToAddress: string;
  amountTrx: number;
  amountUsdt: number; // e.g. 1 TRX = 1 USDT or 0.9, etc.
}) {
  try {
    console.log(`🔹 Starting TRX → SPL-USDT bridge for ${amountTrx} TRX`);

    // 1️⃣ Lock TRX
    const tronTx = await lockTrx({
      tronPrivateKey,
      vaultAddress: tronVaultAddress,
      amountTrx,
    });

    // 2️⃣ Calculate equivalent USDT
    
    // 3️⃣ Send SPL-USDT to user
    const solTx = await sendSplUsdt({
      bridgePrivateKeyBase58: solBridgePrivateKeyBase58,
      solToAddress,
      amountUsdt,
    });

    console.log("✅ Bridge TRX → SPL-USDT completed!");
    return {
      status: "completed",
      fromTxHash: tronTx.txHash,
      toTxHash: solTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeTRXToSPLUSDT error:", err);
    return { status: "failed", error: err.message };
  }
}
