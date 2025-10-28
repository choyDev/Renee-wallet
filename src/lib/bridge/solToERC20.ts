import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
  } from "@solana/web3.js";
  import { ethers } from "ethers";
  import bs58 from "bs58";
  
  /* ===========================================================
     🔹 1️⃣ Lock native SOL on Solana (User → Bridge Vault)
     =========================================================== */
  async function lockSol({
    solPrivateKey,
    vaultAddress,
    amountSol,
  }: {
    solPrivateKey: string;
    vaultAddress: string;
    amountSol: number;
  }) {
    const connection = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
  
    // Handle both base58 & base64
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
    } catch {
      throw new Error("Invalid Solana private key format (must be base58 or base64)");
    }
  
    const vaultPubkey = new PublicKey(vaultAddress);
    const lamportsNeeded = Math.floor(amountSol * LAMPORTS_PER_SOL);
  
    const balance = await connection.getBalance(keypair.publicKey);
    if (balance < lamportsNeeded)
      throw new Error(`Insufficient SOL balance (${balance / LAMPORTS_PER_SOL} SOL)`);
  
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
     🔹 2️⃣ Send ERC-20 USDT on Ethereum (Bridge → User)
     =========================================================== */
  async function sendEthereumUsdt({
    bridgePrivateKey,
    ethToAddress,
    amountErc20,
  }: {
    bridgePrivateKey: string;
    ethToAddress: string;
    amountErc20: number;
  }) {
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
    const bridgeWallet = new ethers.Wallet(bridgePrivateKey, provider);
  
    const usdtContract = new ethers.Contract(
      process.env.USDT_CONTRACT_ETH!,
      [
        "function transfer(address to,uint256 amount) public returns(bool)",
        "function balanceOf(address) view returns(uint256)",
      ],
      bridgeWallet
    );
  
    const decimals = 6;
    const usdtAmount = BigInt(Math.floor(amountErc20 * 10 ** decimals));
  
    const balance = await usdtContract.balanceOf(await bridgeWallet.getAddress());
    console.log(`Bridge wallet ERC-20 USDT balance: ${Number(balance) / 1e6}`);
  
    if (balance < usdtAmount)
      throw new Error("Bridge wallet does not have enough ERC-20 USDT");
  
    const gasEstimate = await usdtContract.transfer.estimateGas(
      ethToAddress,
      usdtAmount
    );
  
    console.log(`🚀 Sending ${amountErc20} USDT (ERC-20) to ${ethToAddress}`);
  
    const tx = await usdtContract.transfer(ethToAddress, usdtAmount, {
      gasLimit: gasEstimate + BigInt(20000),
    });
    const receipt = await tx.wait();
  
    console.log("✅ Sent ERC-20 USDT TX:", receipt.hash);
    return { txHash: receipt.hash };
  }
  
  /* ===========================================================
     🔹 3️⃣ Combined Bridge: SOL → ERC-20 USDT
     =========================================================== */
  export async function bridgeSOLToERC20({
    solPrivateKey,
    solVaultAddress,
    ethBridgePrivateKey,
    ethToAddress,
    amountSol,
    amountErc20,
  }: {
    solPrivateKey: string;
    solVaultAddress: string;
    ethBridgePrivateKey: string;
    ethToAddress: string;
    amountSol: number;
    amountErc20: number; // 1 SOL = ? USDT
  }) {
    try {
      console.log(`🔹 Starting SOL → ERC-20 USDT bridge for ${amountSol} SOL`);
  
      // 1️⃣ Lock SOL on Solana
      const solTx = await lockSol({
        solPrivateKey,
        vaultAddress: solVaultAddress,
        amountSol,
      });
  
      // 3️⃣ Send ERC-20 USDT to Ethereum user
      const ethTx = await sendEthereumUsdt({
        bridgePrivateKey: ethBridgePrivateKey,
        ethToAddress,
        amountErc20,
      });
  
      console.log("✅ Bridge SOL → ERC-20 USDT completed!");
      return {
        status: "completed",
        fromTxHash: solTx.txHash,
        toTxHash: ethTx.txHash,
      };
    } catch (err: any) {
      console.error("bridgeSOLToERC20 error:", err);
      return { status: "failed", error: err.message };
    }
  }
  