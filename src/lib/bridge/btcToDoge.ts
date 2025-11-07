// =============================================================
//  BTC → DOGE Bridge
//  Locks native BTC from user → BTC vault
//  Then sends native DOGE from bridge vault → user
// =============================================================

import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
import axios from "axios";

const ECPair = ECPairFactory(ecc);

/* ===========================================================
   🪙 Network Configurations
=========================================================== */
const BTC_NETWORK =
  process.env.CHAIN_ENV === "testnet"
    ? bitcoin.networks.testnet
    : bitcoin.networks.bitcoin;

const DOGE_NETWORKS = {
  testnet: {
    messagePrefix: "\x19Dogecoin Signed Message:\n",
    bech32: "tdge",
    bip32: { public: 0x043587cf, private: 0x04358394 },
    pubKeyHash: 0x71,
    scriptHash: 0xc4,
    wif: 0xf1,
  },
  mainnet: {
    messagePrefix: "\x19Dogecoin Signed Message:\n",
    bech32: "doge",
    bip32: { public: 0x02facafd, private: 0x02fac398 },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e,
  },
};

function getDogeEnv() {
  const isTest = process.env.CHAIN_ENV === "testnet";
  return {
    isTest,
    apiBase: isTest
      ? process.env.DOGE_API_TESTNET! || "https://doge-electrs-testnet-demo.qed.me"
      : process.env.DOGE_API_MAINNET! || "https://dogechain.info/api",
    explorer: isTest
      ? process.env.DOGE_EXPLORER_TESTNET! || "https://doge-testnet-explorer.qed.me"
      : process.env.DOGE_EXPLORER_MAINNET! || "https://dogechain.info",
    net: isTest ? DOGE_NETWORKS.testnet : DOGE_NETWORKS.mainnet,
  };
}

/* ===========================================================
   🔹 Helper
=========================================================== */
function estimateFee(inputs: number, outputs: number, rate = 10) {
  const txSize = 10 + inputs * 148 + outputs * 34;
  return txSize * rate;
}

/* ===========================================================
   🔒 1️⃣ Lock BTC (User → BTC Vault)
=========================================================== */
export async function lockBtcForDoge({
  btcPrivateKeyWIF,
  vaultAddress,
  btcAmount,
}: {
  btcPrivateKeyWIF: string;
  vaultAddress: string;
  btcAmount: number;
}) {
  try {
    const keyPair = ECPair.fromWIF(btcPrivateKeyWIF, BTC_NETWORK);
    const fromAddress = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network: BTC_NETWORK,
    }).address!;

    const sats = Math.floor(btcAmount * 1e8);
    console.log(`🔒 Locking ${btcAmount} BTC (${sats} sats) from ${fromAddress} → vault ${vaultAddress}`);

    const apiBase =
      process.env.CHAIN_ENV === "testnet"
        ? "https://blockstream.info/testnet/api"
        : "https://blockstream.info/api";

    // Fetch UTXOs
    const utxos = (await axios.get(`${apiBase}/address/${fromAddress}/utxo`)).data;
    if (!utxos?.length) throw new Error("No BTC UTXOs found");

    const psbt = new bitcoin.Psbt({ network: BTC_NETWORK });
    let totalInput = 0;
    const FEE = 500; // sats

    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.payments.p2wpkh({
            pubkey: keyPair.publicKey,
            network: BTC_NETWORK,
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
    const txid = (await axios.post(`${apiBase}/tx`, txHex)).data;

    console.log(`✅ BTC locked successfully: ${txid}`);
    return { txHash: txid };
  } catch (err: any) {
    console.error("lockBtcForDoge error:", err);
    throw new Error(err.message || "Failed to lock BTC");
  }
}

/* ===========================================================
   🪙 2️⃣ Send DOGE (Bridge Vault → User)
=========================================================== */
export async function sendDogeFromBridge({
  bridgeWif,
  toAddress,
  amountDoge,
}: {
  bridgeWif: string;
  toAddress: string;
  amountDoge: number;
}) {
  try {
    const { apiBase, explorer, net } = getDogeEnv();
    const keyPair = ECPair.fromWIF(bridgeWif, net);

    const fromAddress = dogecoin.payments.p2pkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: net,
    }).address!;

    console.log(`🐶 Bridge DOGE vault: ${fromAddress}`);

    // Fetch vault UTXOs
    const utxoRes = await axios.get(`${apiBase}/address/${fromAddress}/utxo`);
    const utxos = utxoRes.data;
    if (!Array.isArray(utxos) || !utxos.length)
      throw new Error("No UTXOs in DOGE vault");

    const sendValue = Math.floor(amountDoge * 1e8);
    const feeRate = 1000;
    const inputs: any[] = [];
    let inValue = 0;
    const outCount = 2;
    let fee = estimateFee(1, outCount, feeRate);

    for (const utxo of utxos) {
      inputs.push(utxo);
      inValue += utxo.value;
      fee = estimateFee(inputs.length, outCount, feeRate);
      if (inValue >= sendValue + fee) break;
    }

    if (inValue < sendValue + fee)
      throw new Error("DOGE vault has insufficient balance");

    const changeValue = inValue - sendValue - fee;

    const psbt = new dogecoin.Psbt({ network: net });
    for (const utxo of inputs) {
      const txHexRes = await axios.get(`${apiBase}/tx/${utxo.txid}/hex`);
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(txHexRes.data, "hex"),
      });
    }

    psbt.addOutput({ address: toAddress, value: sendValue });
    if (changeValue > 0)
      psbt.addOutput({ address: fromAddress, value: changeValue });

    const signer = {
      publicKey: Buffer.from(keyPair.publicKey),
      sign: (hash: Buffer) => Buffer.from(keyPair.sign(hash)),
    };

    psbt.signAllInputs(signer);
    psbt.finalizeAllInputs();
    const rawHex = psbt.extractTransaction().toHex();

    const broadcast = await axios.post(`${apiBase}/tx`, rawHex, {
      headers: { "Content-Type": "text/plain" },
    });
    const txid =
      typeof broadcast.data === "string"
        ? broadcast.data
        : broadcast.data?.txid || broadcast.data?.result;
    if (!txid) throw new Error("DOGE broadcast failed");

    console.log(`✅ Sent ${amountDoge} DOGE → ${toAddress} (${explorer}/tx/${txid})`);
    return { txHash: txid };
  } catch (err: any) {
    console.error("sendDogeFromBridge error:", err);
    throw new Error(err.message || "Failed to send DOGE");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge: BTC → DOGE
=========================================================== */
export async function bridgeBtcToDoge({
  btcPrivateKeyWIF,
  btcVaultAddress,
  dogeBridgeWif,
  dogeToAddress,
  btcAmount,
  dogeAmount,
}: {
  btcPrivateKeyWIF: string;
  btcVaultAddress: string;
  dogeBridgeWif: string;
  dogeToAddress: string;
  btcAmount: number;
  dogeAmount: number;
}) {
  try {
    console.log(`🔹 Starting BTC → DOGE bridge for ${btcAmount} BTC`);

    // Step 1️⃣ Lock BTC
    const btcTx = await lockBtcForDoge({
      btcPrivateKeyWIF,
      vaultAddress: btcVaultAddress,
      btcAmount,
    });

    // Step 2️⃣ Send DOGE
    const dogeTx = await sendDogeFromBridge({
      bridgeWif: dogeBridgeWif,
      toAddress: dogeToAddress,
      amountDoge: dogeAmount,
    });

    console.log("✅ Bridge BTC → DOGE completed!");
    return {
      status: "completed",
      fromTxHash: btcTx.txHash,
      toTxHash: dogeTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeBtcToDoge error:", err);
    return { status: "failed", error: err.message };
  }
}
