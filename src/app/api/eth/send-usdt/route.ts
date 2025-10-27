import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { decryptPrivateKey } from "@/lib/wallet";
import { ethers } from "ethers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Replace with your actual ERC20 USDT contract address

const USDT_CONTRACT = process.env.USDT_CONTRACT_ETH ?? "0x361049DdA69F353C8414331B8eaBc57342F4bD97"; // mainnet fallback

const USDT_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)"
];

function pickRpc() {
  const isTest = process.env.CHAIN_ENV === "testnet";
  return isTest ? process.env.ETH_RPC_TESTNET! : process.env.ETH_RPC_MAINNET!;
}

function explorerFor(txHash: string) {
  const isTest = process.env.CHAIN_ENV === "testnet";
  const base = isTest ? process.env.ETH_EXPLORER_TESTNET! : process.env.ETH_EXPLORER_MAINNET!;
  return `${base}/tx/${txHash}`;
}

export async function POST(req: Request) {
  try {
    const { fromWalletId, to, amountUsdt } = await req.json();
    if (!fromWalletId || !to || amountUsdt === undefined)
      return NextResponse.json({ error: "fromWalletId, to, amountUsdt required" }, { status: 400 });

    const wallet = await prisma.wallet.findUnique({
      where: { id: Number(fromWalletId) }, include: { network: true },
    });
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    if (!wallet.network || wallet.network.symbol !== "ETH")
      return NextResponse.json({ error: "Wallet is not Ethereum" }, { status: 400 });

    const pkHex = decryptPrivateKey(wallet.privateKeyEnc!);
    const privateKey = pkHex.startsWith("0x") ? pkHex : "0x" + pkHex;
    const provider = new ethers.JsonRpcProvider(pickRpc());
    const signer = new ethers.Wallet(privateKey, provider);

    // ERC-20 USDT contract
    const usdt = new ethers.Contract(USDT_CONTRACT, USDT_ABI, signer);

    const decimals: number = await usdt.decimals();
    const value = ethers.parseUnits(String(amountUsdt), decimals);

    const gasEstimate = await usdt.transfer.estimateGas(to, value);
    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas ?? ethers.parseUnits("40", "gwei");
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? ethers.parseUnits("2", "gwei");

    // Check ETH balance for gas
    const ethBalance = await provider.getBalance(signer.address);
    const estFee = gasEstimate * maxFeePerGas;
    if (ethBalance < estFee)
      return NextResponse.json({ error: "Insufficient ETH for gas fee" }, { status: 400 });

    // Send transaction
    const tx = await usdt.transfer(to, value, { gasLimit: gasEstimate, maxFeePerGas, maxPriorityFeePerGas });
    const receipt = await tx.wait();

    const feeEth = Number(ethers.formatEther(estFee));

    await prisma.transaction.create({
      data: {
        userId: wallet.userId,
        walletId: wallet.id,
        tokenId: null, // you can link to Token table later
        type: "TRANSFER",
        amount: new Prisma.Decimal(Number(amountUsdt)),
        fee: new Prisma.Decimal(feeEth), //  store fee in ETH
        txHash: tx.hash,
        explorerUrl: explorerFor(tx.hash),
        status: "CONFIRMED",
        fromAddress: signer.address,
        toAddress: to,
        direction: "SENT",
      },
    });

    return NextResponse.json({
      ok: true,
      hash: tx.hash,
      explorerTx: explorerFor(tx.hash),
      from: signer.address,
      to,
      amountUsdt: Number(amountUsdt),
      feeEth,
      blockNumber: receipt?.blockNumber ?? null,
    });
  } catch (e: any) {
    console.error("USDT send failed:", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
