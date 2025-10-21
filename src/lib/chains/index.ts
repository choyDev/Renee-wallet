// import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// type SymbolCode = "SOL" | "TRX";
// type NetworkInfo = { chainId: string; rpcUrl: string; symbol: SymbolCode };

// export interface ChainAdapter {
//   symbol: SymbolCode;
//   getNativeBalance(address: string): Promise<number>; // SOL or TRX units (not lamports/sun)
// }

// export function makeAdapter(net: NetworkInfo): ChainAdapter {
//   if (net.symbol === "SOL") {
//     const conn = new Connection(net.rpcUrl, "confirmed");
//     return {
//       symbol: "SOL",
//       async getNativeBalance(address: string) {
//         const lamports = await conn.getBalance(new PublicKey(address));
//         return lamports / LAMPORTS_PER_SOL;
//       },
//     };
//   }
//   // TRX
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const TronWeb = require("tronweb");
//   const tronWeb = new TronWeb({
//     fullHost: net.rpcUrl,
//     headers: process.env.TRONGRID_API_KEY
//       ? { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY }
//       : undefined,
//   });
//   return {
//     symbol: "TRX",
//     async getNativeBalance(address: string) {
//       const sun = await tronWeb.trx.getBalance(address); // 1 TRX = 1e6 sun
//       return sun / 1_000_000;
//     },
//   };
// }
