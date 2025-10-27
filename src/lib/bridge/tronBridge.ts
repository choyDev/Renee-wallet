
import TronWeb from "tronweb";

export async function bridgeTron({
  privateKey,
  token,
  amount,
  toAddress,
}: {
  privateKey: string;
  token: string;
  amount: number;
  toAddress: string;
}) {
  try {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_NILE_RPC!,
      headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
      privateKey,
    });

    const vaultAddress = process.env.TRX_BRIDGE_VAULT!;
    const fromAddress = tronWeb.address.fromPrivateKey(privateKey);
    const sun = Math.floor(tronWeb.toSun(amount));

    console.log(`🔒 Locking ${amount} TRX (${sun} sun) from ${fromAddress} → vault ${vaultAddress}`);

    const tx = await tronWeb.trx.sendTransaction(vaultAddress, sun);

    if (!tx?.result) {
      throw new Error(`TRX lock failed: ${JSON.stringify(tx)}`);
    }

    console.log("✅ TRX locked TX:", tx.txid);
    return { txHash: tx.txid };
  } catch (err: any) {
    console.error("bridgeTron error:", err);
    throw new Error(err.message || "Failed to lock TRX");
  }
}

