import { spawn, ChildProcess } from "child_process";
import net from "net";
import axios from "axios";

// ─────────────────────────────────────────────
// ENVIRONMENT-AWARE CONFIGURATION
// ─────────────────────────────────────────────
const isWindows = process.platform === "win32";


const WALLET_DIR = isWindows
  ? "C:\\monero\\wallets"            // development on Windows
  : "/opt/monero/wallets";           // production on Ubuntu

const BIN = isWindows
  ? "C:\\monero\\monero-wallet-rpc.exe"
  : "/usr/local/bin/monero-wallet-rpc"; // adjust if installed elsewhere

const DAEMON = "stagenet.xmr-tw.org:38081"; // or mainnet node if needed
const DEBUG = true

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

async function waitForPort(port: number, timeoutMs = 10000) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const check = () => {
      const sock = net.connect(port, "127.0.0.1");
      sock.on("connect", () => {
        sock.end();
        resolve();
      });
      sock.on("error", () => {
        if (Date.now() - start > timeoutMs)
          reject(new Error(`RPC not responding on ${port}`));
        else setTimeout(check, 400);
      });
    };
    check();
  });
}

// ─────────────────────────────────────────────
// CORE FUNCTION
// ─────────────────────────────────────────────
export async function callXmrOnce(
  walletName: string,
  walletPassword: string,
  method: string,
  params?: Record<string, any>
) {
  const port = await getFreePort();
  const rpcUrl = `http://127.0.0.1:${port}/json_rpc`;

  // 1️⃣ Spawn temporary monero-wallet-rpc
  const rpcProc: ChildProcess = spawn(BIN, [
    "--stagenet",
    `--daemon-address=${DAEMON}`,
    `--wallet-dir=${WALLET_DIR}`,
    "--rpc-bind-ip=127.0.0.1",
    `--rpc-bind-port=${port}`,
    "--disable-rpc-login",
    "--log-level=0",
  ]);

  rpcProc.stdout?.on("data", (d) => DEBUG && console.log("[monero-wallet-rpc]", d.toString()));
  rpcProc.stderr?.on("data", (d) => DEBUG && console.error("[monero-wallet-rpc err]", d.toString()));

  rpcProc.on("error", (err) => log("spawn error:", err.message));

  try {
    // 2️⃣ Wait for RPC to come online
    await waitForPort(port);
    log(`🚀 RPC started on ${port}`);

    // 3️⃣ Open wallet
    await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      id: "0",
      method: "open_wallet",
      params: { filename: walletName, password: walletPassword },
    }).catch(() => null);

    // 4️⃣ Perform the requested operation
    const res = await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      id: "0",
      method,
      params,
    });

    if (res.data.error) throw new Error(res.data.error.message);
    const result = res.data.result;

    // 5️⃣ Close wallet gracefully
    await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      id: "0",
      method: "close_wallet",
    }).catch(() => null);

    return result;
  } catch (err: any) {
    log("❌ RPC error:", err.response?.data || err.message);
    throw err;
  } finally {
    // 6️⃣ Always kill RPC process cleanly
    try {
      rpcProc.kill("SIGTERM");
      log(`💀 RPC process stopped (${port})`);
    } catch (e) {
      log("⚠️ kill error:", e);
    }
  }
}


