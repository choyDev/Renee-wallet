// =============================================================
//  XRP → BTC Bridge
//  Locks native XRP from user → XRP vault
//  Then sends native BTC from bridge vault → user
// =============================================================

import { Client, Wallet } from "xrpl";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import axios from "axios";

const ECPair = ECPairFactory(ecc);

/* ===========================================================
   🌐 Network Configs
=========================================================== */
const BTC_NETWORK =
  process.env.CHAIN_ENV === "testnet"
    ? bitcoin.networks.testnet
    : bitcoin.networks.bitcoin;

/* ===========================================================
   🔒 1️⃣ Lock XRP (User → Vault)
=========================================================== */
export async function lockXrpForBtc({
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
      ? process.env.XRP_API_TESTNET! || "wss://s.altnet.rippletest.net:51233"
      : process.env.XRP_API_MAINNET! || "wss://xrplcluster.com";
    const explorer = isTest
      ? process.env.XRP_EXPLORER_TESTNET! || "https://testnet.xrpl.org"
      : process.env.XRP_EXPLORER_MAINNET! || "https://xrpscan.com";

    const client = new Client(rpcUrl);
    await client.connect();

    const wallet = Wallet.fromSeed(userSeed);
    const fromAddr = wallet.address;

    console.log(`🔒 Locking ${amountXrp} XRP from ${fromAddr} → vault ${vaultAddress}`);

    const accountInfo = await client.request({
      command: "account_info",
      account: fromAddr,
    });

    const sequence = accountInfo.result.account_data.Sequence;
    const ledgerIndex = accountInfo.result.ledger_current_index ?? 0;

    const tx: any = {
      TransactionType: "Payment",
      Account: fromAddr,
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

    if (txResult !== "tesSUCCESS")
      throw new Error(`Lock failed: ${txResult}`);

    console.log(
      `✅ Locked ${amountXrp} XRP | TX: ${explorer}/transactions/${txHash}`
    );
    return { txHash };
  } catch (err: any) {
    console.error("lockXrpForBtc error:", err);
    throw new Error(err.message || "Failed to lock XRP");
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

    const utxos = (await axios.get(`${apiBase}/address/${fromAddress}/utxo`))
      .data;
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
   🔄 3️⃣ Combined Bridge: XRP → BTC
=========================================================== */
export async function bridgeXrpToBtc({
  xrpUserSeed,
  xrpVaultAddress,
  btcBridgePrivateKeyWIF,
  btcToAddress,
  amountXrp,
  amountBtc,
}: {
  xrpUserSeed: string;
  xrpVaultAddress: string;
  btcBridgePrivateKeyWIF: string;
  btcToAddress: string;
  amountXrp: number;
  amountBtc: number;
}) {
  try {
    console.log(`🔹 Starting XRP → BTC bridge for ${amountXrp} XRP`);

    // Step 1️⃣ Lock XRP
    const xrpTx = await lockXrpForBtc({
      userSeed: xrpUserSeed,
      vaultAddress: xrpVaultAddress,
      amountXrp,
      memo: "Bridge XRP→BTC",
    });

    // Step 2️⃣ Send BTC
    const btcTx = await sendBtcFromBridge({
      btcPrivateKeyWIF: btcBridgePrivateKeyWIF,
      toAddress: btcToAddress,
      btcAmount: amountBtc,
    });

    console.log("✅ Bridge XRP → BTC completed!");
    return {
      status: "completed",
      fromTxHash: xrpTx.txHash,
      toTxHash: btcTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeXrpToBtc error:", err);
    return { status: "failed", error: err.message };
  }
}
