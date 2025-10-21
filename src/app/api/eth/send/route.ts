import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptPrivateKey } from "@/lib/wallet";
import { ethers } from "ethers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function pickRpc() {
  const isTest = process.env.CHAIN_ENV === "testnet";
  return isTest
    ? process.env.ETH_RPC_TESTNET!
    : process.env.ETH_RPC_MAINNET!;
}
function explorerFor(txHash: string) {
  const isTest = process.env.CHAIN_ENV === "testnet";
  const base = isTest ? process.env.ETH_EXPLORER_TESTNET! : process.env.ETH_EXPLORER_MAINNET!;
  return `${base}/tx/${txHash}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fromWalletId, to, amountEth } = body as {
      fromWalletId: number; to: string; amountEth: string | number;
    };
    if (!fromWalletId || !to || amountEth === undefined)
      return NextResponse.json({ error: "fromWalletId, to, amountEth required" }, { status: 400 });

    const wallet = await prisma.wallet.findUnique({
      where: { id: Number(fromWalletId) }, include: { network: true },
    });
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    if (!wallet.network || wallet.network.symbol !== "ETH")
      return NextResponse.json({ error: "Wallet is not Ethereum" }, { status: 400 });

    if (!ethers.isAddress(to)) return NextResponse.json({ error: "Invalid destination address" }, { status: 400 });

    const keyHex = decryptPrivateKey(wallet.privateKeyEnc!); // hex string
    const pk = keyHex.startsWith("0x") ? keyHex : ("0x" + keyHex);

    const provider = new ethers.JsonRpcProvider(pickRpc());
    const signer = new ethers.Wallet(pk, provider);

    const value = ethers.parseEther(String(amountEth));
    const fee = await provider.getFeeData();
    const maxFeePerGas       = fee.maxFeePerGas       ?? ethers.parseUnits("40", "gwei");
    const maxPriorityPerGas  = fee.maxPriorityFeePerGas ?? ethers.parseUnits("2", "gwei");

    // quick balance check
    const bal = await provider.getBalance(signer.address);
    // estimate gas for transfer
    const gasLimit = await provider.estimateGas({ to, from: signer.address, value });
    const need = value + gasLimit * maxFeePerGas; // rough upper bound
    if (bal < need) {
      return NextResponse.json(
        { error: `Insufficient ETH. Have ${ethers.formatEther(bal)} need ~${ethers.formatEther(need)}` },
        { status: 400 }
      );
    }

    const tx = await signer.sendTransaction({ to, value, maxFeePerGas, maxPriorityFeePerGas: maxPriorityPerGas, gasLimit });
    const receipt = await tx.wait(); // wait for inclusion

    return NextResponse.json({
      ok: true,
      hash: tx.hash,
      explorerTx: explorerFor(tx.hash),
      from: signer.address,
      to,
      amountEth: Number(amountEth),
      blockNumber: receipt?.blockNumber ?? null,
    });
  } catch (e: any) {
    console.error("ETH send failed:", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
