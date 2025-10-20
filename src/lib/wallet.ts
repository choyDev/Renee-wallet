import { prisma } from "@/lib/prisma";
import { Keypair } from "@solana/web3.js";
import crypto from "crypto";
const TronWeb = require("tronweb");
import "regenerator-runtime/runtime";


const PRIVATE_KEY_SECRET = process.env.PRIVATE_KEY_SECRET || "supersecret32byteskey!!";
const CHAIN_ENV = process.env.CHAIN_ENV === "testnet" ? "testnet" : "mainnet";

const CHAINS = {
  mainnet: {
    sol: { name: "Solana",   chainId: "mainnet-beta", rpcUrl: "https://api.mainnet-beta.solana.com", symbol: "SOL" },
    tron: { name: "Tron",     chainId: "mainnet",      rpcUrl: "https://api.trongrid.io",            symbol: "TRX" },
  },
  testnet: {
    sol: { name: "Solana (Devnet)", chainId: "devnet", rpcUrl: process.env.SOLANA_DEVNET_RPC || "https://api.devnet.solana.com", symbol: "SOL" },
    tron: { name: "Tron (Shasta)",  chainId: "shasta", rpcUrl: process.env.TRON_SHASTA_RPC  || "https://api.shasta.trongrid.io", symbol: "TRX" },
  },
} as const;

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
// Create Solana + Tron wallets if missing
// ----------------------
export async function ensureWalletsForUser(userId: number) {
  console.log(`� Checking wallets for user ${userId} on ${CHAIN_ENV}...`);

  const existingWallets = await prisma.wallet.findMany({ where: { userId } });
  const existingNetworks = new Set(existingWallets.map((w) => w.networkId));

  const SOL = CHAINS[CHAIN_ENV].sol;
  const TRON = CHAINS[CHAIN_ENV].tron;

  // Find by chainId (safer than name), create if missing
  let solanaNet = await prisma.network.findFirst({ where: { chainId: SOL.chainId } });
  if (!solanaNet) {
    solanaNet = await prisma.network.create({
      data: { name: SOL.name, chainId: SOL.chainId, rpcUrl: SOL.rpcUrl, symbol: SOL.symbol },
    });
  } else if (solanaNet.rpcUrl !== SOL.rpcUrl) {
    // keep fresh if you changed RPC
    solanaNet = await prisma.network.update({ where: { id: solanaNet.id }, data: { rpcUrl: SOL.rpcUrl } });
  }

  let tronNet = await prisma.network.findFirst({ where: { chainId: TRON.chainId } });
  if (!tronNet) {
    tronNet = await prisma.network.create({
      data: { name: TRON.name, chainId: TRON.chainId, rpcUrl: TRON.rpcUrl, symbol: TRON.symbol },
    });
  } else if (tronNet.rpcUrl !== TRON.rpcUrl) {
    tronNet = await prisma.network.update({ where: { id: tronNet.id }, data: { rpcUrl: TRON.rpcUrl } });
  }

  const walletsToCreate: any[] = [];

  // ✅ Solana wallet (keypair works on devnet/testnet/mainnet; network decides where you use it)
  if (!existingNetworks.has(solanaNet.id)) {
    const kp = Keypair.generate();
    const publicKey = kp.publicKey.toBase58();
    const privateKey = Buffer.from(kp.secretKey).toString("base64"); // keep base64
    const encKey = encryptPrivateKey(privateKey);
    walletsToCreate.push({
      userId, networkId: solanaNet.id, address: publicKey, privateKeyEnc: encKey,
    });
  }

  // ✅ Tron wallet (same address format; network = Shasta when you broadcast)
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