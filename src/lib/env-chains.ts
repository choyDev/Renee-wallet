const isTestnet = () => process.env.CHAIN_ENV === "testnet";
const pick = (testVal?: string, mainVal?: string) =>
  isTestnet() ? (testVal || "") : (mainVal || "");

export const rpc = {
  SOL: () => pick(process.env.SOLANA_DEVNET_RPC, process.env.SOLANA_MAINNET_RPC),
  TRX: () => pick(process.env.TRON_SHASTA_RPC,   process.env.TRON_MAINNET_RPC),
  ETH: () => pick(process.env.ETH_RPC_TESTNET,   process.env.ETH_RPC_MAINNET),
};
export const explorer = {
  ETH: () => pick(process.env.ETH_EXPLORER_TESTNET, process.env.ETH_EXPLORER_MAINNET),
  BTC: () => pick(process.env.BTC_EXPLORER_TESTNET, process.env.BTC_EXPLORER_MAINNET),
};
export const btcApi = () =>
  pick(process.env.BTC_API_TESTNET, process.env.BTC_API_MAINNET);
export const isTest = isTestnet;
