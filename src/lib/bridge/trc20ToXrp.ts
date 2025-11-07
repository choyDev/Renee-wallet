import TronWeb from "tronweb";
import { Client, Wallet } from "xrpl";

/* ===========================================================
   1️⃣ Lock TRC-20 USDT (User → Tron Bridge Vault)
=========================================================== */
async function lockTronUsdt({
  tronPrivateKey,
  vaultAddress,
  amountUsdt,
}: {
  tronPrivateKey: string;
  vaultAddress: string;
  amountUsdt: number;
}) {
  try {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_NILE_RPC!,
      headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
      privateKey: tronPrivateKey,
    });

    const contract = await tronWeb.contract().at(process.env.TRON_TESTNET_USDT_CONTRACT!);
    const fromAddr = tronWeb.address.fromPrivateKey(tronPrivateKey);
    const decimals = 6;
    const usdtAmount = Math.floor(amountUsdt * 10 ** decimals);

    console.log(`🔒 Locking ${amountUsdt} USDT from ${fromAddr} → vault ${vaultAddress}`);

    const tx = await contract.transfer(vaultAddress, usdtAmount).send({
      feeLimit: 100_000_000,
    });

    console.log("✅ Locked USDT on Tron TX:", tx);
    return { txHash: tx };
  } catch (err: any) {
    console.error("lockTronUsdt error:", err);
    throw new Error(err.message || "Failed to lock TRC-20 USDT");
  }
}

/* ===========================================================
   2️⃣ Send XRP from Bridge Wallet → User
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

    const drops = Math.floor(Number(amountXrp) * 1_000_000);
    if (!Number.isFinite(drops) || drops <= 0)
      throw new Error(`Invalid XRP amount: ${amountXrp}`);

    const accInfo = await client.request({
      command: "account_info",
      account: fromAddress,
    });
    const sequence = accInfo.result.account_data.Sequence;
    const ledgerIndex = Number(accInfo.result.ledger_current_index ?? 0);

    const serverInfo = await client.request({ command: "server_info" });
    const baseFeeXrp =
      Number(serverInfo.result.info?.validated_ledger?.base_fee_xrp) || 0.00001;

    const feeDrops = Math.max(10, Math.floor(baseFeeXrp * 1_000_000));

    const tx: any = {
      TransactionType: "Payment",
      Account: fromAddress,
      Destination: toAddress,
      Amount: drops.toString(),
      Fee: feeDrops.toString(),
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
      throw new Error(`XRP send failed: ${txResult}`);

    console.log(`✅ Sent ${amountXrp} XRP → ${toAddress} (${explorer}/transactions/${txHash})`);
    return { txHash };
  } catch (err: any) {
    console.error("sendXrpFromBridge error:", err);
    throw new Error(err.message || "Failed to send XRP");
  }
}

/* ===========================================================
   3️⃣ Combined Bridge: TRC-20 USDT → XRP
=========================================================== */
export async function bridgeTrc20ToXrp({
  tronPrivateKey,
  tronVaultAddress,
  xrpBridgeSeed,
  xrpToAddress,
  amountUsdt,
  amountXrp,
}: {
  tronPrivateKey: string;
  tronVaultAddress: string;
  xrpBridgeSeed: string;
  xrpToAddress: string;
  amountUsdt: number;
  amountXrp: number;
}) {
  try {
    console.log(`🔹 Starting TRC-20 → XRP bridge for ${amountUsdt} USDT`);

    // Step 1️⃣ Lock USDT on Tron
    const tronTx = await lockTronUsdt({
      tronPrivateKey,
      vaultAddress: tronVaultAddress,
      amountUsdt,
    });

    // Step 2️⃣ Send XRP to user
    const xrpTx = await sendXrpFromBridge({
      bridgeSeed: xrpBridgeSeed,
      toAddress: xrpToAddress,
      amountXrp,
      memo: "TRC20 → XRP Bridge Transfer",
    });

    console.log("✅ Bridge TRC-20 → XRP completed!");
    return {
      status: "completed",
      fromTxHash: tronTx.txHash,
      toTxHash: xrpTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeTrc20ToXrp error:", err);
    return { status: "failed", error: err.message };
  }
}
