import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptPrivateKey } from "@/lib/wallet";
import { ethers } from "ethers";
import { ETH } from "@/lib/swap-constants";

export const runtime = "nodejs";

const ERC20_ABI = [
  "function approve(address spender, uint256 value) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() view returns (uint8)"
];
const V2_ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
  "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external"
];

export async function POST(req: Request) {
  try {
    const { fromWalletId, side, amount, minOut, slippageBps = 50 } = await req.json();

    if (!fromWalletId || !amount || !side) {
      return NextResponse.json({ error: "fromWalletId, side, amount required" }, { status: 400 });
    }
    const w = await prisma.wallet.findUnique({ where: { id: Number(fromWalletId) }, include: { network: true } });
    if (!w || w.network.symbol !== "ETH") return NextResponse.json({ error: "Not an ETH wallet" }, { status: 400 });

    const pkHex = decryptPrivateKey(w.privateKeyEnc!);
    const pk = pkHex.startsWith("0x") ? pkHex : "0x" + pkHex;

    const provider = new ethers.JsonRpcProvider(ETH.RPC, { chainId: ETH.CHAIN_ID, name: ETH.CHAIN_ID === 1 ? "mainnet" : "sepolia" });
    const signer = new ethers.Wallet(pk, provider);
    const router = new ethers.Contract(ETH.ROUTER_V2, V2_ROUTER_ABI, signer);

    const now = Math.floor(Date.now() / 1000);
    const deadline = now + 60 * 10;

    if (side === "NATIVE->USDT") {
      const path = [ETH.WETH, ETH.USDT];
      const value = ethers.parseEther(String(amount));
      const minOutRaw = minOut
        ? ethers.parseUnits(String(minOut), ETH.USDT_DECIMALS)
        : (value * BigInt(95)) / BigInt(100); // fallback (very rough; recommend use quote route’s minOut)

      const tx = await router.swapExactETHForTokens(
        minOutRaw,
        path,
        signer.address,
        deadline,
        { value }
      );
      const rec = await tx.wait();
      return NextResponse.json({ ok: true, hash: tx.hash, explorerTx: (process.env.ETH_EXPLORER_TESTNET || process.env.ETH_EXPLORER_MAINNET) + "/tx/" + tx.hash, blockNumber: rec?.blockNumber ?? null });
    }

    if (side === "USDT->NATIVE") {
      const usdt = new ethers.Contract(ETH.USDT, ERC20_ABI, signer);
      const amountIn = ethers.parseUnits(String(amount), ETH.USDT_DECIMALS);
      const path = [ETH.USDT, ETH.WETH];
      const minOutRaw = minOut
        ? ethers.parseEther(String(minOut))
        : (amountIn * BigInt(95)) / BigInt(100); // fallback

      // approve if needed
      const allowance: bigint = await usdt.allowance(signer.address, ETH.ROUTER_V2);
      if (allowance < amountIn) {
        const txA = await usdt.approve(ETH.ROUTER_V2, amountIn);
        await txA.wait();
      }

      const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountIn,
        minOutRaw,
        path,
        signer.address,
        deadline
      );
      const rec = await tx.wait();
      return NextResponse.json({ ok: true, hash: tx.hash, explorerTx: (process.env.ETH_EXPLORER_TESTNET || process.env.ETH_EXPLORER_MAINNET) + "/tx/" + tx.hash, blockNumber: rec?.blockNumber ?? null });
    }

    return NextResponse.json({ error: "Unsupported side" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Swap failed" }, { status: 500 });
  }
}
