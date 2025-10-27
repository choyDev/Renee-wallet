// src/lib/bridge/bitcoinToEthereum.ts
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";
import axios from "axios";
import { ethers } from "ethers";

const ECPair = ECPairFactory(ecc);
const network = bitcoin.networks.testnet; // 🔹 use mainnet for production

/**
 * 🔒 Step 1: Lock BTC into vault
 */
export async function lockBtcForEth({
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

    // Get UTXOs
    const utxos = (
      await axios.get(`https://blockstream.info/testnet/api/address/${fromAddress}/utxo`)
    ).data;

    if (!utxos || utxos.length === 0)
      throw new Error(`No UTXOs found for BTC address ${fromAddress}`);

    const psbt = new bitcoin.Psbt({ network });
    let totalInput = 0;
    const FEE = 500;

    // Add inputs
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

    // Add vault output
    psbt.addOutput({ address: vaultAddress, value: BigInt(sats) });

    // Add change if needed
    const change = BigInt(totalInput - sats - FEE);
    if (change > BigInt(0))
      psbt.addOutput({ address: fromAddress, value: change });

    // Sign & broadcast
    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();
    const txid = (await axios.post("https://blockstream.info/testnet/api/tx", txHex)).data;

    console.log("✅ BTC locked successfully:", txid);
    return { txHash: txid };
  } catch (err: any) {
    console.error("lockBtcForEth error:", err);
    throw new Error(err.message || "Failed to lock BTC");
  }
}

/**
 * 🪙 Step 2: Mint ETH to user (bridge wallet sends ETH)
 */
export async function mintEthToUser({
  ethBridgePrivateKey,
  ethToAddress,
  ethAmount,
}: {
  ethBridgePrivateKey: string;
  ethToAddress: string;
  ethAmount: number;
}) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
    const bridgeWallet = new ethers.Wallet(ethBridgePrivateKey, provider);

    const value = ethers.parseEther(ethAmount.toFixed(18));
    console.log(`🪙 Minting (sending) ${ethAmount} ETH from ${bridgeWallet.address} → ${ethToAddress}`);

    const tx = await bridgeWallet.sendTransaction({
      to: ethToAddress,
      value,
    });

    const receipt = await tx.wait(1);
    if (!receipt) throw new Error("ETH mint failed (no receipt)");

    console.log("✅ ETH minted successfully:", receipt.hash);
    return { txHash: receipt.hash };
  } catch (err: any) {
    console.error("mintEthToUser error:", err);
    throw new Error(err.message || "Failed to mint ETH");
  }
}

/**
 * 🔄 Combined BTC → ETH bridge flow
 */
export async function bridgeBitcoinToEthereum({
  btcPrivateKeyWIF,
  btcVault,
  ethBridgePrivateKey,
  ethToAddress,
  btcAmount,
  ethAmount,
}: {
  btcPrivateKeyWIF: string;
  btcVault: string;
  ethBridgePrivateKey: string;
  ethToAddress: string;
  btcAmount: number;
  ethAmount: number;
}) {
  try {
    // 1️⃣ Lock BTC
    const btcTx = await lockBtcForEth({
      btcPrivateKeyWIF,
      vaultAddress: btcVault,
      btcAmount,
    });

    // 2️⃣ Mint ETH
    const ethTx = await mintEthToUser({
      ethBridgePrivateKey,
      ethToAddress,
      ethAmount,
    });

    console.log("✅ Bridge BTC → ETH completed!");
    return {
      status: "completed",
      fromTxHash: btcTx.txHash,
      toTxHash: ethTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeBitcoinToEthereum error:", err);
    return { status: "failed", error: err.message };
  }
}
