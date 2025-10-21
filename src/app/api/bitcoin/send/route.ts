import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptPrivateKey } from "@/lib/wallet";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function envs() {
  const isTest = process.env.CHAIN_ENV === "testnet";
  const apiBase = isTest ? process.env.BTC_API_TESTNET! : process.env.BTC_API_MAINNET!;
  const explorer = isTest ? process.env.BTC_EXPLORER_TESTNET! : process.env.BTC_EXPLORER_MAINNET!;
  const net = isTest ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
  return { isTest, apiBase, explorer, net };
}

async function getFeeRate(apiBase: string): Promise<number> {
  try {
    const r = await fetch(`${apiBase}/fee-estimates`, { cache: "no-store" });
    const j = await r.json();
    // use ~next block (1) or 2 blocks as a balance of speed/cost
    return Math.ceil((j["1"] ?? j["2"] ?? 10)); // sats/vB
  } catch {
    return 10;
  }
}

async function getUtxos(apiBase: string, addr: string) {
  const r = await fetch(`${apiBase}/address/${addr}/utxo`, { cache: "no-store" });
  if (!r.ok) throw new Error(`utxo fetch ${r.status}`);
  return (await r.json()) as Array<{ txid: string; vout: number; value: number }>;
}

function vbytesEstimate(inCount: number, outCount: number) {
  // P2WPKH rough vbytes: 10 + in*68 + out*31 (good enough for fee rough calc)
  return 10 + inCount * 68 + outCount * 31;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fromWalletId, to, amountBtc } = body as {
      fromWalletId: number; to: string; amountBtc: string | number;
    };
    if (!fromWalletId || !to || amountBtc === undefined)
      return NextResponse.json({ error: "fromWalletId, to, amountBtc required" }, { status: 400 });

    const { apiBase, explorer, net } = envs();

    const wallet = await prisma.wallet.findUnique({
      where: { id: Number(fromWalletId) }, include: { network: true },
    });
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    if (!wallet.network || wallet.network.symbol !== "BTC")
      return NextResponse.json({ error: "Wallet is not Bitcoin" }, { status: 400 });

    const fromAddress = wallet.address; // expected bech32 P2WPKH
    if (!fromAddress || !fromAddress.startsWith(net.bech32 ?? (process.env.CHAIN_ENV === "testnet" ? "tb1" : "bc1")))
      return NextResponse.json({ error: "Address must be P2WPKH (bech32)" }, { status: 400 });

    const wif = decryptPrivateKey(wallet.privateKeyEnc!);
    const keyPair = ECPair.fromWIF(wif, net);
    const pubkey = keyPair.publicKey!;
    const p2wpkh = bitcoin.payments.p2wpkh({ pubkey, network: net });
    if (!p2wpkh.address || p2wpkh.address !== fromAddress)
      return NextResponse.json({ error: "Private key/address mismatch" }, { status: 400 });

    const utxos = await getUtxos(apiBase, fromAddress);
    if (!utxos.length) return NextResponse.json({ error: "No UTXOs to spend" }, { status: 400 });

    const sendValue = Math.round(Number(amountBtc) * 1e8); // sats
    if (!Number.isFinite(sendValue) || sendValue <= 0)
      return NextResponse.json({ error: "amountBtc must be > 0" }, { status: 400 });

    const feeRate = await getFeeRate(apiBase); // sats/vB

    // naive coin selection: add utxos until enough (incl. rough fee)
    const inputs: typeof utxos = [];
    let inValue = 0;
    const outCountBase = 1 /*to*/ + 1 /*change*/;
    let estBytes = vbytesEstimate(1, outCountBase);
    let fee = estBytes * feeRate;
    while (inValue < sendValue + fee) {
      const utxo = utxos.shift();
      if (!utxo) break;
      inputs.push(utxo);
      inValue += utxo.value;
      estBytes = vbytesEstimate(inputs.length, outCountBase);
      fee = estBytes * feeRate;
    }
    if (inValue < sendValue + fee) {
      return NextResponse.json({ error: "Insufficient BTC (incl. fee)" }, { status: 400 });
    }

    const changeValue = inValue - sendValue - fee;
    const psbt = new bitcoin.Psbt({ network: net });

    for (const inp of inputs) {
      // Esplora doesn't require prevTx if we supply witnessUtxo for P2WPKH
      psbt.addInput({
        hash: inp.txid,
        index: inp.vout,
        witnessUtxo: {
          script: p2wpkh.output!, // scriptPubKey of our P2WPKH
          value: BigInt(inp.value),
        },
      });
    }

    // outputs
    psbt.addOutput({ address: to, value: BigInt(sendValue) });
    if (changeValue > 0) psbt.addOutput({ address: fromAddress, value: BigInt(changeValue) });

    // sign all inputs
    inputs.forEach((_, idx) => psbt.signInput(idx, keyPair));
    psbt.finalizeAllInputs();

    const rawHex = psbt.extractTransaction().toHex();

    // broadcast via Esplora
    const br = await fetch(`${apiBase}/tx`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: rawHex,
    });
    if (!br.ok) {
      const msg = await br.text();
      throw new Error(`Broadcast failed ${br.status}: ${msg.slice(0, 200)}`);
    }
    const txid = await br.text();

    return NextResponse.json({
      ok: true,
      txid,
      explorerTx: `${explorer}/tx/${txid}`,
      from: fromAddress,
      to,
      amountBtc: Number(amountBtc),
      feeSats: fee,
      feeRate,
      inputs: inputs.length,
    });
  } catch (e: any) {
    console.error("BTC send failed:", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
