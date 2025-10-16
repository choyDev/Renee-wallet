import { prisma } from "@/lib/prisma";
import { Keypair } from "@solana/web3.js";
import crypto from "crypto";
const TronWeb = require("tronweb");
import "regenerator-runtime/runtime";


const PRIVATE_KEY_SECRET = process.env.PRIVATE_KEY_SECRET || "supersecret32byteskey!!";

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
  console.log(`🔍 Checking wallets for user ${userId}...`);

  const existingWallets = await prisma.wallet.findMany({ where: { userId } });
  const existingNetworks = new Set(existingWallets.map(w => w.networkId));

  // Find or create networks
  let solanaNet = await prisma.network.findFirst({ where: { name: "Solana" } });
  let tronNet = await prisma.network.findFirst({ where: { name: "Tron" } });

  if (!solanaNet) {
    solanaNet = await prisma.network.create({
      data: {
        name: "Solana",
        chainId: "mainnet-beta",
        rpcUrl: "https://api.mainnet-beta.solana.com",
        symbol: "SOL",
      },
    });
  }

  if (!tronNet) {
    tronNet = await prisma.network.create({
      data: {
        name: "Tron",
        chainId: "mainnet",
        rpcUrl: "https://api.trongrid.io",
        symbol: "TRX",
      },
    });
  }

  const walletsToCreate: any[] = [];

  // ✅ Solana Wallet
  if (!existingNetworks.has(solanaNet.id)) {
    const kp = Keypair.generate();
    const publicKey = kp.publicKey.toBase58();
    const privateKey = Buffer.from(kp.secretKey).toString("base64");
    const encKey = encryptPrivateKey(privateKey);
    walletsToCreate.push({
      userId,
      networkId: solanaNet.id,
      address: publicKey,
      privateKeyEnc: encKey,
    });
  }

  // ✅ Tron Wallet
  if (!existingNetworks.has(tronNet.id)) {
    const account = TronWeb.utils.accounts.generateAccount();
    const address = account.address.base58;
    const privateKey = account.privateKey;
    const encKey = encryptPrivateKey(privateKey);
    walletsToCreate.push({
      userId,
      networkId: tronNet.id,
      address,
      privateKeyEnc: encKey,
    });
  }

  if (walletsToCreate.length > 0) {
    await prisma.wallet.createMany({ data: walletsToCreate, skipDuplicates: true });
  }

  return prisma.wallet.findMany({
    where: { userId },
    include: { network: true },
  });
}
