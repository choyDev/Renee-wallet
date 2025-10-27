import { ethers } from "ethers";

const wallet = ethers.Wallet.createRandom();

console.log("🔹 Ethereum Bridge Wallet");
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey.replace(/^0x/, ""));
console.log("\nAdd to .env:");
console.log(`ETH_BRIDGE_ADDRESS=${wallet.address}`);
console.log(`ETH_BRIDGE_PRIVKEY=${wallet.privateKey.replace(/^0x/, "")}`);
