// getSolanaBridgeWallet.js
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58"; // <-- ✅ base58 encoder

// Generate a new Solana wallet
const kp = Keypair.generate();

console.log("Public Key:", kp.publicKey.toBase58());

// Encode secret key to base58 for .env storage
const privateBase58 = bs58.encode(Buffer.from(kp.secretKey));
console.log("Private (base58):", privateBase58);

// Example .env lines to copy-paste:
console.log("\nPut these in your .env file:");
console.log(`SOL_BRIDGE_PRIVATE_KEY_BASE58=${privateBase58}`);
console.log(`SOL_BRIDGE_ADDRESS=${kp.publicKey.toBase58()}`);
