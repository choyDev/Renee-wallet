import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import axios from "axios";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import bs58 from "bs58";

const ECPair = ECPairFactory(ecc);

/* ===========================================================
   🐶 1️⃣ DOGE Network Definitions
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
      ? "https://doge-electrs-testnet-demo.qed.me"
      : "https://dogechain.info/api",
    explorer: isTest
      ? "https://doge-testnet-explorer.qed.me"
      : "https://dogechain.info",
    net: isTest ? DOGE_NETWORKS.testnet : DOGE_NETWORKS.mainnet,
  };
}

/* ===========================================================
   🔹 Helper to Estimate DOGE Fee
=========================================================== */
function estimateFee(inputs: number, outputs: number, rate = 1000) {
  const txSize = 10 + inputs * 148 + outputs * 34;
  return txSize * rate;
}

/* ===========================================================
   🔹 2️⃣ Lock DOGE (User → Vault)
=========================================================== */
async function lockDoge({
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

    const rawHex = psbt.extractTransaction(true).toHex();

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
    console.error("lockDoge error:", err);
    throw new Error(err.message || "Failed to lock DOGE");
  }
}

/* ===========================================================
   🔹 3️⃣ Send SOL from Bridge Vault → User
=========================================================== */
async function sendSolFromVault({
  bridgePrivateKeyBase58,
  solToAddress,
  amountSol,
  rpcUrl,
}: {
  bridgePrivateKeyBase58: string;
  solToAddress: string;
  amountSol: number;
  rpcUrl?: string;
}) {
  try {
    const conn = new Connection(rpcUrl || process.env.SOLANA_DEVNET_RPC!, "confirmed");
    const secret = bs58.decode(bridgePrivateKeyBase58);
    const bridgeKeypair = Keypair.fromSecretKey(secret);
    const toPubkey = new PublicKey(solToAddress);

    const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
    if (lamports <= 0) throw new Error("Invalid SOL amount");

    console.log(
      `🚀 Sending ${amountSol} SOL from ${bridgeKeypair.publicKey.toBase58()} → ${solToAddress}`
    );

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: bridgeKeypair.publicKey,
        toPubkey,
        lamports,
      })
    );

    const sig = await sendAndConfirmTransaction(conn, tx, [bridgeKeypair]);
    console.log("✅ Sent native SOL TX:", sig);

    return { txHash: sig };
  } catch (err: any) {
    console.error("sendSolFromVault error:", err);
    throw new Error(err.message || "Failed to send SOL");
  }
}

/* ===========================================================
   🔹 4️⃣ Combined Bridge: DOGE → SOL
=========================================================== */
export async function bridgeDogeToSol({
  dogePrivateKeyWIF,
  dogeVault,
  solBridgePrivateKeyBase58,
  solToAddress,
  dogeAmount,
  solAmount,
}: {
  dogePrivateKeyWIF: string;
  dogeVault: string;
  solBridgePrivateKeyBase58: string;
  solToAddress: string;
  dogeAmount: number;
  solAmount: number;
}) {
  try {
    console.log(`🔹 Starting DOGE → SOL bridge for ${dogeAmount} DOGE`);

    // Step 1️⃣ Lock DOGE
    const dogeTx = await lockDoge({
      dogePrivateKeyWIF,
      vaultAddress: dogeVault,
      dogeAmount,
    });

    // Step 2️⃣ Send SOL to user
    const solTx = await sendSolFromVault({
      bridgePrivateKeyBase58: solBridgePrivateKeyBase58,
      solToAddress,
      amountSol: solAmount,
    });

    console.log("✅ Bridge DOGE → SOL completed!");
    return {
      status: "completed",
      fromTxHash: dogeTx.txHash,
      toTxHash: solTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeDogeToSol error:", err);
    return { status: "failed", error: err.message };
  }
}
