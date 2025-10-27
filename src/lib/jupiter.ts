// // Server-only helper for Jupiter allow-list lookups (devnet)
// export type Cluster = "devnet" | "mainnet";

// type CacheShape = {
//   mints?: string[];
//   fetchedAt?: number; // epoch ms
// };
// type GlobalCache = {
//   __jupTradable?: Partial<Record<Cluster, CacheShape>>;
// };

// const g = globalThis as unknown as GlobalCache;

// const TTL_MS = 5 * 60_000; // 5 minutes

// async function fetchTradableMints(cluster: Cluster): Promise<string[]> {
//   const now = Date.now();
//   g.__jupTradable ||= {};
//   const cached = g.__jupTradable[cluster];

//   if (cached?.mints && cached.fetchedAt && (now - cached.fetchedAt) < TTL_MS) {
//     return cached.mints;
//   }

//   const url =
//     cluster === "devnet"
//       ? "https://lite-api.jup.ag/tokens/v1/mints/tradable?cluster=devnet"
//       : "https://lite-api.jup.ag/tokens/v1/mints/tradable";

//   const r = await fetch(url, { cache: "no-store" });
//   if (!r.ok) {
//     const t = await r.text();
//     throw new Error(`Jupiter tradable mints failed: ${r.status} ${t}`);
//   }
//   const mints: string[] = await r.json();

//   g.__jupTradable[cluster] = { mints, fetchedAt: now };
//   return mints;
// }

// /**
//  * Pick a stable mint that Jupiter actually treats as tradable on devnet.
//  * Order of preference: env override -> common candidates -> first tradable fallback.
//  */
// export async function pickDevnetStableMint(): Promise<string | null> {
//   const tradable = await fetchTradableMints("devnet");

//   // 1) Respect an env override IF it's tradable
//   const envMint = process.env.USDT_SOL_TESTNET;
//   if (envMint && tradable.includes(envMint)) return envMint;

//   // 2) Try common devnet stables (USDC devnet variants)
//   const CANDIDATE_STABLES = [
//     "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC (often used on devnet)
//     "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr", // USDC-Dev (older devnet mint)
//   ];
//   const found = CANDIDATE_STABLES.find(m => tradable.includes(m));
//   if (found) return found;

//   // 3) Fallback: if nothing matches, disable swaps (return null)
//   return null;
// }

// export async function isMintTradable(cluster: Cluster, mint: string): Promise<boolean> {
//   const tradable = await fetchTradableMints(cluster);
//   return tradable.includes(mint);
// }
