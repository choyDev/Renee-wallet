// /pages/api/dogecoin/send.ts or /app/api/dogecoin/send/route.ts

import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import { decryptPrivateKey } from "@/lib/wallet"; // Import your decrypt function
import { prisma } from "@/lib/prisma"; // Import your prisma client

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

// --- Dogecoin Network Configuration (must match your wallet creation logic) ---
const DOGE_NET_CONFIG =
  process.env.CHAIN_ENV === "testnet"
    ? {
        // Testnet
        messagePrefix: "\x19Dogecoin Signed Message:\n",
        bech32: "tdge",
        bip32: { public: 0x043587cf, private: 0x04358394 },
        pubKeyHash: 0x71, // D
        scriptHash: 0xc4, // A or B
        wif: 0xf1, // 9
        sochainChain: "DOGETEST", // SoChain code for Dogecoin Testnet
      }
    : {
        // Mainnet
        messagePrefix: "\x19Dogecoin Signed Message:\n",
        bech32: "doge",
        bip32: { public: 0x02facafd, private: 0x02fac398 },
        pubKeyHash: 0x1e, // D
        scriptHash: 0x16, // A or 9
        wif: 0x9e, // 6
        sochainChain: "DOGE", // SoChain code for Dogecoin Mainnet
      };

// --- Transaction Constants ---
// Dogecoin (like BTC) uses SATOSHIS for calculations, but the unit is DOGE.
const DOGE_TO_SATOSHIS = 100000000;
const DUST_LIMIT = 100000; // 0.001 DOGE (Commonly accepted safe minimum)
const FEE_PER_BYTE = 50000; // 0.0005 DOGE/byte (Standard/fast Dogecoin fee rate, adjust as needed)


async function getUtxos(address: string, chain: string) {
  const url = `https://sochain.com/api/v2/get_tx_unspent/${chain}/${address}`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.status !== 'success') {
    throw new Error(`SoChain UTXO fetch failed: ${data.data.error || 'Unknown error'}`);
  }
  
  return data.data.txs.map((tx: any) => ({
    txid: tx.txid,
    vout: tx.output_no,
    value: Math.floor(parseFloat(tx.value) * DOGE_TO_SATOSHIS), // Value in Satoshis
    script: tx.script_hex,
  }));
}

async function broadcastTx(chain: string, signedTxHex: string) {
  const url = `https://sochain.com/api/v2/send_tx/${chain}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx_hex: signedTxHex }),
  });
  
  const data = await res.json();
  if (data.status !== 'success') {
    throw new Error(`SoChain broadcast failed: ${data.data.error || 'Unknown error'}`);
  }
  
  return data.data.txid;
}


export default async function dogecoinSendApi(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { fromWalletId, to, amountDoge } = req.body; // amountDoge is in DOGE unit

    if (!fromWalletId || !to || !amountDoge) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const amountSatoshis = Math.floor(amountDoge * DOGE_TO_SATOSHIS);

    const fromWallet = await prisma.wallet.findUnique({
      where: { id: fromWalletId },
      include: { network: true },
    });

    if (!fromWallet || fromWallet.network?.symbol !== "DOGE") {
      return res.status(404).json({ error: "Dogecoin wallet not found" });
    }
    
    // 1. Decrypt Private Key (WIF format)
    const wif = decryptPrivateKey(fromWallet.privateKeyEnc);
    const keyPair = ECPair.fromWIF(wif, DOGE_NET_CONFIG);

    // 2. Fetch UTXOs
    const utxos = await getUtxos(fromWallet.address, DOGE_NET_CONFIG.sochainChain);
    
    if (utxos.length === 0) {
      throw new Error("Wallet has no unspent funds (UTXOs)");
    }
    
    // 3. Select UTXOs and Calculate Total Input Value
    const txb = new bitcoin.Psbt({ network: DOGE_NET_CONFIG });
    let inputAmount = 0;
    
    const selectedUtxos = utxos.sort((a: any, b: any) => b.value - a.value); // Use largest first
    
    for (const utxo of selectedUtxos) {
      txb.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        // Since Doge uses P2PKH, we need to provide the P2PKH output script (redeemScript is for P2SH)
        // We use the full P2PKH output: <OP_DUP> <OP_HASH160> <PubKeyHash> <OP_EQUALVERIFY> <OP_CHECKSIG>
        nonWitnessUtxo: Buffer.from(utxo.script, 'hex'), // SoChain provides script_hex in UTXO fetch
      });
      inputAmount += utxo.value;
      
      // Stop adding UTXOs once we have enough + a buffer for fees
      // We don't know the exact fee yet, so we over-estimate for now.
      if (inputAmount > amountSatoshis + 2 * DOGE_TO_SATOSHIS) break; 
    }

    if (inputAmount < amountSatoshis) {
      throw new Error("Insufficient DOGE balance to cover amount");
    }

    // 4. Determine Fee and Change
    // Add outputs for the recipient and potential change.
    txb.addOutput({ address: to, value: BigInt(amountSatoshis) });
    
    const initialTxSize = txb.toBuffer().length + (utxos.length * 107) + 34 * 2; // Estimate size (bytes)
    const initialFee = initialTxSize * FEE_PER_BYTE;

    const changeAmount = inputAmount - amountSatoshis - initialFee;

    if (changeAmount < 0) {
        throw new Error("Insufficient DOGE balance to cover amount and fees");
    }

    // Add change output if greater than dust limit
    if (changeAmount >= DUST_LIMIT) {
        txb.addOutput({ address: fromWallet.address, value: BigInt(changeAmount) });
    } else if (changeAmount > 0) {
        // Change is less than dust limit, so it's added to the fee
        // We need to re-calculate the fee to be precise before signing.
        // For simplicity, we just include it as a higher fee for this implementation.
        console.warn(`Change amount (${changeAmount}) below dust limit, absorbing into fee.`);
    }

    // Final fee calculation (optional but good practice for precise fee)
    // You would sign, get the size, then rebuild with the correct fee.
    // However, for this example using Psbt with nonWitnessUtxo, the size is harder to predict precisely 
    // without actually signing/finalizing, so the initial fee estimate is often used.
    
    // 5. Sign the Transaction
    for (let i = 0; i < txb.txInputs.length; i++) {
        txb.signInput(i, keyPair);
    }
    
    // Finalize all inputs (creates the final scriptSig)
    txb.finalizeAllInputs();
    
    // 6. Extract and Broadcast
    const rawTxHex = txb.extractTransaction().toHex();
    
    const txid = await broadcastTx(DOGE_NET_CONFIG.sochainChain, rawTxHex);
    
    return res.status(200).json({ txid });

  } catch (err: any) {
    console.error("Dogecoin Send Error:", err);
    res.status(500).json({ error: err.message || "Failed to create or broadcast Dogecoin transaction" });
  }
}