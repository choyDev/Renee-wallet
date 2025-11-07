import axios from "axios";

/** Supported asset symbols */
export type SymbolKey = "SOL" | "ETH" | "TRX" | "BTC" | "DOGE" | "XRP" | "XMR" | "USDT";

/** Static fallback rates (in USD) */
const STATIC_RATES: Record<SymbolKey, number> = {
  SOL: 150,
  ETH: 3000,
  TRX: 0.13,
  BTC: 65000,
  DOGE: 0.160096,
  XRP: 2.21,
  XMR: 351.96,
  USDT: 1,
};

// In-memory cache for CoinGecko results
let cachedRates: Partial<Record<SymbolKey, number>> | null = null;
let lastFetch = 0;

/**
 * Fetch live USD price from CoinGecko (with 1-min caching)
 */
export async function getRate(symbol: SymbolKey): Promise<number> {
  const useLive = process.env.USE_LIVE_PRICES === "true";

  // Use static fallback if live disabled (for offline dev/test)
  if (!useLive) return STATIC_RATES[symbol];

  const now = Date.now();

  // Use cache if fresh (< 60s)
  if (cachedRates && now - lastFetch < 60_000) {
    return cachedRates[symbol] ?? STATIC_RATES[symbol];
  }

  try {
    // Fetch from CoinGecko
    const { data } = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: "solana,ethereum,tron,bitcoin,dogecoin,ripple,monero,tether",
          vs_currencies: "usd",
        },
        timeout: 5000, // fail fast if slow network
      }
    );

    // Normalize into our symbol map
    cachedRates = {
      SOL: data.solana?.usd ?? STATIC_RATES.SOL,
      ETH: data.ethereum?.usd ?? STATIC_RATES.ETH,
      TRX: data.tron?.usd ?? STATIC_RATES.TRX,
      BTC: data.bitcoin?.usd ?? STATIC_RATES.BTC,
      DOGE: data.dogecoin?.usd ?? STATIC_RATES.DOGE,
      XRP: data.ripple?.usd ?? STATIC_RATES.XRP,
      XMR: data.monero?.usd ?? STATIC_RATES.XMR,
      USDT: data.tether?.usd ?? STATIC_RATES.USDT,
    };

    lastFetch = now;
    return cachedRates[symbol]!;
  } catch (error) {
    console.error("[getRate] CoinGecko fetch failed:", (error as any).message);
    return STATIC_RATES[symbol];
  }
}

/**
 * Convert one token to another using USD reference rate
 * Returns amount in destination token units.
 */
export async function convertRate(
  from: SymbolKey,
  to: SymbolKey,
  amount: number
): Promise<{ fromUSD: number; toAmount: number }> {
  const [fromRate, toRate] = await Promise.all([getRate(from), getRate(to)]);

  const fromUSD = amount * fromRate;
  const toAmount = fromUSD / toRate;

  return { fromUSD, toAmount };
}
