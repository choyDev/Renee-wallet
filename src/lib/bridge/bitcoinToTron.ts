// src/lib/bridge/bitcoinToTron.ts
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";
import TronWeb from "tronweb";
import axios from "axios";

const ECPair = ECPairFactory(ecc);
const network = bitcoin.networks.testnet; // change to mainnet later

/**
 * 🔒 Step 1: Lock BTC into bridge vault
 * (User must send BTC manually or via UI trigger)
 */
export async function lockBtcForTrx({
  btcPrivateKeyWIF,
  vaultAddress,
  btcAmount,
}: {
  btcPrivateKeyWIF: string;
  vaultAddress: string;
  btcAmount: number;
}) {
  try {
    const keyPair = ECPair.fromWIF(btcPrivateKeyWIF, network);
    const fromAddress = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network,
    }).address!;

    const sats = Math.floor(btcAmount * 1e8);
    console.log(`🔒 Locking ${btcAmount} BTC (${sats} sats) from ${fromAddress} → vault ${vaultAddress}`);

    // Fetch UTXOs for user's wallet
    const utxos = (
      await axios.get(`https://blockstream.info/testnet/api/address/${fromAddress}/utxo`)
    ).data;

    if (!utxos || utxos.length === 0)
      throw new Error(`No UTXOs found for BTC address ${fromAddress}`);

    const psbt = new bitcoin.Psbt({ network });
    let totalInput = 0;
    const FEE = 500;

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

    if (totalInput < sats + FEE) throw new Error("Not enough BTC balance");

    psbt.addOutput({ address: vaultAddress, value: BigInt(sats) });

    const change = BigInt(totalInput - sats - FEE);
    if (change > BigInt(0)) psbt.addOutput({ address: fromAddress, value: change });

    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();
    const txid = (
      await axios.post("https://blockstream.info/testnet/api/tx", txHex)
    ).data;

    console.log("✅ BTC locked successfully:", txid);
    return { txHash: txid };
  } catch (err: any) {
    console.error("lockBtcForTrx error:", err);
    throw new Error(err.message || "Failed to lock BTC");
  }
}

/**
 * 🪙 Step 2: Mint TRX to the user
 * (Bridge wallet mints equivalent TRX)
 */
export async function mintTrxToUser({
  trxPrivateKey,
  trxToAddress,
  trxAmount,
}: {
  trxPrivateKey: string;
  trxToAddress: string;
  trxAmount: number;
}) {
  try {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_NILE_RPC!,
      privateKey: trxPrivateKey,
    });

    const sender = tronWeb.address.fromPrivateKey(trxPrivateKey);
    const sunAmount = Math.floor(tronWeb.toSun(trxAmount));

    console.log(`🪙 Minting ${trxAmount} TRX (${sunAmount} sun) from ${sender} → ${trxToAddress}`);

    const tx = await tronWeb.trx.sendTransaction(trxToAddress, sunAmount);
    if (!tx?.result) throw new Error(`TRX mint failed: ${JSON.stringify(tx)}`);

    console.log("✅ TRX minted successfully:", tx.txid);
    return { txHash: tx.txid };
  } catch (err: any) {
    console.error("mintTrxToUser error:", err);
    throw new Error(err.message || "Failed to mint TRX");
  }
}

/**
 * 🔄 Combined BTC → TRX bridge flow
 */
export async function bridgeBitcoinToTron({
  btcPrivateKeyWIF,
  btcVault,
  trxPrivateKey,
  trxToAddress,
  btcAmount,
  trxAmount,
}: {
  btcPrivateKeyWIF: string;
  btcVault: string;
  trxPrivateKey: string;
  trxToAddress: string;
  btcAmount: number;
  trxAmount: number;
}) {
  try {
    // 1️⃣ Lock BTC
    const btcTx = await lockBtcForTrx({
      btcPrivateKeyWIF,
      vaultAddress: btcVault,
      btcAmount,
    });

    // 2️⃣ Mint TRX
    const trxTx = await mintTrxToUser({
      trxPrivateKey,
      trxToAddress,
      trxAmount,
    });

    console.log("✅ Bridge BTC → TRX completed!");
    return {
      status: "completed",
      fromTxHash: btcTx.txHash,
      toTxHash: trxTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeBitcoinToTron error:", err);
    return { status: "failed", error: err.message };
  }
}
