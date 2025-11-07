// =============================================================
//  DOGE → ERC20 Bridge
//  Locks native DOGE (user → vault)
//  Then sends ERC-20 USDT from bridge wallet → user
// =============================================================

import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import axios from "axios";
import { ethers } from "ethers";

const ECPair = ECPairFactory(ecc);

/* ===========================================================
   🐶 DOGE Network Config
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

/* ===========================================================
   🔒 1️⃣ Lock DOGE (User → Bridge Vault)
=========================================================== */
export async function lockDogeForERC20({
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
  
      const rawHex = psbt.extractTransaction().toHex();
  
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
      console.error("lockDogeForTrx error:", err);
      throw new Error(err.message || "Failed to lock DOGE");
    }
  }

/* ===========================================================
   🪙 2️⃣ Send ERC-20 USDT (Bridge → User)
=========================================================== */
export async function sendERC20Usdt({
  bridgePrivateKey,
  userEthAddress,
  amountErc20,
}: {
  bridgePrivateKey: string;
  userEthAddress: string;
  amountErc20: number;
}) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
    const bridgeWallet = new ethers.Wallet(bridgePrivateKey, provider);

    const usdtContract = new ethers.Contract(
      process.env.USDT_CONTRACT_ETH!,
      [
        "function transfer(address to,uint256 amount) public returns(bool)",
        "function balanceOf(address) view returns(uint256)",
      ],
      bridgeWallet
    );

    const decimals = 6;
    const usdtAmount = BigInt(Math.floor(amountErc20 * 10 ** decimals));

    const balance = await usdtContract.balanceOf(await bridgeWallet.getAddress());
    console.log(`Bridge wallet USDT balance: ${Number(balance) / 1e6}`);

    if (balance < usdtAmount) throw new Error("Bridge wallet lacks enough USDT");

    const gasEstimate = await usdtContract.transfer.estimateGas(
      userEthAddress,
      usdtAmount
    );

    console.log(`🚀 Sending ${amountErc20} USDT to ${userEthAddress}`);
    const tx = await usdtContract.transfer(userEthAddress, usdtAmount, {
      gasLimit: gasEstimate + BigInt(20000),
    });
    const receipt = await tx.wait();

    console.log("✅ Sent ERC-20 USDT TX:", receipt.hash);
    return { txHash: receipt.hash };
  } catch (err: any) {
    console.error("sendERC20Usdt error:", err);
    throw new Error(err.message || "Failed to send ERC20 USDT");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge Flow: DOGE → ERC20
=========================================================== */
export async function bridgeDogeToERC20({
  dogeUserWif,
  dogeVaultAddress,
  ethBridgePrivateKey,
  userEthAddress,
  amountDoge,
  amountErc20,
}: {
  dogeUserWif: string;
  dogeVaultAddress: string;
  ethBridgePrivateKey: string;
  userEthAddress: string;
  amountDoge: number;
  amountErc20: number;
}) {
  try {
    console.log(`🔹 Starting DOGE → ERC-20 bridge for ${amountDoge} DOGE`);

    // Step 1️⃣ Lock DOGE
    const dogeTx = await lockDogeForERC20({
      dogePrivateKeyWIF: dogeUserWif,
      vaultAddress: dogeVaultAddress,
      dogeAmount: amountDoge,
    });

    // Step 2️⃣ Send ERC-20 USDT
    const ethTx = await sendERC20Usdt({
      bridgePrivateKey: ethBridgePrivateKey,
      userEthAddress,
      amountErc20,
    });

    console.log("✅ Bridge DOGE → ERC-20 USDT completed!");
    return {
      status: "completed",
      fromTxHash: dogeTx.txHash,
      toTxHash: ethTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeDogeToERC20 error:", err);
    return { status: "failed", error: err.message };
  }
}
