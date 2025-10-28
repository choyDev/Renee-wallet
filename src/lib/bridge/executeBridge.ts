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
import { bridgeTRC20ToSPL } from "./trc20ToSolana";
import { bridgeTRC20ToERC20 } from "./trc20ToErc20";
import { bridgeTronUsdtToSolanaUsdt } from "./trc20ToSpl";
import { bridgeTronUsdtToEthereum } from "./trc20ToEthereum";
import { bridgeSPLToTRC20 } from "./splToTRC20";
import { bridgeSPLToERC20 } from "./splToERC20";
import { bridgeSPLToTRX } from "./splToTrx";
import { bridgeSPLToETH } from "./splToETH";
import { bridgeERC20ToTRC20 } from "./erc20ToTRC20";
import { bridgeERC20ToSPL } from "./erc20ToSPL";
import { bridgeERC20ToTRX } from "./erc20ToTrx";
import { bridgeERC20ToSolana } from "./erc20ToSol";
import { bridgeTRXToSPLUSDT } from "./trxToSPL";
import { bridgeTRXToERC20 } from "./trxToERC20";
import { bridgeSOLToTRC20 } from "./solToTrc20";
import { bridgeSOLToERC20 } from "./solToERC20";
import { bridgeETHToTRC20 } from "./ethToTRC20";
import { bridgeETHToSPL } from "./ethToSPL";
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

    if (
      fromChain === "TRX" &&
      toChain === "SOL" &&
      fromToken === "USDT" &&
      toToken === "USDT"
    ) {
      const result = await bridgeTronUsdtToSolanaUsdt({
        tronPrivateKey: fromPriv,
        tronVault: process.env.TRON_USDT_VAULT!,
        solBridgePrivateKeyBase58: process.env.SOL_BRIDGE_PRIVATE_KEY_BASE58!,
        solToAddress: toWallet.address,
        amount: amt,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "TRX" && toChain === "ETH" && fromToken === "USDT" && toToken === "USDT") {
      const result = await bridgeTRC20ToERC20({
        tronPrivateKey: fromPriv,
        tronVault: process.env.TRON_USDT_VAULT!,
        bridgePrivateKey: process.env.ETH_BRIDGE_PRIVKEY!,
        ethToAddress: toWallet.address,
        amount: amt,
      });
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "SOL" && toChain === "TRX" && fromToken === "USDT" && toToken === "USDT" && toToken === "USDT") {
      const result = await bridgeSPLToTRC20({
        solPrivateKey: fromPriv,
        solVault: process.env.SOL_BRIDGE_VAULT!,
        tronBridgePrivateKey: process.env.TRX_BRIDGE_PRIVATE_KEY!,
        tronToAddress: toWallet.address,
        amount: amt,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "SOL" && toChain === "ETH" && fromToken === "USDT" && toToken === "USDT") {
      
      const result = await bridgeSPLToERC20({
        solPrivateKey: fromPriv,                           // user’s Solana private key
        solVault: process.env.SOL_BRIDGE_VAULT!,           // bridge vault address on Solana
        ethBridgePrivateKey: process.env.ETH_BRIDGE_PRIVKEY!, // bridge vault key on Ethereum
        ethToAddress: toWallet.address,                    // recipient Ethereum address
        amount: amt,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "ETH" && toChain === "TRX" && fromToken === "USDT" && toToken === "USDT") {
      
      const result = await bridgeERC20ToTRC20({
        ethPrivateKey: fromPriv,
        ethVaultAddress: process.env.ETH_BRIDGE_VAULT!,
        tronBridgePrivateKey: process.env.TRX_BRIDGE_PRIVATE_KEY!,
        tronToAddress: toWallet.address,
        amount: amt,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "ETH" && toChain === "SOL" && fromToken === "USDT" && toToken === "USDT") {
      console.log("🔹 Starting ERC20 → SPL USDT bridge flow");
    
      const result = await bridgeERC20ToSPL({
        ethPrivateKey: fromPriv,
        ethVaultAddress: process.env.ETH_BRIDGE_VAULT!,
        solBridgePrivateKeyBase58: process.env.SOL_BRIDGE_PRIVATE_KEY_BASE58!,
        solToAddress: toWallet.address,
        amount: amt,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "ETH" && toChain === "TRX" && fromToken === "USDT" && toToken === "TRX") {
    
      const result = await bridgeERC20ToTRX({
        ethPrivateKey: fromPriv,
        ethVaultAddress: process.env.ETH_BRIDGE_VAULT!,
        tronBridgePrivateKey: process.env.TRX_BRIDGE_PRIVATE_KEY!,
        tronToAddress: toWallet.address,
        amountErc20: amt,
        amountTrx: toAmount,

      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    }  
    
    
    else if (fromChain === "TRX" && toChain === "SOL" && fromToken === "USDT") {
      const result = await bridgeTRC20ToSPL({
        tronPrivateKey: fromPriv,
        tronVault: process.env.TRON_USDT_VAULT!,
        solBridgePrivateKeyBase58: process.env.SOL_BRIDGE_PRIVATE_KEY_BASE58!,
        solToAddress: toWallet.address,
        amount: amt,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "TRX" && toChain === "ETH" && fromToken === "USDT") {
      const result = await bridgeTronUsdtToEthereum({
        tronPrivateKey: fromPriv,
        tronVault: process.env.TRON_USDT_VAULT!,
        ethBridgePrivateKey: process.env.ETH_BRIDGE_PRIVKEY!,
        ethToAddress: toWallet.address,
        amount: amt,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } 

    else if (fromChain === "SOL" && toChain === "TRX" && fromToken === "USDT" && toToken === "TRX") {
      
      const result = await bridgeSPLToTRX({
        solPrivateKey: fromPriv,
        solVault: process.env.SOL_BRIDGE_VAULT!,
        tronBridgePrivateKey: process.env.TRX_BRIDGE_PRIVATE_KEY!,
        tronToAddress: toWallet.address,
        amountSolUsdt: amt,
        amountTrx: toAmount, // simple 1:1 ratio or adjust conversion logic
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "SOL" && toChain === "ETH" && fromToken === "USDT" && toToken === "ETH") {
      
      const result = await bridgeSPLToETH({
        solPrivateKey: fromPriv,
        solVault: process.env.SOL_BRIDGE_VAULT!,
        ethBridgePrivateKey: process.env.ETH_BRIDGE_PRIVKEY!,
        ethToAddress: toWallet.address,
        amountSolUsdt: amt,
        amountEth: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "ETH" && toChain === "SOL" && fromToken === "USDT" && toToken === "SOL") {
      
      const result = await bridgeERC20ToSolana({
        ethPrivateKey: fromPriv,
        ethVaultAddress: process.env.ETH_BRIDGE_VAULT!,
        solBridgePrivateKeyBase58: process.env.SOL_BRIDGE_PRIVATE_KEY_BASE58!,
        solToAddress: toWallet.address,
        amountErc20: amt,
        amountSol: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "TRX" && toChain === "SOL" && fromToken === "TRX" && toToken === "USDT") {
      
      const result = await bridgeTRXToSPLUSDT({
        tronPrivateKey: fromPriv,
        tronVaultAddress: process.env.TRX_BRIDGE_VAULT!,
        solBridgePrivateKeyBase58: process.env.SOL_BRIDGE_PRIVATE_KEY_BASE58!,
        solToAddress: toWallet.address,
        amountTrx: amt,
        amountUsdt: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "TRX" && toChain === "ETH" && fromToken === "TRX" && toToken === "USDT") {
      
      const result = await bridgeTRXToERC20({
        tronPrivateKey: fromPriv,
        tronVaultAddress: process.env.TRX_BRIDGE_VAULT!,
        ethBridgePrivateKey: process.env.ETH_BRIDGE_PRIVKEY!,
        ethToAddress: toWallet.address,
        amountTrx: amt,
        amountErc20: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "SOL" && toChain === "TRX" && fromToken === "SOL" && toToken === "USDT") {
      
      const result = await bridgeSOLToTRC20({
        solPrivateKey: fromPriv,
        solVaultAddress: process.env.SOL_BRIDGE_VAULT!,
        tronBridgePrivateKey: process.env.TRX_BRIDGE_PRIVATE_KEY!,
        tronToAddress: toWallet.address,
        amountSol: amt,
        amountTrc20: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "SOL" && toChain === "ETH" && fromToken === "SOL" && toToken === "USDT") {
      
      const result = await bridgeSOLToERC20({
        solPrivateKey: fromPriv,
        solVaultAddress: process.env.SOL_BRIDGE_VAULT!,
        ethBridgePrivateKey: process.env.ETH_BRIDGE_PRIVKEY!,
        ethToAddress: toWallet.address,
        amountSol: amt,
        amountErc20: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "ETH" && toChain === "TRX" && fromToken === "ETH" && toToken === "USDT") {
      
      const result = await bridgeETHToTRC20({
        ethPrivateKey: fromPriv,
        ethVaultAddress: process.env.ETH_BRIDGE_VAULT!,
        tronBridgePrivateKey: process.env.TRX_BRIDGE_PRIVATE_KEY!,
        tronToAddress: toWallet.address,
        amountEth: amt,
        amountTrc20: toAmount,
      });
    
      if (result.status === "failed") throw new Error(result.error);
      fromTx = { txHash: result.fromTxHash || "" };
      toTx = { txHash: result.toTxHash || "" };
    } else if (fromChain === "ETH" && toChain === "SOL" && fromToken === "ETH" && toToken === "USDT") {
    
      const result = await bridgeETHToSPL({
        ethPrivateKey: fromPriv,
        ethVaultAddress: process.env.ETH_BRIDGE_VAULT!,
        solBridgePrivateKeyBase58: process.env.SOL_BRIDGE_PRIVATE_KEY_BASE58!,
        solToAddress: toWallet.address,
        amountEth: amt,
        amountUsdt: toAmount, // pre-converted in frontend or backend (e.g., using exchange rate)
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


