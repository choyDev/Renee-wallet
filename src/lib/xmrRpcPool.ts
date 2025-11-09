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
// SIMPLIFIED APPROACH: ONE SHARED RPC INSTANCE
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
// SEQUENTIAL REQUEST QUEUE
// ─────────────────────────────────────────────
class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }
    this.processing = false;
  }
}

const requestQueue = new RequestQueue();

// ─────────────────────────────────────────────
// SHARED RPC INSTANCE
// ─────────────────────────────────────────────
let sharedRpc: {
  port: number;
  process: ChildProcess;
  url: string;
  currentWallet: string | null;
} | null = null;

async function getFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, () => {
      const port = (s.address() as any).port;
      s.close(() => resolve(port));
    });
  });
}

async function waitForPort(port: number, timeoutMs = 20000) {
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
          reject(new Error(`RPC not responding on ${port}`));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

async function ensureRpcRunning() {
  if (sharedRpc) {
    // Check if still alive
    try {
      await axios.post(sharedRpc.url, {
        jsonrpc: "2.0",
        id: "0",
        method: "get_version",
      }, { timeout: 3000 });
      return sharedRpc;
    } catch (e) {
      log("⚠️ Shared RPC not responding, restarting...");
      try {
        sharedRpc.process.kill("SIGKILL");
      } catch {}
      sharedRpc = null;
    }
  }

  // Start new RPC instance
  log("🆕 Starting shared RPC instance");
  const port = await getFreePort();
  const url = `http://127.0.0.1:${port}/json_rpc`;

  const rpcProc = spawn(BIN, [
    "--stagenet",
    `--daemon-address=${DAEMON}`,
    `--wallet-dir=${WALLET_DIR}`,
    "--rpc-bind-ip=127.0.0.1",
    `--rpc-bind-port=${port}`,
    "--disable-rpc-login",
    "--log-level=0",
  ], {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  rpcProc.stdout?.on("data", (d) => DEBUG && console.log(`[SHARED-RPC]`, d.toString().trim()));
  rpcProc.stderr?.on("data", (d) => DEBUG && console.error(`[SHARED-RPC err]`, d.toString().trim()));

  rpcProc.on("error", (err) => {
    log("❌ Spawn error:", err.message);
    sharedRpc = null;
  });
  
  rpcProc.on("exit", (code) => {
    log(`💀 Shared RPC exited with code ${code}`);
    sharedRpc = null;
  });

  await waitForPort(port);
  log(`✅ Shared RPC started on port ${port}`);

  sharedRpc = { port, process: rpcProc, url, currentWallet: null };
  
  // Small delay for initialization
  await new Promise(r => setTimeout(r, 500));
  
  return sharedRpc;
}

// ─────────────────────────────────────────────
// MAIN FUNCTION - SEQUENTIAL PROCESSING
// ─────────────────────────────────────────────
export async function callXmrOnce(
  walletName: string,
  walletPassword: string,
  method: string,
  params?: Record<string, any>
): Promise<any> {
  // All requests go through sequential queue
  return requestQueue.add(async () => {
    const rpc = await ensureRpcRunning();
    
    try {
      // Switch wallet if needed
      if (rpc.currentWallet !== walletName) {
        log(`🔄 Switching to wallet: ${walletName}`);
        
        // Close current wallet if any
        if (rpc.currentWallet) {
          try {
            await axios.post(rpc.url, {
              jsonrpc: "2.0",
              id: "0",
              method: "close_wallet",
            }, { timeout: 5000 });
            log(`📪 Closed previous wallet`);
          } catch (e) {
            // Ignore
          }
        }

        // Open new wallet
        const openRes = await axios.post(rpc.url, {
          jsonrpc: "2.0",
          id: "0",
          method: "open_wallet",
          params: { filename: walletName, password: walletPassword },
        }, { timeout: 15000 });

        if (openRes.data.error) {
          const errMsg = openRes.data.error.message || "";
          
          if (errMsg.includes("not found")) {
            throw new Error(`Wallet "${walletName}" not found in ${WALLET_DIR}`);
          }
          
          if (errMsg.includes("locked")) {
            log(`⚠️ Wallet locked, restarting RPC...`);
            try {
              rpc.process.kill("SIGKILL");
            } catch {}
            sharedRpc = null;
            
            // Retry once
            await new Promise(r => setTimeout(r, 2000));
            return callXmrOnce(walletName, walletPassword, method, params);
          }
          
          throw new Error(errMsg);
        }

        rpc.currentWallet = walletName;
        log(`✅ Opened wallet: ${walletName}`);
        
        // Wait for wallet to sync
        await new Promise(r => setTimeout(r, 1500));
      } else {
        log(`📂 Using already open wallet: ${walletName}`);
      }

      // Execute method
      log(`📞 Calling ${method} on ${walletName}`);
      const res = await axios.post(rpc.url, {
        jsonrpc: "2.0",
        id: "0",
        method,
        params,
      }, { timeout: 30000 });

      if (res.data.error) {
        throw new Error(res.data.error.message);
      }

      log(`✅ ${method} successful on ${walletName}`);
      return res.data.result;
      
    } catch (err: any) {
      log(`❌ Error with ${walletName}:`, err.response?.data || err.message);
      throw err;
    }
  });
}

// ─────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────
async function shutdown() {
  log("🛑 Shutting down...");
  if (sharedRpc) {
    try {
      await axios.post(sharedRpc.url, {
        jsonrpc: "2.0",
        id: "0",
        method: "close_wallet",
      }, { timeout: 2000 }).catch(() => {});
      
      sharedRpc.process.kill("SIGTERM");
    } catch (e) {}
  }
  setTimeout(() => process.exit(0), 1000);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);