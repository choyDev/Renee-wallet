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
  createMintToInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";


/* 🔹 Step 1 – Lock TRC-20 USDT on Tron */
export async function lockTronUsdt({
  tronPrivateKey,
  vaultAddress,
  amount,
}: {
  tronPrivateKey: string;
  vaultAddress: string;
  amount: number;
}) {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    privateKey: tronPrivateKey,
  });

  const contractAddr = process.env.TRON_TESTNET_USDT_CONTRACT!;
  const usdtAmount = Math.floor(amount * 1e6);

  // sanity-check: must be a deployed contract
  const code = await tronWeb.trx.getContract(contractAddr);
  if (!code || !code.bytecode) {
    throw new Error(`Invalid TRC-20 contract: ${contractAddr}`);
  }

  const contract = await tronWeb.contract().at(contractAddr);
  console.log(`🔒 Locking ${amount} USDT on Tron → ${vaultAddress}`);

  const tx = await contract
    .transfer(vaultAddress, usdtAmount)
    .send({ feeLimit: 100_000_000 });

  console.log("✅ Locked USDT TX:", tx);
  return { txHash: tx };
}

/* 🔹 Step 2 – Mint SPL USDT on Solana */
export async function mintSolanaUsdt({
  bridgePrivateKeyBase58,
  solToAddress,
  amount,
}: {
  bridgePrivateKeyBase58: string;
  solToAddress: string;
  amount: number;
}) {
  const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
  const secret = bs58.decode(bridgePrivateKeyBase58);
  const bridgeKeypair = Keypair.fromSecretKey(secret);

  const mint = new PublicKey(process.env.USDT_MINT_SOL!);
  const userPubkey = new PublicKey(solToAddress);
  const userATA = await getAssociatedTokenAddress(mint, userPubkey);

  const tx = new Transaction();
  const info = await conn.getAccountInfo(userATA);
  if (!info) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        bridgeKeypair.publicKey,
        userATA,
        userPubkey,
        mint
      )
    );
  }

  const lamports = BigInt(Math.floor(amount * 10 ** 6));
  tx.add(createMintToInstruction(mint, userATA, bridgeKeypair.publicKey, lamports));

  const sig = await sendAndConfirmTransaction(conn, tx, [bridgeKeypair]);
  console.log(`✅ Minted ${amount} USDT to ${solToAddress} — Tx: ${sig}`);
  return { txHash: sig };
}

/* 🔹 Step 3 – Combined Bridge Flow */
export async function bridgeTronUsdtToSolanaUsdt({
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
    const tronTx = await lockTronUsdt({
      tronPrivateKey,
      vaultAddress: tronVault,
      amount,
    });

    const solTx = await mintSolanaUsdt({
      bridgePrivateKeyBase58: solBridgePrivateKeyBase58,
      solToAddress,
      amount,
    });

    console.log("✅ Bridge TRC-20 USDT → SPL USDT completed!");
    return {
      status: "completed",
      fromTxHash: tronTx.txHash,
      toTxHash: solTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeTronUsdtToSolanaUsdt error:", err);
    return { status: "failed", error: err.message };
  }
}
