export async function getUsdPrices(symbols: ("SOL"|"TRX")[], live: boolean) {
  if (!live) return { SOL: 150, TRX: 0.1 }; // dev stub; change anytime
  const map = { SOL: "solana", TRX: "tron" };
  const ids = symbols.map(s => map[s]).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  const j = await res.json();
  return {
    SOL: j.solana?.usd ?? 0,
    TRX: j.tron?.usd ?? 0,
  };
}
