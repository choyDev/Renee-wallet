// /src/app/api/swap/trx/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptPrivateKey } from "@/lib/wallet";

// TronWeb (CommonJS)
const TronWeb = require("tronweb");

import { TRON } from "@/lib/swap-constants";
import { SUNSWAP_V2_ROUTER_ABI, TRC20_ABI } from "@/lib/tron-abis";

export const runtime = "nodejs";

/**
 * ENV expected:
 * - CHAIN_ENV = "testnet" | "mainnet"
 * - TRONGRID_API_KEY (optional but recommended)
 * - TRX_BRIDGE_PRIVATE_KEY (treasury signer)
 * - TRON_TESTNET_USDT_CONTRACT (Nile USDT: TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf)
 * - TRON_NILE_RPC (fallback https://nile.trongrid.io)
 */
const IS_TEST = process.env.CHAIN_ENV !== "mainnet";
const FULLHOST = TRON.RPC || process.env.TRON_NILE_RPC || "https://nile.trongrid.io";
const API_KEY = process.env.TRONGRID_API_KEY || undefined;
const FEE_LIMIT = 100_000_000; // 100 TRX in sun (upper cap for contract sends)
const SUN = 1e6;

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function makeTronWeb(pk?: string) {
  const opts: any = { fullHost: FULLHOST };
  if (API_KEY) opts.headers = { "TRON-PRO-API-KEY": API_KEY };
  if (pk) opts.privateKey = pk;
  return new TronWeb(opts);
}

function toBase58(tw: any, addr: string) {
  return addr?.startsWith("41") ? tw.address.fromHex(addr) : addr;
}

function errJson(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

/* ---- quick price fetch (demo path uses real price, not 1:1) ---- */
async function withTimeout<T>(p: Promise<T>, ms = 2500) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    // @ts-ignore
    return await p;
  } finally {
    clearTimeout(timer);
  }
}
async function pxBinanceTRX() {
  const r = await withTimeout(fetch("https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT", { cache: "no-store" }));
  if (!r.ok) throw new Error("binance http");
  const j = await r.json();
  const v = Number(j?.price);
  if (!Number.isFinite(v) || v <= 0) throw new Error("binance parse");
  return v;
}
async function pxCoingeckoTRX() {
  const r = await withTimeout(fetch("https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd", { cache: "no-store" }));
  if (!r.ok) throw new Error("coingecko http");
  const j = await r.json();
  const v = Number(j?.tron?.usd);
  if (!Number.isFinite(v) || v <= 0) throw new Error("coingecko parse");
  return v;
}
function median(a: number[]) {
  const b = a.slice().sort((x, y) => x - y);
  const m = Math.floor(b.length / 2);
  return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
}
let _px = { t: 0, v: 0 };
async function getTrxUsd(): Promise<number> {
  const now = Date.now();
  if (now - _px.t < 30_000 && _px.v > 0) return _px.v;
  const res = await Promise.allSettled([pxBinanceTRX(), pxCoingeckoTRX()]);
  const vals: number[] = [];
  for (const r of res) if (r.status === "fulfilled") vals.push(r.value);
  if (!vals.length) throw new Error("No TRX price");
  const v = median(vals);
  _px = { t: now, v };
  return v;
}

/* -------------------------------------------------------------------------- */
/* Demo swap (testnet only): price-based accounting between user & treasury   */
/* -------------------------------------------------------------------------- */

async function demoSwapTron(params: {
  side: "NATIVE->USDT" | "USDT->NATIVE";
  amount: string;
  userPkHex: string;
}) {
  const { side, amount, userPkHex } = params;

  if (!process.env.TRX_BRIDGE_PRIVATE_KEY) {
    throw new Error("Missing TRX_BRIDGE_PRIVATE_KEY");
  }
  if (!process.env.TRON_TESTNET_USDT_CONTRACT) {
    throw new Error("Missing TRON_TESTNET_USDT_CONTRACT");
  }

  const tronUser = makeTronWeb(userPkHex);
  const tronTrea = makeTronWeb(process.env.TRX_BRIDGE_PRIVATE_KEY);

  const userAddr = tronUser.address.fromPrivateKey(userPkHex);
  const treaAddr = tronTrea.address.fromPrivateKey(process.env.TRX_BRIDGE_PRIVATE_KEY);

  const tokenAddr = process.env.TRON_TESTNET_USDT_CONTRACT; // base58 T...
  const usdtUser = await tronUser.contract().at(tokenAddr);
  usdtUser.abi = TRC20_ABI;
  const usdtTrea = await tronTrea.contract().at(tokenAddr);
  usdtTrea.abi = TRC20_ABI;

  // READS use .call()
  let dec = 6;
  try {
    dec = Number(await usdtTrea.decimals().call());
  } catch {
    dec = 6;
  }

  const ui = Number(amount);
  if (!isFinite(ui) || ui <= 0) throw new Error("Invalid amount");

  const trxUsd = await getTrxUsd(); // price in USDT

  const txids: string[] = [];

  if (side === "NATIVE->USDT") {
    // TRX from user → treasury
    const sunIn = Math.round(ui * SUN);
    try {
      const tx = await tronUser.trx.sendTransaction(treaAddr, sunIn);
      txids.push(tx?.txid || tx?.transaction?.txID);
    } catch (e: any) {
      throw new Error(`TRX transfer user→treasury failed: ${e?.message || e}`);
    }

    // USDT from treasury → user (treasury pays energy)
    const tokenOut = Math.round(ui * trxUsd * 10 ** dec);
    try {
      const receipt = await usdtTrea
        .transfer(userAddr, tokenOut.toString())
        .send({ feeLimit: FEE_LIMIT, shouldPollResponse: true });
      txids.push(receipt?.txid || receipt);
    } catch (e: any) {
      throw new Error(`USDT transfer treasury→user failed: ${e?.message || e}`);
    }

    return {
      ok: true,
      mode: "demo",
      filledIn: ui.toString(),
      filledOut: (tokenOut / 10 ** dec).toFixed(dec),
      price: trxUsd,
      txids,
      explorerTx: `https://nile.tronscan.org/#/transaction/${txids[txids.length - 1]}`
    };
  } else {
    // USDT from user → treasury
    const tokenIn = Math.round(ui * 10 ** dec);
    try {
      const receipt = await usdtUser
        .transfer(treaAddr, tokenIn.toString())
        .send({ feeLimit: FEE_LIMIT, shouldPollResponse: true });
      txids.push(receipt?.txid || receipt);
    } catch (e: any) {
      // User needs some TRX for energy/bandwidth.
      throw new Error(`USDT transfer user→treasury failed: ${e?.message || e}`);
    }

    // TRX from treasury → user
    const sunOut = Math.round((ui / trxUsd) * SUN);
    try {
      const tx = await tronTrea.trx.sendTransaction(userAddr, sunOut);
      txids.push(tx?.txid || tx?.transaction?.txID);
    } catch (e: any) {
      throw new Error(`TRX transfer treasury→user failed: ${e?.message || e}`);
    }

    return {
      ok: true,
      mode: "demo",
      filledIn: ui.toFixed(dec),
      filledOut: (sunOut / SUN).toFixed(6),
      price: trxUsd,
      txids,
      explorerTx: `https://nile.tronscan.org/#/transaction/${txids[txids.length - 1]}`
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Main handler                                                               */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
  try {
    const { fromWalletId, side, amount, minOut, slippageBps = 50 } = await req.json();

    if (!fromWalletId || !amount || !side) {
      return errJson("fromWalletId, side, amount required");
    }

    // Get wallet & pk
    const w = await prisma.wallet.findUnique({
      where: { id: Number(fromWalletId) },
      include: { network: true },
    });
    if (!w || w.network.symbol !== "TRX") {
      return errJson("Not a TRON wallet");
    }
    const pk = decryptPrivateKey(w.privateKeyEnc!); // 64-hex, no 0x

    /* ----------------------------- TESTNET path ---------------------------- */
    if (IS_TEST) {
      try {
        const demo = await demoSwapTron({
          side,
          amount: String(amount),
          userPkHex: pk,
        });
        return NextResponse.json(demo);
      } catch (e: any) {
        return errJson(e?.message || "Testnet demo swap failed", 500);
      }
    }

    /* ----------------------------- MAINNET path ---------------------------- */
    if (!TRON.ROUTER || !TRON.USDT) {
      return errJson("Router/USDT not configured for TRON");
    }

    const tronWeb = makeTronWeb(pk);

    // Build contracts with signer. IMPORTANT: state-changing => .send()
    const router = await tronWeb.contract().at(toBase58(tronWeb, TRON.ROUTER));
    router.abi = SUNSWAP_V2_ROUTER_ABI;

    const usdt = await tronWeb.contract().at(toBase58(tronWeb, TRON.USDT));
    usdt.abi = TRC20_ABI;

    // Resolve WTRX (some ABIs expose WETH(), some WTRX())
    let WTRX: string | undefined;
    try { WTRX = await router.WETH().call(); } catch {}
    if (!WTRX) { try { WTRX = await (router as any).WTRX?.().call(); } catch {} }
    if (!WTRX && process.env.TRON_WTRX) WTRX = process.env.TRON_WTRX;
    if (!WTRX) return errJson("Cannot resolve WTRX address");

    WTRX = toBase58(tronWeb, WTRX);
    const to = tronWeb.address.fromPrivateKey(pk);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    if (side === "NATIVE->USDT") {
      // TRX -> USDT (pay TRX in callValue)
      const path = [WTRX, toBase58(tronWeb, TRON.USDT)];
      const valueSun = Math.round(Number(amount) * SUN);
      const minOutRaw = minOut
        ? Math.round(Number(minOut) * SUN)        // USDT 6 dp
        : Math.floor(valueSun * (1 - slippageBps / 10_000)); // rough fallback

      // SunSwap might name it swapExactETHForTokens or swapExactTRXForTokens
      const hasEth = typeof (router as any).swapExactETHForTokens === "function";
      try {
        const txId = hasEth
          ? await (router as any)
              .swapExactETHForTokens(minOutRaw, path, to, deadline)
              .send({ callValue: valueSun, feeLimit: FEE_LIMIT, shouldPollResponse: true })
          : await (router as any)
              .swapExactTRXForTokens(minOutRaw, path, to, deadline)
              .send({ callValue: valueSun, feeLimit: FEE_LIMIT, shouldPollResponse: true });

        return NextResponse.json({
          ok: true,
          txId,
          explorerTx: `https://tronscan.org/#/transaction/${txId}`,
        });
      } catch (e: any) {
        return errJson(`Router swap TRX→USDT failed: ${e?.message || e}`, 500);
      }
    }

    if (side === "USDT->NATIVE") {
      // USDT -> TRX (approve then swap)
      const path = [toBase58(tronWeb, TRON.USDT), WTRX];
      const amountIn = Math.round(Number(amount) * SUN); // USDT 6 dp
      const minOutRaw = minOut
        ? Math.round(Number(minOut) * SUN)
        : Math.floor(amountIn * (1 - slippageBps / 10_000));

      // Approve if needed (READ uses .call())
      try {
        const allowance = await usdt.allowance(to, toBase58(tronWeb, TRON.ROUTER)).call();
        // @ts-ignore BigNumber
        const need = tronWeb.toBigNumber(amountIn);
        // @ts-ignore BigNumber
        if (tronWeb.toBigNumber(allowance).lt(need)) {
          await usdt
            .approve(toBase58(tronWeb, TRON.ROUTER), amountIn)
            .send({ feeLimit: FEE_LIMIT, shouldPollResponse: true });
        }
      } catch (e: any) {
        return errJson(`USDT approve failed: ${e?.message || e}`, 500);
      }

      // Supporting-fee variant is usually safer for USDT
      try {
        const hasEthSupp =
          typeof (router as any).swapExactTokensForETHSupportingFeeOnTransferTokens === "function";
        const txId = hasEthSupp
          ? await (router as any)
              .swapExactTokensForETHSupportingFeeOnTransferTokens(
                amountIn,
                minOutRaw,
                path,
                to,
                deadline
              )
              .send({ feeLimit: FEE_LIMIT, shouldPollResponse: true })
          : await (router as any)
              .swapExactTokensForTRXSupportingFeeOnTransferTokens?.(
                amountIn,
                minOutRaw,
                path,
                to,
                deadline
              )
              .send({ feeLimit: FEE_LIMIT, shouldPollResponse: true });

        if (!txId) throw new Error("No txId from router");
        return NextResponse.json({
          ok: true,
          txId,
          explorerTx: `https://tronscan.org/#/transaction/${txId}`,
        });
      } catch (e: any) {
        return errJson(`Router swap USDT→TRX failed: ${e?.message || e}`, 500);
      }
    }

    return errJson("Unsupported side");
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Swap failed" }, { status: 500 });
  }
}
