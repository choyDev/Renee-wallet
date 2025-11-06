import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { decryptPrivateKey } from "@/lib/wallet";
import * as dogecoin from "@dogiwallet/dogecoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import axios from "axios";

const ECPair = ECPairFactory(ecc);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* -------------------------------------------------------
   Dogecoin network definitions (fixed for WIF prefixes)
-------------------------------------------------------- */
const DOGE_NETWORKS = {
  testnet: {
    messagePrefix: "\x19Dogecoin Signed Message:\n",
    bech32: "tdge",
    bip32: { public: 0x043587cf, private: 0x04358394 },
    pubKeyHash: 0x71,
    scriptHash: 0xc4,
    wif: 0xf1, // ✅ correct testnet WIF prefix
  },
  mainnet: {
    messagePrefix: "\x19Dogecoin Signed Message:\n",
    bech32: "doge",
    bip32: { public: 0x02facafd, private: 0x02fac398 },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e, // ✅ correct mainnet WIF prefix
  },
};

/* -------------------------------------------------------
   Helpers
-------------------------------------------------------- */
function envs() {
  const isTest = process.env.CHAIN_ENV === "testnet";
  const apiBase = isTest
    ? "https://doge-electrs-testnet-demo.qed.me"
    : "https://dogechain.info/api";
  const explorer = isTest
    ? "https://doge-testnet-explorer.qed.me"
    : "https://dogechain.info";
  const net = isTest ? DOGE_NETWORKS.testnet : DOGE_NETWORKS.mainnet;
  return { isTest, apiBase, explorer, net };
}

function estimateFee(inputs: number, outputs: number, rate: number) {
  const txSize = 10 + inputs * 148 + outputs * 34;
  return txSize * rate;
}

/* -------------------------------------------------------
   POST /api/dogecoin/send
-------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fromWalletId, to, amountDoge } = body as {
      fromWalletId: number;
      to: string;
      amountDoge: string | number;
    };

    if (!fromWalletId || !to || amountDoge === undefined) {
      return NextResponse.json(
        { error: "fromWalletId, to, amountDoge required" },
        { status: 400 }
      );
    }

    const { apiBase, explorer, net } = envs();

    // Get wallet from DB
    const wallet = await prisma.wallet.findUnique({
      where: { id: Number(fromWalletId) },
      include: { network: true },
    });
    if (!wallet)
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    if (!wallet.network || wallet.network.symbol !== "DOGE")
      return NextResponse.json({ error: "Wallet is not Dogecoin" }, { status: 400 });

    const fromAddress = wallet.address;
    if (!fromAddress)
      return NextResponse.json({ error: "Invalid Dogecoin address" }, { status: 400 });

    /* -------------------------------------------
       Decrypt and verify WIF private key
    ------------------------------------------- */
    const wif = decryptPrivateKey(wallet.privateKeyEnc!);
    const keyPair = ECPair.fromWIF(wif, net);

    const p2pkh = dogecoin.payments.p2pkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: net,
    });

    if (!p2pkh.address || p2pkh.address !== fromAddress)
      return NextResponse.json({ error: "Private key/address mismatch" }, { status: 400 });

    /* -------------------------------------------
       Fetch UTXOs
    ------------------------------------------- */
    const utxoRes = await axios.get(`${apiBase}/address/${fromAddress}/utxo`);
    const utxos = utxoRes.data;
    if (!Array.isArray(utxos) || !utxos.length)
      return NextResponse.json({ error: "No UTXOs to spend" }, { status: 400 });

    const sendValue = Math.round(Number(amountDoge) * 1e8);
    if (!Number.isFinite(sendValue) || sendValue <= 0)
      return NextResponse.json({ error: "amountDoge must be > 0" }, { status: 400 });

    /* -------------------------------------------
       Fee + coin selection
    ------------------------------------------- */
    const feeRate = 1000; // sat/vB (approx)
    const inputs: any[] = [];
    let inValue = 0;
    const outCount = 2;
    let fee = estimateFee(1, outCount, feeRate);

    for (const utxo of utxos) {
      inputs.push(utxo);
      inValue += utxo.value;
      fee = estimateFee(inputs.length, outCount, feeRate);
      if (inValue >= sendValue + fee) break;
    }
    if (inValue < sendValue + fee)
      return NextResponse.json({ error: "Insufficient DOGE balance" }, { status: 400 });

    const changeValue = inValue - sendValue - fee;

    /* -------------------------------------------
       Build PSBT
    ------------------------------------------- */
    const psbt = new dogecoin.Psbt({ network: net });
    for (const utxo of inputs) {
      const txHexRes = await axios.get(`${apiBase}/tx/${utxo.txid}/hex`);
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(txHexRes.data, "hex"),
      });
    }

    psbt.addOutput({ address: to, value: sendValue });
    if (changeValue > 0)
      psbt.addOutput({ address: fromAddress, value: changeValue });

    const signer: dogecoin.Signer = {
      publicKey: Buffer.from(keyPair.publicKey),
      sign: (hash: Buffer) => Buffer.from(keyPair.sign(hash)),
    };

    psbt.signAllInputs(signer);
    psbt.finalizeAllInputs();
    const rawHex = psbt.extractTransaction().toHex();

    /* -------------------------------------------
       Broadcast
    ------------------------------------------- */
    const broadcast = await axios.post(`${apiBase}/tx`, rawHex, {
      headers: { "Content-Type": "text/plain" },
    });
    const txid = typeof broadcast.data === "string" ? broadcast.data : broadcast.data?.txid;
    if (!txid) throw new Error("Broadcast failed: no txid returned");

    const explorerTx = `${explorer}/tx/${txid}`;
    console.log(`✅ DOGE TX broadcasted: ${explorerTx}`);

    /* -------------------------------------------
       Save transaction to DB
    ------------------------------------------- */
    await prisma.transaction.create({
      data: {
        userId: wallet.userId,
        walletId: wallet.id,
        tokenId: null,
        type: "TRANSFER",
        amount: new Prisma.Decimal(Number(amountDoge)),
        usdValue: new Prisma.Decimal(0),
        fee: new Prisma.Decimal(fee / 1e8),
        txHash: txid,
        explorerUrl: explorerTx,
        status: "CONFIRMED",
        fromAddress,
        toAddress: to,
        direction: "SENT",
      },
    });

    return NextResponse.json({
      ok: true,
      txid,
      explorerTx,
      from: fromAddress,
      to,
      amountDoge: Number(amountDoge),
      feeSats: fee,
      inputs: inputs.length,
    });
  } catch (e: any) {
    console.error("DOGE send failed:", e);
    return NextResponse.json(
      { error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}
