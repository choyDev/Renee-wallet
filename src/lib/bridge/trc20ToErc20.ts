import TronWeb from "tronweb";
import { ethers } from "ethers";

/* ------------------ 1️⃣ Lock TRC-20 USDT on Tron ------------------ */
export async function lockTronUsdt({
  tronPrivateKey,
  vaultAddress,
  amount,
}: {
  tronPrivateKey: string;
  vaultAddress: string;
  amount: number;
}) {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    privateKey: tronPrivateKey,
  });

  const contract = await tronWeb.contract().at(process.env.TRON_TESTNET_USDT_CONTRACT!);
  const usdtAmount = Math.floor(amount * 1e6);

  console.log(`🔒 Locking ${amount} USDT (TRC-20) → ${vaultAddress}`);
  const tx = await contract.transfer(vaultAddress, usdtAmount).send({ feeLimit: 100_000_000 });
  console.log("✅ Locked TRC-20 USDT TX:", tx);
  return { txHash: tx };
}

/* ------------------ 2️⃣ Mint / Send ERC-20 USDT on Ethereum ------------------ */
export async function sendEthereumUsdt({
  bridgePrivateKey,
  ethToAddress,
  amount,
}: {
  bridgePrivateKey: string;
  ethToAddress: string;
  amount: number;
}) {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
  const bridgeWallet = new ethers.Wallet(bridgePrivateKey, provider);
  const usdtContract = new ethers.Contract(
    process.env.USDT_CONTRACT_ETH!,
    ["function transfer(address to,uint256 amount) public returns(bool)"],
    bridgeWallet
  );

  const usdtAmount = ethers.parseUnits(amount.toString(), 6);

  const gasEstimate = await usdtContract.transfer.estimateGas(ethToAddress, usdtAmount);
  console.log(`💸 Sending ${amount} USDT (ERC-20) to ${ethToAddress}`);
  const tx = await usdtContract.transfer(ethToAddress, usdtAmount, { gasLimit: gasEstimate + BigInt(20000) });
  const receipt = await tx.wait();

  console.log("✅ Sent ERC-20 USDT TX:", receipt.hash);
  return { txHash: receipt.hash };
}

/* ------------------ 3️⃣ Combined Bridge Flow ------------------ */
export async function bridgeTRC20ToERC20({
  tronPrivateKey,
  tronVault,
  bridgePrivateKey,
  ethToAddress,
  amount,
}: {
  tronPrivateKey: string;
  tronVault: string;
  bridgePrivateKey: string;
  ethToAddress: string;
  amount: number;
}) {
  try {
    // 1️⃣ Lock USDT on Tron
    const tronTx = await lockTronUsdt({ tronPrivateKey, vaultAddress: tronVault, amount });

    // 2️⃣ Send USDT on Ethereum
    const ethTx = await sendEthereumUsdt({ bridgePrivateKey, ethToAddress, amount });

    console.log("✅ Bridge TRC-20 USDT → ERC-20 USDT completed!");
    return { status: "completed", fromTxHash: tronTx.txHash, toTxHash: ethTx.txHash };
  } catch (err: any) {
    console.error("bridgeTronUsdtToEthereum error:", err);
    return { status: "failed", error: err.message };
  }
}
