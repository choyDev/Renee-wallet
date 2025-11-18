import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
  } from "@solana/web3.js";
  import TronWeb from "tronweb";
  import bs58 from "bs58";

  import BigNumber from "bignumber.js";
  
  /* ===========================================================
     🔹 1️⃣ Lock native SOL (User → Bridge Vault)
     =========================================================== */
  async function lockSol({
    solPrivateKey,
    vaultAddress,
    amountSol,
  }: {
    solPrivateKey: string; // base58 or base64
    vaultAddress: string;
    amountSol: number;
  }) {
    const connection = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
  
    // Parse either base58 or base64
    let keypair: Keypair;
    try {
      if (/^[A-Za-z0-9+/=]+$/.test(solPrivateKey.trim()) && solPrivateKey.length > 80) {
        // base64
        const secret = Uint8Array.from(Buffer.from(solPrivateKey, "base64"));
        keypair = Keypair.fromSecretKey(secret);
      } else {
        // base58
        keypair = Keypair.fromSecretKey(bs58.decode(solPrivateKey));
      }
    } catch (err) {
      throw new Error("Invalid Solana private key format (must be base58 or base64)");
    }
  
    const vaultPubkey = new PublicKey(vaultAddress);
    const lamportsNeeded = Math.floor(amountSol * LAMPORTS_PER_SOL);
  
    const balance = await connection.getBalance(keypair.publicKey);
    if (balance < lamportsNeeded)
      throw new Error(
        `Insufficient SOL balance. Available: ${balance / LAMPORTS_PER_SOL} SOL`
      );
  
    console.log(`🔒 Locking ${amountSol} SOL from ${keypair.publicKey.toBase58()} → ${vaultAddress}`);
  
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: vaultPubkey,
        lamports: lamportsNeeded,
      })
    );
  
    const sig = await sendAndConfirmTransaction(connection, tx, [keypair]);
    console.log("✅ Locked SOL TX:", sig);
    return { txHash: sig };
  }
  
  /* ===========================================================
     🔹 2️⃣ Send TRC20-USDT (Bridge → User)
     =========================================================== */
  async function sendTronUsdt({
    tronBridgePrivateKey,
    toAddress,
    amountTrc20,
  }: {
    tronBridgePrivateKey: string;
    toAddress: string;
    amountTrc20: number;
  }) {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_NILE_RPC!,
      headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
      privateKey: tronBridgePrivateKey,
    });
  
    const fromAddr = tronWeb.address.fromPrivateKey(tronBridgePrivateKey);
    const contract = await tronWeb.contract().at(process.env.TRON_TESTNET_USDT_CONTRACT!);
  
    console.log(`🚀 Sending ${amountTrc20} USDT (TRC-20) from ${fromAddr} → ${toAddress}`);

    const decimals = 6;

    // Convert human amount → integer amount
    const rawAmount = new BigNumber(amountTrc20)
      .multipliedBy(new BigNumber(10).pow(decimals))
      .integerValue() // remove decimals
      .toString(10);
  
    const tx = await contract.transfer(toAddress, rawAmount).send();
    console.log("✅ Sent TRC-20 USDT TX:", tx);
    return { txHash: tx };
  }
  
  /* ===========================================================
     🔹 3️⃣ Combined Bridge: SOL → TRC20 USDT
     =========================================================== */
  export async function bridgeSOLToTRC20({
    solPrivateKey,
    solVaultAddress,
    tronBridgePrivateKey,
    tronToAddress,
    amountSol,
    amountTrc20,
  }: {
    solPrivateKey: string;
    solVaultAddress: string;
    tronBridgePrivateKey: string;
    tronToAddress: string;
    amountSol: number;
    amountTrc20: number; // e.g., 1 SOL = 100 USDT
  }) {
    try {
      console.log(`🔹 Starting SOL → TRC20 USDT bridge for ${amountSol} SOL`);
  
      // 1️⃣ Lock SOL on Solana
      const solTx = await lockSol({
        solPrivateKey,
        vaultAddress: solVaultAddress,
        amountSol,
      });
  
      
      // 3️⃣ Send TRC20 USDT to Tron user
      const tronTx = await sendTronUsdt({
        tronBridgePrivateKey,
        toAddress: tronToAddress,
        amountTrc20,
      });
  
      console.log("✅ Bridge SOL → TRC20 USDT completed!");
      return {
        status: "completed",
        fromTxHash: solTx.txHash,
        toTxHash: tronTx.txHash,
      };
    } catch (err: any) {
      console.error("bridgeSOLToTRC20 error:", err);
      return { status: "failed", error: err.message };
    }
  }
  