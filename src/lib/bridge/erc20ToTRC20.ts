import { ethers } from "ethers";
import TronWeb from "tronweb";

/* ===========================================================
   🔹 1️⃣ Lock ERC20 USDT on Ethereum (user → bridge vault)
   =========================================================== */
async function lockEthereumUsdt({
  ethPrivateKey,
  vaultAddress,
  amount,
}: {
  ethPrivateKey: string;
  vaultAddress: string;
  amount: number;
}) {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
  const wallet = new ethers.Wallet(ethPrivateKey, provider);

  const usdtContract = new ethers.Contract(
    process.env.USDT_CONTRACT_ETH!,
    ["function transfer(address to,uint256 amount) public returns(bool)", "function balanceOf(address) view returns(uint256)"],
    wallet
  );

  const decimals = 6;
  const usdtAmount = BigInt(Math.floor(amount * 10 ** decimals));

  // Check user balance
  const balance = await usdtContract.balanceOf(wallet.address);
  if (balance < usdtAmount)
    throw new Error(`Insufficient USDT balance: ${Number(balance) / 1e6}`);

  console.log(
    `🔒 Locking ${amount} ERC20 USDT from ${wallet.address} → vault ${vaultAddress}`
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
   🔹 2️⃣ Mint (Send) TRC20 USDT on Tron (bridge vault → user)
   =========================================================== */
async function mintTronUsdt({
  tronPrivateKey,
  toAddress,
  amount,
}: {
  tronPrivateKey: string;
  toAddress: string;
  amount: number;
}) {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
    privateKey: tronPrivateKey,
  });

  const fromAddr = tronWeb.address.fromPrivateKey(tronPrivateKey);
  const contract = await tronWeb.contract().at(process.env.TRON_TESTNET_USDT_CONTRACT!);

  console.log(`🪙 Sending ${amount} TRC20 USDT from bridge ${fromAddr} → ${toAddress}`);

  const tx = await contract.transfer(toAddress, tronWeb.toSun(amount)).send();
  console.log("✅ TRC20-USDT TX:", tx);
  return { txHash: tx };
}

/* ===========================================================
   🔹 3️⃣ Combined Bridge Flow: ERC20 → TRC20
   =========================================================== */
export async function bridgeERC20ToTRC20({
  ethPrivateKey,
  ethVaultAddress,
  tronBridgePrivateKey,
  tronToAddress,
  amount,
}: {
  ethPrivateKey: string;
  ethVaultAddress: string;
  tronBridgePrivateKey: string;
  tronToAddress: string;
  amount: number;
}) {
  try {
    console.log(`🔹 Starting ERC20 → TRC20 USDT bridge for ${amount} USDT`);

    // 1️⃣ Lock ERC20-USDT on Ethereum
    const ethTx = await lockEthereumUsdt({
      ethPrivateKey,
      vaultAddress: ethVaultAddress,
      amount,
    });

    // 2️⃣ Mint (send) TRC20-USDT on Tron
    const tronTx = await mintTronUsdt({
      tronPrivateKey: tronBridgePrivateKey,
      toAddress: tronToAddress,
      amount,
    });

    console.log("✅ Bridge ERC20→TRC20 completed!");
    return {
      status: "completed",
      fromTxHash: ethTx.txHash,
      toTxHash: tronTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeERC20ToTRC20 error:", err);
    return { status: "failed", error: err.message };
  }
}
