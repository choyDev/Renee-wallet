import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
  } from "@solana/web3.js";
  import * as bitcoin from "bitcoinjs-lib";
  import * as ecc from "tiny-secp256k1";
  import ECPairFactory from "ecpair";
  import axios from "axios";
  
  /* ========== Config ========== */
  const ECPair = ECPairFactory(ecc);
  const network = bitcoin.networks.testnet; // switch to mainnet for production
  
  /**
   * 🔒 Step 1: Lock SOL in Solana vault
   */
  export async function lockSolanaForBTC({
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
    console.log("✅ SOL locked on-chain:", sig);
    return { txHash: sig };
  }
  
  /**
   * 🪙 Step 2: Send BTC from bridge wallet
   */
  export async function sendBtcToUser({
    btcPrivateKeyWIF,
    toAddress,
    btcAmount,
  }: {
    btcPrivateKeyWIF: string;
    toAddress: string;
    btcAmount: number;
  }) {
    const ECPair = ECPairFactory(ecc);
    const keyPair = ECPair.fromWIF(btcPrivateKeyWIF, network);
  
    const sats = BigInt(Math.floor(btcAmount * 1e8));
    const fromAddress = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network,
    }).address!;
  
    console.log(`🚀 Sending ${btcAmount} BTC from ${fromAddress} → ${toAddress}`);
  
    // 🔹 Get UTXOs
    const utxosRes = await axios.get(
      `https://blockstream.info/testnet/api/address/${fromAddress}/utxo`
    );
    const utxos = utxosRes.data;
  
    if (!utxos?.length) throw new Error("No BTC UTXOs available in bridge wallet");
  
    const psbt = new bitcoin.Psbt({ network });
  
    let totalInput = BigInt(0);
    const FEE = BigInt(500);
  
    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.payments.p2wpkh({
            pubkey: keyPair.publicKey,
            network,
          }).output!,
          value: BigInt(utxo.value),
        },
      });
      totalInput += BigInt(utxo.value);
      if (totalInput >= sats + FEE) break;
    }
  
    if (totalInput < sats + FEE)
      throw new Error("Not enough BTC balance in bridge wallet");
  
    // 🔹 Add recipient output
    psbt.addOutput({
      address: toAddress,
      value: sats,
    });
  
    // 🔹 Add change output if needed
    const change = totalInput - sats - FEE;
    if (change > BigInt(0)) {
      psbt.addOutput({
        address: fromAddress,
        value: change,
      });
    }
  
    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();
  
    const txHex = psbt.extractTransaction().toHex();
  
    const broadcast = await axios.post(
      "https://blockstream.info/testnet/api/tx",
      txHex
    );
    const txid = broadcast.data;
  
    console.log("✅ BTC sent successfully:", txid);
    return { txHash: txid };
  }
  
  /**
   * 🔄 Combined SOL → BTC Bridge Flow
   */
  export async function bridgeSolanaToBitcoin({
    solPrivateKey,
    solVault,
    btcPrivateKeyWIF,
    btcToAddress,
    solAmount,
    btcAmount,
  }: {
    solPrivateKey: string;
    solVault: string;
    btcPrivateKeyWIF: string;
    btcToAddress: string;
    solAmount: number;
    btcAmount: number;
  }) {
    try {
      // 🔒 Lock SOL
      const solTx = await lockSolanaForBTC({
        privateKeyBase64: solPrivateKey,
        vaultAddress: solVault,
        amountSol: solAmount,
      });
  
      // 🪙 Send BTC
      const btcTx = await sendBtcToUser({
        btcPrivateKeyWIF,
        toAddress: btcToAddress,
        btcAmount,
      });
  
      return {
        status: "completed",
        fromTxHash: solTx.txHash,
        toTxHash: btcTx.txHash,
      };
    } catch (err: any) {
      console.error("bridgeSolanaToBitcoin error:", err);
      return { status: "failed", error: err.message };
    }
  }
  