import TronWeb from "tronweb";
import fs from "fs-extra";
import solc from "solc";
import dotenv from "dotenv";
dotenv.config();

// ---------------------------------------------------
// 🔧 Tron setup
// ---------------------------------------------------
const tronWeb = new TronWeb({
  fullHost: process.env.TRON_NILE_RPC || "https://nile.trongrid.io",
  privateKey: process.env.TRX_BRIDGE_PRIVATE_KEY,
});

// ---------------------------------------------------
// 🧠 Helper: Compile Solidity file (supports imports)
// ---------------------------------------------------
async function compileContract(file, contractName) {
  console.log(`📦 Compiling ${file} ...`);

  const source = fs.readFileSync(file, "utf8");

  // include both contracts if BridgeVault imports WrappedToken
  const sources = {
    [file]: { content: source },
  };

  // if the main file imports WrappedToken.sol, include it manually too
  if (file.includes("BridgeVault.sol") && fs.existsSync("./WrappedToken.sol")) {
    sources["./WrappedToken.sol"] = {
      content: fs.readFileSync("./WrappedToken.sol", "utf8"),
    };
  }

  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const fileKeys = Object.keys(output.contracts || {});

  if (fileKeys.length === 0) {
    console.log("⚠️ Full compiler output:", JSON.stringify(output, null, 2));
    throw new Error(`❌ No compiled files found in output`);
  }

  const matchingKey =
    fileKeys.find((k) => k.endsWith(file.split("/").pop() || "")) ||
    fileKeys[0];

  const contract = output.contracts[matchingKey]?.[contractName];
  if (!contract) {
    console.error(
      `⚠️ Available contracts in ${matchingKey}:`,
      Object.keys(output.contracts[matchingKey] || {})
    );
    throw new Error(`❌ Contract ${contractName} not found in ${matchingKey}`);
  }

  const abi = contract.abi;
  const bytecode = "0x" + contract.evm.bytecode.object;
  console.log(`✅ Compiled ${contractName} successfully!\n`);
  return { abi, bytecode };
}

// ---------------------------------------------------
// 🚀 Helper: Deploy contract
// ---------------------------------------------------
async function deployContract(abi, bytecode, params = []) {
  const contract = await tronWeb.contract().new({
    abi,
    bytecode,
    parameters: params,
  });
  return contract;
}

// ---------------------------------------------------
// 🚀 Deploy WrappedToken + BridgeVault pair
// ---------------------------------------------------
async function deployWrappedAndVault(symbol, name) {
  console.log(`\n🚀 Deploying ${name} (${symbol}) pair...`);

  const { abi: tokenAbi, bytecode: tokenBytecode } = await compileContract(
    "./WrappedToken.sol",
    "WrappedToken"
  );
  const { abi: vaultAbi, bytecode: vaultBytecode } = await compileContract(
    "./BridgeVault.sol",
    "BridgeVault"
  );

  console.log("📦 Deploying WrappedToken...");
  const token = await deployContract(tokenAbi, tokenBytecode, [name, symbol]);
  console.log(`✅ WrappedToken deployed at: ${token.address}`);

  console.log("📦 Deploying BridgeVault...");
  const vault = await deployContract(vaultAbi, vaultBytecode, [token.address]);
  console.log(`✅ BridgeVault deployed at: ${vault.address}`);

  fs.appendFileSync(
    ".env",
    `\n${symbol}_TOKEN=${token.address}\n${symbol}_VAULT=${vault.address}\n`
  );
  console.log("📝 Saved to .env ✅");
}

// ---------------------------------------------------
// 🏁 Main
// ---------------------------------------------------
async function main() {
  const deployer = await tronWeb.address.fromPrivateKey(process.env.TRX_BRIDGE_PRIVATE_KEY);
  console.log("👤 Deployer:", deployer);

  //await deployWrappedAndVault("WSOL", "Wrapped SOL");
  //await deployWrappedAndVault("WETH", "Wrapped ETH");
  //await deployWrappedAndVault("WBTC", "Wrapped BTC");
  await deployWrappedAndVault("WUSDT", "Wrapped USDT");
}

main().catch((err) => console.error("❌ Deployment failed:", err));
