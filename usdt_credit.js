import fs from "fs";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

// ======== CONFIGURATION ========

//  Connect to Solana Devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

//  Your custom USDT-like mint created on Devnet
const mintAddress = "9TBHyDBpzY1ENKRHC5bUFnhM98mZyUrde9yotmcXJDc7";
const mint = new PublicKey(mintAddress);

//  Path to your Solana keypair JSON file
const keypairPath = "E:/Blockchain/Renee_wallet/devnet.json";

//  Recipient wallet (public address)
const recipient = new PublicKey("E4Rxofg9StzZUW4tHGW4eoXotuWineLosXwP8WnuCE7g");

//  Amount to mint (1000 USDT)
const amount = 1000 * 1e6; // 6 decimals

// ======== EXECUTION ========

(async () => {
  console.log("🚀 Connecting to Solana Devnet...");
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf8")));
  const payer = Keypair.fromSecretKey(secretKey);

  console.log("👛 Minting from:", payer.publicKey.toBase58());
  console.log("💸 To recipient:", recipient.toBase58());

  // Get or create ATA (Associated Token Account) for recipient
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    recipient
  );

  console.log(" Recipient ATA:", ata.address.toBase58());

  // Mint tokens
  const txSig = await mintTo(connection, payer, mint, ata.address, payer, amount);
  console.log(" Successfully minted 1000 USDT tokens!");
  console.log(`🔗 Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
})();
