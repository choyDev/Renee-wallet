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
  import { ethers } from "ethers";
 
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
  
    // ✅ Decode base64-encoded 64-byte private key
    let secretKey: Uint8Array;
    try {
      const buffer = Buffer.from(userPrivateKey.trim(), "base64");
      secretKey = new Uint8Array(buffer);
      if (secretKey.length !== 64)
        throw new Error(`Invalid key length (${secretKey.length}), expected 64 bytes`);
    } catch {
      throw new Error("Invalid Solana private key (must be base64-encoded 64-byte key)");
    }
  
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
     🔹 3️⃣ Send native ETH (bridge → user)
     =========================================================== */
  async function sendNativeEth({
    ethBridgePrivateKey,
    ethToAddress,
    amountEth,
  }: {
    ethBridgePrivateKey: string;
    ethToAddress: string;
    amountEth: number;
  }) {
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
    const wallet = new ethers.Wallet(ethBridgePrivateKey, provider);
  
    const valueWei = ethers.parseEther(amountEth.toFixed(8));
  
    const balance = await provider.getBalance(wallet.address);
    if (balance < valueWei)
      throw new Error(
        `Bridge wallet insufficient ETH. Balance=${ethers.formatEther(balance)}`
      );
  
    console.log(`🚀 Sending ${amountEth} ETH from ${wallet.address} → ${ethToAddress}`);
    const tx = await wallet.sendTransaction({ to: ethToAddress, value: valueWei });
    const receipt = await tx.wait();
    if (!receipt) throw new Error("ETH lock failed (no receipt)");
    console.log("✅ ETH TX Hash:", receipt.hash);
    return { txHash: receipt.hash };
  }
  
  /* ===========================================================
     🔹 4️⃣ Combined Bridge: SPL → ETH
     =========================================================== */
  export async function bridgeSPLToETH({
    solPrivateKey,
    solVault,
    ethBridgePrivateKey,
    ethToAddress,
    amountSolUsdt,
    amountEth,
  }: {
    solPrivateKey: string;
    solVault: string;
    ethBridgePrivateKey: string;
    ethToAddress: string;
    amountSolUsdt: number; // SPL USDT to lock
    amountEth: number;
  }) {
    try {
      console.log(`🔹 Starting SPL → ETH bridge for ${amountSolUsdt} USDT`);
  
      // 1️⃣ Lock USDT on Solana
      const solTx = await lockSolanaUsdt({
        userPrivateKey: solPrivateKey,
        vaultAddress: solVault,
        amount: amountSolUsdt,
      });
  

      // 3️⃣ Send native ETH
      const ethTx = await sendNativeEth({
        ethBridgePrivateKey,
        ethToAddress,
        amountEth,
      });
  
      console.log("✅ Bridge SPL→ETH completed!");
      return {
        status: "completed",
        fromTxHash: solTx.txHash,
        toTxHash: ethTx.txHash,
      };
    } catch (err: any) {
      console.error("bridgeSPLToETH error:", err);
      return { status: "failed", error: err.message };
    }
  }
  