
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

import React, { useState } from "react";
import {
  FaQrcode,
  FaPaperPlane,
  FaExchangeAlt,
  FaLink,
} from "react-icons/fa";

import SendReceiveModal from "./modal/SendReceiveModal";
import SwapModal from "./modal/SwapModal";
import BridgeModal from "./modal/BridgeModal";

type SymbolCode = "SOL" | "TRX" | "ETH" | "BTC";
type WalletBrief = { id: number; address: string };

export default function WalletBalanceCard({
  walletsBySymbol = {},
  currentChain, // 👈 NEW PROP
}: {
  walletsBySymbol?: Partial<Record<SymbolCode, WalletBrief>>;
  currentChain?: SymbolCode; // 👈 Add current chain
}) {
  const [modalType, setModalType] = useState<"send" | "receive" | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [bridgeOpen, setBridgeOpen] = useState(false);

  const actions = [
    { label: "Receive", icon: <FaQrcode />, onClick: () => setModalType("receive") },
    { label: "Send", icon: <FaPaperPlane />, onClick: () => setModalType("send") },
    { label: "Swap", icon: <FaExchangeAlt />, onClick: () => setSwapOpen(true) },
    { label: "Bridge", icon: <FaLink />, onClick: () => setBridgeOpen(true) },
  ];

  return (
    <>
      <div className="flex flex-col justify-between h-full">
        <div className="grid grid-cols-4 gap-4 mt-auto">
          {actions
            .map((btn, i) => (
              <button
                key={i}
                onClick={btn.onClick}
                className="group flex flex-row gap-4 items-center justify-center w-full py-5 rounded-2xl
                           bg-white dark:bg-[#121B2E]
                           text-gray-700 dark:text-[#C7C9D1]
                           border border-gray-200 dark:border-gray-700
                           hover:bg-gray-50 dark:hover:bg-[#1A2235]
                           hover:border-blue-400 dark:hover:border-blue-500
                           transition-all duration-200 ease-in-out"
              >
                <span className="text-2xl text-gray-500 dark:text-[#9B9FB5] group-hover:text-blue-500 dark:group-hover:text-blue-500 transition-colors mb-1">
                  {btn.icon}
                </span>
                <span className="text-lg font-medium group-hover:text-blue-500 dark:group-hover:text-blue-500">
                  {btn.label}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* ====== MODALS ====== */}
      {modalType && (
        <SendReceiveModal
          type={modalType}
          currentChain={currentChain} // 👈 Pass current chain (e.g., "TRX")
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
