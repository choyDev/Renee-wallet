import TronWeb from "tronweb";
import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import axios from "axios";

const ECPair = ECPairFactory(ecc);

/* -------------------------------------------------------
   Dogecoin Networks
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
    apiBase: isTest
      ? "https://doge-electrs-testnet-demo.qed.me"
      : "https://dogechain.info/api",
    explorer: isTest
      ? "https://doge-testnet-explorer.qed.me"
      : "https://dogechain.info",
    net: isTest ? DOGE_NETWORKS.testnet : DOGE_NETWORKS.mainnet,
  };
}

/* -------------------------------------------------------
   Helper for fee estimation
-------------------------------------------------------- */
function estimateFee(inputs: number, outputs: number, rate = 1000) {
  const txSize = 10 + inputs * 148 + outputs * 34;
  return txSize * rate;
}

/* ===========================================================
   1️⃣ Lock native TRX (User → Vault)
=========================================================== */
async function lockTrx({
  tronPrivateKey,
  vaultAddress,
  amountTrx,
}: {
  tronPrivateKey: string;
  vaultAddress: string;
  amountTrx: number;
}) {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: tronPrivateKey,
  });

  const fromAddr = tronWeb.address.fromPrivateKey(tronPrivateKey);
  const sunAmount = Math.floor(Number(tronWeb.toSun(amountTrx)));

  console.log(`🔒 Locking ${amountTrx} TRX from ${fromAddr} → ${vaultAddress}`);

  const tx = await tronWeb.trx.sendTransaction(vaultAddress, sunAmount);
  if (!tx?.result) throw new Error(`TRX lock failed: ${JSON.stringify(tx)}`);

  console.log("✅ Locked TRX TX:", tx.txid);
  return { txHash: tx.txid };
}

/* ===========================================================
   2️⃣ Send DOGE from Bridge Vault (imitate /api/dogecoin/send)
=========================================================== */
async function sendDogecoinVault({
  bridgeWif,
  toAddress,
  amountDoge,
}: {
  bridgeWif: string;
  toAddress: string;
  amountDoge: number;
}) {
  const { apiBase, explorer, net } = getEnv();
  const keyPair = ECPair.fromWIF(bridgeWif, net);

  const p2pkh = dogecoin.payments.p2pkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network: net,
  });

  const fromAddress = p2pkh.address!;
  console.log(`🐶 DOGE Vault: ${fromAddress}`);

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

  // Build PSBT
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

  // ✅ Proper signer conversion
  const signer = {
    publicKey: Buffer.from(keyPair.publicKey),
    sign: (hash: Buffer) => Buffer.from(keyPair.sign(hash)),
  };

  psbt.signAllInputs(signer);
  psbt.finalizeAllInputs();
  const rawHex = psbt.extractTransaction().toHex();

  // Broadcast
  const broadcast = await axios.post(`${apiBase}/tx`, rawHex, {
    headers: { "Content-Type": "text/plain" },
  });
  const txid =
    typeof broadcast.data === "string" ? broadcast.data : broadcast.data?.txid;
  if (!txid) throw new Error("Broadcast failed: no txid returned");

  console.log(`✅ DOGE sent → ${toAddress} (${explorer}/tx/${txid})`);
  return { txHash: txid };
}

/* ===========================================================
   3️⃣ Combined Bridge: TRX → DOGE
=========================================================== */
export async function bridgeTRXToDOGE({
  tronPrivateKey,
  tronVaultAddress,
  dogeBridgeWif,
  dogeToAddress,
  amountTrx,
  amountDoge,
}: {
  tronPrivateKey: string;
  tronVaultAddress: string;
  dogeBridgeWif: string;
  dogeToAddress: string;
  amountTrx: number;
  amountDoge: number;
}) {
  try {
    console.log(`🔹 Starting TRX → DOGE bridge for ${amountTrx} TRX`);

    // Step 1️⃣ Lock on Tron
    const tronTx = await lockTrx({
      tronPrivateKey,
      vaultAddress: tronVaultAddress,
      amountTrx,
    });

    // Step 2️⃣ Send DOGE
    const dogeTx = await sendDogecoinVault({
      bridgeWif: dogeBridgeWif,
      toAddress: dogeToAddress,
      amountDoge,
    });

    console.log("✅ Bridge TRX → DOGE completed!");
    return {
      status: "completed",
      fromTxHash: tronTx.txHash,
      toTxHash: dogeTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeTRXToDOGE error:", err);
    return { status: "failed", error: err.message };
  }
}
