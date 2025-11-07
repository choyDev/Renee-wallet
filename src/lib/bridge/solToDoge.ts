// src/lib/bridge/solToDoge.ts

import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
  } from "@solana/web3.js";
  import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
  import * as ecc from "tiny-secp256k1";
  import { ECPairFactory } from "ecpair";
  import axios from "axios";
  
  const ECPair = ECPairFactory(ecc);
  
  /* ===========================================================
     🔒 1️⃣ Lock SOL (User → Bridge Vault)
  =========================================================== */
  async function lockSol({
    privateKeyBase64,
    vaultAddress,
    amountSol,
    rpcUrl,
  }: {
    privateKeyBase64: string;
    vaultAddress: string;
    amountSol: number;
    rpcUrl?: string;
  }) {
    try {
      const conn = new Connection(rpcUrl || process.env.SOLANA_DEVNET_RPC!, "confirmed");
      const secret = Uint8Array.from(Buffer.from(privateKeyBase64, "base64"));
      const userKeypair = Keypair.fromSecretKey(secret);
      const userAddress = userKeypair.publicKey.toBase58();
  
      const balanceLamports = await conn.getBalance(userKeypair.publicKey);
      const lamportsNeeded = Math.floor(amountSol * LAMPORTS_PER_SOL);
  
      if (balanceLamports < lamportsNeeded) {
        throw new Error(
          `Insufficient SOL balance: ${(balanceLamports / LAMPORTS_PER_SOL).toFixed(
            4
          )} SOL available, need ${amountSol} SOL`
        );
      }
  
      console.log(`🔒 Locking ${amountSol} SOL from ${userAddress} → ${vaultAddress}`);
  
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: userKeypair.publicKey,
          toPubkey: new PublicKey(vaultAddress),
          lamports: lamportsNeeded,
        })
      );
  
      const signature = await sendAndConfirmTransaction(conn, tx, [userKeypair]);
      console.log("✅ SOL locked successfully:", signature);
      return { txHash: signature };
    } catch (err: any) {
      console.error("lockSol error:", err);
      throw new Error(err.message || "Failed to lock SOL");
    }
  }
  
  /* ===========================================================
     🐕 2️⃣ Send DOGE from Bridge Vault → User
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
  
  function estimateFee(inputs: number, outputs: number, rate = 1000) {
    const txSize = 10 + inputs * 148 + outputs * 34;
    return txSize * rate;
  }
  
  async function sendDogeFromVault({
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
  
      const p2pkh = dogecoin.payments.p2pkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: net,
      });
      const fromAddress = p2pkh.address!;
  
      console.log(`🐕 DOGE Bridge Vault: ${fromAddress}`);
      console.log(`🚀 Sending ${amountDoge} DOGE → ${toAddress}`);
  
      const utxoRes = await axios.get(`${apiBase}/address/${fromAddress}/utxo`);
      const utxos = utxoRes.data;
      if (!Array.isArray(utxos) || utxos.length === 0)
        throw new Error("No UTXOs found in DOGE bridge vault");
  
      const sendValue = Math.floor(amountDoge * 1e8);
      const feeRate = 1000;
      const inputs: any[] = [];
      let total = 0;
      const outCount = 2;
      let fee = estimateFee(1, outCount, feeRate);
  
      for (const utxo of utxos) {
        inputs.push(utxo);
        total += utxo.value;
        fee = estimateFee(inputs.length, outCount, feeRate);
        if (total >= sendValue + fee) break;
      }
  
      if (total < sendValue + fee)
        throw new Error("Insufficient DOGE in bridge vault");
  
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
  
      psbt.addOutput({ address: toAddress, value: sendValue });
      if (change > 0)
        psbt.addOutput({ address: fromAddress, value: change });
  
      const signer = {
        publicKey: Buffer.from(keyPair.publicKey),
        sign: (hash: Buffer) => Buffer.from(keyPair.sign(hash)),
      };
  
      psbt.signAllInputs(signer);
      psbt.finalizeAllInputs();
  
      // 🧠 Prevent “fee too high” warning
      const rawHex = psbt.extractTransaction(true).toHex();
  
      const broadcast = await axios.post(`${apiBase}/tx`, rawHex, {
        headers: { "Content-Type": "text/plain" },
      });
      const res = broadcast.data;
      const txid =
        typeof res === "string" ? res : res?.txid || res?.result || null;
      if (!txid) throw new Error("Broadcast failed: " + JSON.stringify(res));
  
      console.log(`✅ DOGE sent successfully: ${explorer}/tx/${txid}`);
      return { txHash: txid };
    } catch (err: any) {
      console.error("sendDogeFromVault error:", err);
      throw new Error(err.message || "Failed to send DOGE");
    }
  }
  
  /* ===========================================================
     🔄 3️⃣ Combined Bridge: SOL → DOGE
  =========================================================== */
  export async function bridgeSolToDoge({
    solPrivateKey,
    solVaultAddress,
    dogeBridgeWif,
    dogeToAddress,
    solAmount,
    dogeAmount,
  }: {
    solPrivateKey: string;
    solVaultAddress: string;
    dogeBridgeWif: string;
    dogeToAddress: string;
    solAmount: number;
    dogeAmount: number;
  }) {
    try {
      console.log(`🔹 Starting SOL → DOGE bridge for ${solAmount} SOL`);
  
      // Step 1️⃣ Lock SOL
      const solTx = await lockSol({
        privateKeyBase64: solPrivateKey,
        vaultAddress: solVaultAddress,
        amountSol: solAmount,
      });
  
      // Step 2️⃣ Send DOGE from vault
      const dogeTx = await sendDogeFromVault({
        bridgeWif: dogeBridgeWif,
        toAddress: dogeToAddress,
        amountDoge: dogeAmount,
      });
  
      console.log("✅ Bridge SOL → DOGE completed!");
      return {
        status: "completed",
        fromTxHash: solTx.txHash,
        toTxHash: dogeTx.txHash,
      };
    } catch (err: any) {
      console.error("bridgeSolToDoge error:", err);
      return { status: "failed", error: err.message };
    }
  }
  