// src/lib/bridge/ethereumToDoge.ts
import { ethers } from "ethers";
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
      ? process.env.DOGE_API_TESTNET!
      : process.env.DOGE_API_MAINNET!,
    explorer: isTest
      ? process.env.DOGE_EXPLORER_TESTNET!
      : process.env.DOGE_EXPLORER_MAINNET!,
    net: isTest ? DOGE_NETWORKS.testnet : DOGE_NETWORKS.mainnet,
  };
}

function estimateFee(inputs: number, outputs: number, rate = 1000) {
  const txSize = 10 + inputs * 148 + outputs * 34;
  return txSize * rate;
}

/* ===========================================================
   🔹 1️⃣ Lock ETH (User → Bridge Vault)
=========================================================== */
export async function lockEthForDoge({
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
    const wallet = new ethers.Wallet(ethPrivateKey, provider);
    const valueWei = ethers.parseEther(ethAmount.toFixed(8));

    const balance = await provider.getBalance(wallet.address);
    if (balance < valueWei)
      throw new Error(
        `Insufficient ETH balance (${ethers.formatEther(balance)} ETH)`
      );

    console.log(
      `🔒 Locking ${ethAmount} ETH from ${wallet.address} → vault ${ethVault}`
    );

    const tx = await wallet.sendTransaction({ to: ethVault, value: valueWei });
    const receipt = await tx.wait();
    if (!receipt) throw new Error("ETH lock failed (no receipt)");

    console.log("✅ ETH locked TX:", receipt.hash);
    return { txHash: receipt.hash };
  } catch (err: any) {
    console.error("lockEthForDoge error:", err);
    throw new Error(err.message || "Failed to lock ETH");
  }
}

/* ===========================================================
   🪙 2️⃣ Send DOGE (Bridge → User)
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
    const { apiBase, explorer, net } = getEnv();
    const keyPair = ECPair.fromWIF(bridgeWif, net);

    const fromAddress = dogecoin.payments.p2pkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: net,
    }).address!;

    console.log(`🐶 Bridge vault: ${fromAddress}`);

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
    if (!txid) throw new Error("Broadcast failed");

    console.log(`✅ DOGE sent → ${toAddress} (${explorer}/tx/${txid})`);
    return { txHash: txid };
  } catch (err: any) {
    console.error("sendDogeFromBridge error:", err);
    throw new Error(err.message || "Failed to send DOGE");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge: ETH → DOGE
=========================================================== */
export async function bridgeEthereumToDoge({
  ethPrivateKey,
  ethVault,
  dogeBridgeWif,
  dogeToAddress,
  ethAmount,
  dogeAmount,
}: {
  ethPrivateKey: string;
  ethVault: string;
  dogeBridgeWif: string;
  dogeToAddress: string;
  ethAmount: number;
  dogeAmount: number;
}) {
  try {
    console.log(`🔹 Starting ETH → DOGE bridge for ${ethAmount} ETH`);

    // Step 1️⃣ Lock ETH
    const ethTx = await lockEthForDoge({
      ethPrivateKey,
      ethVault,
      ethAmount,
    });

    // Step 2️⃣ Send DOGE
    const dogeTx = await sendDogeFromBridge({
      bridgeWif: dogeBridgeWif,
      toAddress: dogeToAddress,
      amountDoge: dogeAmount,
    });

    console.log("✅ Bridge ETH → DOGE completed!");
    return {
      status: "completed",
      fromTxHash: ethTx.txHash,
      toTxHash: dogeTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeEthereumToDoge error:", err);
    return { status: "failed", error: err.message };
  }
}
