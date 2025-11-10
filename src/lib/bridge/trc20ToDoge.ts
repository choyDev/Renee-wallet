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

function getDogeEnv() {
  const isTest = process.env.CHAIN_ENV === "testnet";
  return {
    isTest,
    apiBase: isTest ? process.env.DOGE_API_TESTNET! : process.env.DOGE_API_MAINNET!,
    explorer: isTest ? process.env.DOGE_EXPLORER_TESTNET! : process.env.DOGE_EXPLORER_MAINNET!,
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
   1️⃣ Lock TRC-20 USDT (User → Vault)
=========================================================== */
async function lockTrc20Usdt({
  tronPrivateKey,
  vaultAddress,
  amountUsdt,
}: {
  tronPrivateKey: string;
  vaultAddress: string;
  amountUsdt: number;
}) {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: tronPrivateKey,
  });

  const fromAddr = tronWeb.address.fromPrivateKey(tronPrivateKey);
  const contractAddr = process.env.TRON_TESTNET_USDT_CONTRACT!;
  const decimals = Number(process.env.TRC20_USDT_DECIMALS || 6);
  const usdtAmount = Math.floor(amountUsdt * 10 ** decimals);

  console.log(`🔒 Locking ${amountUsdt} USDT from ${fromAddr} → vault ${vaultAddress}`);

  const contract = await tronWeb.contract().at(contractAddr);
  const tx = await contract.transfer(vaultAddress, usdtAmount).send({
    feeLimit: 100_000_000,
  });

  console.log("✅ Locked TRC-20 USDT TX:", tx);
  return { txHash: tx };
}

/* ===========================================================
   2️⃣ Send DOGE from Bridge Vault → User
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
  const { apiBase, explorer, net } = getDogeEnv();
  const keyPair = ECPair.fromWIF(bridgeWif, net);

  const p2pkh = dogecoin.payments.p2pkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network: net,
  });
  const fromAddress = p2pkh.address!;
  console.log(`🐶 DOGE Bridge Vault: ${fromAddress}`);

  // Fetch UTXOs
  const utxos = (await axios.get(`${apiBase}/address/${fromAddress}/utxo`)).data;
  if (!Array.isArray(utxos) || !utxos.length)
    throw new Error("No UTXOs available in DOGE bridge vault");

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
    throw new Error("DOGE bridge vault has insufficient balance");

  const changeValue = inValue - sendValue - fee;

  // Build PSBT
  const psbt = new dogecoin.Psbt({ network: net });
  psbt.setMaximumFeeRate(1e9); // ✅ avoid fee warning

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

  // ✅ bypass fee safety check
  const rawHex = psbt.extractTransaction(true).toHex();

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
   3️⃣ Combined Bridge: TRC20 USDT → DOGE
=========================================================== */
export async function bridgeTrc20ToDoge({
  tronPrivateKey,
  tronVaultAddress,
  dogeBridgeWif,
  dogeToAddress,
  amountUsdt,
  amountDoge,
}: {
  tronPrivateKey: string;
  tronVaultAddress: string;
  dogeBridgeWif: string;
  dogeToAddress: string;
  amountUsdt: number;
  amountDoge: number;
}) {
  try {
    console.log(`🔹 Starting TRC20 → DOGE bridge for ${amountUsdt} USDT`);

    // Step 1️⃣ Lock TRC20 USDT
    const tronTx = await lockTrc20Usdt({
      tronPrivateKey,
      vaultAddress: tronVaultAddress,
      amountUsdt,
    });

    // Step 2️⃣ Send DOGE
    const dogeTx = await sendDogecoinVault({
      bridgeWif: dogeBridgeWif,
      toAddress: dogeToAddress,
      amountDoge,
    });

    console.log("✅ Bridge TRC20 → DOGE completed!");
    return {
      status: "completed",
      fromTxHash: tronTx.txHash,
      toTxHash: dogeTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeTrc20ToDoge error:", err);
    return { status: "failed", error: err.message };
  }
}
