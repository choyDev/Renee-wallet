import { prisma } from "@/lib/prisma";
import { Keypair } from "@solana/web3.js";
import crypto from "crypto";
const TronWeb = require("tronweb");
import "regenerator-runtime/runtime";
import { ethers } from "ethers";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
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

  if (walletsToCreate.length) {
    await prisma.wallet.createMany({ data: walletsToCreate, skipDuplicates: true });
  }

  return prisma.wallet.findMany({ where: { userId }, include: { network: true } });
}