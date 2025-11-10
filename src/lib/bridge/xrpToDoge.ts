// =============================================================
// XRP → DOGE Bridge
// Locks native XRP from user → XRP vault
// Then sends native DOGE from bridge vault → user
// =============================================================

import { Client, Wallet } from "xrpl";
import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
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
      ? process.env.DOGE_API_TESTNET!
      : process.env.DOGE_API_MAINNET!,
    explorer: isTest
      ? process.env.DOGE_EXPLORER_TESTNET!
      : process.env.DOGE_EXPLORER_MAINNET!,
    net: isTest ? DOGE_NETWORKS.testnet : DOGE_NETWORKS.mainnet,
  };
}

function estimateDogeFee(inputs: number, outputs: number, rate = 1000) {
  const txSize = 10 + inputs * 148 + outputs * 34;
  return txSize * rate;
}

/* ===========================================================
   🔒 1️⃣ Lock XRP (User → XRP Vault)
=========================================================== */
export async function lockXrpForDoge({
  userSeed,
  vaultAddress,
  amountXrp,
  memo,
}: {
  userSeed: string;
  vaultAddress: string;
  amountXrp: number;
  memo?: string;
}) {
  try {
    const isTest = process.env.CHAIN_ENV === "testnet";
    const rpcUrl = isTest
      ? process.env.XRP_API_TESTNET!  // e.g. "wss://s.altnet.rippletest.net:51233"
      : process.env.XRP_API_MAINNET!; // e.g. "wss://xrplcluster.com"
    const explorer = isTest
      ? process.env.XRP_EXPLORER_TESTNET!
      : process.env.XRP_EXPLORER_MAINNET!;

    const client = new Client(rpcUrl);
    await client.connect();

    const wallet = Wallet.fromSeed(userSeed);
    const fromAddress = wallet.address;

    console.log(`🔒 Locking ${amountXrp} XRP from ${fromAddress} → vault ${vaultAddress}`);

    const accountInfo = await client.request({
      command: "account_info",
      account: fromAddress,
    });

    const sequence = accountInfo.result.account_data.Sequence;
    const ledgerIndex = accountInfo.result.ledger_current_index ?? 0;

    const tx: any = {
      TransactionType: "Payment",
      Account: fromAddress,
      Destination: vaultAddress,
      Amount: (BigInt(Math.floor(amountXrp * 1_000_000))).toString(), // drops
      Fee: "12",
      Sequence: sequence,
      LastLedgerSequence: ledgerIndex + 10,
    };

    if (memo) {
      tx.Memos = [
        {
          Memo: {
            MemoData: Buffer.from(memo, "utf8").toString("hex"),
          },
        },
      ];
    }

    const signed = wallet.sign(tx);
    const submit = await client.submitAndWait(signed.tx_blob);
    await client.disconnect();

    const result = submit.result;
    const txHash = result.hash;
    const txResult =
      typeof result.meta === "object" && "TransactionResult" in result.meta
        ? (result.meta as any).TransactionResult
        : "UNKNOWN";

    if (txResult !== "tesSUCCESS") {
      throw new Error(`XRP lock failed: ${txResult}`);
    }

    console.log(`✅ Locked ${amountXrp} XRP | TX: ${explorer}/transactions/${txHash}`);
    return { txHash };
  } catch (err: any) {
    console.error("lockXrpForDoge error:", err);
    throw new Error(err.message || "Failed to lock XRP");
  }
}

/* ===========================================================
   💸 2️⃣ Send DOGE (Bridge Vault → User)
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

    console.log(`🐶 Bridge vault: ${fromAddress}`);

    const utxoRes = await axios.get(`${apiBase}/address/${fromAddress}/utxo`);
    const utxos = utxoRes.data;
    if (!Array.isArray(utxos) || utxos.length === 0) {
      throw new Error("No UTXOs found for DOGE vault");
    }

    const sendValue = Math.floor(amountDoge * 1e8);
    const feeRate = 1000;
    const inputs: any[] = [];
    let inValue = 0;
    const outCount = 2;
    let fee = estimateDogeFee(1, outCount, feeRate);

    for (const utxo of utxos) {
      inputs.push(utxo);
      inValue += utxo.value;
      fee = estimateDogeFee(inputs.length, outCount, feeRate);
      if (inValue >= sendValue + fee) break;
    }

    if (inValue < sendValue + fee) {
      throw new Error("DOGE vault has insufficient balance");
    }

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
    if (changeValue > 0) {
      psbt.addOutput({ address: fromAddress, value: changeValue });
    }

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
    if (!txid) {
      throw new Error("Broadcast failed: " + JSON.stringify(res));
    }

    console.log(`✅ DOGE sent → ${toAddress} | TX: ${explorer}/tx/${txid}`);
    return { txHash: txid };
  } catch (err: any) {
    console.error("sendDogeFromBridge error:", err);
    throw new Error(err.message || "Failed to send DOGE");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge: XRP → DOGE
=========================================================== */
export async function bridgeXrpToDoge({
  xrpUserSeed,
  xrpVaultAddress,
  dogeBridgeWif,
  dogeToAddress,
  amountXrp,
  amountDoge,
}: {
  xrpUserSeed: string;
  xrpVaultAddress: string;
  dogeBridgeWif: string;
  dogeToAddress: string;
  amountXrp: number;
  amountDoge: number;
}) {
  try {
    console.log(`🔹 Starting XRP → DOGE bridge for ${amountXrp} XRP`);

    // Step 1: Lock XRP
    const xrpTx = await lockXrpForDoge({
      userSeed: xrpUserSeed,
      vaultAddress: xrpVaultAddress,
      amountXrp,
      memo: `Bridge XRP→DOGE`,
    });

    // Step 2: Send DOGE
    const dogeTx = await sendDogeFromBridge({
      bridgeWif: dogeBridgeWif,
      toAddress: dogeToAddress,
      amountDoge,
    });

    console.log("✅ Bridge XRP → DOGE completed!");
    return {
      status: "completed",
      fromTxHash: xrpTx.txHash,
      toTxHash: dogeTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeXrpToDoge error:", err);
    return { status: "failed", error: err.message };
  }
}
