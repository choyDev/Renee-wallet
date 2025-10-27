export const IS_TEST = process.env.CHAIN_ENV === "testnet";

/** -------- Ethereum (Sepolia/Mainnet) --------
 * Uniswap V2 Router02:
 *  - mainnet: 0x7a250d56...
 *  - sepolia: 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3 (official Uniswap V2) */
export const ETH = {
  RPC: IS_TEST ? process.env.ETH_RPC_TESTNET! : process.env.ETH_RPC_MAINNET!,
  CHAIN_ID: IS_TEST ? 11155111 : 1,

  // � make testnet addresses lowercase to avoid checksum validation
  ROUTER_V2: IS_TEST
    ? "0xee567fe1712faf6149d80da1e6934e354124cfe3"
    : "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // mainnet is fine (checksummed)

  WETH: IS_TEST
    ? "0xfff9976782d46cc05630d1f6ebab18b2324d6b14"
    : "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",

  USDT: IS_TEST
    ? "0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0" // your test token
    : "0xdac17f958d2ee523a2206206994597c13d831ec7",

  USDT_DECIMALS: 6,
} as const;


/** -------- Solana (devnet/mainnet) -------- */
export const SOL = {
  RPC: IS_TEST ? process.env.SOLANA_DEVNET_RPC! : process.env.SOLANA_MAINNET_RPC!,
  // USDT mints
  USDT_MINT: IS_TEST
    ? 
      // "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr" // USDC-Dev (often works)
      "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" // USDC devnet (sometimes disabled)
     // you can replace with actual devnet USDT mint if different
    : "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" // mainnet USDT (classic)
  // We’ll rely on Jupiter for routing
} as const;

/** -------- Tron (Nile/Mainnet) --------
 * SUNSwap router (Uniswap-v2 style). Nile liquidity is poor; disable on testnet. */
export const TRON = {
  RPC: IS_TEST ? process.env.TRON_NILE_RPC! : process.env.TRON_MAINNET_RPC!,
  // SunSwap V2 Router (mainnet)
  ROUTER: IS_TEST ? null : "TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax",
  // USDT TRC-20 (mainnet)
  USDT: IS_TEST ? null : "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  USDT_DECIMALS: 6,
} as const;