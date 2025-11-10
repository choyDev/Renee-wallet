// =============================================================
//  BTC → XRP Bridge
//  Locks native BTC from user → BTC vault
//  Then sends native XRP from bridge vault → user
// =============================================================

import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import axios from "axios";
import { Client, Wallet } from "xrpl";

const ECPair = ECPairFactory(ecc);

/* ===========================================================
   🌐 Network Config
=========================================================== */
const BTC_NETWORK =
  process.env.CHAIN_ENV === "testnet"
    ? bitcoin.networks.testnet
    : bitcoin.networks.bitcoin;

/* ===========================================================
   🔒 1️⃣ Lock BTC (User → Bridge Vault)
=========================================================== */
export async function lockBtcForXrp({
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

    const utxos = (await axios.get(`${apiBase}/address/${fromAddress}/utxo`)).data;
    if (!utxos?.length) throw new Error("No UTXOs found for BTC address");

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

    if (totalInput < sats + FEE)
      throw new Error("Not enough BTC to lock");

    psbt.addOutput({ address: vaultAddress, value: BigInt(sats) });

    const change = BigInt(totalInput - sats - FEE);
    if (change > BigInt(0))
      psbt.addOutput({ address: fromAddress, value: change });

    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();
    const txid = (await axios.post(`${apiBase}/tx`, txHex)).data;

    console.log(`✅ BTC locked successfully: ${txid}`);
    return { txHash: txid };
  } catch (err: any) {
    console.error("lockBtcForXrp error:", err);
    throw new Error(err.message || "Failed to lock BTC");
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
      ? process.env.XRP_API_TESTNET! || "wss://s.altnet.rippletest.net:51233"
      : process.env.XRP_API_MAINNET! || "wss://xrplcluster.com";
    const explorer = isTest
      ? process.env.XRP_EXPLORER_TESTNET! || "https://testnet.xrpl.org"
      : process.env.XRP_EXPLORER_MAINNET! || "https://xrpscan.com";

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
      Amount: (BigInt(Math.floor(amountXrp * 1_000_000))).toString(),
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

    if (txResult !== "tesSUCCESS")
      throw new Error(`XRP send failed: ${txResult}`);

    console.log(
      `✅ Sent ${amountXrp} XRP to ${toAddress} | TX: ${explorer}/transactions/${txHash}`
    );
    return { txHash };
  } catch (err: any) {
    console.error("sendXrpFromBridge error:", err);
    throw new Error(err.message || "Failed to send XRP");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge Flow: BTC → XRP
=========================================================== */
export async function bridgeBtcToXrp({
  btcPrivateKeyWIF,
  btcVaultAddress,
  xrpBridgeSeed,
  xrpToAddress,
  btcAmount,
  xrpAmount,
}: {
  btcPrivateKeyWIF: string;
  btcVaultAddress: string;
  xrpBridgeSeed: string;
  xrpToAddress: string;
  btcAmount: number;
  xrpAmount: number;
}) {
  try {
    console.log(`🔹 Starting BTC → XRP bridge for ${btcAmount} BTC`);

    // 1️⃣ Lock BTC
    const btcTx = await lockBtcForXrp({
      btcPrivateKeyWIF,
      vaultAddress: btcVaultAddress,
      btcAmount,
    });

    // 2️⃣ Send XRP
    const xrpTx = await sendXrpFromBridge({
      bridgeSeed: xrpBridgeSeed,
      toAddress: xrpToAddress,
      amountXrp: xrpAmount,
      memo: `Bridge BTC→XRP ${btcTx.txHash}`,
    });

    console.log("✅ Bridge BTC → XRP completed!");
    return {
      status: "completed",
      fromTxHash: btcTx.txHash,
      toTxHash: xrpTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeBtcToXrp error:", err);
    return { status: "failed", error: err.message };
  }
}
