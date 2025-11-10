// =============================================================
//  ERC20 → DOGE Bridge
//  Locks ERC-20 USDT (user → bridge vault on Ethereum)
//  Then sends DOGE (bridge vault → user)
//  Uses the same stable DOGE send logic from ethereumToDoge.ts
// =============================================================

import { ethers } from "ethers";
import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import axios from "axios";

const ECPair = ECPairFactory(ecc);

/* -------------------------------------------------------
   Dogecoin Network Configuration
-------------------------------------------------------- */
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

function getEnv() {
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

function estimateFee(inputs: number, outputs: number, rate = 1000) {
  const txSize = 10 + inputs * 148 + outputs * 34;
  return txSize * rate;
}

/* ===========================================================
   🔹 1️⃣ Lock ERC20-USDT on Ethereum (User → Bridge Vault)
=========================================================== */
export async function lockErc20ForDoge({
  ethPrivateKey,
  vaultAddress,
  amountUsdt,
}: {
  ethPrivateKey: string;
  vaultAddress: string;
  amountUsdt: number;
}) {
  try {
    if (!process.env.USDT_CONTRACT_ETH)
      throw new Error("Missing env: USDT_CONTRACT_ETH");
    if (!ethers.isAddress(process.env.USDT_CONTRACT_ETH))
      throw new Error(`Invalid USDT_CONTRACT_ETH: ${process.env.USDT_CONTRACT_ETH}`);
    if (!ethers.isAddress(vaultAddress))
      throw new Error(`Invalid vault address: ${vaultAddress}`);

    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
    const wallet = new ethers.Wallet(ethPrivateKey, provider);

    const usdtContract = new ethers.Contract(
      process.env.USDT_CONTRACT_ETH!,
      [
        "function transfer(address to,uint256 amount) public returns(bool)",
        "function balanceOf(address) view returns(uint256)",
      ],
      wallet
    );

    const decimals = 6;
    const usdtAmount = BigInt(Math.floor(amountUsdt * 10 ** decimals));
    const balance = await usdtContract.balanceOf(wallet.address);

    if (balance < usdtAmount)
      throw new Error(
        `Insufficient ERC-20 USDT balance: have ${Number(balance) / 1e6}, need ${amountUsdt}`
      );

    console.log(
      `🔒 Locking ${amountUsdt} USDT (ERC-20) from ${wallet.address} → vault ${vaultAddress}`
    );

    const gasEstimate = await usdtContract.transfer.estimateGas(
      vaultAddress,
      usdtAmount
    );

    const tx = await usdtContract.transfer(vaultAddress, usdtAmount, {
      gasLimit: gasEstimate + BigInt(20000),
    });

    const receipt = await tx.wait(1);
    console.log("✅ ERC-20 locked TX:", receipt.hash);
    return { txHash: receipt.hash };
  } catch (err: any) {
    console.error("lockErc20ForDoge error:", err);
    throw new Error(err.message || "Failed to lock ERC-20 USDT");
  }
}

/* ===========================================================
   🐶 2️⃣ Send DOGE (Bridge Vault → User)
   (Copied from your proven ethereumToDoge.ts logic)
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
    const { apiBase, explorer, net } = getEnv();
    const keyPair = ECPair.fromWIF(bridgeWif, net);
    const fromAddress = dogecoin.payments.p2pkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: net,
    }).address!;

    console.log(`🐶 Bridge vault: ${fromAddress}`);

    // Fetch UTXOs
    const utxoRes = await axios.get(`${apiBase}/address/${fromAddress}/utxo`);
    const utxos = utxoRes.data;
    if (!Array.isArray(utxos) || utxos.length === 0)
      throw new Error("No UTXOs in DOGE vault");

    const sendValue = Math.floor(amountDoge * 1e8);
    const feeRate = 1000;
    const inputs: any[] = [];
    let inValue = 0;
    const outCount = 2;
    let fee = estimateFee(1, outCount, feeRate);

    for (const utxo of utxos) {
      inputs.push(utxo);
      inValue += utxo.value;
      fee = estimateFee(inputs.length, outCount, feeRate);
      if (inValue >= sendValue + fee) break;
    }

    if (inValue < sendValue + fee)
      throw new Error("DOGE vault has insufficient balance");

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
    if (changeValue > 0)
      psbt.addOutput({ address: fromAddress, value: changeValue });

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

    const txid =
      typeof broadcast.data === "string"
        ? broadcast.data
        : broadcast.data?.txid || broadcast.data?.result;
    if (!txid) throw new Error("Broadcast failed");

    console.log(`✅ DOGE sent → ${toAddress} (${explorer}/tx/${txid})`);
    return { txHash: txid };
  } catch (err: any) {
    console.error("sendDogeFromBridge error:", err);
    throw new Error(err.message || "Failed to send DOGE");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge Flow: ERC20 → DOGE
=========================================================== */
export async function bridgeERC20ToDoge({
  ethPrivateKey,
  ethVaultAddress,
  dogeBridgeWif,
  dogeToAddress,
  amountErc20,
  amountDoge,
}: {
  ethPrivateKey: string;
  ethVaultAddress: string;
  dogeBridgeWif: string;
  dogeToAddress: string;
  amountErc20: number;
  amountDoge: number;
}) {
  try {
    console.log(`🔹 Starting ERC-20 → DOGE bridge for ${amountErc20} USDT`);

    // Step 1️⃣ Lock ERC-20
    const ethTx = await lockErc20ForDoge({
      ethPrivateKey,
      vaultAddress: ethVaultAddress,
      amountUsdt: amountErc20,
    });

    // Step 2️⃣ Send DOGE (same logic as ethereumToDoge)
    const dogeTx = await sendDogeFromBridge({
      bridgeWif: dogeBridgeWif,
      toAddress: dogeToAddress,
      amountDoge,
    });

    console.log("✅ Bridge ERC-20 → DOGE completed!");
    return {
      status: "completed",
      fromTxHash: ethTx.txHash,
      toTxHash: dogeTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeERC20ToDoge error:", err);
    return { status: "failed", error: err.message };
  }
}
