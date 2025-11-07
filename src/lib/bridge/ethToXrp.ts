// =============================================================
//  ETH → XRP Bridge
//  Locks native ETH (user → vault) and sends XRP (bridge → user)
//  Using proven XRP send logic from solToXrp.ts
// =============================================================

import { ethers } from "ethers";
import { Client, Wallet } from "xrpl";

/* ===========================================================
   🔒 1️⃣ Lock ETH on Ethereum (User → Bridge Vault)
=========================================================== */
async function lockEth({
  ethPrivateKey,
  vaultAddress,
  amountEth,
}: {
  ethPrivateKey: string;
  vaultAddress: string;
  amountEth: number;
}) {
  try {
    if (!ethers.isAddress(vaultAddress))
      throw new Error(`Invalid ETH vault address: ${vaultAddress}`);

    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
    const wallet = new ethers.Wallet(ethPrivateKey, provider);
    const value = ethers.parseEther(amountEth.toFixed(8));
    const balance = await provider.getBalance(wallet.address);

    if (balance < value)
      throw new Error(
        `Insufficient ETH balance (${ethers.formatEther(balance)} ETH)`
      );

    console.log(`🔒 Locking ${amountEth} ETH from ${wallet.address} → vault ${vaultAddress}`);

    const tx = await wallet.sendTransaction({ to: vaultAddress, value });
    const receipt = await tx.wait(1);
    if (!receipt) throw new Error("ETH lock failed (no receipt)");

    console.log("✅ Locked ETH TX:", receipt.hash);
    return { txHash: receipt.hash };
  } catch (err: any) {
    console.error("lockEth error:", err);
    throw new Error(err.message || "Failed to lock ETH");
  }
}

/* ===========================================================
   💸 2️⃣ Send XRP from Bridge Vault → User
   (Reused directly from your working solToXrp implementation)
=========================================================== */
async function sendXrpFromBridge({
  bridgeSeed,
  toAddress,
  amountXrp,
  memo,
}: {
  bridgeSeed: string;
  toAddress: string;
  amountXrp: number;
  memo?: string;
}) {
  try {
    const isTest = process.env.CHAIN_ENV === "testnet";
    const rpcUrl = isTest
      ? "wss://s.altnet.rippletest.net:51233"
      : "wss://xrplcluster.com";
    const explorer = isTest
      ? "https://testnet.xrpl.org"
      : "https://xrpscan.com";

    const client = new Client(rpcUrl);
    await client.connect();

    const wallet = Wallet.fromSeed(bridgeSeed);
    const fromAddress = wallet.address;

    const accountInfo = await client.request({
      command: "account_info",
      account: fromAddress,
    });

    const sequence = accountInfo.result.account_data.Sequence;
    const ledgerIndex = accountInfo.result.ledger_current_index ?? 0;

    const tx: any = {
      TransactionType: "Payment",
      Account: fromAddress,
      Destination: toAddress,
      Amount: (BigInt(Math.floor(amountXrp * 1_000_000))).toString(),
      Fee: "12",
      Sequence: sequence,
      LastLedgerSequence: ledgerIndex + 10,
    };

    if (memo) {
      tx.Memos = [
        {
          Memo: { MemoData: Buffer.from(memo, "utf8").toString("hex") },
        },
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

    if (txResult !== "tesSUCCESS")
      throw new Error(`XRP send failed: ${txResult}`);

    console.log(
      `✅ Sent ${amountXrp} XRP to ${toAddress} | TX: ${explorer}/transactions/${txHash}`
    );
    return { txHash };
  } catch (err: any) {
    console.error("sendXrpFromBridge error:", err);
    throw new Error(err.message || "Failed to send XRP");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge: ETH → XRP
=========================================================== */
export async function bridgeEthToXrp({
  ethPrivateKey,
  ethVaultAddress,
  xrpBridgeSeed,
  xrpToAddress,
  amountEth,
  amountXrp,
}: {
  ethPrivateKey: string;
  ethVaultAddress: string;
  xrpBridgeSeed: string;
  xrpToAddress: string;
  amountEth: number;
  amountXrp: number;
}) {
  try {
    console.log(`🔹 Starting ETH → XRP bridge for ${amountEth} ETH`);

    // Step 1️⃣ Lock ETH on Ethereum
    const ethTx = await lockEth({
      ethPrivateKey,
      vaultAddress: ethVaultAddress,
      amountEth,
    });

    // Step 2️⃣ Send XRP on XRPL
    const xrpTx = await sendXrpFromBridge({
      bridgeSeed: xrpBridgeSeed,
      toAddress: xrpToAddress,
      amountXrp,
      memo: `Bridge ETH→XRP ${ethTx.txHash}`,
    });

    console.log("✅ Bridge ETH → XRP completed!");
    return {
      status: "completed",
      fromTxHash: ethTx.txHash,
      toTxHash: xrpTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeEthToXrp error:", err);
    return { status: "failed", error: err.message };
  }
}
