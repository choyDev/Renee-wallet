import { prisma } from "@/lib/prisma";
import { decryptPrivateKey } from "@/lib/wallet";
import { bridgeTron } from "./tronBridge";
import { bridgeSolana } from "./solanaBridge";
import { bridgeEthereum } from "./ethereumBridge";
import { bridgeBitcoin } from "./bitcoinBridge";
import { bridgeSolanaToTron } from "./solanaToTron";
import { bridgeSolanaToEthereum } from "./solanaToEthereum";
import { bridgeSolanaToBitcoin } from "./solanaToBitcoin";
import { bridgeEthereumToTron } from "./ethereumToTron";
import { bridgeEthereumToSolana } from "./ethereumToSolana";
import { bridgeEthereumToBitcoin } from "./ethereumToBitcoin";
import { bridgeBitcoinToTron } from "./bitcoinToTron";
import { bridgeBitcoinToSolana } from "./bitcoinToSolana";
import { bridgeBitcoinToEthereum } from "./bitcoinToEthereum";
import { bridgeTronUsdtToSolana } from "./tronUsdtToSolana";

import { convertRate, SymbolKey } from "./rate";
import type { BridgeResult } from "./types";

export async function executeBridge({
  fromUser,
  fromChain,
  toChain,
  fromToken,
  toToken,
  amount,
}: {
  fromUser: number;
  fromChain: string;
  toChain: string;
  fromToken: SymbolKey;
  toToken: SymbolKey;
  amount: number;
}): Promise<BridgeResult> {
  try {
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) throw new Error("Invalid amount");

    // 1️⃣ Fetch both wallets
    const [fromWallet, toWallet] = await Promise.all([
      prisma.wallet.findFirst({
        where: { userId: fromUser, network: { symbol: fromChain } },
        include: { network: true },
      }),
      prisma.wallet.findFirst({
        where: { userId: fromUser, network: { symbol: toChain } },
        include: { network: true },
      }),
    ]);

    if (!fromWallet || !toWallet) {
      throw new Error("Missing source or destination wallet.");
    }

    // 2️⃣ Decrypt private key for source chain
    const fromPriv = decryptPrivateKey(fromWallet.privateKeyEnc);

    // 3️⃣ Convert rate between specific tokens
    const { toAmount } = await convertRate(fromToken, toToken, amt);

    // 4️⃣ Execute bridge
    let fromTx: { txHash: string } | null = null;
    let toTx: { txHash: string } | null = null;

    if (fromChain === "TRX" && toChain === "SOL" && fromToken === "USDT") {
      const result = await bridgeTronUsdtToSolana({
        tronPrivateKey: fromPriv,
        tronVault: process.env.TRON_USDT_VAULT!,
        solBridgePrivateKeyBase58: process.env.SOL_BRIDGE_PRIVATE_KEY_BASE58!,
        solToAddress: toWallet.address,
        amount: amt,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    }

    else if (fromChain === "TRX" && toChain === "SOL") {
      fromTx = await bridgeTron({
        privateKey: fromPriv,
        amount: amt,
        token: fromToken,
        toAddress: toWallet.address,
      });

      toTx = await bridgeSolana({
        token: toToken,
        action: "MINT",
        amount: toAmount,
        toAddress: toWallet.address,
      });
    } else if (fromChain === "TRX" && toChain === "ETH") {
      // Step 1️⃣ Lock on Tron
      fromTx = await bridgeTron({
        privateKey: fromPriv,
        amount: amt,
        token: fromToken,
        toAddress: toWallet.address, // destination ETH wallet address stored for user
      });
    
      // Step 2️⃣ Mint or send equivalent ETH
      toTx = await bridgeEthereum({
        token: toToken,
        action: "MINT",
        amount: toAmount,
        toAddress: toWallet.address,
      });
    } else if (fromChain === "TRX" && toChain === "BTC") {
      fromTx = await bridgeTron({
        privateKey: fromPriv,
        amount: amt,
        token: fromToken,
        toAddress: toWallet.address,
      });
    
      toTx = await bridgeBitcoin({
        token: toToken,
        action: "MINT",
        amount: toAmount,
        toAddress: toWallet.address,
      });
    } else if (fromChain === "SOL" && toChain === "TRX") {
      
      const result = await bridgeSolanaToTron({
        solPrivateKey: fromPriv,
        tronPrivateKey: process.env.TRX_BRIDGE_PRIVATE_KEY!,
        solVault: process.env.SOL_BRIDGE_VAULT!, // Solana vault that holds locked SOL
        tronToAddress: toWallet.address,         // user’s Tron wallet to receive WSOL
        solAmount: amt,                          // original SOL amount
        tronAmount: toAmount,                    // converted TRX (WSOL) amount
      });
    
      if (result.status === "failed") throw new Error(result.error);
    
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };

    } else if (fromChain === "SOL" && toChain === "ETH") {
      const result = await bridgeSolanaToEthereum({
        solPrivateKey: fromPriv,
        solVault: process.env.SOL_BRIDGE_VAULT!,
        ethToAddress: toWallet.address,
        solAmount: amt,
        ethAmount: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
    
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "SOL" && toChain === "BTC") {
      const result = await bridgeSolanaToBitcoin({
        solPrivateKey: fromPriv,
        solVault: process.env.SOL_BRIDGE_VAULT!,
        btcPrivateKeyWIF: process.env.BTC_BRIDGE_WIF!,
        btcToAddress: toWallet.address,
        solAmount: amt,
        btcAmount: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "ETH" && toChain === "TRX") {
      const result = await bridgeEthereumToTron({
        ethPrivateKey: fromPriv,
        ethVault: process.env.ETH_BRIDGE_VAULT!,
        trxPrivateKey: process.env.TRX_BRIDGE_PRIVATE_KEY!,
        trxToAddress: toWallet.address,
        ethAmount: amt,
        trxAmount: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "ETH" && toChain === "SOL") {
      const result = await bridgeEthereumToSolana({
        ethPrivateKey: fromPriv, // ✅ user's decrypted private key
        ethVault: process.env.ETH_BRIDGE_VAULT!,
        solBridgePrivateKeyBase58: process.env.SOL_BRIDGE_PRIVATE_KEY_BASE58!,
        solToAddress: toWallet.address,
        ethAmount: amt,
        solAmount: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "ETH" && toChain === "BTC") {
      const result = await bridgeEthereumToBitcoin({
        ethPrivateKey: fromPriv, // user’s decrypted ETH private key
        ethVault: process.env.ETH_BRIDGE_VAULT!,
        btcPrivateKeyWIF: process.env.BTC_BRIDGE_WIF!,
        btcToAddress: toWallet.address,
        ethAmount: amt,
        btcAmount: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "BTC" && toChain === "TRX") {
      const result = await bridgeBitcoinToTron({
        btcPrivateKeyWIF: fromPriv, // user’s BTC private key
        btcVault: process.env.BTC_BRIDGE_VAULT!,
        trxPrivateKey: process.env.TRX_BRIDGE_PRIVATE_KEY!,
        trxToAddress: toWallet.address,
        btcAmount: amt,
        trxAmount: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash };
      toTx = { txHash: result.toTxHash };
    } else if (fromChain === "BTC" && toChain === "SOL") {
      const result = await bridgeBitcoinToSolana({
        btcPrivateKeyWIF: fromPriv,
        btcVault: process.env.BTC_BRIDGE_VAULT!,
        solBridgePrivateKeyBase58: process.env.SOL_BRIDGE_PRIVATE_KEY_BASE58!,
        solToAddress: toWallet.address,
        btcAmount: amt,
        solAmount: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "BTC" && toChain === "ETH") {
      const result = await bridgeBitcoinToEthereum({
        btcPrivateKeyWIF: fromPriv,
        btcVault: process.env.BTC_BRIDGE_VAULT!,
        ethBridgePrivateKey: process.env.ETH_BRIDGE_PRIVKEY!,
        ethToAddress: toWallet.address,
        btcAmount: amt,
        ethAmount: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } 
    else {
      throw new Error(`Unsupported bridge path: ${fromChain} → ${toChain}`);
    }

    if (!fromTx?.txHash || !toTx?.txHash) {
      throw new Error("Bridge failed: missing transaction hashes.");
    }

    const token = await prisma.token.findFirst({
      where: { 
        symbol: fromToken,
        networkId: fromWallet.networkId
      }
    });
    
    if (!token) {
      throw new Error(`Token ${fromToken} not found`);
    }

    // 5️⃣ Save DB record
    const saved = await prisma.bridgetransaction.create({
      data: {
        userId: fromUser,
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        tokenId: token.id,
        fromChain,
        toChain,
        amount,
        bridgeFee: 0.001,
        fromTxHash: fromTx.txHash,
        toTxHash: toTx.txHash,
        status: "COMPLETED",
      },
    });

    return { status: "completed", db: saved };
  } catch (err: any) {
    console.error("executeBridge error:", err);
    return { status: "failed", error: err.message };
  }
}


