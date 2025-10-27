// src/lib/bridge/solanaToEthereum.ts
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

  /**
   * 🔒 Step 1: Lock SOL in vault
   */
  export async function lockSolanaForEth({
    privateKeyBase64,
    vaultAddress,
    amountSol,
  }: {
    privateKeyBase64: string;
    vaultAddress: string;
    amountSol: number;
  }) {
    const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
    const secret = Uint8Array.from(Buffer.from(privateKeyBase64, "base64"));
    const keypair = Keypair.fromSecretKey(secret);

    const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
  
    console.log(`🔒 Locking ${amountSol} SOL → vault ${vaultAddress}`);
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new PublicKey(vaultAddress),
        lamports,
      })
    );
  
    const sig = await sendAndConfirmTransaction(conn, tx, [keypair]);
    console.log("✅ SOL locked:", sig);
    return { txHash: sig };
  }
  
  /**
   * 🪙 Step 2: Mint equivalent ETH to user
   */
  export async function mintEthToUser({
    amountEth,
    toAddress,
  }: {
    amountEth: number;
    toAddress: string;
  }) {
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
    const bridgeWallet = new ethers.Wallet(process.env.ETH_BRIDGE_PRIVKEY!, provider);
  
    const value = ethers.parseEther(amountEth.toFixed(18));
    console.log(`🪙 Minting (sending) ${amountEth} ETH → ${toAddress}`);
  
    const tx = await bridgeWallet.sendTransaction({
      to: toAddress,
      value,
    });
  
    const receipt = await tx.wait(1);
    if (!receipt) throw new Error("Transaction not confirmed or receipt is null");
    console.log("✅ ETH minted TX:", receipt.hash);
  
    return { txHash: receipt.hash };
  }
  
  /**
   * 🔄 Combined SOL → ETH Bridge flow
   */
  export async function bridgeSolanaToEthereum({
    solPrivateKey,
    solVault,
    ethToAddress,
    solAmount,
    ethAmount,
  }: {
    solPrivateKey: string;
    solVault: string;
    ethToAddress: string;
    solAmount: number;
    ethAmount: number;
  }) {
    try {
      const lockTx = await lockSolanaForEth({
        privateKeyBase64: solPrivateKey,
        vaultAddress: solVault,
        amountSol: solAmount,
      });
  
      const mintTx = await mintEthToUser({
        amountEth: ethAmount,
        toAddress: ethToAddress,
      });
  
      return {
        status: "completed",
        fromTxHash: lockTx.txHash,
        toTxHash: mintTx.txHash,
      };
    } catch (err: any) {
      console.error("bridgeSolanaToEthereum error:", err);
      return { status: "failed", error: err.message };
    }
  }
  