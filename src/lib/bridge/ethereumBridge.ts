import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_TESTNET!);
const bridgeWallet = new ethers.Wallet(process.env.ETH_BRIDGE_PRIVKEY!, provider);

export async function bridgeEthereum({
  token,
  action,
  amount,
  toAddress,
}: {
  token: string;
  action: "MINT" | "LOCK";
  amount: number;
  toAddress: string;
}) {
  try {
    
    const value = ethers.parseEther(Number(amount).toFixed(18));
    const tx = await bridgeWallet.sendTransaction({
      to: toAddress,
      value,
    });

    // ✅ Wait for 1 confirmation (non-null guaranteed)
    const receipt = await tx.wait(1);

    if (!receipt) throw new Error("Transaction not confirmed or receipt is null");
    // ✅ In ethers v6, use `receipt.hash`
    return { txHash: receipt.hash };
  } catch (err: any) {
    console.error("bridgeEthereum error:", err);
    throw new Error(err.message || "bridgeEthereum failed");
  }
}
