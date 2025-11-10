// =============================================================
// DOGE → XRP Bridge
// Locks native DOGE (user → DOGE vault)
// Then sends native XRP (bridge vault → user)
// =============================================================

import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import axios from "axios";
import { Client, Wallet } from "xrpl";

const ECPair = ECPairFactory(ecc);

/* ===========================================================
   🌐 Network Config for DOGE & XRP
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
      ? process.env.DOGE_API_TESTNET! // e.g. `"https://doge-electrs-testnet-demo.qed.me"`
      : process.env.DOGE_API_MAINNET!,  // e.g. `"https://dogechain.info/api"`
    explorer: isTest
      ? process.env.DOGE_EXPLORER_TESTNET! // e.g. `"https://doge-testnet-explorer.qed.me"`
      : process.env.DOGE_EXPLORER_MAINNET!, // e.g. `"https://dogechain.info"`
    net: isTest ? DOGE_NETWORKS.testnet : DOGE_NETWORKS.mainnet,
  };
}

/* ===========================================================
   🧮 Fee Estimate for DOGE (UTXO style)
=========================================================== */
function estimateDogeFee(inputs: number, outputs: number, rate = 1000) {
  const txSize = 10 + inputs * 148 + outputs * 34;
  return txSize * rate;
}

/* ===========================================================
   🔒 1️⃣ Lock DOGE (User → DOGE Vault)
=========================================================== */
export async function lockDogeForXrp({
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

    // fetch UTXOs
    const utxoRes = await axios.get(`${apiBase}/address/${fromAddress}/utxo`);
    const utxos = utxoRes.data;
    if (!Array.isArray(utxos) || utxos.length === 0) {
      throw new Error("No UTXOs found for DOGE address");
    }

    const sendValue = Math.floor(dogeAmount * 1e8);
    const inputs: any[] = [];
    let total = 0;
    const outCount = 2;
    let fee = estimateDogeFee(1, outCount);

    for (const utxo of utxos) {
      inputs.push(utxo);
      total += utxo.value;
      fee = estimateDogeFee(inputs.length, outCount);
      if (total >= sendValue + fee) {
        break;
      }
    }
    if (total < sendValue + fee) {
      throw new Error("Not enough DOGE to lock");
    }

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

    // output: vault
    psbt.addOutput({ address: vaultAddress, value: sendValue });
    // change output
    if (change > 0) {
      psbt.addOutput({ address: fromAddress, value: change });
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
    const txid = typeof res === "string" ? res : res?.txid || res?.result || null;
    if (!txid) {
      throw new Error("Broadcast failed: " + JSON.stringify(res));
    }

    console.log(`✅ DOGE locked successfully: ${explorer}/tx/${txid}`);
    return { txHash: txid };
  } catch (err: any) {
    console.error("lockDogeForXrp error:", err);
    throw new Error(err.message || "Failed to lock DOGE");
  }
}

/* ===========================================================
   💸 2️⃣ Send XRP (Bridge Vault → User)
=========================================================== */
export async function sendXrpFromBridge({
  bridgeSeed,
  toAddress,
  amountXrp,
  memo,
}: {
  bridgeSeed: string;
  toAddress: string;
  amountXrp: number;
  memo?: string;
}) {
  try {
    const isTest = process.env.CHAIN_ENV === "testnet";
    const rpcUrl = isTest
      ? process.env.XRP_API_TESTNET! // e.g. "wss://s.altnet.rippletest.net:51233"
      : process.env.XRP_API_MAINNET!; // e.g. "wss://xrplcluster.com"
    const explorer = isTest
      ? process.env.XRP_EXPLORER_TESTNET!
      : process.env.XRP_EXPLORER_MAINNET!;

    const client = new Client(rpcUrl);
    await client.connect();

    const wallet = Wallet.fromSeed(bridgeSeed);
    const fromAddress = wallet.address;

    const accountInfo = await client.request({
      command: "account_info",
      account: fromAddress,
    });

    const sequence = accountInfo.result.account_data.Sequence;
    const ledgerIndex = accountInfo.result.ledger_current_index ?? 0;

    const tx: any = {
      TransactionType: "Payment",
      Account: fromAddress,
      Destination: toAddress,
      Amount: (BigInt(Math.floor(amountXrp * 1_000_000))).toString(), // drops
      Fee: "12",
      Sequence: sequence,
      LastLedgerSequence: ledgerIndex + 10,
    };

    if (memo) {
      tx.Memos = [
        {
          Memo: { MemoData: Buffer.from(memo, "utf8").toString("hex") },
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
      throw new Error(`XRP send failed: ${txResult}`);
    }

    console.log(`✅ Sent ${amountXrp} XRP → ${toAddress} | TX: ${explorer}/transactions/${txHash}`);
    return { txHash };
  } catch (err: any) {
    console.error("sendXrpFromBridge error:", err);
    throw new Error(err.message || "Failed to send XRP");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge: DOGE → XRP
=========================================================== */
export async function bridgeDogeToXrp({
  dogeUserWif,
  dogeVaultAddress,
  xrpBridgeSeed,
  xrpToAddress,
  dogeAmount,
  xrpAmount,
}: {
  dogeUserWif: string;
  dogeVaultAddress: string;
  xrpBridgeSeed: string;
  xrpToAddress: string;
  dogeAmount: number;
  xrpAmount: number;
}) {
  try {
    console.log(`🔹 Starting DOGE → XRP bridge for ${dogeAmount} DOGE`);

    // Step 1: Lock DOGE
    const dogeTx = await lockDogeForXrp({
      dogePrivateKeyWIF: dogeUserWif,
      vaultAddress: dogeVaultAddress,
      dogeAmount,
    });

    // Step 2: Send XRP
    const xrpTx = await sendXrpFromBridge({
      bridgeSeed: xrpBridgeSeed,
      toAddress: xrpToAddress,
      amountXrp: xrpAmount,
      memo: `Bridge DOGE→XRP ${dogeTx.txHash}`,
    });

    console.log("✅ Bridge DOGE → XRP completed!");
    return {
      status: "completed",
      fromTxHash: dogeTx.txHash,
      toTxHash: xrpTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeDogeToXrp error:", err);
    return { status: "failed", error: err.message };
  }
}
