// =============================================================
//  DOGE → BTC Bridge
//  Locks native DOGE (user → DOGE vault)
//  Then sends native BTC from bridge vault → user
// =============================================================

import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import axios from "axios";

const ECPair = ECPairFactory(ecc);

/* ===========================================================
   🌐 Network Configs
=========================================================== */
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

const BTC_NETWORK =
  process.env.CHAIN_ENV === "testnet"
    ? bitcoin.networks.testnet
    : bitcoin.networks.bitcoin;

/* ===========================================================
   🧮 Fee Helper
=========================================================== */
function estimateFee(inputs: number, outputs: number, rate = 1000) {
  const txSize = 10 + inputs * 148 + outputs * 34;
  return txSize * rate;
}

/* ===========================================================
   🔒 1️⃣ Lock DOGE (User → DOGE Vault)
=========================================================== */
export async function lockDogeForBtc({
  dogePrivateKeyWIF,
  vaultAddress,
  dogeAmount,
}: {
  dogePrivateKeyWIF: string;
  vaultAddress: string;
  dogeAmount: number;
}) {
  try {
    const { apiBase, explorer, net } = getDogeEnv();
    const keyPair = ECPair.fromWIF(dogePrivateKeyWIF, net);
    const fromAddress = dogecoin.payments.p2pkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: net,
    }).address!;

    console.log(`🔒 Locking ${dogeAmount} DOGE from ${fromAddress} → vault ${vaultAddress}`);

    const utxoRes = await axios.get(`${apiBase}/address/${fromAddress}/utxo`);
    const utxos = utxoRes.data;
    if (!Array.isArray(utxos) || !utxos.length)
      throw new Error("No UTXOs found for DOGE address");

    const sendValue = Math.floor(dogeAmount * 1e8);
    const inputs: any[] = [];
    let total = 0;
    const outCount = 2;
    let fee = estimateFee(1, outCount);

    for (const utxo of utxos) {
      inputs.push(utxo);
      total += utxo.value;
      fee = estimateFee(inputs.length, outCount);
      if (total >= sendValue + fee) break;
    }

    if (total < sendValue + fee)
      throw new Error("Not enough DOGE to lock");

    const change = total - sendValue - fee;
    const psbt = new dogecoin.Psbt({ network: net });

    for (const utxo of inputs) {
      const txHexRes = await axios.get(`${apiBase}/tx/${utxo.txid}/hex`);
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(txHexRes.data, "hex"),
      });
    }

    psbt.addOutput({ address: vaultAddress, value: sendValue });
    if (change > 0) psbt.addOutput({ address: fromAddress, value: change });

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

    if (!txid) throw new Error("Broadcast failed");

    console.log(`✅ DOGE locked successfully: ${explorer}/tx/${txid}`);
    return { txHash: txid };
  } catch (err: any) {
    console.error("lockDogeForBtc error:", err);
    throw new Error(err.message || "Failed to lock DOGE");
  }
}

/* ===========================================================
   🪙 2️⃣ Send BTC (Bridge Vault → User)
=========================================================== */
export async function sendBtcFromBridge({
  btcPrivateKeyWIF,
  toAddress,
  btcAmount,
}: {
  btcPrivateKeyWIF: string;
  toAddress: string;
  btcAmount: number;
}) {
  try {
    const ECPair = ECPairFactory(ecc);
    const keyPair = ECPair.fromWIF(btcPrivateKeyWIF, BTC_NETWORK);

    const sats = BigInt(Math.floor(btcAmount * 1e8));
    const fromAddress = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network: BTC_NETWORK,
    }).address!;

    console.log(`🚀 Sending ${btcAmount} BTC from ${fromAddress} → ${toAddress}`);

    const apiBase =
      process.env.CHAIN_ENV === "testnet"
        ? "https://blockstream.info/testnet/api"
        : "https://blockstream.info/api";

    const utxos = (await axios.get(`${apiBase}/address/${fromAddress}/utxo`)).data;
    if (!utxos?.length)
      throw new Error("No BTC UTXOs available in bridge wallet");

    const psbt = new bitcoin.Psbt({ network: BTC_NETWORK });

    let totalInput = BigInt(0);
    const FEE = BigInt(500);

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
      totalInput += BigInt(utxo.value);
      if (totalInput >= sats + FEE) break;
    }

    if (totalInput < sats + FEE)
      throw new Error("Not enough BTC balance in bridge wallet");

    psbt.addOutput({ address: toAddress, value: sats });

    const change = totalInput - sats - FEE;
    if (change > BigInt(0))
      psbt.addOutput({ address: fromAddress, value: change });

    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();
    const txid = (await axios.post(`${apiBase}/tx`, txHex)).data;

    console.log("✅ BTC sent successfully:", txid);
    return { txHash: txid };
  } catch (err: any) {
    console.error("sendBtcFromBridge error:", err);
    throw new Error(err.message || "Failed to send BTC");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge: DOGE → BTC
=========================================================== */
export async function bridgeDogeToBtc({
  dogePrivateKeyWIF,
  dogeVaultAddress,
  btcBridgePrivateKeyWIF,
  btcToAddress,
  dogeAmount,
  btcAmount,
}: {
  dogePrivateKeyWIF: string;
  dogeVaultAddress: string;
  btcBridgePrivateKeyWIF: string;
  btcToAddress: string;
  dogeAmount: number;
  btcAmount: number;
}) {
  try {
    console.log(`🔹 Starting DOGE → BTC bridge for ${dogeAmount} DOGE`);

    // 1️⃣ Lock DOGE
    const dogeTx = await lockDogeForBtc({
      dogePrivateKeyWIF,
      vaultAddress: dogeVaultAddress,
      dogeAmount,
    });

    // 2️⃣ Send BTC
    const btcTx = await sendBtcFromBridge({
      btcPrivateKeyWIF: btcBridgePrivateKeyWIF,
      toAddress: btcToAddress,
      btcAmount,
    });

    console.log("✅ Bridge DOGE → BTC completed!");
    return {
      status: "completed",
      fromTxHash: dogeTx.txHash,
      toTxHash: btcTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeDogeToBtc error:", err);
    return { status: "failed", error: err.message };
  }
}
