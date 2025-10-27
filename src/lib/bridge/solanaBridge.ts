import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import bs58 from "bs58";

const conn = new Connection(process.env.SOLANA_DEVNET_RPC!, "confirmed");
const bridgeKeypair = Keypair.fromSecretKey(
  bs58.decode(process.env.SOL_BRIDGE_PRIVATE_KEY_BASE58!)
);

export async function bridgeSolana({
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
  const toPubkey = new PublicKey(toAddress);
  const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: bridgeKeypair.publicKey,
      toPubkey,
      lamports,
    })
  );

  const sig = await sendAndConfirmTransaction(conn, tx, [bridgeKeypair]);
  return { txHash: sig };
}


