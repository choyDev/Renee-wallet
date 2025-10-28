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
import bs58 from "bs58";

/* ===========================================================
   🔹 1️⃣ Lock ERC20-USDT on Ethereum (User → Bridge Vault)
   =========================================================== */
async function lockEthereumUsdt({
  ethPrivateKey,
  vaultAddress,
  amount,
}: {
  ethPrivateKey: string;
  vaultAddress: string;
  amount: number;
}) {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
  const wallet = new ethers.Wallet(ethPrivateKey, provider);

  const usdtContract = new ethers.Contract(
    process.env.USDT_CONTRACT_ETH!,
    [
      "function transfer(address to,uint256 amount) public returns(bool)",
      "function balanceOf(address) view returns(uint256)",
    ],
    wallet
  );

  const decimals = 6;
  const usdtAmount = BigInt(Math.floor(amount * 10 ** decimals));

  const balance = await usdtContract.balanceOf(wallet.address);
  if (balance < usdtAmount)
    throw new Error(`Insufficient ERC-20 USDT balance`);

  console.log(
    `🔒 Locking ${amount} USDT (ERC-20) from ${wallet.address} → ${vaultAddress}`
  );

  const gasEstimate = await usdtContract.transfer.estimateGas(
    vaultAddress,
    usdtAmount
  );
  const tx = await usdtContract.transfer(vaultAddress, usdtAmount, {
    gasLimit: gasEstimate + BigInt(20000),
  });

  const receipt = await tx.wait();
  console.log("✅ Locked ERC-20 USDT TX:", receipt.hash);
  return { txHash: receipt.hash };
}

/* ===========================================================
   🔹 2️⃣ Send native SOL (Bridge → User)
   =========================================================== */
async function sendSol({
  bridgePrivateKeyBase58,
  solToAddress,
  amountSol,
}: {
  bridgePrivateKeyBase58: string;
  solToAddress: string;
  amountSol: number;
}) {
  const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
  const secret = bs58.decode(bridgePrivateKeyBase58);
  const bridgeKeypair = Keypair.fromSecretKey(secret);
  const toPubkey = new PublicKey(solToAddress);

  const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

  console.log(
    `🚀 Sending ${amountSol} SOL from ${bridgeKeypair.publicKey.toBase58()} → ${solToAddress}`
  );

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: bridgeKeypair.publicKey,
      toPubkey,
      lamports,
    })
  );

  const sig = await sendAndConfirmTransaction(conn, tx, [bridgeKeypair]);
  console.log("✅ Sent native SOL TX:", sig);
  return { txHash: sig };
}

/* ===========================================================
   🔹 3️⃣ Combined Bridge: ERC20 USDT → native SOL
   =========================================================== */
export async function bridgeERC20ToSolana({
  ethPrivateKey,
  ethVaultAddress,
  solBridgePrivateKeyBase58,
  solToAddress,
  amountErc20,
  amountSol,
}: {
  ethPrivateKey: string;
  ethVaultAddress: string;
  solBridgePrivateKeyBase58: string;
  solToAddress: string;
  amountErc20: number;
  amountSol: number; // e.g. 1 USDT = 0.03 SOL
}) {
  try {
    console.log(`🔹 Starting ERC-20 USDT → native SOL bridge for ${amountErc20} USDT`);

    // 1️⃣ Lock ERC-20 on Ethereum
    const ethTx = await lockEthereumUsdt({
      ethPrivateKey,
      vaultAddress: ethVaultAddress,
      amount: amountErc20,
    });

    
    const solTx = await sendSol({
      bridgePrivateKeyBase58: solBridgePrivateKeyBase58,
      solToAddress,
      amountSol,
    });

    console.log("✅ Bridge ERC-20 → SOL completed!");
    return {
      status: "completed",
      fromTxHash: ethTx.txHash,
      toTxHash: solTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeERC20ToSolana error:", err);
    return { status: "failed", error: err.message };
  }
}
