import { ethers } from "ethers";
import TronWeb from "tronweb";

/* ===========================================================
   🔹 1️⃣ Lock native ETH (User → Bridge Vault)
   =========================================================== */
async function lockNativeEth({
  ethPrivateKey,
  vaultAddress,
  amountEth,
}: {
  ethPrivateKey: string;
  vaultAddress: string;
  amountEth: number;
}) {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
  const wallet = new ethers.Wallet(ethPrivateKey, provider);

  const weiAmount = ethers.parseEther(amountEth.toString());
  const balance = await provider.getBalance(wallet.address);

  if (balance < weiAmount)
    throw new Error(
      `Insufficient ETH balance (${ethers.formatEther(balance)} ETH)`
    );

  console.log(
    `🔒 Locking ${amountEth} ETH from ${wallet.address} → vault ${vaultAddress}`
  );

  const tx = await wallet.sendTransaction({
    to: vaultAddress,
    value: weiAmount,
  });

  const receipt = await tx.wait();
  console.log("✅ Locked native ETH TX:", receipt!.hash);
  return { txHash: receipt!.hash };
}

/* ===========================================================
   🔹 2️⃣ Send TRC20-USDT (Bridge → User)
   =========================================================== */
async function sendTronUsdt({
  tronBridgePrivateKey,
  tronToAddress,
  amountTrc20,
}: {
  tronBridgePrivateKey: string;
  tronToAddress: string;
  amountTrc20: number;
}) {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: tronBridgePrivateKey,
  });

  const fromAddr = tronWeb.address.fromPrivateKey(tronBridgePrivateKey);
  const contract = await tronWeb.contract().at(process.env.TRON_TESTNET_USDT_CONTRACT!);

  console.log(
    `🚀 Sending ${amountTrc20} USDT (TRC-20) from ${fromAddr} → ${tronToAddress}`
  );

  const sunAmount = Math.floor(Number(tronWeb.toSun(amountTrc20)));

  const tx = await contract.transfer(tronToAddress, sunAmount).send();
  console.log("✅ Sent TRC-20 USDT TX:", tx);
  return { txHash: tx };
}

/* ===========================================================
   🔹 3️⃣ Combined Bridge: ETH → TRC20 USDT
   =========================================================== */
export async function bridgeETHToTRC20({
  ethPrivateKey,
  ethVaultAddress,
  tronBridgePrivateKey,
  tronToAddress,
  amountEth,
  amountTrc20,
}: {
  ethPrivateKey: string;
  ethVaultAddress: string;
  tronBridgePrivateKey: string;
  tronToAddress: string;
  amountEth: number;
  amountTrc20: number; // 1 ETH = ? USDT
}) {
  try {
    console.log(`🔹 Starting native ETH → TRC20 USDT bridge for ${amountEth} ETH`);

    // 1️⃣ Lock ETH on Ethereum
    const ethTx = await lockNativeEth({
      ethPrivateKey,
      vaultAddress: ethVaultAddress,
      amountEth,
    });

    
    // 3️⃣ Send USDT on Tron
    const tronTx = await sendTronUsdt({
      tronBridgePrivateKey,
      tronToAddress,
      amountTrc20,
    });

    console.log("✅ Bridge ETH → TRC20 completed!");
    return {
      status: "completed",
      fromTxHash: ethTx.txHash,
      toTxHash: tronTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeETHToTRC20 error:", err);
    return { status: "failed", error: err.message };
  }
}
