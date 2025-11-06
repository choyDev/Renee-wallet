
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCopy, FiLoader } from "react-icons/fi";
import { SiSolana, SiEthereum, SiBitcoin, SiTether, SiDogecoin, SiRipple, SiMonero } from "react-icons/si";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import { walletEventBus } from "@/lib/events";

const TronIcon = ({ className = "w-4 h-4 text-[#FF4747]" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M1.5 3.75L12 22.5L22.5 3.75L12 1.5L1.5 3.75ZM12 4.5L18.24 5.76L12 20.1L5.76 5.76L12 4.5ZM9.3 7.26L12 12.93L14.7 7.26H9.3Z" />
  </svg>
);

type SymbolCode = "SOL" | "TRX" | "ETH" | "BTC" | "DOGE" | "XMR" | "XRP";
type TokenCode = "NATIVE" | "USDT";
type WalletBrief = { id: number; address: string };
type SendResult = { id: string; link?: string };

interface Props {
  type: "send" | "receive";
  currentChain?: SymbolCode;
  onClose: () => void;
  walletsBySymbol?: Partial<Record<SymbolCode, WalletBrief>>;
}

export default function SendReceiveModal({
  type,
  currentChain,
  onClose,
  walletsBySymbol = {},
}: Props) {
  const [selectedToken, setSelectedToken] = useState<TokenCode>("NATIVE");
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSym = currentChain ?? "SOL";
  const currentWallet = walletsBySymbol[selectedSym];
  const currentAddress = currentWallet?.address ?? "—";

  // Choose icon for each network
  const networkIcons: Record<SymbolCode, React.ReactNode> = {
    SOL: <SiSolana className="text-[#14F195] text-lg" />,
    TRX: <TronIcon />,
    ETH: <SiEthereum className="text-[#627EEA] text-lg" />,
    BTC: <SiBitcoin className="text-[#F7931A] text-lg" />,
    DOGE:<SiDogecoin className="text-[#C2A633] text-lg" />,
    XMR: <SiMonero className="text-[#FF6600] text-lg" />,
    XRP: <SiRipple className="text-[#0A74E6] text-lg" />,
  };

  // token options per chain
  const tokensForNetwork: { code: TokenCode; label: string }[] =
    selectedSym === "BTC" || "DOGE" || "XMR" || "XRP"
      ? [{ code: "NATIVE", label: selectedSym }]
      : [
          { code: "NATIVE", label: selectedSym },
          { code: "USDT", label: "USDT" },
        ];

  /* ------------------ SEND FUNCTIONS ------------------ */
  async function sendNative(): Promise<SendResult> {
    const amt = parseFloat(amount);
    let endpoint = "";
    let body: any = { fromWalletId: currentWallet!.id, to, amount };

    switch (selectedSym) {
      case "SOL":
        endpoint = "/api/solana/send";
        body = { fromWalletId: currentWallet!.id, to, amountSol: amt, memo: memo || undefined };
        break;
      case "TRX":
        endpoint = "/api/tron/send";
        body = { fromWalletId: currentWallet!.id, to, amountTrx: amt };
        break;
      case "ETH":
        endpoint = "/api/eth/send";
        body = { fromWalletId: currentWallet!.id, to, amountEth: amt };
        break;
      case "BTC":
        endpoint = "/api/bitcoin/send";
        body = { fromWalletId: currentWallet!.id, to, amountBtc: amt };
        break;
        case "DOGE":
          endpoint = "/api/dogecoin/send";
          body = { fromWalletId: currentWallet!.id, to, amountDoge: amt };
          break;

        case "XRP":
          endpoint = "/api/xrp/send";
          body = { fromWalletId: currentWallet!.id, to, amountXrp: amt, memo: memo || undefined };
          break;
    
        case "XMR":
          endpoint = "/api/monero/send";
          body = { fromWalletId: currentWallet!.id, to, amountXmr: amt, paymentId: memo || undefined };
          break;
      default:
        throw new Error("Unsupported chain");
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
    return { id: data.signature || data.txid || data.hash, link: data.explorerTx };
  }

  async function sendUSDT(): Promise<SendResult> {
    const amt = parseFloat(amount);
    let endpoint = "";

    switch (selectedSym) {
      case "TRX":
        endpoint = "/api/tron/send-usdt";
        break;
      case "ETH":
        endpoint = "/api/eth/send-usdt";
        break;
      case "SOL":
        endpoint = "/api/solana/send-usdt";
        break;
      default:
        throw new Error(`USDT not supported on ${selectedSym}`);
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromWalletId: currentWallet!.id, to, amountUsdt: amt }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
    return { id: data.signature || data.txid || data.hash, link: data.explorerTx };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!currentWallet?.id) throw new Error("No wallet for this chain");
      const amt = parseFloat(amount);
      if (!to || !Number.isFinite(amt) || amt <= 0)
        throw new Error("Enter valid address and amount");

      const result =
        selectedToken === "USDT" ? await sendUSDT() : await sendNative();

      toast.success("Transaction sent successfully!");
      walletEventBus.refresh();
      setTimeout(onClose, 500);
    } catch (err: any) {
      setError(err.message || "Transaction failed");
      toast.error(err.message || "Failed to send");
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------ UI ------------------ */
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]
                     bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 24 }}
        >
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition disabled:opacity-40"
          >
            <FiX size={22} />
          </button>

          <h2 className="text-xl font-semibold text-white mb-6 capitalize tracking-wide">
            {type === "send" ? "Send Crypto" : "Receive Crypto"}
          </h2>

          {/* ====== RECEIVE MODE ====== */}
          {type === "receive" && (
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="bg-white p-3 rounded-xl">
                <QRCode value={currentAddress} size={150} />
              </div>
              <p className="text-sm text-gray-300">
                Your {selectedSym} Address
              </p>
              <div className="flex items-center justify-between bg-white/10 px-4 py-2 rounded-xl w-full text-sm text-gray-100 border border-white/10">
                <span className="truncate">{currentAddress}</span>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(currentAddress);
                    toast.success("Address copied!");
                  }}
                  className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 rounded-md text-xs font-semibold text-white hover:opacity-90 transition"
                >
                  <FiCopy size={14} /> Copy
                </button>
              </div>
            </div>
          )}

          {/* ====== SEND MODE ====== */}
          {type === "send" && (
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Recipient Address
                </label>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  type="text"
                  placeholder="Enter recipient address"
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Token Selector (Custom Styled) */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Select Token</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTokenDropdown((v) => !v)}
                      disabled={submitting}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-white/10 
                                bg-white/5 hover:bg-white/10 transition text-white font-medium focus:outline-none"
                    >
                      <div className="flex items-center gap-2">
                        {selectedToken === "USDT" ? (
                          <SiTether className="text-[#26A17B] text-lg" />
                        ) : (
                          networkIcons[selectedSym]
                        )}
                        <span>{selectedToken === "USDT" ? "USDT" : selectedSym}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-300 transition-transform ${
                          showTokenDropdown ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown List */}
                    {showTokenDropdown && (
                      <div
                        className="absolute mt-2 w-full bg-[#1e293b]/95 border border-white/10 rounded-xl shadow-lg z-10 backdrop-blur-md"
                      >
                        {tokensForNetwork.map((t) => (
                          <button
                            key={t.code}
                            onClick={() => {
                              setSelectedToken(t.code);
                              setShowTokenDropdown(false);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left text-white hover:bg-white/10 transition"
                          >
                            {t.code === "USDT" ? (
                              <SiTether className="text-[#26A17B] text-lg" />
                            ) : (
                              networkIcons[selectedSym]
                            )}
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Amount ({selectedToken === "NATIVE" ? selectedSym : "USDT"})
                </label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={submitting || !currentWallet?.id}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting
                  ? "Sending..."
                  : `Send ${
                      selectedToken === "NATIVE" ? selectedSym : "USDT"
                    }`}
              </button>
            </form>
          )}

          {submitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl"
            >
              <FiLoader className="text-blue-400 animate-spin mb-3" size={28} />
              <p className="text-gray-200 text-sm">
                Processing transaction...
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
