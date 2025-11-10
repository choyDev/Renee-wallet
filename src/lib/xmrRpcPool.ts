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
// PRODUCTION-OPTIMIZED FOR LINUX VPS
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
  if (DEBUG) console.log("[XMR-RPC]", new Date().toISOString(), ...args);
}

// ─────────────────────────────────────────────
// PERSISTENT RPC POOL - ONE PER WALLET
// ─────────────────────────────────────────────
type RpcInstance = {
  walletName: string;
  port: number;
  process: ChildProcess;
  url: string;
  ready: boolean;
  lastUsed: number;
  openedAt: number;
};

const rpcPool = new Map<string, RpcInstance>();
const pendingInits = new Map<string, Promise<RpcInstance>>();

// Keep wallets open for 10 minutes after last use
const WALLET_TIMEOUT = 10 * 60 * 1000;
const CLEANUP_INTERVAL = 60 * 1000;

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

async function waitForPort(port: number, timeoutMs = 30000) {
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
          setTimeout(check, 800);
        }
      });
    };
    check();
  });
}

async function testRpcAlive(url: string): Promise<boolean> {
  try {
    await axios.post(url, {
      jsonrpc: "2.0",
      id: "0",
      method: "get_version",
    }, { timeout: 3000 });
    return true;
  } catch (e) {
    return false;
  }
}


export async function createXmrWallet(
  walletName: string,
  walletPassword: string,
  language: string = "English"
): Promise<{ address: string; seed?: string }> {
  log(`🆕 [${walletName}] Creating new wallet...`);

  const port = await getFreePort();
  const url = `http://127.0.0.1:${port}/json_rpc`;

  // Spawn temporary RPC for creation only
  const args = [
    "--stagenet",
    `--daemon-address=${DAEMON}`,
    `--wallet-dir=${WALLET_DIR}`,
    "--rpc-bind-ip=127.0.0.1",
    `--rpc-bind-port=${port}`,
    "--disable-rpc-login",
    "--log-level=0",
    "--trusted-daemon",
  ];

  const rpcProc = spawn(BIN, args, {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  rpcProc.stdout?.on("data", (d) => {
    if (DEBUG) console.log(`[RPC-${port}]`, d.toString().trim());
  });

  rpcProc.stderr?.on("data", (d) => {
    const msg = d.toString().trim();
    if (DEBUG && msg) console.error(`[RPC-${port}]`, msg);
  });

  try {
    // Wait for RPC to start
    await waitForPort(port);
    log(`✅ [${walletName}] RPC started on port ${port}`);

    // Give it time to initialize
    await new Promise(r => setTimeout(r, 1000));

    // Create the wallet
    log(`🔨 [${walletName}] Calling create_wallet...`);
    const createRes = await axios.post(url, {
      jsonrpc: "2.0",
      id: "0",
      method: "create_wallet",
      params: {
        filename: walletName,
        password: walletPassword,
        language,
      },
    }, { timeout: 20000 });

    if (createRes.data.error) {
      const errMsg = createRes.data.error.message || "";
      log(`❌ [${walletName}] Create error:`, errMsg);
      throw new Error(errMsg);
    }

    log(`✅ [${walletName}] Wallet created successfully`);

    // Wait for wallet to finish creating
    await new Promise(r => setTimeout(r, 2000));

    // Get the address (wallet is already open after creation)
    log(`📍 [${walletName}] Getting address...`);
    const addrRes = await axios.post(url, {
      jsonrpc: "2.0",
      id: "0",
      method: "get_address",
      params: { account_index: 0 },
    }, { timeout: 10000 });

    if (addrRes.data.error) {
      throw new Error(addrRes.data.error.message);
    }

    const address = addrRes.data.result.address;
    log(`✅ [${walletName}] Address: ${address}`);

    // Optionally get seed
    let seed;
    try {
      const seedRes = await axios.post(url, {
        jsonrpc: "2.0",
        id: "0",
        method: "query_key",
        params: { key_type: "mnemonic" },
      }, { timeout: 5000 });

      if (!seedRes.data.error) {
        seed = seedRes.data.result.key;
      }
    } catch (e) {
      log(`⚠️ [${walletName}] Could not retrieve seed`);
    }

    // Close wallet gracefully
    log(`📪 [${walletName}] Closing wallet...`);
    await axios.post(url, {
      jsonrpc: "2.0",
      id: "0",
      method: "close_wallet",
    }, { timeout: 5000 }).catch(() => {});

    return { address, seed };

  } catch (err: any) {
    log(`❌ [${walletName}] Creation failed:`, err.response?.data || err.message);
    throw err;
  } finally {
    // Always kill the temporary RPC
    try {
      rpcProc.kill("SIGTERM");
      log(`💀 [${walletName}] Temporary RPC stopped (${port})`);
    } catch (e) {}
  }
}

// ─────────────────────────────────────────────
// GET OR CREATE DEDICATED RPC FOR WALLET
// ─────────────────────────────────────────────
async function getOrCreateRpc(walletName: string, walletPassword: string): Promise<RpcInstance> {
  // Check if already exists and is alive
  const existing = rpcPool.get(walletName);
  if (existing?.ready) {
    const alive = await testRpcAlive(existing.url);
    if (alive) {
      log(`♻️ [${walletName}] Reusing RPC on port ${existing.port} (age: ${Math.round((Date.now() - existing.openedAt) / 1000)}s)`);
      existing.lastUsed = Date.now();
      return existing;
    } else {
      log(`⚠️ [${walletName}] RPC dead, removing...`);
      try {
        existing.process.kill("SIGKILL");
      } catch (e) {}
      rpcPool.delete(walletName);
    }
  }

  // Check if already being initialized
  const pending = pendingInits.get(walletName);
  if (pending) {
    log(`⏳ [${walletName}] Waiting for pending init...`);
    return pending;
  }

  // Create new instance
  const initPromise = (async () => {
    try {
      log(`🆕 [${walletName}] Creating dedicated RPC instance...`);
      
      const port = await getFreePort();
      const url = `http://127.0.0.1:${port}/json_rpc`;

      // Spawn process with optimized flags for Linux
      const args = [
        "--stagenet",
        `--daemon-address=${DAEMON}`,
        `--wallet-dir=${WALLET_DIR}`,
        "--rpc-bind-ip=127.0.0.1",
        `--rpc-bind-port=${port}`,
        "--disable-rpc-login",
        "--log-level=0",
        "--trusted-daemon", // Speed up sync
      ];

      const rpcProc = spawn(BIN, args, {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Collect output for debugging
      let stdout = "";
      let stderr = "";
      
      rpcProc.stdout?.on("data", (d) => {
        const msg = d.toString().trim();
        stdout += msg + "\n";
        if (DEBUG) console.log(`[RPC-${port}]`, msg);
      });
      
      rpcProc.stderr?.on("data", (d) => {
        const msg = d.toString().trim();
        stderr += msg + "\n";
        if (DEBUG && msg) console.error(`[RPC-${port}]`, msg);
      });

      const instance: RpcInstance = {
        walletName,
        port,
        process: rpcProc,
        url,
        ready: false,
        lastUsed: Date.now(),
        openedAt: Date.now(),
      };

      // Handle process errors/exit
      rpcProc.on("error", (err) => {
        log(`❌ [${walletName}] Process error:`, err.message);
        rpcPool.delete(walletName);
        pendingInits.delete(walletName);
      });

      rpcProc.on("exit", (code, signal) => {
        log(`💀 [${walletName}] Process exited (code: ${code}, signal: ${signal})`);
        if (stderr) log(`[${walletName}] stderr:`, stderr.slice(-500));
        rpcPool.delete(walletName);
        pendingInits.delete(walletName);
      });

      // Wait for RPC to be ready
      log(`⏳ [${walletName}] Waiting for RPC on port ${port}...`);
      await waitForPort(port);
      log(`✅ [${walletName}] RPC port ${port} is listening`);

      // Give it extra time to fully initialize on Linux
      await new Promise(r => setTimeout(r, 1000));

      // Test if it's actually responding
      const alive = await testRpcAlive(url);
      if (!alive) {
        throw new Error("RPC not responding to test request");
      }

      // Open the wallet
      log(`🔓 [${walletName}] Opening wallet...`);
      const openRes = await axios.post(url, {
        jsonrpc: "2.0",
        id: "0",
        method: "open_wallet",
        params: { filename: walletName, password: walletPassword },
      }, { timeout: 20000 });

      if (openRes.data.error) {
        const errMsg = openRes.data.error.message || "";
        log(`❌ [${walletName}] Open wallet error:`, errMsg);
        
        if (errMsg.includes("not found")) {
          rpcProc.kill("SIGKILL");
          throw new Error(`Wallet "${walletName}" not found in ${WALLET_DIR}`);
        }
        
        if (errMsg.includes("locked") || errMsg.includes("Resource temporarily unavailable")) {
          rpcProc.kill("SIGKILL");
          throw new Error(`Wallet locked: ${errMsg}`);
        }
        
        rpcProc.kill("SIGKILL");
        throw new Error(errMsg);
      }

      log(`✅ [${walletName}] Wallet opened successfully`);
      
      // Wait for wallet to sync
      await new Promise(r => setTimeout(r, 2000));

      instance.ready = true;
      rpcPool.set(walletName, instance);
      pendingInits.delete(walletName);

      log(`🎉 [${walletName}] RPC fully ready on port ${port}`);
      return instance;

    } catch (err: any) {
      log(`❌ [${walletName}] Failed to create RPC:`, err.message);
      pendingInits.delete(walletName);
      throw err;
    }
  })();

  pendingInits.set(walletName, initPromise);
  return initPromise;
}

// ─────────────────────────────────────────────
// CLEANUP OLD INSTANCES
// ─────────────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [walletName, instance] of rpcPool.entries()) {
    const idle = now - instance.lastUsed;
    if (idle > WALLET_TIMEOUT) {
      log(`🧹 [${walletName}] Cleaning up (idle ${Math.round(idle / 1000)}s)`);
      try {
        // Close wallet gracefully
        axios.post(instance.url, {
          jsonrpc: "2.0",
          id: "0",
          method: "close_wallet",
        }, { timeout: 3000 }).catch(() => {});
        
        setTimeout(() => {
          instance.process.kill("SIGTERM");
        }, 1000);
      } catch (e) {}
      
      rpcPool.delete(walletName);
    }
  }
}, CLEANUP_INTERVAL);

// ─────────────────────────────────────────────
// MAIN FUNCTION - WITH AUTO-RETRY
// ─────────────────────────────────────────────
export async function callXmrOnce(
  walletName: string,
  walletPassword: string,
  method: string,
  params?: Record<string, any>,
  retryCount = 0
): Promise<any> {
  const MAX_RETRIES = 3;

  try {
    const instance = await getOrCreateRpc(walletName, walletPassword);

    // Execute method
    log(`📞 [${walletName}] Calling ${method}...`);
    const res = await axios.post(instance.url, {
      jsonrpc: "2.0",
      id: "0",
      method,
      params,
    }, { 
      timeout: 45000,
      // Keep connection alive
      headers: {
        'Connection': 'keep-alive',
      }
    });

    if (res.data.error) {
      throw new Error(res.data.error.message);
    }

    instance.lastUsed = Date.now();
    log(`✅ [${walletName}] ${method} successful`);
    return res.data.result;

  } catch (err: any) {
    log(`❌ [${walletName}] Error:`, err.response?.data?.error || err.message);

    // Remove failed instance
    const instance = rpcPool.get(walletName);
    if (instance) {
      try {
        instance.process.kill("SIGKILL");
      } catch (e) {}
      rpcPool.delete(walletName);
    }
    pendingInits.delete(walletName);

    // Auto-retry on specific errors
    const shouldRetry = 
      err.code === "ECONNREFUSED" ||
      err.code === "ETIMEDOUT" ||
      err.message?.includes("locked") ||
      err.message?.includes("not responding");

    if (shouldRetry && retryCount < MAX_RETRIES) {
      const delay = (retryCount + 1) * 2000; // 2s, 4s, 6s
      log(`🔄 [${walletName}] Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(r => setTimeout(r, delay));
      return callXmrOnce(walletName, walletPassword, method, params, retryCount + 1);
    }

    throw err;
  }
}

// ─────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────
async function shutdown() {
  log("🛑 Shutting down all RPC instances...");
  
  const closePromises = Array.from(rpcPool.values()).map(async (instance) => {
    try {
      log(`📪 [${instance.walletName}] Closing wallet...`);
      await axios.post(instance.url, {
        jsonrpc: "2.0",
        id: "0",
        method: "close_wallet",
      }, { timeout: 3000 }).catch(() => {});
      
      instance.process.kill("SIGTERM");
    } catch (e) {}
  });

  await Promise.all(closePromises);
  log("✅ All instances closed");
  
  setTimeout(() => process.exit(0), 2000);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("beforeExit", shutdown);

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
export async function getPoolStatus() {
  const status = Array.from(rpcPool.entries()).map(([name, inst]) => ({
    wallet: name,
    port: inst.port,
    ready: inst.ready,
    ageSeconds: Math.round((Date.now() - inst.openedAt) / 1000),
    idleSeconds: Math.round((Date.now() - inst.lastUsed) / 1000),
  }));
  
  return {
    activeInstances: rpcPool.size,
    pendingInits: pendingInits.size,
    instances: status,
  };
}