// =============================================================
//  XRP → ERC-20 Bridge
//  Locks native XRP (user → vault)
//  Then sends ERC-20 USDT from bridge wallet → user
// =============================================================

import { Client, Wallet } from "xrpl";
import { ethers } from "ethers";

/* ===========================================================
   🔒 1️⃣ Lock XRP (User → Bridge Vault)
=========================================================== */
export async function lockXrpForERC20({
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
    const fromAddress = wallet.address;

    console.log(`🔒 Locking ${amountXrp} XRP from ${fromAddress} → ${vaultAddress}`);

    const accountInfo = await client.request({
      command: "account_info",
      account: fromAddress,
    });

    const sequence = accountInfo.result.account_data.Sequence;
    const ledgerIndex = accountInfo.result.ledger_current_index ?? 0;

    const tx: any = {
      TransactionType: "Payment",
      Account: fromAddress,
      Destination: vaultAddress,
      Amount: (BigInt(Math.floor(amountXrp * 1_000_000))).toString(), // drops
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
    console.error("lockXrpForERC20 error:", err);
    throw new Error(err.message || "Failed to lock XRP");
  }
}

/* ===========================================================
   🪙 2️⃣ Send ERC-20 USDT (Bridge → User)
=========================================================== */
export async function sendERC20Usdt({
  bridgePrivateKey,
  userEthAddress,
  amountErc20,
}: {
  bridgePrivateKey: string;
  userEthAddress: string;
  amountErc20: number;
}) {
  try {
    const rpcUrl =
      process.env.CHAIN_ENV === "testnet"
        ? process.env.ETH_RPC_TESTNET!
        : process.env.ETH_RPC_MAINNET!;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const bridgeWallet = new ethers.Wallet(bridgePrivateKey, provider);

    const usdtContract = new ethers.Contract(
      process.env.USDT_CONTRACT_ETH!,
      [
        "function transfer(address to,uint256 amount) public returns(bool)",
        "function balanceOf(address) view returns(uint256)",
        "function decimals() view returns(uint8)",
      ],
      bridgeWallet
    );

    const decimals = await usdtContract.decimals();
    const usdtAmount = BigInt(Math.round(amountErc20 * Number(`1e${decimals}`)));

    const balance: bigint = await usdtContract.balanceOf(
      await bridgeWallet.getAddress()
    );
    console.log(`Bridge wallet USDT balance: ${Number(balance) / 1e6}`);

    if (balance < usdtAmount)
      throw new Error("Bridge wallet lacks enough USDT balance");

    const gasEstimate = await usdtContract.transfer.estimateGas(
      userEthAddress,
      usdtAmount
    );

    console.log(`🚀 Sending ${amountErc20} USDT to ${userEthAddress}`);
    const tx = await usdtContract.transfer(userEthAddress, usdtAmount, {
      gasLimit: gasEstimate + BigInt(20000),
    });
    const receipt = await tx.wait();

    console.log("✅ Sent ERC-20 USDT TX:", receipt.hash);
    return { txHash: receipt.hash };
  } catch (err: any) {
    console.error("sendERC20Usdt error:", err);
    throw new Error(err.message || "Failed to send ERC20 USDT");
  }
}

/* ===========================================================
   🔄 3️⃣ Combined Bridge: XRP → ERC-20
=========================================================== */
export async function bridgeXrpToERC20({
  xrpUserSeed,
  xrpVaultAddress,
  ethBridgePrivateKey,
  userEthAddress,
  amountXrp,
  amountErc20,
}: {
  xrpUserSeed: string;
  xrpVaultAddress: string;
  ethBridgePrivateKey: string;
  userEthAddress: string;
  amountXrp: number;
  amountErc20: number;
}) {
  try {
    console.log(`🔹 Starting XRP → ERC-20 bridge for ${amountXrp} XRP`);

    // Step 1️⃣ Lock XRP
    const xrpTx = await lockXrpForERC20({
      userSeed: xrpUserSeed,
      vaultAddress: xrpVaultAddress,
      amountXrp,
      memo: "Bridge XRP→ERC20",
    });

    // Step 2️⃣ Send ERC-20 USDT
    const ethTx = await sendERC20Usdt({
      bridgePrivateKey: ethBridgePrivateKey,
      userEthAddress,
      amountErc20,
    });

    console.log("✅ Bridge XRP → ERC-20 USDT completed!");
    return {
      status: "completed",
      fromTxHash: xrpTx.txHash,
      toTxHash: ethTx.txHash,
    };
  } catch (err: any) {
    console.error("bridgeXrpToERC20 error:", err);
    return { status: "failed", error: err.message };
  }
}
