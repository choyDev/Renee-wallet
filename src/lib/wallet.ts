import { prisma } from "@/lib/prisma";
import { Keypair } from "@solana/web3.js";
const TronWeb = require("tronweb");
import crypto from "crypto";

const PRIVATE_KEY_SECRET = process.env.PRIVATE_KEY_SECRET || "supersecret32byteskey!!";

function encryptPrivateKey(privateKey: string): string {
    const iv = crypto.randomBytes(16);
    
    // Ensure the key is exactly 32 bytes
    let key = Buffer.from(PRIVATE_KEY_SECRET);
    if (key.length < 32) {
      key = Buffer.concat([key, Buffer.alloc(32 - key.length)]);
    } else if (key.length > 32) {
      key = key.slice(0, 32);
    }
    
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(privateKey, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }
  
  // ----------------------
  // Helper: Generate blockchain wallets
  // ----------------------
  async function ensureWalletsForUser(userId: number) {
    try {
      
      const existingWallets = await prisma.wallet.findMany({ where: { userId } });
      const existingNetworks = new Set(existingWallets.map(w => w.networkId));
      
      // Find or create Solana & Tron network records
      let solanaNet = await prisma.network.findFirst({ 
        where: { name: { equals: "Solana",} } 
      });
      
      let tronNet = await prisma.network.findFirst({ 
        where: { name: { equals: "Tron", } } 
      });
  
      // Create networks if they don't exist
      if (!solanaNet) {
        solanaNet = await prisma.network.create({
          data: {
            name: "Solana",
            chainId: "mainnet-beta",
            rpcUrl: "https://api.mainnet-beta.solana.com",
            symbol: "SOL",
          },
        });
        console.log("✅ Solana network created:", solanaNet.id);
      }
  
      if (!tronNet) {
        console.log("⚠️ Tron network not found, creating...");
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
  
      // Create Solana wallet if missing
      if (solanaNet && !existingNetworks.has(solanaNet.id)) {
        try {
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
          
        } catch (error) {
          console.error("❌ Error generating Solana wallet:", error);
        }
      } else {
        console.log("ℹ️ Solana wallet already exists or network not found");
      }
  
      // Create Tron wallet if missing
      if (tronNet && !existingNetworks.has(tronNet.id)) {
        try {
          
          // Method 1: Using TronWeb utility (recommended)
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
        } catch (error) {
          console.error("❌ Error generating Tron wallet:", error);
        }
      } else {
        console.log("ℹ️ Tron wallet already exists or network not found");
      }
  
      // Create wallets in database
      if (walletsToCreate.length > 0) {
        try {
          await prisma.wallet.createMany({ 
            data: walletsToCreate,
            skipDuplicates: true, // Prevent duplicate key errors
          });
        } catch (error) {
          console.error("❌ Error creating wallets in database:", error);
          throw error;
        }
      } else {
        console.log("ℹ️ No new wallets to create");
      }
  
      // Return all wallets for the user
      const allWallets = await prisma.wallet.findMany({
        where: { userId },
        include: { network: true },
      });
      
      return allWallets;
      
    } catch (error) {
      console.error("❌ Error in ensureWalletsForUser:", error);
      throw error;
    }
  }
