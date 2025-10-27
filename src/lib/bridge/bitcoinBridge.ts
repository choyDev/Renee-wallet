import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";
import axios from "axios";

const ECPair = ECPairFactory(ecc);
const network = bitcoin.networks.testnet; 
const BRIDGE_PRIVATE_KEY = process.env.BTC_BRIDGE_WIF!;
const keyPair = ECPair.fromWIF(BRIDGE_PRIVATE_KEY, network);

/**
 * Send BTC from bridge wallet to recipient
 */
export async function bridgeBitcoin({
  token,
  action,
  amount,
  toAddress,
}: {
  token: string;
  action: "MINT" | "LOCK";
  amount: number;
  toAddress: string;
}) {
  try {
    // ✅ Convert BTC amount to satoshis (use bigint)
    const sats = BigInt(Math.floor(amount * 1e8));

    // 🔹 Fetch UTXOs
    const fromAddress = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network,
    }).address!;
    const utxosRes = await axios.get(
      `https://blockstream.info/testnet/api/address/${fromAddress}/utxo`
    );
    const utxos = utxosRes.data;

    if (!utxos || utxos.length === 0)
      throw new Error("No UTXOs available for bridge wallet");

    // 🔹 Create transaction
    const psbt = new bitcoin.Psbt({ network });

    let totalInput = BigInt(0);
    const FEE = BigInt(500);

    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.payments.p2wpkh({
            pubkey: keyPair.publicKey,
            network,
          }).output!,
          value: BigInt(utxo.value),
        },
      });
      totalInput += BigInt(utxo.value);
      if (totalInput >= sats + FEE) break;
    }

    if (totalInput < sats + FEE)
      throw new Error("Insufficient BTC balance in bridge wallet");

    // 🔹 Output: send BTC to recipient
    psbt.addOutput({
      address: toAddress,
      value: sats,
    });

    // 🔹 Change output (if any)
    const change = totalInput - sats - FEE;
    if (change > BigInt(0)) {
      psbt.addOutput({
        address: fromAddress,
        value: change,
      });
    }

    // 🔹 Sign and finalize
    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();

    // 🔹 Extract raw transaction hex
    const txHex = psbt.extractTransaction().toHex();

    // 🔹 Broadcast using Blockstream API
    const broadcast = await axios.post(
      "https://blockstream.info/testnet/api/tx",
      txHex
    );
    const txid = broadcast.data;

    console.log(`✅ BTC Bridge TX Sent: ${txid}`);
    return { txHash: txid };
  } catch (err: any) {
    console.error("bridgeBitcoin error:", err);
    throw new Error(err.message || "bridgeBitcoin failed");
  }
}
