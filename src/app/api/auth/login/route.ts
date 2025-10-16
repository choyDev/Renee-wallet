import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // optional if you want a token

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });

    const kyc = await prisma.kycVerification.findFirst({ where: { userId: user.id } });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

    const res = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        kycVerified: kyc?.verified || false,
      },
    });

    res.cookies.set("token", token, { httpOnly: true, sameSite: "lax", path: "/" });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { Keypair } from "@solana/web3.js";
// const TronWeb = require("tronweb");
// import crypto from "crypto";

// const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
// const PRIVATE_KEY_SECRET = process.env.PRIVATE_KEY_SECRET || "supersecret32byteskey!!"; // Must be exactly 32 bytes

// // ----------------------
// // Helper: Encrypt private key with AES
// // ----------------------
// function encryptPrivateKey(privateKey: string): string {
//   const iv = crypto.randomBytes(16);
  
//   // Ensure the key is exactly 32 bytes
//   let key = Buffer.from(PRIVATE_KEY_SECRET);
//   if (key.length < 32) {
//     key = Buffer.concat([key, Buffer.alloc(32 - key.length)]);
//   } else if (key.length > 32) {
//     key = key.slice(0, 32);
//   }
  
//   const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
//   let encrypted = cipher.update(privateKey, "utf8");
//   encrypted = Buffer.concat([encrypted, cipher.final()]);
//   return iv.toString("hex") + ":" + encrypted.toString("hex");
// }

// // ----------------------
// // Helper: Generate blockchain wallets
// // ----------------------
// async function ensureWalletsForUser(userId: number) {
//   try {
//     console.log(`🔍 Checking wallets for user ${userId}...`);
    
//     const existingWallets = await prisma.wallet.findMany({ where: { userId } });
//     const existingNetworks = new Set(existingWallets.map(w => w.networkId));
    
//     console.log(`✅ Existing wallets: ${existingWallets.length}`);
//     console.log(`📋 Existing networks:`, Array.from(existingNetworks));

//     // Find or create Solana & Tron network records
//     let solanaNet = await prisma.network.findFirst({ 
//       where: { name: { equals: "Solana",} } 
//     });
    
//     let tronNet = await prisma.network.findFirst({ 
//       where: { name: { equals: "Tron", } } 
//     });

//     // Create networks if they don't exist
//     if (!solanaNet) {
//       console.log("⚠️ Solana network not found, creating...");
//       solanaNet = await prisma.network.create({
//         data: {
//           name: "Solana",
//           chainId: "mainnet-beta",
//           rpcUrl: "https://api.mainnet-beta.solana.com",
//           symbol: "SOL",
//         },
//       });
//       console.log("✅ Solana network created:", solanaNet.id);
//     }

//     if (!tronNet) {
//       console.log("⚠️ Tron network not found, creating...");
//       tronNet = await prisma.network.create({
//         data: {
//           name: "Tron",
//           chainId: "mainnet",
//           rpcUrl: "https://api.trongrid.io",
//           symbol: "TRX",
//         },
//       });
//       console.log("✅ Tron network created:", tronNet.id);
//     }

//     const walletsToCreate: any[] = [];

//     // Create Solana wallet if missing
//     if (solanaNet && !existingNetworks.has(solanaNet.id)) {
//       try {
//         console.log("🔧 Generating Solana wallet...");
//         const kp = Keypair.generate();
//         const publicKey = kp.publicKey.toBase58();
//         const privateKey = Buffer.from(kp.secretKey).toString("base64");
//         const encKey = encryptPrivateKey(privateKey);
        
//         walletsToCreate.push({
//           userId,
//           networkId: solanaNet.id,
//           address: publicKey,
//           privateKeyEnc: encKey,
//         });
//         console.log(`✅ Solana wallet generated: ${publicKey}`);
//       } catch (error) {
//         console.error("❌ Error generating Solana wallet:", error);
//       }
//     } else {
//       console.log("ℹ️ Solana wallet already exists or network not found");
//     }

//     // Create Tron wallet if missing
//     if (tronNet && !existingNetworks.has(tronNet.id)) {
//       try {
//         console.log("🔧 Generating Tron wallet...");
        
//         // Method 1: Using TronWeb utility (recommended)
//         const account = TronWeb.utils.accounts.generateAccount();
//         const address = account.address.base58;
//         const privateKey = account.privateKey;
//         const encKey = encryptPrivateKey(privateKey);
        
//         walletsToCreate.push({
//           userId,
//           networkId: tronNet.id,
//           address,
//           privateKeyEnc: encKey,
//         });
//         console.log(`✅ Tron wallet generated: ${address}`);
//       } catch (error) {
//         console.error("❌ Error generating Tron wallet:", error);
//       }
//     } else {
//       console.log("ℹ️ Tron wallet already exists or network not found");
//     }

//     // Create wallets in database
//     if (walletsToCreate.length > 0) {
//       console.log(`💾 Creating ${walletsToCreate.length} wallet(s) in database...`);
//       try {
//         await prisma.wallet.createMany({ 
//           data: walletsToCreate,
//           skipDuplicates: true, // Prevent duplicate key errors
//         });
//         console.log("✅ Wallets created successfully");
//       } catch (error) {
//         console.error("❌ Error creating wallets in database:", error);
//         throw error;
//       }
//     } else {
//       console.log("ℹ️ No new wallets to create");
//     }

//     // Return all wallets for the user
//     const allWallets = await prisma.wallet.findMany({
//       where: { userId },
//       include: { network: true },
//     });
    
//     console.log(`✅ Total wallets for user: ${allWallets.length}`);
//     return allWallets;
    
//   } catch (error) {
//     console.error("❌ Error in ensureWalletsForUser:", error);
//     throw error;
//   }
// }

// // ----------------------
// // POST /api/auth/login
// // ----------------------
// export async function POST(req: Request) {
//   try {
//     const { email, password } = await req.json();

//     if (!email || !password) {
//       return NextResponse.json(
//         { error: "Email and password required" },
//         { status: 400 }
//       );
//     }

//     console.log(`🔐 Login attempt for: ${email}`);

//     // Find user
//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) {
//       console.log(`❌ User not found: ${email}`);
//       return NextResponse.json(
//         { error: "Invalid credentials" }, 
//         { status: 401 }
//       );
//     }

//     console.log(`✅ User found: ${user.id}`);

//     // Validate password
//     const valid = await bcrypt.compare(password, user.password_hash);
//     if (!valid) {
//       console.log(`❌ Invalid password for: ${email}`);
//       return NextResponse.json(
//         { error: "Invalid credentials" }, 
//         { status: 401 }
//       );
//     }

//     console.log(`✅ Password validated for: ${email}`);

//     // Generate JWT token
//     const token = jwt.sign(
//       { id: user.id, email: user.email },
//       JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     // ✅ Ensure blockchain wallets exist
//     console.log(`🔧 Ensuring wallets for user ${user.id}...`);
//     let wallets: any[] = [];
    
//     try {
//       wallets = await ensureWalletsForUser(user.id);
//       console.log(`✅ Wallets ensured: ${wallets.length} wallet(s)`);
//     } catch (walletError) {
//       console.error("❌ Error ensuring wallets:", walletError);
//       // Continue with login even if wallet creation fails
//       // You can decide whether to fail the login or continue
//     }

//     // Response
//     const res = NextResponse.json({
//       message: "Login successful",
//       user: { 
//         id: user.id, 
//         email: user.email,
//         name: user.full_name,
//       },
//       wallets: wallets.map(w => ({
//         id: w.id,
//         address: w.address,
//         network: w.network.name,
//         symbol: w.network.symbol,
//       })),
//     });

//     res.cookies.set("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       path: "/",
//       maxAge: 86400, // 1 day
//     });

//     console.log(`✅ Login successful for: ${email}`);
//     return res;

//   } catch (err) {
//     console.error("❌ Login error:", err);
//     return NextResponse.json(
//       { 
//         error: "Internal Server Error",
//         details: process.env.NODE_ENV === "development" ? String(err) : undefined
//       }, 
//       { status: 500 }
//     );
//   }
// }

