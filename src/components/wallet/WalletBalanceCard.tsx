
// "use client";

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   FaQrcode,
//   FaPaperPlane,
//   FaExchangeAlt,
//   FaLink,
// } from "react-icons/fa";

// import SendReceiveModal from "./modal/SendReceiveModal";
// import SwapModal from "./modal/SwapModal";
// import BridgeModal from "./modal/BridgeModal";

// type SymbolCode = "SOL" | "TRX" | "ETH" | "BTC";
// type WalletBrief = { id: number; address: string };

// export default function WalletBalanceCard(
//   {
//   walletsBySymbol = {},                          // <= NEW prop with safe default
// }: {
//   walletsBySymbol?: Partial<Record<SymbolCode, WalletBrief>>;
// }
// ) {

//   const [modalType, setModalType] = useState<"send" | "receive" | null>(null);
//   const [swapOpen, setSwapOpen] = useState(false);
//   const [bridgeOpen, setBridgeOpen] = useState(false);
//   const router = useRouter();

//   // derive specific wallet briefs from the incoming map so these names exist below
//   const solanaWallet = walletsBySymbol.SOL;
//   const tronWallet = walletsBySymbol.TRX;
//   const ethWallet = walletsBySymbol.ETH;

//   const actions = [
//     { label: "Receive", icon: <FaQrcode />, onClick: () => setModalType("receive") },
//     { label: "Send", icon: <FaPaperPlane />, onClick: () => setModalType("send") },
//     { label: "Swap", icon: <FaExchangeAlt />, onClick: () => setSwapOpen(true) },
//     { label: "Bridge", icon: <FaLink />, onClick: () => setBridgeOpen(true) },
//     // { label: "Buy", icon: <FaDollarSign />, onClick: () => router.push("wallet/deposit") },
//   ];

//   return (
//     <>

//         <div className="flex flex-col justify-between h-full">
//           <div className="grid grid-cols-4 gap-4 mt-auto">
//             {actions
//               .map((btn, i) => (
//                 <button
//                   key={i}
//                   onClick={btn.onClick}
//                   className="group flex flex-row gap-4 items-center justify-center w-full py-5 rounded-2xl
//                            bg-white dark:bg-[#121B2E]
//                            text-gray-700 dark:text-[#C7C9D1]
//                            border border-gray-200 dark:border-gray-800
//                            hover:bg-gray-50 dark:hover:bg-[#1A2235]
//                            hover:border-blue-400 dark:hover:border-blue-500
//                            transition-all duration-200 ease-in-out"
//                 >
//                   <span className="text-2xl text-gray-500 dark:text-[#9B9FB5] group-hover:text-blue-500 transition-colors mb-1">
//                     {btn.icon}
//                   </span>
//                   <span className="text-lg font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
//                     {btn.label}
//                   </span>
//                 </button>
//               ))}
//           </div>
//         </div>

//       {/* ====== MODALS ====== */}
//       {modalType && (
//         <SendReceiveModal
//           type={modalType}
//           onClose={() => setModalType(null)}
//           walletsBySymbol={walletsBySymbol}           // <= pass down
//         />
//       )}
//       {swapOpen && (
//         <SwapModal
//           onClose={() => setSwapOpen(false)}
//           walletsBySymbol={{
//             SOL: solanaWallet ? { id: solanaWallet.id, address: solanaWallet.address } : undefined,
//             TRX: tronWallet ? { id: tronWallet.id, address: tronWallet.address } : undefined,
//             ETH: ethWallet ? { id: ethWallet.id, address: ethWallet.address } : undefined,
//           }}
//         />
//       )}
//       {bridgeOpen && <BridgeModal onClose={() => setBridgeOpen(false)} />}
//     </>
//   );
// }

"use client";

import React, { useMemo, useState } from "react";
import {
  FaQrcode,
  FaPaperPlane,
  FaExchangeAlt,
  FaLink,
} from "react-icons/fa";

import SendReceiveModal from "./modal/SendReceiveModal";
import SwapModal from "./modal/SwapModal";
import BridgeModal from "./modal/BridgeModal";

type SymbolCode = "SOL" | "TRX" | "ETH" | "BTC" | "DOGE" | "XMR" | "XRP";
type WalletBrief = { id: number; address: string };

export default function WalletBalanceCard({
  walletsBySymbol = {},
  currentChain,
}: {
  walletsBySymbol?: Partial<Record<SymbolCode, WalletBrief>>;
  currentChain?: SymbolCode;
}) {
  const [modalType, setModalType] = useState<"send" | "receive" | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [bridgeOpen, setBridgeOpen] = useState(false);

  const accent = useMemo(() => {
    switch (currentChain) {
      case "SOL":
        return "#14F195";
      case "TRX":
        return "#EF4444";
      case "ETH":
        return "#8B5CF6";
      case "BTC":
        return "#F59E0B";
      case "DOGE": 
        return "#C2A633";
      case "XMR": 
        return "#FF6600";
      case "XRP": 
        return "#0A74E6";
      default:
        return "#3B82F6"; // fallback blue
    }
  }, [currentChain]);

  const actions = [
    { label: "Receive", icon: <FaQrcode />, onClick: () => setModalType("receive") },
    { label: "Send", icon: <FaPaperPlane />, onClick: () => setModalType("send") },
    { label: "Swap", icon: <FaExchangeAlt />, onClick: () => setSwapOpen(true) },
    { label: "Bridge", icon: <FaLink />, onClick: () => setBridgeOpen(true) },
  ] as const;

  return (
    <>
      {/* shell with subtle gradient hairline */}
      <div
      >
        <div
          className="flex h-full flex-col rounded-2xl border border-gray-200/60 dark:border-white/10
                     bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm shadow-sm"
        >
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {actions.map((btn, i) => (
                <ActionButton
                  key={i}
                  label={btn.label}
                  icon={btn.icon}
                  onClick={btn.onClick}
                  accent={accent}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* modals */}
      {modalType && (
        <SendReceiveModal
          type={modalType}
          currentChain={currentChain}
          onClose={() => setModalType(null)}
          walletsBySymbol={walletsBySymbol}
        />
      )}
      {swapOpen && (
        <SwapModal
          currentChain={currentChain}
          onClose={() => setSwapOpen(false)}
          walletsBySymbol={walletsBySymbol}
        />
      )}
      {bridgeOpen && <BridgeModal currentChain={currentChain} onClose={() => setBridgeOpen(false)} />}
    </>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent: string;
}) {
  const backgroundByLabel: Record<string, string> = {
    Receive: "radial-gradient(100px circle at var(--mouse-x, 100%) var(--mouse-y, 100%), var(--accent, #3B82F6)5%, transparent 60%)",
    Send: "radial-gradient(100px circle at var(--mouse-x, 0%) var(--mouse-y, 100%), var(--accent, #3B82F6)5%, transparent 60%)",
    Swap: "radial-gradient(100px circle at var(--mouse-x, 100%) var(--mouse-y, 0%), var(--accent, #3B82F6)5%, transparent 60%)",
    Bridge: "radial-gradient(100px circle at var(--mouse-x, 0%) var(--mouse-y, 0%), var(--accent, #3B82F6)5%, transparent 60%)",
  };

  return (
    <div
      className="h-full rounded-2xl p-px"
      style={{
        background: `linear-gradient(135deg, ${accent}25, transparent)`,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        className="group relative flex aspect-[2/1] w-full flex-col items-center justify-center overflow-hidden
                   rounded-2xl border border-gray-200/60 dark:border-white/10
                   bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm shadow-sm
                   text-gray-700 dark:text-[#C7C9D1]
                   transition-all duration-200 ease-out
                   hover:-translate-y-0.5 hover:shadow-md
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white
                   dark:focus-visible:ring-offset-[#0B1220]"
        style={{
          ['--accent' as any]: accent,
        }}
      >
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200
                     group-hover:opacity-100"
          style={{
            background:
              backgroundByLabel[label] ??
              `radial-gradient(100px circle at var(--mouse-x, 100%) var(--mouse-y, 100%), ${accent} 5%, transparent 60%)`,
          }}
        />
        <span
          className="relative mb-1 text-2xl sm:text-3xl text-gray-500 dark:text-[#9B9FB5]
                     transition-transform duration-200 group-hover:-translate-y-0.5"
          style={{ color: "var(--accent)" }}
        >
          {icon}
        </span>
        <span
          className="relative text-sm sm:text-base font-medium tracking-tight
                     text-gray-900 dark:text-white transition-colors"
        >
          {label}
        </span>
      </button>
    </div>
  );
}
