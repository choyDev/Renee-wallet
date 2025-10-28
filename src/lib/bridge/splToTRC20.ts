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
  let secretKey: Uint8Array;
  try {
    const buffer = Buffer.from(userPrivateKey.trim(), "base64");
    secretKey = new Uint8Array(buffer);
    if (secretKey.length !== 64) {
      throw new Error(`Invalid key length (${secretKey.length}), expected 64 bytes`);
    }
  } catch (err) {
    throw new Error("Invalid Solana private key — must be base64-encoded 64-byte key");
  }

  // ✅ Build the Keypair
  const userKeypair = Keypair.fromSecretKey(secretKey);
  const mint = new PublicKey(process.env.USDT_MINT_SOL!);
  const vaultPub = new PublicKey(vaultAddress);

  const userATA = await getAssociatedTokenAddress(mint, userKeypair.publicKey);
  const vaultATA = await getAssociatedTokenAddress(mint, vaultPub);

  const tx = new Transaction();
  const lamports = BigInt(Math.floor(amount * 10 ** 6));

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
   🔹 2️⃣ Mint (Send) TRC-20 USDT on Tron (bridge → user)
   =========================================================== */
async function mintTronUsdt({
  tronPrivateKey,
  toAddress,
  amount,
}: {
  tronPrivateKey: string;
  toAddress: string;
  amount: number;
}) {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: tronPrivateKey,
  });

  const fromAddr = tronWeb.address.fromPrivateKey(tronPrivateKey);
  const contract = await tronWeb.contract().at(process.env.TRON_TESTNET_USDT_CONTRACT!);

  console.log(`🪙 Sending ${amount} USDT (TRC-20) from bridge ${fromAddr} → ${toAddress}`);

  const tx = await contract.transfer(toAddress, tronWeb.toSun(amount)).send();
  console.log("✅ TRC-20 USDT TX:", tx);
  return { txHash: tx };
}

/* ===========================================================
   🔹 3️⃣ Combined Bridge: SPL → TRC-20
   =========================================================== */
export async function bridgeSPLToTRC20({
  solPrivateKey,
  solVault,
  tronBridgePrivateKey,
  tronToAddress,
  amount,
}: {
  solPrivateKey: string;
  solVault: string;
  tronBridgePrivateKey: string;
  tronToAddress: string;
  amount: number;
}) {
  try {
    console.log(`🔹 Starting SPL → TRC20 USDT bridge for ${amount} USDT`);

    // 1️⃣ Lock SPL-USDT on Solana
    const solTx = await lockSolanaUsdt({
      userPrivateKey: solPrivateKey,
      vaultAddress: solVault,
      amount,
    });

    // 2️⃣ Send TRC-20 USDT on Tron
    const tronTx = await mintTronUsdt({
      tronPrivateKey: tronBridgePrivateKey,
      toAddress: tronToAddress,
      amount,
    });

    console.log("✅ Bridge SPL→TRX completed!");
    return { status: "completed", fromTxHash: solTx.txHash, toTxHash: tronTx.txHash };
  } catch (err: any) {
    console.error("bridgeSolanaUsdtToTron error:", err);
    return { status: "failed", error: err.message };
  }
}
