import TronWeb from "tronweb";

const tronWeb = new TronWeb({ fullHost: "https://nile.trongrid.io" });
const account = await tronWeb.createAccount();

console.log("🔹 Tron Bridge Wallet");
console.log("Address:", account.address.base58);
console.log("Private Key:", account.privateKey);
console.log("\nAdd to .env:");
console.log(`TRX_BRIDGE_ADDRESS=${account.address.base58}`);
console.log(`TRX_BRIDGE_PRIVATE_KEY=${account.privateKey}`);
