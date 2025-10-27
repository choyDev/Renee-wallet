import { prisma } from "@/lib/prisma";
import { decryptPrivateKey } from "@/lib/wallet";
import { ethers } from "ethers";
import TronWeb from "tronweb";
import { Connection, Keypair } from "@solana/web3.js";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

/** Fetch both wallets (from + to) for a given symbol dynamically from DB */
export async function getBridgeWallets(fromUser: number, toUser: number, symbol: string) {
  const [fromWallet, toWallet] = await Promise.all([
    prisma.wallet.findFirst({
      where: { userId: fromUser, network: { symbol } },
      include: { network: true },
    }),
    prisma.wallet.findFirst({
      where: { userId: toUser, network: { symbol } },
      include: { network: true },
    }),
  ]);
  if (!fromWallet || !toWallet) throw new Error(`Missing ${symbol} wallets in DB`);

  const fromPriv = decryptPrivateKey(fromWallet.privateKeyEnc);
  return { fromWallet, toWallet, fromPriv };
}

/** Get signer or connection for a specific chain */
export async function getSigner(symbol: string, privateKey: string) {
  switch (symbol) {
    case "ETH":
      return new ethers.Wallet("0x" + privateKey, new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET));
    case "TRX":
      return new TronWeb({ fullHost: process.env.TRON_NILE_RPC, privateKey });
    case "SOL": {
      const secret = Buffer.from(privateKey, "base64");
      const kp = Keypair.fromSecretKey(secret);
      const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
      return { kp, conn };
    }
    case "BTC": {
      const net = bitcoin.networks.testnet;
      const keyPair = ECPair.fromWIF(privateKey, net);
      return { keyPair, net };
    }
    default:
      throw new Error("Unsupported chain");
  }
}
