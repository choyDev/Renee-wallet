// src/lib/bridge/ethereumToBitcoin.ts
import { ethers } from "ethers";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";
import axios from "axios";

const ECPair = ECPairFactory(ecc);
const network = bitcoin.networks.testnet; // use testnet or mainnet

/**
 * 🔒 Step 1: Lock ETH from user's wallet into vault
 */
export async function lockEthForBtc({
  ethPrivateKey,
  ethVault,
  ethAmount,
}: {
  ethPrivateKey: string;
  ethVault: string;
  ethAmount: number;
}) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
    const userWallet = new ethers.Wallet(ethPrivateKey, provider);

    const value = ethers.parseEther(ethAmount.toFixed(18));
    console.log(`🔒 Locking ${ethAmount} ETH from ${userWallet.address} → vault ${ethVault}`);

    const tx = await userWallet.sendTransaction({ to: ethVault, value });
    const receipt = await tx.wait(1);
    if (!receipt) throw new Error("ETH lock failed (no receipt)");

    console.log("✅ ETH locked TX:", receipt.hash);
    return { txHash: receipt.hash };
  } catch (err: any) {
    console.error("lockEthForBtc error:", err);
    throw new Error(err.message || "Failed to lock ETH");
  }
}

/**
 * 🪙 Step 2: Send BTC from bridge wallet → user
 */
export async function sendBtcToUser({
  btcPrivateKeyWIF,
  btcToAddress,
  btcAmount,
}: {
  btcPrivateKeyWIF: string;
  btcToAddress: string;
  btcAmount: number;
}) {
  try {
    const keyPair = ECPair.fromWIF(btcPrivateKeyWIF, network);
    const fromAddress = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network,
    }).address!;

    const sats = Math.floor(btcAmount * 1e8);
    console.log(`🚀 Sending ${btcAmount} BTC (${sats} sats) from ${fromAddress} → ${btcToAddress}`);

    // Fetch available UTXOs
    const utxos = (
      await axios.get(`https://blockstream.info/testnet/api/address/${fromAddress}/utxo`)
    ).data;

    if (!utxos || utxos.length === 0) {
      throw new Error(`No UTXOs found in BTC bridge wallet ${fromAddress}`);
    }

    const psbt = new bitcoin.Psbt({ network });
    let totalInput = 0;
    const FEE = 500; // sats

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

    if (totalInput < sats + FEE) {
      throw new Error(`Not enough BTC balance: have ${totalInput}, need ${sats + FEE}`);
    }

    // Add outputs (to user + change)
    psbt.addOutput({ address: btcToAddress, value: BigInt(sats) });
    const change = BigInt(totalInput - sats - FEE);
    if (change > BigInt(0)) psbt.addOutput({ address: fromAddress, value: change });


    // Sign and broadcast
    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();
    const txHex = psbt.extractTransaction().toHex();

    const txid = (
      await axios.post("https://blockstream.info/testnet/api/tx", txHex)
    ).data;

    console.log("✅ BTC sent successfully:", txid);
    return { txHash: txid };
  } catch (err: any) {
    console.error("sendBtcToUser error:", err);
    throw new Error(err.message || "Failed to send BTC");
  }
}

/**
 * 🔄 Combined ETH → BTC bridge flow
 */
export async function bridgeEthereumToBitcoin({
  ethPrivateKey,
  ethVault,
  btcPrivateKeyWIF,
  btcToAddress,
  ethAmount,
  btcAmount,
}: {
  ethPrivateKey: string;
  ethVault: string;
  btcPrivateKeyWIF: string;
  btcToAddress: string;
  ethAmount: number;
  btcAmount: number;
}) {
  try {
    // 1️⃣ Lock ETH (user → vault)
    const ethTx = await lockEthForBtc({
      ethPrivateKey,
      ethVault,
      ethAmount,
    });

    // 2️⃣ Send BTC (bridge wallet → user)
    const btcTx = await sendBtcToUser({
      btcPrivateKeyWIF,
      btcToAddress,
      btcAmount,
    });

    console.log("✅ Bridge ETH → BTC completed!");
    return {
      status: "completed",
      fromTxHash: ethTx.txHash,
      toTxHash: btcTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeEthereumToBitcoin error:", err);
    return { status: "failed", error: err.message };
  }
}
