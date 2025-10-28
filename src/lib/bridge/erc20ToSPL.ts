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
    throw new Error(
      `Insufficient ERC20 USDT balance: ${Number(balance) / 1e6}`
    );

  console.log(
    `🔒 Locking ${amount} ERC20-USDT from ${wallet.address} → vault ${vaultAddress}`
  );

  const gasEstimate = await usdtContract.transfer.estimateGas(
    vaultAddress,
    usdtAmount
  );
  const tx = await usdtContract.transfer(vaultAddress, usdtAmount, {
    gasLimit: gasEstimate + BigInt(20000),
  });

  const receipt = await tx.wait();
  console.log("✅ Locked ERC20-USDT TX:", receipt.hash);
  return { txHash: receipt.hash };
}

/* ===========================================================
   🔹 2️⃣ Mint SPL-USDT on Solana (Bridge Authority → User)
   =========================================================== */
async function mintSplUsdt({
  bridgePrivateKeyBase58,
  userAddress,
  amount,
}: {
  bridgePrivateKeyBase58: string;
  userAddress: string;
  amount: number;
}) {
  const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");

  // ✅ Decode Base58 Solana bridge key (same key as TRC20→SPL)
  const secret = bs58.decode(bridgePrivateKeyBase58);
  const bridgeKeypair = Keypair.fromSecretKey(secret);

  const mint = new PublicKey(process.env.USDT_MINT_SOL!);
  const userPub = new PublicKey(userAddress);

  const bridgeATA = await getAssociatedTokenAddress(
    mint,
    bridgeKeypair.publicKey
  );
  const userATA = await getAssociatedTokenAddress(mint, userPub);

  const tx = new Transaction();

  // Ensure user ATA exists
  const userInfo = await conn.getAccountInfo(userATA);
  if (!userInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        bridgeKeypair.publicKey,
        userATA,
        userPub,
        mint
      )
    );
  }

  // Transfer SPL tokens from bridge → user
  const lamports = BigInt(Math.floor(amount * 10 ** 6));
  tx.add(
    createTransferInstruction(
      bridgeATA,
      userATA,
      bridgeKeypair.publicKey,
      lamports
    )
  );

  const sig = await sendAndConfirmTransaction(conn, tx, [bridgeKeypair]);
  console.log("✅ Minted SPL-USDT TX:", sig);
  return { txHash: sig };
}

/* ===========================================================
   🔹 3️⃣ Combined Bridge: ERC20 → SPL
   =========================================================== */
export async function bridgeERC20ToSPL({
  ethPrivateKey,
  ethVaultAddress,
  solBridgePrivateKeyBase58,
  solToAddress,
  amount,
}: {
  ethPrivateKey: string;
  ethVaultAddress: string;
  solBridgePrivateKeyBase58: string;
  solToAddress: string;
  amount: number;
}) {
  try {
    console.log(`🔹 Starting ERC20 → SPL USDT bridge for ${amount} USDT`);

    // 1️⃣ Lock ERC20-USDT on Ethereum
    const ethTx = await lockEthereumUsdt({
      ethPrivateKey,
      vaultAddress: ethVaultAddress,
      amount,
    });

    // 2️⃣ Mint SPL-USDT on Solana (bridge authority)
    const solTx = await mintSplUsdt({
      bridgePrivateKeyBase58: solBridgePrivateKeyBase58,
      userAddress: solToAddress,
      amount,
    });

    console.log("✅ Bridge ERC20→SPL completed!");
    return {
      status: "completed",
      fromTxHash: ethTx.txHash,
      toTxHash: solTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeERC20ToSPL error:", err);
    return { status: "failed", error: err.message };
  }
}
