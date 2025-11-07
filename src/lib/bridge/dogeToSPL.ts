// src/lib/bridge/dogeToSpl.ts

import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
  } from "@solana/web3.js";
  import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
  } from "@solana/spl-token";
  import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
  import * as ecc from "tiny-secp256k1";
  import { ECPairFactory } from "ecpair";
  import axios from "axios";
  import bs58 from "bs58";
  
  const ECPair = ECPairFactory(ecc);
  
  /* ===========================================================
     🔹 1️⃣ Lock native DOGE (User → Bridge Vault)
  =========================================================== */
  async function lockDogeToVault({
    userWif,
    vaultAddress,
    amountDoge,
  }: {
    userWif: string;
    vaultAddress: string;
    amountDoge: number;
  }) {
    try {
      const isTest = process.env.CHAIN_ENV === "testnet";
      const net = isTest
        ? {
            messagePrefix: "\x19Dogecoin Signed Message:\n",
            bech32: "tdge",
            bip32: { public: 0x043587cf, private: 0x04358394 },
            pubKeyHash: 0x71,
            scriptHash: 0xc4,
            wif: 0xf1,
          }
        : {
            messagePrefix: "\x19Dogecoin Signed Message:\n",
            bech32: "doge",
            bip32: { public: 0x02facafd, private: 0x02fac398 },
            pubKeyHash: 0x1e,
            scriptHash: 0x16,
            wif: 0x9e,
          };
  
      const apiBase = isTest
        ? "https://doge-electrs-testnet-demo.qed.me"
        : "https://dogechain.info/api";
      const explorer = isTest
        ? "https://doge-testnet-explorer.qed.me"
        : "https://dogechain.info";
  
      const keyPair = ECPair.fromWIF(userWif, net);
      const p2pkh = dogecoin.payments.p2pkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: net,
      });
      const fromAddress = p2pkh.address!;
  
      const utxoRes = await axios.get(`${apiBase}/address/${fromAddress}/utxo`);
      const utxos = utxoRes.data;
      if (!Array.isArray(utxos) || utxos.length === 0)
        throw new Error("No UTXOs available in DOGE wallet");
  
      const sendValue = Math.floor(amountDoge * 1e8);
      const feeRate = 1000;
      const outCount = 2;
  
      function estimateFee(inputs: number, outputs: number, rate = 1000) {
        const txSize = 10 + inputs * 148 + outputs * 34;
        return txSize * rate;
      }
  
      const inputs: any[] = [];
      let total = 0;
      let fee = estimateFee(1, outCount, feeRate);
  
      for (const utxo of utxos) {
        inputs.push(utxo);
        total += utxo.value;
        fee = estimateFee(inputs.length, outCount, feeRate);
        if (total >= sendValue + fee) break;
      }
  
      if (total < sendValue + fee)
        throw new Error("Insufficient DOGE balance for locking");
  
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
      if (!txid) throw new Error("DOGE lock broadcast failed");
  
      console.log(`🔒 Locked ${amountDoge} DOGE | TX: ${explorer}/tx/${txid}`);
      return { txHash: txid };
    } catch (err: any) {
      console.error("lockDogeToVault error:", err);
      throw new Error(err.message || "Failed to lock DOGE");
    }
  }
  
  /* ===========================================================
     🔹 2️⃣ Send SPL-USDT from Bridge Vault → Solana User
  =========================================================== */
  async function sendSolanaUsdt({
    bridgePrivateKeyBase58,
    solToAddress,
    amountUsdt,
  }: {
    bridgePrivateKeyBase58: string;
    solToAddress: string;
    amountUsdt: number;
  }) {
    try {
      const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
      const bridgeKeypair = Keypair.fromSecretKey(bs58.decode(bridgePrivateKeyBase58));
      const mint = new PublicKey(process.env.USDT_MINT_SOL!);
      const toPub = new PublicKey(solToAddress);
  
      const bridgeATA = await getAssociatedTokenAddress(mint, bridgeKeypair.publicKey);
      const toATA = await getAssociatedTokenAddress(mint, toPub);
  
      const tx = new Transaction();
      const lamports = BigInt(Math.floor(amountUsdt * 10 ** 6));
  
      const toInfo = await conn.getAccountInfo(toATA);
      if (!toInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            bridgeKeypair.publicKey,
            toATA,
            toPub,
            mint
          )
        );
      }
  
      tx.add(
        createTransferInstruction(bridgeATA, toATA, bridgeKeypair.publicKey, lamports)
      );
  
      const sig = await sendAndConfirmTransaction(conn, tx, [bridgeKeypair]);
      console.log(`✅ Sent ${amountUsdt} SPL-USDT → ${solToAddress} | TX: ${sig}`);
      return { txHash: sig };
    } catch (err: any) {
      console.error("sendSolanaUsdt error:", err);
      throw new Error(err.message || "Failed to send SPL-USDT");
    }
  }
  
  /* ===========================================================
     🔹 3️⃣ Combined Bridge: DOGE → SPL-USDT
  =========================================================== */
  export async function bridgeDogeToSPL({
    dogeUserWif,
    dogeVaultAddress,
    solBridgePrivateKeyBase58,
    solToAddress,
    amountDoge,
    amountUsdt,
  }: {
    dogeUserWif: string;
    dogeVaultAddress: string;
    solBridgePrivateKeyBase58: string;
    solToAddress: string;
    amountDoge: number;
    amountUsdt: number;
  }) {
    try {
      console.log(`🔹 Starting DOGE → SPL-USDT bridge for ${amountDoge} DOGE`);
  
      // 1️⃣ Lock DOGE
      const dogeTx = await lockDogeToVault({
        userWif: dogeUserWif,
        vaultAddress: dogeVaultAddress,
        amountDoge,
      });
  
      // 2️⃣ Send SPL-USDT
      const solTx = await sendSolanaUsdt({
        bridgePrivateKeyBase58: solBridgePrivateKeyBase58,
        solToAddress,
        amountUsdt,
      });
  
      console.log("✅ Bridge DOGE → SPL-USDT completed!");
      return {
        status: "completed",
        fromTxHash: dogeTx.txHash,
        toTxHash: solTx.txHash,
      };
    } catch (err: any) {
      console.error("bridgeDogeToSPL error:", err);
      return { status: "failed", error: err.message };
    }
  }
  