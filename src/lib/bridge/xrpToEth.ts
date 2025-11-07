// =============================================================
//  XRP → ETH Bridge
//  Locks native XRP (user → XRP vault)
//  Then sends native ETH from bridge vault → user
// =============================================================

import { Client, Wallet } from "xrpl";
import { ethers } from "ethers";

/* ===========================================================
   🔒 1️⃣ Lock XRP (User → Bridge Vault)
=========================================================== */
async function lockXrpToVault({
  userSeed,
  vaultAddress,
  amountXrp,
  memo,
}: {
  userSeed: string;
  vaultAddress: string;
  amountXrp: number;
  memo?: string;
}) {
  try {
    const isTest = process.env.CHAIN_ENV === "testnet";
    const rpcUrl = isTest
      ? process.env.XRP_API_TESTNET!
      : process.env.XRP_API_MAINNET!;
    const explorer = isTest
      ? process.env.XRP_EXPLORER_TESTNET!
      : process.env.XRP_EXPLORER_MAINNET!;

    const client = new Client(rpcUrl);
    await client.connect();

    const wallet = Wallet.fromSeed(userSeed);
    const fromAddr = wallet.address;

    console.log(`🔒 Locking ${amountXrp} XRP from ${fromAddr} → vault ${vaultAddress}`);

    const accountInfo = await client.request({
      command: "account_info",
      account: fromAddr,
    });

    const sequence = accountInfo.result.account_data.Sequence;
    const ledgerIndex = accountInfo.result.ledger_current_index ?? 0;

    const tx: any = {
      TransactionType: "Payment",
      Account: fromAddr,
      Destination: vaultAddress,
      Amount: (BigInt(Math.floor(amountXrp * 1_000_000))).toString(),
      Fee: "12",
      Sequence: sequence,
      LastLedgerSequence: ledgerIndex + 10,
    };

    if (memo) {
      tx.Memos = [
        { Memo: { MemoData: Buffer.from(memo, "utf8").toString("hex") } },
      ];
    }

    const signed = wallet.sign(tx);
    const submit = await client.submitAndWait(signed.tx_blob);
    await client.disconnect();

    const result = submit.result;
    const txHash = result.hash;
    const txResult =
      typeof result.meta === "object" && "TransactionResult" in result.meta
        ? (result.meta as any).TransactionResult
        : "UNKNOWN";

    if (txResult !== "tesSUCCESS") throw new Error(`Lock failed: ${txResult}`);

    console.log(`✅ Locked ${amountXrp} XRP | TX: ${explorer}/transactions/${txHash}`);
    return { txHash };
  } catch (err: any) {
    console.error("lockXrpToVault error:", err);
    throw new Error(err.message || "Failed to lock XRP");
  }
}

/* ===========================================================
   💸 2️⃣ Send native ETH (Bridge Vault → User)
=========================================================== */
async function sendEthFromBridge({
  bridgePrivateKey,
  toAddress,
  amountEth,
}: {
  bridgePrivateKey: string;
  toAddress: string;
  amountEth: number;
}) {
  try {
    const rpcUrl =
      process.env.CHAIN_ENV === "testnet"
        ? process.env.ETH_RPC_TESTNET!
        : process.env.ETH_RPC_MAINNET!;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(bridgePrivateKey, provider);

    const valueWei = ethers.parseEther(amountEth.toFixed(8));
    const balance = await provider.getBalance(wallet.address);
    if (balance < valueWei)
      throw new Error(
        `Bridge wallet insufficient ETH (${ethers.formatEther(balance)} ETH)`
      );

    console.log(`🚀 Sending ${amountEth} ETH from ${wallet.address} → ${toAddress}`);

    const tx = await wallet.sendTransaction({ to: toAddress, value: valueWei });
    const receipt = await tx.wait(1);
    if (!receipt) throw new Error("ETH send failed (no receipt)");

    console.log(`✅ Sent ETH | TX: ${receipt.hash}`);
    return { txHash: receipt.hash };
  } catch (err: any) {
    console.error("sendEthFromBridge error:", err);
    throw new Error(err.message || "Failed to send ETH");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge: XRP → ETH
=========================================================== */
export async function bridgeXrpToEth({
  xrpUserSeed,
  xrpVaultAddress,
  ethBridgePrivateKey,
  ethToAddress,
  amountXrp,
  amountEth,
}: {
  xrpUserSeed: string;
  xrpVaultAddress: string;
  ethBridgePrivateKey: string;
  ethToAddress: string;
  amountXrp: number;
  amountEth: number;
}) {
  try {
    console.log(`🔹 Starting XRP → ETH bridge for ${amountXrp} XRP`);

    // Step 1️⃣ Lock XRP
    const xrpTx = await lockXrpToVault({
      userSeed: xrpUserSeed,
      vaultAddress: xrpVaultAddress,
      amountXrp,
      memo: "Bridge XRP→ETH",
    });

    // Step 2️⃣ Send ETH
    const ethTx = await sendEthFromBridge({
      bridgePrivateKey: ethBridgePrivateKey,
      toAddress: ethToAddress,
      amountEth,
    });

    console.log("✅ Bridge XRP → ETH completed!");
    return {
      status: "completed",
      fromTxHash: xrpTx.txHash,
      toTxHash: ethTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeXrpToEth error:", err);
    return { status: "failed", error: err.message };
  }
}
