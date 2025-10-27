// src/lib/bridge/bitcoinToSolana.ts
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import axios from "axios";
import bs58 from "bs58"; // ✅ Proper Base58 decoder

const ECPair = ECPairFactory(ecc);
const network = bitcoin.networks.testnet; // 🔹 Use mainnet later when ready

/**
 * 🔒 Step 1: Lock BTC into vault
 * User’s BTC is sent to a vault (bridge custody address)
 */
export async function lockBtcForSol({
  btcPrivateKeyWIF,
  vaultAddress,
  btcAmount,
}: {
  btcPrivateKeyWIF: string;
  vaultAddress: string;
  btcAmount: number;
}) {
  try {
    if (!vaultAddress) throw new Error("Missing BTC vault address");

    const keyPair = ECPair.fromWIF(btcPrivateKeyWIF, network);
    const fromAddress = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network,
    }).address!;

    const sats = Math.floor(btcAmount * 1e8);
    console.log(`🔒 Locking ${btcAmount} BTC (${sats} sats) from ${fromAddress} → vault ${vaultAddress}`);

    // Fetch available UTXOs
    const utxos = (
      await axios.get(`https://blockstream.info/testnet/api/address/${fromAddress}/utxo`)
    ).data;

    if (!utxos || utxos.length === 0)
      throw new Error(`No UTXOs found for BTC address ${fromAddress}`);

    const psbt = new bitcoin.Psbt({ network });
    let totalInput = 0;
    const FEE = 500;

    // ✅ Collect enough inputs to cover transfer + fee
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
      totalInput += Number(utxo.value);
      if (totalInput >= sats + FEE) break;
    }

    if (totalInput < sats + FEE)
      throw new Error("Not enough BTC balance to lock");

    // ✅ Output: send to vault
    psbt.addOutput({ address: vaultAddress, value: BigInt(sats) });

    // ✅ Optional change output
    const change = BigInt(totalInput - sats - FEE);
    if (change > BigInt(0))
      psbt.addOutput({ address: fromAddress, value: change });

    // ✅ Sign + finalize + broadcast
    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();
    const txid = (await axios.post("https://blockstream.info/testnet/api/tx", txHex)).data;

    console.log("✅ BTC locked successfully:", txid);
    return { txHash: txid };
  } catch (err: any) {
    console.error("lockBtcForSol error:", err);
    throw new Error(err.message || "Failed to lock BTC");
  }
}

/**
 * 🪙 Step 2: Mint SOL to user (bridge wallet → user address)
 */
export async function mintSolToUser({
  solBridgePrivateKeyBase58,
  solToAddress,
  solAmount,
}: {
  solBridgePrivateKeyBase58: string;
  solToAddress: string;
  solAmount: number;
}) {
  try {
    const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");

    // ✅ Properly decode base58 private key
    const secret = bs58.decode(solBridgePrivateKeyBase58);
    const bridgeKeypair = Keypair.fromSecretKey(secret);

    const toPubkey = new PublicKey(solToAddress);
    const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

    console.log(`🪙 Minting ${solAmount} SOL (${lamports} lamports) → ${solToAddress}`);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: bridgeKeypair.publicKey,
        toPubkey,
        lamports,
      })
    );

    const sig = await sendAndConfirmTransaction(conn, tx, [bridgeKeypair]);
    console.log("✅ SOL minted successfully:", sig);

    return { txHash: sig };
  } catch (err: any) {
    console.error("mintSolToUser error:", err);
    throw new Error(err.message || "Failed to mint SOL");
  }
}

/**
 * 🔄 Combined BTC → SOL Bridge Flow
 */
export async function bridgeBitcoinToSolana({
  btcPrivateKeyWIF,
  btcVault,
  solBridgePrivateKeyBase58,
  solToAddress,
  btcAmount,
  solAmount,
}: {
  btcPrivateKeyWIF: string;
  btcVault: string;
  solBridgePrivateKeyBase58: string;
  solToAddress: string;
  btcAmount: number;
  solAmount: number;
}) {
  try {
    // 1️⃣ Lock BTC
    const btcTx = await lockBtcForSol({
      btcPrivateKeyWIF,
      vaultAddress: btcVault,
      btcAmount,
    });

    // 2️⃣ Mint SOL
    const solTx = await mintSolToUser({
      solBridgePrivateKeyBase58,
      solToAddress,
      solAmount,
    });

    console.log("✅ Bridge BTC → SOL completed!");
    return {
      status: "completed",
      fromTxHash: btcTx.txHash,
      toTxHash: solTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeBitcoinToSolana error:", err);
    return { status: "failed", error: err.message };
  }
}
