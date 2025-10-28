import { ethers } from "ethers";
import TronWeb from "tronweb";

/* ===========================================================
   🔹 1️⃣ Lock ERC20-USDT on Ethereum (User → Bridge Vault)
   =========================================================== */
async function lockEthereumUsdt({
  ethPrivateKey,
  vaultAddress,
  amountErc20,
}: {
  ethPrivateKey: string;
  vaultAddress: string;
  amountErc20: number;
}) {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
  const wallet = new ethers.Wallet(ethPrivateKey, provider);

  const usdtContract = new ethers.Contract(
    process.env.USDT_CONTRACT_ETH!,
    [
      "function transfer(address to,uint256 amount) public returns(bool)",
      "function balanceOf(address) view returns(uint256)",
    ],
    wallet
  );

  const decimals = 6;
  const usdtAmount = BigInt(Math.floor(amountErc20 * 10 ** decimals));

  const balance = await usdtContract.balanceOf(wallet.address);
  if (balance < usdtAmount)
    throw new Error(
      `Insufficient ERC20 USDT balance: ${Number(balance) / 1e6}`
    );

  console.log(
    `🔒 Locking ${amountErc20} ERC20-USDT from ${wallet.address} → vault ${vaultAddress}`
  );

  const gasEstimate = await usdtContract.transfer.estimateGas(
    vaultAddress,
    usdtAmount
  );
  const tx = await usdtContract.transfer(vaultAddress, usdtAmount, {
    gasLimit: gasEstimate + BigInt(20000),
  });

  const receipt = await tx.wait();
  console.log("✅ Locked ERC20-USDT TX:", receipt.hash);
  return { txHash: receipt.hash };
}

/* ===========================================================
   🔹 2️⃣ Send TRX natively (Bridge → User)
   =========================================================== */
async function sendTrx({
  tronBridgePrivateKey,
  tronToAddress,
  amountTrx,
}: {
  tronBridgePrivateKey: string;
  tronToAddress: string;
  amountTrx: number;
}) {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: tronBridgePrivateKey,
  });

  const fromAddr = tronWeb.address.fromPrivateKey(tronBridgePrivateKey);
  console.log(
    `🚀 Sending ${amountTrx} TRX from ${fromAddr} → ${tronToAddress}`
  );

  // Convert TRX → SUN
  const sunAmount = Math.floor(Number(tronWeb.toSun(amountTrx)));

  const tx = await tronWeb.trx.sendTransaction(tronToAddress, sunAmount);
  if (!tx?.result) throw new Error(`TRX transfer failed: ${JSON.stringify(tx)}`);

  console.log("✅ TRX sent successfully:", tx.txid);
  return { txHash: tx.txid };
}

/* ===========================================================
   🔹 3️⃣ Combined Bridge: ERC20 → TRX
   =========================================================== */
export async function bridgeERC20ToTRX({
  ethPrivateKey,
  ethVaultAddress,
  tronBridgePrivateKey,
  tronToAddress,
  amountErc20,
  amountTrx,
}: {
  ethPrivateKey: string;
  ethVaultAddress: string;
  tronBridgePrivateKey: string;
  tronToAddress: string;
  amountErc20: number;
  amountTrx: number;
}) {
  try {
    console.log(`🔹 Starting ERC20 → TRX bridge for ${amountErc20} USDT`);

    // 1️⃣ Lock ERC20 on Ethereum
    const ethTx = await lockEthereumUsdt({
      ethPrivateKey,
      vaultAddress: ethVaultAddress,
      amountErc20,
    });

    // 2️⃣ Send TRX to user
    const trxTx = await sendTrx({
      tronBridgePrivateKey,
      tronToAddress,
      amountTrx: amountTrx, // you can later apply exchange rate logic
    });

    console.log("✅ Bridge ERC20→TRX completed!");
    return {
      status: "completed",
      fromTxHash: ethTx.txHash,
      toTxHash: trxTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeEthereumToTron error:", err);
    return { status: "failed", error: err.message };
  }
}
