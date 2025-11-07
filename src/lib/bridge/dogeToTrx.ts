import TronWeb from "tronweb";
import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import axios from "axios";

const ECPair = ECPairFactory(ecc);

/* -------------------------------------------------------
   DOGE Networks (Testnet / Mainnet)
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

function estimateFee(inputs: number, outputs: number, rate = 1000) {
  const txSize = 10 + inputs * 148 + outputs * 34;
  return txSize * rate;
}

/* ===========================================================
   1️⃣ Lock DOGE (User → Bridge Vault)
=========================================================== */
export async function lockDogeForTrx({
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
    const fromP2pkh = dogecoin.payments.p2pkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: net,
    });
    const fromAddress = fromP2pkh.address!;
    console.log(`🔒 Locking ${dogeAmount} DOGE from ${fromAddress} → ${vaultAddress}`);

    // Fetch UTXOs
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
    const res = broadcast.data;
    const txid =
      typeof res === "string" ? res : res?.txid || res?.result || null;
    if (!txid) throw new Error("Broadcast failed: " + JSON.stringify(res));

    console.log(`✅ DOGE locked successfully: ${explorer}/tx/${txid}`);
    return { txHash: txid };
  } catch (err: any) {
    console.error("lockDogeForTrx error:", err);
    throw new Error(err.message || "Failed to lock DOGE");
  }
}

/* ===========================================================
   2️⃣ Mint TRX to user (Bridge Wallet → User)
=========================================================== */
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
      headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
      privateKey: trxPrivateKey,
    });

    const sender = tronWeb.address.fromPrivateKey(trxPrivateKey);
    const sunAmount = Math.floor(tronWeb.toSun(trxAmount));
    console.log(`🪙 Minting ${trxAmount} TRX from ${sender} → ${trxToAddress}`);

    const tx = await tronWeb.trx.sendTransaction(trxToAddress, sunAmount);
    const txHash = tx?.txid || tx?.transaction?.txID;
    if (!tx?.result || !txHash)
      throw new Error(`TRX mint failed: ${JSON.stringify(tx)}`);

    console.log("✅ TRX minted successfully:", txHash);
    return { txHash };
  } catch (err: any) {
    console.error("mintTrxToUser error:", err);
    throw new Error(err.message || "Failed to mint TRX");
  }
}

/* ===========================================================
   3️⃣ Combined DOGE → TRX Bridge
=========================================================== */
export async function bridgeDogeToTrx({
  dogePrivateKeyWIF,
  dogeVault,
  trxPrivateKey,
  trxToAddress,
  dogeAmount,
  trxAmount,
}: {
  dogePrivateKeyWIF: string;
  dogeVault: string;
  trxPrivateKey: string;
  trxToAddress: string;
  dogeAmount: number;
  trxAmount: number;
}) {
  try {
    console.log(`🔹 Starting DOGE → TRX bridge for ${dogeAmount} DOGE`);

    // 1️⃣ Lock DOGE
    const dogeTx = await lockDogeForTrx({
      dogePrivateKeyWIF,
      vaultAddress: dogeVault,
      dogeAmount,
    });

    // 2️⃣ Mint TRX
    const trxTx = await mintTrxToUser({
      trxPrivateKey,
      trxToAddress,
      trxAmount,
    });

    console.log("✅ Bridge DOGE → TRX completed!");
    return {
      status: "completed",
      fromTxHash: dogeTx.txHash,
      toTxHash: trxTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeDogeToTrx error:", err);
    return { status: "failed", error: err.message };
  }
}
