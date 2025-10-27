import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptPrivateKey } from "@/lib/wallet";
const TronWeb = require("tronweb");
import { TRON } from "@/lib/swap-constants";
import { SUNSWAP_V2_ROUTER_ABI, TRC20_ABI } from "@/lib/tron-abis";

export const runtime = "nodejs";

const SUN = 1e6;

const V2_ROUTER_ABI = [ /* add minimal methods you need:
  {"name":"swapExactTokensForTokens","type":"Function","inputs":[{"name":"amountIn","type":"uint256"},...]}
  {"name":"swapExactTRXForTokens","type":"Function","inputs":[...]}
  {"name":"getAmountsOut","type":"Function","inputs":[...]}
*/ 
  // query
  {
    "inputs": [],
    "name": "factory",
    "outputs": [{"internalType":"address","name":"","type":"address"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WETH",            // returns WTRX address on Tron
    "outputs": [{"internalType":"address","name":"","type":"address"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType":"uint256","name":"amountIn","type":"uint256"},
      {"internalType":"address[]","name":"path","type":"address[]"}
    ],
    "name": "getAmountsOut",
    "outputs": [{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType":"uint256","name":"amountOut","type":"uint256"},
      {"internalType":"address[]","name":"path","type":"address[]"}
    ],
    "name": "getAmountsIn",
    "outputs": [{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },

  // swaps (exact-in)
  {
    "inputs": [
      {"internalType":"uint256","name":"amountIn","type":"uint256"},
      {"internalType":"uint256","name":"amountOutMin","type":"uint256"},
      {"internalType":"address[]","name":"path","type":"address[]"},
      {"internalType":"address","name":"to","type":"address"},
      {"internalType":"uint256","name":"deadline","type":"uint256"}
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType":"uint256","name":"amountOutMin","type":"uint256"},
      {"internalType":"address[]","name":"path","type":"address[]"},
      {"internalType":"address","name":"to","type":"address"},
      {"internalType":"uint256","name":"deadline","type":"uint256"}
    ],
    "name": "swapExactETHForTokens",      // ETH==TRX; send TRX via callValue
    "outputs": [{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType":"uint256","name":"amountIn","type":"uint256"},
      {"internalType":"uint256","name":"amountOutMin","type":"uint256"},
      {"internalType":"address[]","name":"path","type":"address[]"},
      {"internalType":"address","name":"to","type":"address"},
      {"internalType":"uint256","name":"deadline","type":"uint256"}
    ],
    "name": "swapExactTokensForETH",      // ETH==TRX
    "outputs": [{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // supporting-fee variants (handy for USDT)
  {
    "inputs": [
      {"internalType":"uint256","name":"amountIn","type":"uint256"},
      {"internalType":"uint256","name":"amountOutMin","type":"uint256"},
      {"internalType":"address[]","name":"path","type":"address[]"},
      {"internalType":"address","name":"to","type":"address"},
      {"internalType":"uint256","name":"deadline","type":"uint256"}
    ],
    "name": "swapExactTokensForTokensSupportingFeeOnTransferTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType":"uint256","name":"amountOutMin","type":"uint256"},
      {"internalType":"address[]","name":"path","type":"address[]"},
      {"internalType":"address","name":"to","type":"address"},
      {"internalType":"uint256","name":"deadline","type":"uint256"}
    ],
    "name": "swapExactETHForTokensSupportingFeeOnTransferTokens",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType":"uint256","name":"amountIn","type":"uint256"},
      {"internalType":"uint256","name":"amountOutMin","type":"uint256"},
      {"internalType":"address[]","name":"path","type":"address[]"},
      {"internalType":"address","name":"to","type":"address"},
      {"internalType":"uint256","name":"deadline","type":"uint256"}
    ],
    "name": "swapExactTokensForETHSupportingFeeOnTransferTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export async function POST(req: Request) {
  try {
    if (!TRON.ROUTER || !TRON.USDT) {
      return NextResponse.json({ error: "TRX swap disabled on testnet" }, { status: 400 });
    }

    const { fromWalletId, side, amount, minOut, slippageBps = 50 } = await req.json();

    if (!fromWalletId || !amount || !side) {
      return NextResponse.json({ error: "fromWalletId, side, amount required" }, { status: 400 });
    }

    // Get the TRX wallet + pk
    const w = await prisma.wallet.findUnique({ where: { id: Number(fromWalletId) }, include: { network: true } });
    if (!w || w.network.symbol !== "TRX") return NextResponse.json({ error: "Not a TRON wallet" }, { status: 400 });

    const pk = decryptPrivateKey(w.privateKeyEnc!); // hex string
    const tronWeb = new TronWeb({ fullHost: TRON.RPC, privateKey: pk });

    const router = await tronWeb.contract(SUNSWAP_V2_ROUTER_ABI, TRON.ROUTER);
    const usdt  = await tronWeb.contract(TRC20_ABI, TRON.USDT);
    const WTRX  = await router.WETH().call(); // base58 WTRX

    const to = tronWeb.address.fromPrivateKey(pk);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    if (side === "NATIVE->USDT") {
      // TRX -> USDT   (pay TRX in callValue)
      const path = [WTRX, TRON.USDT];
      const valueSun = Math.round(Number(amount) * SUN);
      const minOutRaw = minOut
        ? Math.round(Number(minOut) * SUN)
        : Math.floor(valueSun * (1 - slippageBps / 10_000)); // very rough fallback

      const txId = await router
        .swapExactETHForTokens(minOutRaw, path, to, deadline)
        .send({ callValue: valueSun }); // TRX paid here

      return NextResponse.json({
        ok: true,
        txId,
        explorerTx: `https://tronscan.org/#/transaction/${txId}`,
      });
    }

    if (side === "USDT->NATIVE") {
      // USDT -> TRX   (approve then swap)
      const path = [TRON.USDT, WTRX];
      const amountIn = Math.round(Number(amount) * SUN);
      const minOutRaw = minOut
        ? Math.round(Number(minOut) * SUN)
        : Math.floor(amountIn * (1 - slippageBps / 10_000));

      // approve if needed
      const allowance = await usdt.allowance(to, TRON.ROUTER).call();
      if (tronWeb.toBigNumber(allowance).lt(tronWeb.toBigNumber(amountIn))) {
        const txA = await usdt.approve(TRON.ROUTER, amountIn).send();
        // optional: wait for confirmation via tronWeb.trx.getTransactionInfo(txA)
      }

      const txId = await router
        .swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountIn,
          minOutRaw,
          path,
          to,
          deadline
        )
        .send();

      return NextResponse.json({
        ok: true,
        txId,
        explorerTx: `https://tronscan.org/#/transaction/${txId}`,
      });
    }

    return NextResponse.json({ error: "Unsupported side" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Swap failed" }, { status: 500 });
  }
}
