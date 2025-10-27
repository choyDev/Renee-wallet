import TronWeb from "tronweb";

(async () => {
  const tronWeb = new TronWeb({
    fullHost: process.env.TRON_NILE_RPC || "https://nile.trongrid.io",
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
  });

  const addr = process.env.TRON_TESTNET_USDT_CONTRACT || "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf";

  console.log("🔍 Testing contract:", addr);
  console.log("Valid address?", tronWeb.isAddress(addr));

  try {
    const contract = await tronWeb.contract().at(addr);
    const name = await contract.name().call();
    console.log("✅ Contract loaded:", name);
  } catch (err) {
    console.error("❌ Failed:", err.message);
  }
})();
