import { Client, Wallet } from "xrpl";
import TronWeb from "tronweb";

/* ===========================================================
   1️⃣ Lock XRP (User → Bridge Vault)
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
      ? "wss://s.altnet.rippletest.net:51233"
      : "wss://xrplcluster.com";
    const explorer = isTest
      ? "https://testnet.xrpl.org"
      : "https://xrpscan.com";

    const client = new Client(rpcUrl);
    await client.connect();

    const wallet = Wallet.fromSeed(userSeed);
    const fromAddress = wallet.address;

    const accInfo = await client.request({
      command: "account_info",
      account: fromAddress,
    });
    const sequence = accInfo.result.account_data.Sequence;
    const ledgerIndex = Number(accInfo.result.ledger_current_index ?? 0);

    const serverInfo = await client.request({ command: "server_info" });
    const baseFeeXrp =
      Number(serverInfo.result.info?.validated_ledger?.base_fee_xrp) || 0.00001;

    const drops = Math.floor(Number(amountXrp) * 1_000_000);
    if (!Number.isFinite(drops) || drops <= 0)
      throw new Error(`Invalid XRP amount: ${amountXrp}`);

    const tx: any = {
      TransactionType: "Payment",
      Account: fromAddress,
      Destination: vaultAddress,
      Amount: drops.toString(),
      Fee: Math.max(10, Math.floor(baseFeeXrp * 1_000_000)).toString(),
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

    const txHash = submit.result.hash;
    const meta = (submit.result.meta as any) || {};
    const txResult = meta.TransactionResult ?? "UNKNOWN";

    if (txResult !== "tesSUCCESS")
      throw new Error(`Lock XRP failed: ${txResult}`);

    console.log(
      `🔒 Locked ${amountXrp} XRP from ${fromAddress} → vault ${vaultAddress} (${explorer}/transactions/${txHash})`
    );
    return { txHash };
  } catch (err: any) {
    console.error("lockXrpToVault error:", err);
    throw new Error(err.message || "Failed to lock XRP");
  }
}

/* ===========================================================
   2️⃣ Send TRC-20 USDT from Bridge → User
=========================================================== */
async function sendTronUsdt({
  tronBridgePrivateKey,
  toAddress,
  amountUsdt,
}: {
  tronBridgePrivateKey: string;
  toAddress: string;
  amountUsdt: number;
}) {
  try {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_NILE_RPC!,
      headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
      privateKey: tronBridgePrivateKey,
    });

    const contract = await tronWeb.contract().at(process.env.TRON_TESTNET_USDT_CONTRACT!);
    const fromAddr = tronWeb.address.fromPrivateKey(tronBridgePrivateKey);

    const decimals = 6;
    const usdtAmount = Math.floor(amountUsdt * 10 ** decimals);

    console.log(
      `🚀 Sending ${amountUsdt} USDT (TRC-20) from ${fromAddr} → ${toAddress}`
    );

    const tx = await contract.transfer(toAddress, usdtAmount).send({
      feeLimit: 100_000_000,
    });

    console.log("✅ TRC-20 USDT sent TX:", tx);
    return { txHash: tx };
  } catch (err: any) {
    console.error("sendTronUsdt error:", err);
    throw new Error(err.message || "Failed to send TRC-20 USDT");
  }
}

/* ===========================================================
   3️⃣ Combined Bridge: XRP → TRC-20 USDT
=========================================================== */
export async function bridgeXrpToTrc20({
  xrpUserSeed,
  xrpVaultAddress,
  tronBridgePrivateKey,
  tronToAddress,
  amountXrp,
  amountUsdt,
}: {
  xrpUserSeed: string;
  xrpVaultAddress: string;
  tronBridgePrivateKey: string;
  tronToAddress: string;
  amountXrp: number;
  amountUsdt: number;
}) {
  try {
    console.log(`🔹 Starting XRP → TRC-20 bridge for ${amountXrp} XRP`);

    // Step 1️⃣ Lock XRP on XRP Ledger
    const xrpTx = await lockXrpToVault({
      userSeed: xrpUserSeed,
      vaultAddress: xrpVaultAddress,
      amountXrp,
      memo: "XRP→TRC20 Bridge Lock",
    });

    // Step 2️⃣ Send TRC-20 USDT to User
    const usdtTx = await sendTronUsdt({
      tronBridgePrivateKey,
      toAddress: tronToAddress,
      amountUsdt,
    });

    console.log("✅ Bridge XRP → TRC-20 completed!");
    return {
      status: "completed",
      fromTxHash: xrpTx.txHash,
      toTxHash: usdtTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeXrpToTrc20 error:", err);
    return { status: "failed", error: err.message };
  }
}
