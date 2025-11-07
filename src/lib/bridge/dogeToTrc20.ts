import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import TronWeb from "tronweb";
import axios from "axios";

const ECPair = ECPairFactory(ecc);

/* -------------------------------------------------------
   DOGE Networks
-------------------------------------------------------- */
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

function getEnv() {
  const isTest = process.env.CHAIN_ENV === "testnet";
  return {
    isTest,
    apiBase: isTest ? process.env.DOGE_API_TESTNET! : process.env.DOGE_API_MAINNET!,
    explorer: isTest ? process.env.DOGE_EXPLORER_TESTNET! : process.env.DOGE_EXPLORER_MAINNET!,
    net: isTest ? DOGE_NETWORKS.testnet : DOGE_NETWORKS.mainnet,
  };
}

function estimateFee(inputs: number, outputs: number, rate = 1000) {
  const txSize = 10 + inputs * 148 + outputs * 34;
  return txSize * rate;
}

/* ==========================================================
   1️⃣ Lock DOGE to Vault
========================================================== */
export async function lockDogeForTrc20({
  dogePrivateKeyWIF,
  vaultAddress,
  dogeAmount,
}: {
  dogePrivateKeyWIF: string;
  vaultAddress: string;
  dogeAmount: number;
}) {
  try {
    const { apiBase, explorer, net } = getEnv();
    const keyPair = ECPair.fromWIF(dogePrivateKeyWIF, net);
    const fromAddress = dogecoin.payments.p2pkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: net,
    }).address!;
    console.log(`🔒 Locking ${dogeAmount} DOGE from ${fromAddress} → vault ${vaultAddress}`);

    const utxos = (await axios.get(`${apiBase}/address/${fromAddress}/utxo`)).data;
    if (!Array.isArray(utxos) || !utxos.length)
      throw new Error("No UTXOs to spend for DOGE address");

    const sendValue = Math.floor(dogeAmount * 1e8);
    const inputs: any[] = [];
    let total = 0;
    let fee = estimateFee(1, 2);
    for (const utxo of utxos) {
      inputs.push(utxo);
      total += utxo.value;
      fee = estimateFee(inputs.length, 2);
      if (total >= sendValue + fee) break;
    }
    if (total < sendValue + fee) throw new Error("Insufficient DOGE balance");

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
    const txid = typeof broadcast.data === "string" ? broadcast.data : broadcast.data?.txid;
    if (!txid) throw new Error("Broadcast failed");
    console.log(`✅ DOGE locked: ${explorer}/tx/${txid}`);
    return { txHash: txid };
  } catch (err: any) {
    console.error("lockDogeForTrc20 error:", err);
    throw new Error(err.message || "Failed to lock DOGE");
  }
}

/* ==========================================================
   2️⃣ Send TRC20 USDT to User
========================================================== */
export async function sendTronUsdt({
  tronBridgePrivateKey,
  tronToAddress,
  amountTrc20,
}: {
  tronBridgePrivateKey: string;
  tronToAddress: string;
  amountTrc20: number;
}) {
  try {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_NILE_RPC!,
      headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
      privateKey: tronBridgePrivateKey,
    });
    const fromAddr = tronWeb.address.fromPrivateKey(tronBridgePrivateKey);
    const contract = await tronWeb.contract().at(process.env.TRON_TESTNET_USDT_CONTRACT!);

    console.log(`🚀 Sending ${amountTrc20} USDT from ${fromAddr} → ${tronToAddress}`);
    const sunAmount = Math.floor(Number(tronWeb.toSun(amountTrc20)));
    const tx = await contract.transfer(tronToAddress, sunAmount).send();
    console.log("✅ Sent TRC20 USDT TX:", tx);
    return { txHash: tx };
  } catch (err: any) {
    console.error("sendTronUsdt error:", err);
    throw new Error(err.message || "Failed to send TRC20 USDT");
  }
}

/* ==========================================================
   3️⃣ Combined DOGE → TRC20 Bridge
========================================================== */
export async function bridgeDogeToTrc20({
  dogePrivateKeyWIF,
  dogeVault,
  tronBridgePrivateKey,
  tronToAddress,
  dogeAmount,
  trc20Amount,
}: {
  dogePrivateKeyWIF: string;
  dogeVault: string;
  tronBridgePrivateKey: string;
  tronToAddress: string;
  dogeAmount: number;
  trc20Amount: number;
}) {
  try {
    console.log(`🔹 Starting DOGE → TRC20 bridge for ${dogeAmount} DOGE`);
    const dogeTx = await lockDogeForTrc20({
      dogePrivateKeyWIF,
      vaultAddress: dogeVault,
      dogeAmount,
    });
    const tronTx = await sendTronUsdt({
      tronBridgePrivateKey,
      tronToAddress,
      amountTrc20: trc20Amount,
    });
    console.log("✅ Bridge DOGE → TRC20 completed!");
    return { status: "completed", fromTxHash: dogeTx.txHash, toTxHash: tronTx.txHash };
  } catch (err: any) {
    console.error("bridgeDogeToTrc20 error:", err);
    return { status: "failed", error: err.message };
  }
}
