const axios = require("axios");
const RPC_URL = "http://127.0.0.1:38083/json_rpc";

// Reusable function to open any wallet and get its balance
async function getWalletBalance(walletName, walletPassword) {
  try {
    // 1️⃣ Open wallet
    await axios.post(
      RPC_URL,
      {
        jsonrpc: "2.0",
        id: "0",
        method: "open_wallet",
        params: {
          filename: walletName,
          password: walletPassword,
        },
      },
      { headers: { "Content-Type": "application/json" } }
    );

    // 2️⃣ Query balance
    const res = await axios.post(
      RPC_URL,
      {
        jsonrpc: "2.0",
        id: "0",
        method: "get_balance",
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const result = res.data.result;
    const total = result.balance / 1e12;
    const unlocked = result.unlocked_balance / 1e12;

    console.log(`💼 Wallet: ${walletName}`);
    console.log(`💰 Total: ${total} XMR`);
    console.log(`🔓 Unlocked: ${unlocked} XMR\n`);
  } catch (err) {
    console.error(`❌ Error for wallet ${walletName}:`, err.response?.data || err.message);
  }
}

// Example: loop through multiple user wallets
(async () => {
  const wallets = [
    { name: "user_8_xmr", password: "c0a090367bc33a926ff93b33" },
    { name: "user_9_xmr", password: "cc33a8b0cf30a03ece3ad276" },
    
  ];

  for (const w of wallets) {
    await getWalletBalance(w.name, w.password);
  }
})();
