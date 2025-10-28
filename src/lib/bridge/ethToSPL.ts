import { ethers } from "ethers";
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
   🔹 1️⃣ Lock native ETH (User → Bridge Vault)
   =========================================================== */
async function lockNativeEth({
  ethPrivateKey,
  vaultAddress,
  amountEth,
}: {
  ethPrivateKey: string;
  vaultAddress: string;
  amountEth: number;
}) {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
  const wallet = new ethers.Wallet(ethPrivateKey, provider);

  const weiAmount = ethers.parseEther(amountEth.toString());
  const balance = await provider.getBalance(wallet.address);

  if (balance < weiAmount)
    throw new Error(
      `Insufficient ETH balance (${ethers.formatEther(balance)} ETH)`
    );

  console.log(
    `🔒 Locking ${amountEth} ETH from ${wallet.address} → vault ${vaultAddress}`
  );

  const tx = await wallet.sendTransaction({
    to: vaultAddress,
    value: weiAmount,
  });

  const receipt = await tx.wait();
  console.log("✅ Locked native ETH TX:", receipt!.hash);
  return { txHash: receipt!.hash };
}

/* ===========================================================
   🔹 2️⃣ Send SPL-USDT (Bridge → Solana User)
   =========================================================== */
async function sendSolanaUsdt({
  bridgePrivateKeyBase58,
  solToAddress,
  amountUsdt,
}: {
  bridgePrivateKeyBase58: string;
  solToAddress: string;
  amountUsdt: number;
}) {
  const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
  const bridgeKeypair = Keypair.fromSecretKey(bs58.decode(bridgePrivateKeyBase58));
  const mint = new PublicKey(process.env.USDT_MINT_SOL!);
  const toPub = new PublicKey(solToAddress);

  const bridgeATA = await getAssociatedTokenAddress(mint, bridgeKeypair.publicKey);
  const toATA = await getAssociatedTokenAddress(mint, toPub);

  const tx = new Transaction();
  const lamports = BigInt(Math.floor(amountUsdt * 10 ** 6)); // 6 decimals

  const toInfo = await conn.getAccountInfo(toATA);
  if (!toInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        bridgeKeypair.publicKey,
        toATA,
        toPub,
        mint
      )
    );
  }

  tx.add(
    createTransferInstruction(bridgeATA, toATA, bridgeKeypair.publicKey, lamports)
  );

  const sig = await sendAndConfirmTransaction(conn, tx, [bridgeKeypair]);
  console.log(`✅ Sent ${amountUsdt} SPL-USDT → ${solToAddress} | TX: ${sig}`);
  return { txHash: sig };
}

/* ===========================================================
   🔹 3️⃣ Combined Bridge: ETH → SPL USDT
   =========================================================== */
export async function bridgeETHToSPL({
  ethPrivateKey,
  ethVaultAddress,
  solBridgePrivateKeyBase58,
  solToAddress,
  amountEth,
  amountUsdt,
}: {
  ethPrivateKey: string;
  ethVaultAddress: string;
  solBridgePrivateKeyBase58: string;
  solToAddress: string;
  amountEth: number;
  amountUsdt: number;
}) {
  try {
    console.log(`🔹 Starting native ETH → SPL-USDT bridge for ${amountEth} ETH`);

    // 1️⃣ Lock ETH on Ethereum
    const ethTx = await lockNativeEth({
      ethPrivateKey,
      vaultAddress: ethVaultAddress,
      amountEth,
    });

    // 2️⃣ Send equivalent SPL-USDT on Solana
    const solTx = await sendSolanaUsdt({
      bridgePrivateKeyBase58: solBridgePrivateKeyBase58,
      solToAddress,
      amountUsdt,
    });

    console.log("✅ Bridge ETH → SPL-USDT completed!");
    return {
      status: "completed",
      fromTxHash: ethTx.txHash,
      toTxHash: solTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeETHToSPL error:", err);
    return { status: "failed", error: err.message };
  }
}
