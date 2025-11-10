// =============================================================
//  ERC-20 → XRP Bridge
//  Locks ERC-20 USDT (user → ETH vault)
//  Then sends native XRP from bridge vault → user
// =============================================================

import { ethers } from "ethers";
import { Client, Wallet } from "xrpl";

/* ===========================================================
   🔒 1️⃣ Lock ERC-20 USDT (User → Bridge Vault)
=========================================================== */
export async function lockERC20ForXrp({
  ethPrivateKey,
  ethVaultAddress,
  amountErc20,
}: {
  ethPrivateKey: string;
  ethVaultAddress: string;
  amountErc20: number;
}) {
  try {
    const rpcUrl =
      process.env.CHAIN_ENV === "testnet"
        ? process.env.ETH_RPC_TESTNET!
        : process.env.ETH_RPC_MAINNET!;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const userWallet = new ethers.Wallet(ethPrivateKey, provider);

    const usdtContract = new ethers.Contract(
      process.env.USDT_CONTRACT_ETH!,
      [
        "function transfer(address to,uint256 amount) public returns(bool)",
        "function balanceOf(address) view returns(uint256)",
        "function decimals() view returns(uint8)",
      ],
      userWallet
    );

    const decimals = await usdtContract.decimals();
    const usdtAmount = BigInt(Math.round(amountErc20 * Number(`1e${decimals}`)));

    const balance: bigint = await usdtContract.balanceOf(userWallet.address);
    console.log(`🔹 User ERC-20 USDT balance: ${Number(balance) / 1e6}`);

    if (balance < usdtAmount)
      throw new Error("Insufficient ERC-20 USDT balance to lock");

    console.log(
      `🔒 Locking ${amountErc20} USDT (ERC-20) from ${userWallet.address} → ${ethVaultAddress}`
    );

    const gasEstimate = await usdtContract.transfer.estimateGas(
      ethVaultAddress,
      usdtAmount
    );

    const tx = await usdtContract.transfer(ethVaultAddress, usdtAmount, {
      gasLimit: gasEstimate + BigInt(20000),
    });
    const receipt = await tx.wait(1);

    console.log(`✅ Locked ERC-20 USDT TX: ${receipt.hash}`);
    return { txHash: receipt.hash };
  } catch (err: any) {
    console.error("lockERC20ForXrp error:", err);
    throw new Error(err.message || "Failed to lock ERC20 token");
  }
}

/* ===========================================================
   💸 2️⃣ Send XRP (Bridge Vault → User)
=========================================================== */
export async function sendXrpFromBridge({
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
      ? process.env.XRP_API_TESTNET!
      : process.env.XRP_API_MAINNET!;
    const explorer = isTest
      ? process.env.XRP_EXPLORER_TESTNET!
      : process.env.XRP_EXPLORER_MAINNET!;

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
   🔄 3️⃣ Combined Bridge Flow: ERC-20 → XRP
=========================================================== */
export async function bridgeERC20ToXrp({
  ethPrivateKey,
  ethVaultAddress,
  xrpBridgeSeed,
  xrpToAddress,
  amountErc20,
  amountXrp,
}: {
  ethPrivateKey: string;
  ethVaultAddress: string;
  xrpBridgeSeed: string;
  xrpToAddress: string;
  amountErc20: number;
  amountXrp: number;
}) {
  try {
    console.log(`🔹 Starting ERC-20 → XRP bridge for ${amountErc20} USDT`);

    // Step 1️⃣ Lock ERC-20 token
    const ercTx = await lockERC20ForXrp({
      ethPrivateKey,
      ethVaultAddress,
      amountErc20,
    });

    // Step 2️⃣ Send XRP from bridge wallet
    const xrpTx = await sendXrpFromBridge({
      bridgeSeed: xrpBridgeSeed,
      toAddress: xrpToAddress,
      amountXrp,
      memo: `Bridge ERC20→XRP ${ercTx.txHash}`,
    });

    console.log("✅ Bridge ERC-20 → XRP completed!");
    return {
      status: "completed",
      fromTxHash: ercTx.txHash,
      toTxHash: xrpTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeERC20ToXrp error:", err);
    return { status: "failed", error: err.message };
  }
}
