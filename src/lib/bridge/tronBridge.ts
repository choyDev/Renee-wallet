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
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC!,
    privateKey,
  });

  const vaultAddress = process.env.TRX_BRIDGE_VAULT!;
  const contract = await tronWeb.contract().at(vaultAddress);

  const sun = tronWeb.toSun(amount);
  const tx = await contract.lock("SOL", toAddress).send({ callValue: sun });

  return { txHash: tx };
}


