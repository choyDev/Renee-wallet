// import { spawn, ChildProcess } from "child_process";
// import net from "net";
// import axios from "axios";

// // ─────────────────────────────────────────────
// // ENVIRONMENT-AWARE CONFIGURATION
// // ─────────────────────────────────────────────
// const isWindows = process.platform === "win32";


// const WALLET_DIR = isWindows
//   ? "C:\\monero\\wallets"            // development on Windows
//   : "/opt/monero/wallets";           // production on Ubuntu

// const BIN = isWindows
//   ? "C:\\monero\\monero-wallet-rpc.exe"
//   : "/usr/local/bin/monero-wallet-rpc"; // adjust if installed elsewhere

// const DAEMON = "stagenet.xmr-tw.org:38081"; // or mainnet node if needed
// const DEBUG = true

// function log(...args: any[]) {
//   if (DEBUG) console.log("[XMR-RPC]", ...args);
// }

// // ─────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────
// async function getFreePort(): Promise<number> {
//   return new Promise((resolve) => {
//     const s = net.createServer();
//     s.listen(0, () => {
//       const port = (s.address() as any).port;
//       s.close(() => resolve(port));
//     });
//   });
// }

// async function waitForPort(port: number, timeoutMs = 10000) {
//   const start = Date.now();
//   return new Promise<void>((resolve, reject) => {
//     const check = () => {
//       const sock = net.connect(port, "127.0.0.1");
//       sock.on("connect", () => {
//         sock.end();
//         resolve();
//       });
//       sock.on("error", () => {
//         if (Date.now() - start > timeoutMs)
//           reject(new Error(`RPC not responding on ${port}`));
//         else setTimeout(check, 400);
//       });
//     };
//     check();
//   });
// }

// // ─────────────────────────────────────────────
// // CORE FUNCTION
// // ─────────────────────────────────────────────
// export async function callXmrOnce(
//   walletName: string,
//   walletPassword: string,
//   method: string,
//   params?: Record<string, any>
// ) {
//   const port = await getFreePort();
//   const rpcUrl = `http://127.0.0.1:${port}/json_rpc`;

//   // 1️⃣ Spawn temporary monero-wallet-rpc
//   const rpcProc: ChildProcess = spawn(BIN, [
//     "--stagenet",
//     `--daemon-address=${DAEMON}`,
//     `--wallet-dir=${WALLET_DIR}`,
//     "--rpc-bind-ip=127.0.0.1",
//     `--rpc-bind-port=${port}`,
//     "--disable-rpc-login",
//     "--log-level=0",
//   ]);

//   rpcProc.stdout?.on("data", (d) => DEBUG && console.log("[monero-wallet-rpc]", d.toString()));
//   rpcProc.stderr?.on("data", (d) => DEBUG && console.error("[monero-wallet-rpc err]", d.toString()));

//   rpcProc.on("error", (err) => log("spawn error:", err.message));

//   try {
//     // 2️⃣ Wait for RPC to come online
//     await waitForPort(port);
//     log(`🚀 RPC started on ${port}`);

//     // 3️⃣ Open wallet
//     await axios.post(rpcUrl, {
//       jsonrpc: "2.0",
//       id: "0",
//       method: "open_wallet",
//       params: { filename: walletName, password: walletPassword },
//     }).catch(() => null);

//     // 4️⃣ Perform the requested operation
//     const res = await axios.post(rpcUrl, {
//       jsonrpc: "2.0",
//       id: "0",
//       method,
//       params,
//     });

//     if (res.data.error) throw new Error(res.data.error.message);
//     const result = res.data.result;

//     // 5️⃣ Close wallet gracefully
//     await axios.post(rpcUrl, {
//       jsonrpc: "2.0",
//       id: "0",
//       method: "close_wallet",
//     }).catch(() => null);

//     return result;
//   } catch (err: any) {
//     log("❌ RPC error:", err.response?.data || err.message);
//     throw err;
//   } finally {
//     // 6️⃣ Always kill RPC process cleanly
//     try {
//       rpcProc.kill("SIGTERM");
//       log(`💀 RPC process stopped (${port})`);
//     } catch (e) {
//       log("⚠️ kill error:", e);
//     }
//   }
// }


import { spawn, ChildProcess } from "child_process";
import net from "net";
import axios from "axios";

// ─────────────────────────────────────────────
// ENVIRONMENT-AWARE CONFIGURATION
// ─────────────────────────────────────────────
const isWindows = process.platform === "win32";

const WALLET_DIR = isWindows
  ? "C:\\monero\\wallets"
  : "/opt/monero/wallets";

const BIN = isWindows
  ? "C:\\monero\\monero-wallet-rpc.exe"
  : "/usr/local/bin/monero-wallet-rpc";

const DAEMON = "stagenet.xmr-tw.org:38081";
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) console.log("[XMR-RPC]", ...args);
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function getFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, () => {
      const port = (s.address() as any).port;
      s.close(() => resolve(port));
    });
  });
}

async function waitForPort(port: number, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const check = () => {
      const sock = net.connect(port, "127.0.0.1");
      sock.on("connect", () => {
        sock.end();
        resolve();
      });
      sock.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`RPC not responding on ${port} after ${timeoutMs}ms`));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

// ─────────────────────────────────────────────
// PROCESS POOL - REUSE INSTANCES
// ─────────────────────────────────────────────
type RpcInstance = {
  port: number;
  process: ChildProcess;
  inUse: boolean;
  currentWallet: string | null;
  lastUsed: number;
};

const rpcPool = new Map<string, RpcInstance>(); // key = walletName
const IDLE_TIMEOUT = 120000; // 2 minutes - kill idle processes
const CLEANUP_INTERVAL = 60000; // Check every minute

// Cleanup idle processes
setInterval(() => {
  const now = Date.now();
  for (const [walletName, instance] of rpcPool.entries()) {
    if (!instance.inUse && now - instance.lastUsed > IDLE_TIMEOUT) {
      log(`🧹 Cleaning up idle RPC for wallet: ${walletName}`);
      try {
        instance.process.kill("SIGTERM");
      } catch (e) {
        log("⚠️ Error killing idle process:", e);
      }
      rpcPool.delete(walletName);
    }
  }
}, CLEANUP_INTERVAL);

// ─────────────────────────────────────────────
// GET OR CREATE RPC INSTANCE
// ─────────────────────────────────────────────
async function getOrCreateRpcInstance(walletName: string): Promise<RpcInstance> {
  // Check if we already have an instance for this wallet
  const existing = rpcPool.get(walletName);
  if (existing) {
    log(`♻️ Reusing existing RPC instance for ${walletName} on port ${existing.port}`);
    existing.inUse = true;
    existing.lastUsed = Date.now();
    return existing;
  }

  // Create new instance
  log(`🆕 Creating new RPC instance for ${walletName}`);
  const port = await getFreePort();
  const rpcUrl = `http://127.0.0.1:${port}/json_rpc`;

  const rpcProc: ChildProcess = spawn(BIN, [
    "--stagenet",
    `--daemon-address=${DAEMON}`,
    `--wallet-dir=${WALLET_DIR}`,
    "--rpc-bind-ip=127.0.0.1",
    `--rpc-bind-port=${port}`,
    "--disable-rpc-login",
    "--log-level=0",
  ]);

  rpcProc.stdout?.on("data", (d) => DEBUG && console.log(`[RPC-${port}]`, d.toString().trim()));
  rpcProc.stderr?.on("data", (d) => DEBUG && console.error(`[RPC-${port} err]`, d.toString().trim()));

  rpcProc.on("error", (err) => log(`Spawn error on port ${port}:`, err.message));
  rpcProc.on("exit", (code) => {
    log(`💀 RPC process ${port} exited with code ${code}`);
    rpcPool.delete(walletName);
  });

  // Wait for RPC to start
  await waitForPort(port);
  log(`✅ RPC started on ${port}`);

  const instance: RpcInstance = {
    port,
    process: rpcProc,
    inUse: true,
    currentWallet: null,
    lastUsed: Date.now(),
  };

  rpcPool.set(walletName, instance);
  return instance;
}

// ─────────────────────────────────────────────
// MAIN FUNCTION - WITH PROCESS REUSE
// ─────────────────────────────────────────────
export async function callXmrOnce(
  walletName: string,
  walletPassword: string,
  method: string,
  params?: Record<string, any>
) {
  const instance = await getOrCreateRpcInstance(walletName);
  const rpcUrl = `http://127.0.0.1:${instance.port}/json_rpc`;

  try {
    // Open wallet if not already open or if different wallet
    if (instance.currentWallet !== walletName) {
      log(`🔓 Opening wallet: ${walletName}`);
      const openRes = await axios.post(rpcUrl, {
        jsonrpc: "2.0",
        id: "0",
        method: "open_wallet",
        params: { filename: walletName, password: walletPassword },
      });

      if (openRes.data.error) {
        // If wallet not found, maybe it needs to be created first
        if (openRes.data.error.message?.includes("not found")) {
          throw new Error(`Wallet file "${walletName}" not found in ${WALLET_DIR}`);
        }
        throw new Error(openRes.data.error.message);
      }

      instance.currentWallet = walletName;
      log(`✅ Wallet opened: ${walletName}`);
    } else {
      log(`📂 Wallet already open: ${walletName}`);
    }

    // Perform the requested operation
    log(`📞 Calling method: ${method}`);
    const res = await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      id: "0",
      method,
      params,
    });

    if (res.data.error) {
      throw new Error(res.data.error.message);
    }

    log(`✅ Method ${method} successful`);
    return res.data.result;
  } catch (err: any) {
    log("❌ RPC error:", err.response?.data || err.message);
    
    // If critical error, kill this instance so it can be recreated
    if (err.message?.includes("locked") || err.message?.includes("not found")) {
      log(`🗑️ Removing failed RPC instance for ${walletName}`);
      try {
        instance.process.kill("SIGTERM");
      } catch (e) {}
      rpcPool.delete(walletName);
    }
    
    throw err;
  } finally {
    // Mark as not in use (but keep alive for reuse)
    instance.inUse = false;
    instance.lastUsed = Date.now();
  }
}

// ─────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────
process.on("SIGTERM", () => {
  log("🛑 SIGTERM received, closing all RPC instances...");
  for (const [walletName, instance] of rpcPool.entries()) {
    try {
      instance.process.kill("SIGTERM");
    } catch (e) {}
  }
  process.exit(0);
});

process.on("SIGINT", () => {
  log("🛑 SIGINT received, closing all RPC instances...");
  for (const [walletName, instance] of rpcPool.entries()) {
    try {
      instance.process.kill("SIGTERM");
    } catch (e) {}
  }
  process.exit(0);
});