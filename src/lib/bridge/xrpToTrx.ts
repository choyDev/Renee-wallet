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
      Amount: drops.toString(), // must be integer string
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
   2️⃣ Mint TRX from Bridge Wallet → User
=========================================================== */
async function mintTrxToUser({
  bridgePrivateKey,
  toAddress,
  amountTrx,
}: {
  bridgePrivateKey: string;
  toAddress: string;
  amountTrx: number;
}) {
  try {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_NILE_RPC!,
      headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
      privateKey: bridgePrivateKey,
    });

    const fromAddr = tronWeb.address.fromPrivateKey(bridgePrivateKey);
    const sunAmount = Math.floor(Number(tronWeb.toSun(amountTrx)));

    console.log(`🪙 Minting ${amountTrx} TRX from ${fromAddr} → ${toAddress}`);

    const tx = await tronWeb.trx.sendTransaction(toAddress, sunAmount);
    if (!tx?.result) throw new Error(`TRX mint failed: ${JSON.stringify(tx)}`);

    console.log("✅ Minted TRX TX:", tx.txid);
    return { txHash: tx.txid };
  } catch (err: any) {
    console.error("mintTrxToUser error:", err);
    throw new Error(err.message || "Failed to mint TRX");
  }
}

/* ===========================================================
   3️⃣ Combined Bridge: XRP → TRX
=========================================================== */
export async function bridgeXrpToTrx({
  xrpUserSeed,
  xrpVaultAddress,
  tronBridgePrivateKey,
  trxToAddress,
  amountXrp,
  amountTrx,
}: {
  xrpUserSeed: string;
  xrpVaultAddress: string;
  tronBridgePrivateKey: string;
  trxToAddress: string;
  amountXrp: number;
  amountTrx: number;
}) {
  try {
    console.log(`🔹 Starting XRP → TRX bridge for ${amountXrp} XRP`);

    // Step 1️⃣ Lock XRP on XRP Ledger
    const xrpTx = await lockXrpToVault({
      userSeed: xrpUserSeed,
      vaultAddress: xrpVaultAddress,
      amountXrp,
      memo: "XRP→TRX Bridge Lock",
    });

    // Step 2️⃣ Mint TRX on Tron
    const trxTx = await mintTrxToUser({
      bridgePrivateKey: tronBridgePrivateKey,
      toAddress: trxToAddress,
      amountTrx,
    });

    console.log("✅ Bridge XRP → TRX completed!");
    return {
      status: "completed",
      fromTxHash: xrpTx.txHash,
      toTxHash: trxTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeXrpToTrx error:", err);
    return { status: "failed", error: err.message };
  }
}
