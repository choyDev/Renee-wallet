import TronWeb from "tronweb";
import { ethers } from "ethers";

/* ==============================
   1️⃣ Lock TRC-20 USDT on Tron
============================== */
async function lockTronUsdt({
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

  const fromAddr = tronWeb.address.fromPrivateKey(tronPrivateKey);
  const contractAddr = process.env.TRON_TESTNET_USDT_CONTRACT!;
  const decimals = Number(process.env.TRC20_USDT_DECIMALS || 6);
  const usdtAmount = Math.floor(amount * 10 ** decimals);

  console.log(`🔒 Locking ${amount} USDT from ${fromAddr} → ${vaultAddress}`);

  const code = await tronWeb.trx.getContract(contractAddr);
  if (!code || !code.bytecode) {
    throw new Error(`Invalid TRC20 contract: ${contractAddr}`);
  }

  const contract = await tronWeb.contract().at(contractAddr);
  const tx = await contract.transfer(vaultAddress, usdtAmount).send({feeLimit: 100_000_000,});

  console.log("✅ Locked USDT on Tron TX:", tx);
  return { txHash: tx };
}

/* ==============================
   2️⃣ Send Native ETH on Ethereum
============================== */
async function sendNativeEth({
  bridgePrivateKey,
  ethToAddress,
  amountEth,
}: {
  bridgePrivateKey: string;
  ethToAddress: string;
  amountEth: number;
}) {
  const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC!);
  const bridgeWallet = new ethers.Wallet(bridgePrivateKey, provider);

  const tx = await bridgeWallet.sendTransaction({
    to: ethToAddress,
    value: ethers.parseEther(amountEth.toString()),
  });

  console.log(`✅ Sent ${amountEth} ETH to ${ethToAddress} — Tx: ${tx.hash}`);
  await tx.wait();
  return { txHash: tx.hash };
}

/* ==============================
   3️⃣ Combined TRC-20 USDT → ETH Bridge
============================== */
export async function bridgeTronUsdtToEthereum({
  tronPrivateKey,
  tronVault,
  ethBridgePrivateKey,
  ethToAddress,
  amount,
}: {
  tronPrivateKey: string;
  tronVault: string;
  ethBridgePrivateKey: string;
  ethToAddress: string;
  amount: number;
}) {
  try {
    // Step 1 — Lock USDT on Tron
    const tronTx = await lockTronUsdt({
      tronPrivateKey,
      vaultAddress: tronVault,
      amount,
    });

    // Step 2 — Send ETH to user
    const conversionRate = 0.00025; // example: 1 USDT = 0.00025 ETH (≈ $4 K ETH)
    const ethAmount = amount * conversionRate;

    const ethTx = await sendNativeEth({
      bridgePrivateKey: ethBridgePrivateKey,
      ethToAddress,
      amountEth: ethAmount,
    });

    console.log("✅ Bridge TRC-20 USDT → ETH completed!");
    return {
      status: "completed",
      fromTxHash: tronTx.txHash,
      toTxHash: ethTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeTronUsdtToEthereum error:", err);
    return { status: "failed", error: err.message };
  }
}
