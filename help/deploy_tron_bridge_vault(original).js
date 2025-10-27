import TronWeb from "tronweb";
import fs from "fs-extra";
import solc from "solc";
import dotenv from "dotenv";
dotenv.config();

const tronWeb = new TronWeb({
  fullHost: process.env.TRON_NILE_RPC,
  privateKey: process.env.TRX_BRIDGE_PRIVATE_KEY,
});

async function main() {
  console.log("📦 Compiling contract...");

  const source = fs.readFileSync("./TronBridgeVault.sol(original)", "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "BridgeVault.sol": { content: source },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contractName = "BridgeVault";
  const contract = output.contracts["BridgeVault.sol"][contractName];

  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  console.log("✅ Compiled successfully!");

  const Contract = await tronWeb.contract().new({
    abi,
    bytecode: "0x" + bytecode,
  });

  console.log("🚀 BridgeVault deployed at:", Contract.address);
}

main().catch((err) => console.error("❌ Deployment failed:", err));
