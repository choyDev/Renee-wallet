import TronWeb from "tronweb";
import { Client, Wallet } from "xrpl";

/* ===========================================================
   🔹 1️⃣ Lock native TRX (User → Tron Bridge Vault)
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
  try {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_NILE_RPC!,
      headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
      privateKey: tronPrivateKey,
    });

    const fromAddr = tronWeb.address.fromPrivateKey(tronPrivateKey);
    const sunAmount = Math.floor(Number(tronWeb.toSun(amountTrx)));

    console.log(`🔒 Locking ${amountTrx} TRX from ${fromAddr} → vault ${vaultAddress}`);

    const tx = await tronWeb.trx.sendTransaction(vaultAddress, sunAmount);
    if (!tx?.result) throw new Error(`TRX lock failed: ${JSON.stringify(tx)}`);

    console.log("✅ Locked TRX TX:", tx.txid);
    return { txHash: tx.txid };
  } catch (err: any) {
    console.error("lockTrx error:", err);
    throw new Error(err.message || "Failed to lock TRX");
  }
}

/* ===========================================================
   🔹 2️⃣ Send XRP from Bridge Wallet → User
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

    // ✅ Convert to integer drops safely
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

    const feeDrops = Math.max(10, Math.floor(baseFeeXrp * 1_000_000)); // ensure minimum fee

    const tx: any = {
      TransactionType: "Payment",
      Account: fromAddress,
      Destination: toAddress,
      Amount: drops.toString(), // ✅ integer drops only
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

    console.log(
      `✅ Sent ${amountXrp} XRP → ${toAddress} (${explorer}/transactions/${txHash})`
    );
    return { txHash };
  } catch (err: any) {
    console.error("sendXrpFromBridge error:", err);
    throw new Error(err.message || "Failed to send XRP");
  }
}

/* ===========================================================
   🔹 3️⃣ Combined Bridge: TRX → XRP
=========================================================== */
export async function bridgeTrxToXrp({
  tronPrivateKey,
  tronVaultAddress,
  xrpBridgeSeed,
  xrpToAddress,
  amountTrx,
  amountXrp,
}: {
  tronPrivateKey: string;
  tronVaultAddress: string;
  xrpBridgeSeed: string;
  xrpToAddress: string;
  amountTrx: number;
  amountXrp: number;
}) {
  try {
    console.log(`🔹 Starting TRX → XRP bridge for ${amountTrx} TRX`);

    // Step 1️⃣ Lock TRX on Tron
    const trxTx = await lockTrx({
      tronPrivateKey,
      vaultAddress: tronVaultAddress,
      amountTrx,
    });

    // Step 2️⃣ Send XRP to user
    const xrpTx = await sendXrpFromBridge({
      bridgeSeed: xrpBridgeSeed,
      toAddress: xrpToAddress,
      amountXrp,
      memo: "TRX→XRP Bridge Transfer",
    });

    console.log("✅ Bridge TRX → XRP completed!");
    return {
      status: "completed",
      fromTxHash: trxTx.txHash,
      toTxHash: xrpTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeTrxToXrp error:", err);
    return { status: "failed", error: err.message };
  }
}
