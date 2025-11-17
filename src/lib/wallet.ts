import { prisma } from "@/lib/prisma";
import { Keypair } from "@solana/web3.js";
import crypto from "crypto";
const TronWeb = require("tronweb");
import "regenerator-runtime/runtime";
import { ethers } from "ethers";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import { Wallet as XrpWallet } from "xrpl";
import { createXmrWallet } from "@/lib/xmrRpcPool";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);


const PRIVATE_KEY_SECRET = process.env.PRIVATE_KEY_SECRET || "supersecret32byteskey!!";
const CHAIN_ENV = process.env.CHAIN_ENV === "testnet" ? "testnet" : "mainnet";

const CHAINS = {
  mainnet: {
    sol: { name: "Solana",   chainId: "mainnet-beta", rpcUrl: "https://api.mainnet-beta.solana.com", symbol: "SOL", explorerUrl: "https://solscan.io", },
    tron: { name: "Tron",     chainId: "mainnet",      rpcUrl: "https://api.trongrid.io",            symbol: "TRX", explorerUrl: "https://tronscan.org", },
  },
  testnet: {
    sol: { name: "Solana (Devnet)", chainId: "devnet", rpcUrl: process.env.SOLANA_DEVNET_RPC || "https://api.devnet.solana.com", symbol: "SOL", explorerUrl: "https://solscan.io/?cluster=devnet", },
    tron: { name: "Tron (Nile)",  chainId: "nile", rpcUrl: process.env.TRON_NILE_RPC  || "https://nile.trongrid.io", symbol: "TRX", explorerUrl: "https://nile.tronscan.org", },
  },
} as const;

const ETH_NET = {
  name: CHAIN_ENV === "testnet" ? "Ethereum (Sepolia)" : "Ethereum",
  chainId: CHAIN_ENV === "testnet" ? "sepolia" : "mainnet",
  rpcUrl:
    CHAIN_ENV === "testnet"
      ? (process.env.ETH_RPC_TESTNET as string)
      : (process.env.ETH_RPC_MAINNET as string),
  symbol: "ETH",
  explorerUrl:
    CHAIN_ENV === "testnet"
      ? process.env.ETH_EXPLORER_TESTNET
      : process.env.ETH_EXPLORER_MAINNET,
};

const BTC_NET = {
  name: CHAIN_ENV === "testnet" ? "Bitcoin (Testnet)" : "Bitcoin",
  chainId: CHAIN_ENV === "testnet" ? "testnet" : "mainnet",
  // we store the Esplora base as "rpcUrl" for reads/broadcasts
  rpcUrl:
    CHAIN_ENV === "testnet"
      ? (process.env.BTC_API_TESTNET as string)
      : (process.env.BTC_API_MAINNET as string),
  symbol: "BTC",
  explorerUrl:
    CHAIN_ENV === "testnet"
      ? process.env.BTC_EXPLORER_TESTNET
      : process.env.BTC_EXPLORER_MAINNET,
};

// ----------------------
// DOGE, XMR, XRP Networks
// ----------------------

const DOGE_NET = {
  name: CHAIN_ENV === "testnet" ? "Dogecoin (Testnet)" : "Dogecoin",
  chainId: CHAIN_ENV === "testnet" ? "doge-testnet" : "doge-mainnet",
  rpcUrl:
    CHAIN_ENV === "testnet"
      ? "https://doge-electrs-testnet-demo.qed.me" // testnet API
      : "https://dogechain.info", // mainnet API
  symbol: "DOGE",
  explorerUrl:
    CHAIN_ENV === "testnet"
      ? "https://doge-testnet-explorer.qed.me/address"
      : "https://dogechain.info/address",
};


const XRP_NET = {
  name: CHAIN_ENV === "testnet" ? "XRP (Testnet)" : "XRP",
  chainId: CHAIN_ENV === "testnet" ? "xrp-testnet" : "xrp-mainnet",
  rpcUrl:
    CHAIN_ENV === "testnet"
      ? "wss://s.altnet.rippletest.net:51233"
      : "wss://xrplcluster.com",
  symbol: "XRP",
  explorerUrl:
    CHAIN_ENV === "testnet"
      ? "https://testnet.xrpl.org"
      : "https://xrpscan.com",
};

const XMR_NET = {
  name: CHAIN_ENV === "testnet" ? "Monero (Stagenet)" : "Monero",
  chainId: CHAIN_ENV === "testnet" ? "xmr-stagenet" : "xmr-mainnet",
  rpcUrl:
    CHAIN_ENV === "testnet"
      // 👇 point to your running wallet-RPC, not monerod
      ? process.env.MONERO_RPC_TESTNET || "http://127.0.0.1:38083/json_rpc"
      // mainnet default (change when you deploy)
      : process.env.MONERO_RPC_MAINNET || "http://127.0.0.1:38083/json_rpc",
  symbol: "XMR",
  explorerUrl:
    CHAIN_ENV === "testnet"
      ? "https://stagenet.xmrchain.net"
      : "https://xmrchain.net",
};




// ----------------------
// Encrypt private key
// ----------------------
export function encryptPrivateKey(privateKey: string): string {
  const iv = crypto.randomBytes(16);
  let key = Buffer.from(PRIVATE_KEY_SECRET);
  if (key.length < 32) key = Buffer.concat([key, Buffer.alloc(32 - key.length)]);
  else if (key.length > 32) key = key.slice(0, 32);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(privateKey, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// ----------------------
// Decrypt private key (matches encryptPrivateKey)
// stored format: "<ivHex>:<cipherHex>"
// ----------------------
export function decryptPrivateKey(ciphertext: string): string {
  const [ivHex, encHex] = ciphertext.split(":");
  if (!ivHex || !encHex) throw new Error("Invalid encrypted key format");
  const iv = Buffer.from(ivHex, "hex");
  let key = Buffer.from(PRIVATE_KEY_SECRET);
  if (key.length < 32) key = Buffer.concat([key, Buffer.alloc(32 - key.length)]);
  else if (key.length > 32) key = key.slice(0, 32);

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8"); // base64 secretKey for Solana, hex for Tron
}

// ----------------------
// Create Solana + Tron wallets if missing
// ----------------------
export async function ensureWalletsForUser(userId: number) {
  
  const existingWallets = await prisma.wallet.findMany({ where: { userId } });
  const existingNetworks = new Set(existingWallets.map((w) => w.networkId));

  const SOL = CHAINS[CHAIN_ENV].sol;
  const TRON = CHAINS[CHAIN_ENV].tron;

  // Find or create networks (we already had Solana/Tron earlier)
  let solanaNet = await prisma.network.findFirst({ where: { symbol: "SOL" } });
  let tronNet   = await prisma.network.findFirst({ where: { symbol: "TRX" } });
  let ethNet    = await prisma.network.findFirst({ where: { symbol: "ETH" } });
  let btcNet    = await prisma.network.findFirst({ where: { symbol: "BTC" } });
  let dogeNet = await prisma.network.findFirst({ where: { symbol: "DOGE" } });
  let xmrNet  = await prisma.network.findFirst({ where: { symbol: "XMR" } });
  let xrpNet  = await prisma.network.findFirst({ where: { symbol: "XRP" } });


  if (!solanaNet) {
    solanaNet = await prisma.network.create({
      data: { name: SOL.name, chainId: SOL.chainId, rpcUrl: SOL.rpcUrl, symbol: SOL.symbol, explorerUrl: SOL.explorerUrl, },
    });
  } else if (solanaNet.rpcUrl !== SOL.rpcUrl) {
    // keep fresh if you changed RPC
    solanaNet = await prisma.network.update({ where: { id: solanaNet.id }, data: { rpcUrl: SOL.rpcUrl, explorerUrl: SOL.explorerUrl } });
  }

  if (!tronNet) {
    tronNet = await prisma.network.create({
      data: { name: TRON.name, chainId: TRON.chainId, rpcUrl: TRON.rpcUrl, symbol: TRON.symbol, explorerUrl: TRON.explorerUrl, },
    });
  } else if (tronNet.rpcUrl !== TRON.rpcUrl) {
    tronNet = await prisma.network.update({ where: { id: tronNet.id }, data: { rpcUrl: TRON.rpcUrl, explorerUrl: TRON.explorerUrl } });
  }

  // create/update ETH network
  if (!ethNet) {
    ethNet = await prisma.network.create({
      data: {
        name: ETH_NET.name, chainId: ETH_NET.chainId, rpcUrl: ETH_NET.rpcUrl, symbol: ETH_NET.symbol,
        explorerUrl: ETH_NET.explorerUrl || null,
      },
    });
  } else if (ethNet.rpcUrl !== ETH_NET.rpcUrl) {
    ethNet = await prisma.network.update({ where: { id: ethNet.id }, data: { rpcUrl: ETH_NET.rpcUrl, explorerUrl: ETH_NET.explorerUrl || null } });
  }

  // create/update BTC network
  if (!btcNet) {
    btcNet = await prisma.network.create({
      data: {
        name: BTC_NET.name, chainId: BTC_NET.chainId, rpcUrl: BTC_NET.rpcUrl, symbol: BTC_NET.symbol,
        explorerUrl: BTC_NET.explorerUrl || null,
      },
    });
  } else if (btcNet.rpcUrl !== BTC_NET.rpcUrl) {
    btcNet = await prisma.network.update({ where: { id: btcNet.id }, data: { rpcUrl: BTC_NET.rpcUrl, explorerUrl: BTC_NET.explorerUrl || null } });
  }

  // DOGE
    if (!dogeNet) {
      dogeNet = await prisma.network.create({
        data: {
          name: DOGE_NET.name,
          chainId: DOGE_NET.chainId,
          rpcUrl: DOGE_NET.rpcUrl,
          symbol: DOGE_NET.symbol,
          explorerUrl: DOGE_NET.explorerUrl,
        },
      });
    } else if (dogeNet.rpcUrl !== DOGE_NET.rpcUrl) {
      dogeNet = await prisma.network.update({
        where: { id: dogeNet.id },
        data: { rpcUrl: DOGE_NET.rpcUrl, explorerUrl: DOGE_NET.explorerUrl },
      });
    }

  // XRP
  if (!xrpNet) {
    xrpNet = await prisma.network.create({
      data: {
        name: XRP_NET.name,
        chainId: XRP_NET.chainId,
        rpcUrl: XRP_NET.rpcUrl,
        symbol: XRP_NET.symbol,
        explorerUrl: XRP_NET.explorerUrl,
      },
    });
  } else if (xrpNet.rpcUrl !== XRP_NET.rpcUrl) {
    xrpNet = await prisma.network.update({
      where: { id: xrpNet.id },
      data: { rpcUrl: XRP_NET.rpcUrl, explorerUrl: XRP_NET.explorerUrl },
    });
  }

  if (!xmrNet) {
    xmrNet = await prisma.network.create({
      data: {
        name: XMR_NET.name,
        chainId: XMR_NET.chainId,
        rpcUrl: XMR_NET.rpcUrl,
        symbol: XMR_NET.symbol,
        explorerUrl: XMR_NET.explorerUrl,
      },
    });
  } else if (xmrNet.rpcUrl !== XMR_NET.rpcUrl) {
    xmrNet = await prisma.network.update({
      where: { id: xmrNet.id },
      data: { rpcUrl: XMR_NET.rpcUrl, explorerUrl: XMR_NET.explorerUrl },
    });
  }

  const walletsToCreate: any[] = [];

  // ETH wallet (hex private key)
  if (ethNet && !existingNetworks.has(ethNet.id)) {
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;                 // 0x...
    const privHex = wallet.privateKey.replace(/^0x/, "");
    const enc = encryptPrivateKey(privHex);
    walletsToCreate.push({ userId, networkId: ethNet.id, address, privateKeyEnc: enc });
  }

  // BTC wallet (P2WPKH bech32 + WIF)
  if (btcNet && !existingNetworks.has(btcNet.id)) {
    const net = CHAIN_ENV === "testnet" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    const keyPair = ECPair.makeRandom({ network: net });
    const wif = keyPair.toWIF();
    const pay = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network: net });
    if (!pay.address) throw new Error("BTC address gen failed");
    const enc = encryptPrivateKey(wif);            // store WIF encrypted
    walletsToCreate.push({ userId, networkId: btcNet.id, address: pay.address, privateKeyEnc: enc });
  }

  // Solana wallet (keypair works on devnet/testnet/mainnet; network decides where you use it)
  if (!existingNetworks.has(solanaNet.id)) {
    const kp = Keypair.generate();
    const publicKey = kp.publicKey.toBase58();
    const privateKey = Buffer.from(kp.secretKey).toString("base64"); // keep base64
    const encKey = encryptPrivateKey(privateKey);
    walletsToCreate.push({
      userId, networkId: solanaNet.id, address: publicKey, privateKeyEnc: encKey,
    });
  }

  // Tron wallet (same address format; network = Nile when you broadcast)
  if (!existingNetworks.has(tronNet.id)) {
    const account = TronWeb.utils.accounts.generateAccount();
    const address = account.address.base58;
    const privateKey = account.privateKey;
    const encKey = encryptPrivateKey(privateKey);
    walletsToCreate.push({
      userId, networkId: tronNet.id, address, privateKeyEnc: encKey,
    });
  }

  // DOGE wallet (P2PKH address + WIF)
  if (!existingNetworks.has(dogeNet.id)) {
    const net =
      CHAIN_ENV === "testnet"
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

    const keyPair = ECPair.makeRandom({ network: net });
    const { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network: net,
    });
    if (!address) throw new Error("Dogecoin address generation failed");
    
    const wif = keyPair.toWIF();

    const enc = encryptPrivateKey(wif);
    walletsToCreate.push({
      userId,
      networkId: dogeNet.id,
      address,
      privateKeyEnc: enc,
    });
  }

  if (!existingNetworks.has(xrpNet.id)) {
    const wallet = XrpWallet.generate();
    const address = wallet.classicAddress;
    const secret = wallet.seed!;
    const enc = encryptPrivateKey(secret);
    walletsToCreate.push({
      userId,
      networkId: xrpNet.id,
      address,
      privateKeyEnc: enc,
    });
  }

  // XMR (Monero) wallet creation via monero-wallet-rpc
    if (!existingNetworks.has(xmrNet.id)) {
      try {
        const isTestnet = CHAIN_ENV === "testnet";
        const networkType = isTestnet ? "stagenet" : "mainnet";

        const walletName = `user_${userId}_xmr`;
        const walletPassword = crypto.randomBytes(12).toString("hex");

        console.log(`🪙 Creating Monero wallet for user ${userId} (${networkType})...`);

        // // 1️⃣ Create wallet via xmrRpcPool
        // await callXmrOnce(walletName, walletPassword, "create_wallet", {
        //   filename: walletName,
        //   password: walletPassword,
        //   language: "English",
        // });

        // // 2️⃣ Fetch address from same one-shot process
        // const addrRes = await callXmrOnce(walletName, walletPassword, "get_address");
        // const address = addrRes.address;

        const { address } = await createXmrWallet(
          walletName,
          walletPassword,
          "English"
        );

        const metaData = {
          rpcUrl: "http://127.0.0.1:38083/json_rpc", // optional reference, not used here
          walletName,
          walletPassword,
          networkType,
        };

        walletsToCreate.push({
          userId,
          networkId: xmrNet.id,
          address,
          privateKeyEnc: "",
          meta: JSON.stringify(metaData),
        });

        console.log(`✅ Monero wallet created for user ${userId}: ${address}`);
      } catch (err: any) {
        console.error("❌ Monero wallet creation failed:", err.message);
      }
    }

    if (walletsToCreate.length) {
      await prisma.wallet.createMany({ data: walletsToCreate, skipDuplicates: true });
    }

    return prisma.wallet.findMany({ where: { userId }, include: { network: true } });
  }