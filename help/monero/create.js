const axios = require("axios");

const RPC_URL = "http://127.0.0.1:38083/json_rpc";
const walletName = "testwallet1";
const walletPassword = "123456";

async function createWallet() {
  try {
    const res = await axios.post(
      RPC_URL,
      {
        jsonrpc: "2.0",
        id: "0",
        method: "create_wallet",
        params: {
          filename: walletName,
          password: walletPassword,
          language: "English",
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("✅ Wallet created:", res.data);

    // Now get its primary address
    const addr = await axios.post(
      RPC_URL,
      { jsonrpc: "2.0", id: "0", method: "get_address" },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("💳 Wallet address:", addr.data.result.address);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}

createWallet();
