import TronWeb from "tronweb";
import { ethers } from "ethers";

/* ===========================================================
   🔹 1️⃣ Lock native TRX on Tron (User → Vault)
   =========================================================== */
async function lockTrx({
  tronPrivateKey,
  vaultAddress,
  amountTrx,
}: {
  tronPrivateKey: string;
  vaultAddress: string;
  amountTrx: number;
}) {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: tronPrivateKey,
  });

  const fromAddr = tronWeb.address.fromPrivateKey(tronPrivateKey);
  const sunAmount = Math.floor(Number(tronWeb.toSun(amountTrx)));

  console.log(`🔒 Locking ${amountTrx} TRX from ${fromAddr} → ${vaultAddress}`);

  const tx = await tronWeb.trx.sendTransaction(vaultAddress, sunAmount);
  if (!tx?.result) throw new Error(`TRX lock failed: ${JSON.stringify(tx)}`);

  console.log("✅ Locked TRX TX:", tx.txid);
  return { txHash: tx.txid };
}

/* ===========================================================
   🔹 2️⃣ Send ERC20-USDT on Ethereum (Bridge → User)
   =========================================================== */
async function sendEthereumUsdt({
  bridgePrivateKey,
  ethToAddress,
  amountErc20,
}: {
  bridgePrivateKey: string;
  ethToAddress: string;
  amountErc20: number;
}) {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
  const bridgeWallet = new ethers.Wallet(bridgePrivateKey, provider);

  const usdtContract = new ethers.Contract(
    process.env.USDT_CONTRACT_ETH!,
    [
      "function transfer(address to,uint256 amount) public returns(bool)",
      "function balanceOf(address) view returns(uint256)",
    ],
    bridgeWallet
  );

  const decimals = 6;
  const usdtAmount = BigInt(Math.floor(amountErc20 * 10 ** decimals));

  const balance = await usdtContract.balanceOf(await bridgeWallet.getAddress());
  console.log(`Bridge wallet ERC-20 USDT balance: ${Number(balance) / 1e6}`);

  if (balance < usdtAmount)
    throw new Error("Bridge wallet does not have enough ERC-20 USDT");

  const gasEstimate = await usdtContract.transfer.estimateGas(
    ethToAddress,
    usdtAmount
  );

  console.log(
    `🚀 Sending ${amountErc20} ERC-20 USDT to ${ethToAddress} (gas ~${gasEstimate})`
  );

  const tx = await usdtContract.transfer(ethToAddress, usdtAmount, {
    gasLimit: gasEstimate + BigInt(20000),
  });
  const receipt = await tx.wait();

  console.log("✅ Sent ERC-20 USDT TX:", receipt.hash);
  return { txHash: receipt.hash };
}

/* ===========================================================
   🔹 3️⃣ Combined Bridge: TRX → ERC20-USDT
   =========================================================== */
export async function bridgeTRXToERC20({
  tronPrivateKey,
  tronVaultAddress,
  ethBridgePrivateKey,
  ethToAddress,
  amountTrx,
  amountErc20,
}: {
  tronPrivateKey: string;
  tronVaultAddress: string;
  ethBridgePrivateKey: string;
  ethToAddress: string;
  amountTrx: number;
  amountErc20: number; // 1 TRX = ? USDT
}) {
  try {
    console.log(`🔹 Starting TRX → ERC20-USDT bridge for ${amountTrx} TRX`);

    // 1️⃣ Lock native TRX on Tron
    const tronTx = await lockTrx({
      tronPrivateKey,
      vaultAddress: tronVaultAddress,
      amountTrx,
    });

    // 2️⃣ Compute equivalent USDT
    
    // 3️⃣ Send ERC-20 USDT on Ethereum
    const ethTx = await sendEthereumUsdt({
      bridgePrivateKey: ethBridgePrivateKey,
      ethToAddress,
      amountErc20,
    });

    console.log("✅ Bridge TRX → ERC20-USDT completed!");
    return {
      status: "completed",
      fromTxHash: tronTx.txHash,
      toTxHash: ethTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeTRXToERC20 error:", err);
    return { status: "failed", error: err.message };
  }
}
