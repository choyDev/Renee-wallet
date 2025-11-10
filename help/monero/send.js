const axios = require("axios");

// RPC endpoint (your running wallet-rpc)
const RPC_URL = "http://127.0.0.1:38083/json_rpc";

// === Sender wallet info ===
const senderWallet = "testwallet";      // name of wallet that has balance
const senderPassword = "123456";

// === Receiver address ===
const receiverAddress = "53c77jPxKTUSu1ZKH1qMvXdRVSHWSzdzo8ej3bBsaGjVaCQFHtgFr8HFBtcLDXZfvCQwzXG3sn4fWUGbtT4tFcYXVF1ECnC"; // replace with wallet2 address

// === Amount to send ===
// 1 XMR = 1e12 atomic units → so 0.1 XMR = 1e11
const amountToSend = 0.001 * 1e12;  // send 0.1 XMR

async function openWallet() {
  console.log("🔓 Opening wallet...");
  await axios.post(
    RPC_URL,
    {
      jsonrpc: "2.0",
      id: "0",
      method: "open_wallet",
      params: {
        filename: senderWallet,
        password: senderPassword,
      },
    },
    { headers: { "Content-Type": "application/json" } }
  );
}

async function transferFunds() {
  try {
    await openWallet();

    console.log(`💸 Sending ${amountToSend / 1e12} XMR to ${receiverAddress}`);

    const res = await axios.post(
      RPC_URL,
      {
        jsonrpc: "2.0",
        id: "0",
        method: "transfer",
        params: {
          destinations: [
            {
              address: receiverAddress,
              amount: amountToSend,
            },
          ],
          priority: 0,         // 0 = default fee
          ring_size: 11,       // typical ring size
        },
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("✅ Transfer successful!");
    console.log(res.data.result);
    console.log("TX Hash:", res.data.result.tx_hash);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}

transferFunds();
