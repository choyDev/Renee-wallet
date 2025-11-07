// src/lib/bridge/splToDoge.ts

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
  
  const ECPair = ECPairFactory(ecc);
  
  /* ===========================================================
     🔹 1️⃣ Lock SPL-USDT on Solana (User → Bridge Vault)
  =========================================================== */
  async function lockSolanaUsdt({
    userPrivateKey,
    vaultAddress,
    amount,
  }: {
    userPrivateKey: string;
    vaultAddress: string;
    amount: number;
  }) {
    try {
      const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
  
      // ✅ Decode base64 private key
      const buffer = Buffer.from(userPrivateKey.trim(), "base64");
      if (buffer.length !== 64)
        throw new Error(`Invalid key length (${buffer.length}), expected 64 bytes`);
      const userKeypair = Keypair.fromSecretKey(new Uint8Array(buffer));
  
      const mint = new PublicKey(process.env.USDT_MINT_SOL!);
      const vaultPub = new PublicKey(vaultAddress);
  
      const userATA = await getAssociatedTokenAddress(mint, userKeypair.publicKey);
      const vaultATA = await getAssociatedTokenAddress(mint, vaultPub);
  
      const tx = new Transaction();
      const lamports = BigInt(Math.floor(amount * 10 ** 6)); // USDT decimals = 6
  
      // Create vault ATA if missing
      const vaultInfo = await conn.getAccountInfo(vaultATA);
      if (!vaultInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            userKeypair.publicKey,
            vaultATA,
            vaultPub,
            mint
          )
        );
      }
  
      tx.add(createTransferInstruction(userATA, vaultATA, userKeypair.publicKey, lamports));
  
      const sig = await sendAndConfirmTransaction(conn, tx, [userKeypair]);
      console.log(`🔒 Locked ${amount} SPL-USDT on Solana TX: ${sig}`);
      return { txHash: sig };
    } catch (err: any) {
      console.error("lockSolanaUsdt error:", err);
      throw new Error(err.message || "Failed to lock SPL-USDT");
    }
  }
  
  /* ===========================================================
     🐶 2️⃣ Send DOGE from Bridge Vault → User
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
      console.log(`🐕 Bridge Vault DOGE Address: ${fromAddress}`);
  
      const utxoRes = await axios.get(`${apiBase}/address/${fromAddress}/utxo`);
      const utxos = utxoRes.data;
      if (!Array.isArray(utxos) || utxos.length === 0)
        throw new Error("No UTXOs in DOGE bridge vault");
  
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
      if (total < sendValue + fee) throw new Error("Insufficient DOGE balance in vault");
  
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
      if (!txid) throw new Error("DOGE broadcast failed: " + JSON.stringify(res));
  
      console.log(`✅ DOGE sent → ${toAddress} (${explorer}/tx/${txid})`);
      return { txHash: txid };
    } catch (err: any) {
      console.error("sendDogeFromVault error:", err);
      throw new Error(err.message || "Failed to send DOGE");
    }
  }
  
  /* ===========================================================
     🔄 3️⃣ Combined Bridge: SPL-USDT → DOGE
  =========================================================== */
  export async function bridgeSPLToDoge({
    solPrivateKey,
    solVault,
    dogeBridgeWif,
    dogeToAddress,
    amountSolUsdt,
    amountDoge,
  }: {
    solPrivateKey: string;
    solVault: string;
    dogeBridgeWif: string;
    dogeToAddress: string;
    amountSolUsdt: number;
    amountDoge: number;
  }) {
    try {
      console.log(`🔹 Starting SPL-USDT → DOGE bridge for ${amountSolUsdt} USDT`);
  
      // 1️⃣ Lock SPL-USDT
      const solTx = await lockSolanaUsdt({
        userPrivateKey: solPrivateKey,
        vaultAddress: solVault,
        amount: amountSolUsdt,
      });
  
      // 2️⃣ Send DOGE
      const dogeTx = await sendDogeFromVault({
        bridgeWif: dogeBridgeWif,
        toAddress: dogeToAddress,
        amountDoge,
      });
  
      console.log("✅ Bridge SPL-USDT → DOGE completed!");
      return {
        status: "completed",
        fromTxHash: solTx.txHash,
        toTxHash: dogeTx.txHash,
      };
    } catch (err: any) {
      console.error("bridgeSPLToDoge error:", err);
      return { status: "failed", error: err.message };
    }
  }
  