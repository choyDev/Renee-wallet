import { ethers } from "ethers";

// === CONFIG ===
const RPC_URL = "https://sepolia.infura.io/v3/5a772f67b04648cda36fd5ef1fe0e61d";  // or any Sepolia RPC
const PRIVATE_KEY = "8342bd42dac8d337f239f6e04e8c7e5d32141bbc55d8e1286bc9ccc36e582d74";                 // wallet that owns TestUSDT
const USDT_CONTRACT = "0x361049DdA69F353C8414331B8eaBc57342F4bD97";        // your TestUSDT contract
const TO_ADDRESS = "0x91bE157daAc5E4a99293C5B3F6e9EE4916a850CB";              // wallet you want to credit
const AMOUNT = "100"; // Amount of USDT to send

// === SCRIPT ===
async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Only need ERC20 transfer ABI
  const usdt = new ethers.Contract(
    USDT_CONTRACT,
    ["function transfer(address to, uint256 value) public returns (bool)"],
    wallet
  );

  // Change 18 to 6 if your token uses 6 decimals
  const amountInUnits = ethers.parseUnits(AMOUNT, 18);

  console.log(`💸 Sending ${AMOUNT} USDT to ${TO_ADDRESS}...`);
  const tx = await usdt.transfer(TO_ADDRESS, amountInUnits);
  console.log("⏳ Transaction hash:", tx.hash);

  await tx.wait();
  console.log("✅ Transfer confirmed!");
}

main().catch(console.error);