import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

const network = bitcoin.networks.testnet;
const keyPair = ECPair.makeRandom({ network });
const { address } = bitcoin.payments.p2wpkh({
  pubkey: keyPair.publicKey,
  network,
});

console.log("🔹 Bitcoin Bridge Wallet (Testnet)");
console.log("Address:", address);
console.log("Private (WIF):", keyPair.toWIF());
console.log("\nAdd to .env:");
console.log(`BTC_BRIDGE_ADDRESS=${address}`);
console.log(`BTC_BRIDGE_WIF=${keyPair.toWIF()}`);
