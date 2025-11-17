
// "use client";

// import React, { useMemo, useState } from "react";
// import {
//   FaQrcode,
//   FaPaperPlane,
//   FaExchangeAlt,
//   FaLink,
// } from "react-icons/fa";

// import SendReceiveModal from "./modal/SendReceiveModal";
// import SwapModal from "./modal/SwapModal";
// import BridgeModal from "./modal/BridgeModal";

// type SymbolCode = "SOL" | "TRX" | "ETH" | "BTC" | "DOGE" | "XMR" | "XRP";
// type WalletBrief = { id: number; address: string };

// export default function WalletBalanceCard({
//   walletsBySymbol = {},
//   currentChain,
// }: {
//   walletsBySymbol?: Partial<Record<SymbolCode, WalletBrief>>;
//   currentChain?: SymbolCode;
// }) {
//   const [modalType, setModalType] = useState<"send" | "receive" | null>(null);
//   const [swapOpen, setSwapOpen] = useState(false);
//   const [bridgeOpen, setBridgeOpen] = useState(false);

//   const accent = useMemo(() => {
//     switch (currentChain) {
//       case "SOL":
//         return "#14F195";
//       case "TRX":
//         return "#EF4444";
//       case "ETH":
//         return "#8B5CF6";
//       case "BTC":
//         return "#F59E0B";
//       case "DOGE": 
//         return "#EAB308";
//       case "XMR": 
//         return "#F97316";
//       case "XRP": 
//         return "#25A768";
//       default:
//         return "#3B82F6"; // fallback blue
//     }
//   }, [currentChain]);

//   const actions = [
//     { label: "Receive", icon: <FaQrcode />, onClick: () => setModalType("receive") },
//     { label: "Send", icon: <FaPaperPlane />, onClick: () => setModalType("send") },
//     { label: "Swap", icon: <FaExchangeAlt />, onClick: () => setSwapOpen(true) },
//     { label: "Bridge", icon: <FaLink />, onClick: () => setBridgeOpen(true) },
//   ] as const;

//   return (
//     <>
//       {/* shell with subtle gradient hairline */}
//       <div
//       >
//         <div
//           className="flex h-full flex-col rounded-2xl border border-gray-200/60 dark:border-white/10
//                      bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm shadow-sm"
//         >
//           <div className="p-3 sm:p-4">
//             <div className="grid grid-cols-2 gap-3 sm:gap-4">
//               {actions.map((btn, i) => (
//                 <ActionButton
//                   key={i}
//                   label={btn.label}
//                   icon={btn.icon}
//                   onClick={btn.onClick}
//                   accent={accent}
//                 />
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* modals */}
//       {modalType && (
//         <SendReceiveModal
//           type={modalType}
//           currentChain={currentChain}
//           onClose={() => setModalType(null)}
//           walletsBySymbol={walletsBySymbol}
//         />
//       )}
//       {swapOpen && (
//         <SwapModal
//           currentChain={currentChain}
//           onClose={() => setSwapOpen(false)}
//           walletsBySymbol={walletsBySymbol}
//         />
//       )}
//       {bridgeOpen && <BridgeModal currentChain={currentChain} onClose={() => setBridgeOpen(false)} />}
//     </>
//   );
// }

// function ActionButton({
//   label,
//   icon,
//   onClick,
//   accent,
// }: {
//   label: string;
//   icon: React.ReactNode;
//   onClick: () => void;
//   accent: string;
// }) {
//   const backgroundByLabel: Record<string, string> = {
//     Receive: "radial-gradient(100px circle at var(--mouse-x, 100%) var(--mouse-y, 100%), var(--accent, #3B82F6)5%, transparent 60%)",
//     Send: "radial-gradient(100px circle at var(--mouse-x, 0%) var(--mouse-y, 100%), var(--accent, #3B82F6)5%, transparent 60%)",
//     Swap: "radial-gradient(100px circle at var(--mouse-x, 100%) var(--mouse-y, 0%), var(--accent, #3B82F6)5%, transparent 60%)",
//     Bridge: "radial-gradient(100px circle at var(--mouse-x, 0%) var(--mouse-y, 0%), var(--accent, #3B82F6)5%, transparent 60%)",
//   };

//   return (
//     <div
//       className="h-full rounded-2xl p-px"
//       style={{
//         background: `linear-gradient(135deg, ${accent}25, transparent)`,
//       }}
//     >
//       <button
//         type="button"
//         onClick={onClick}
//         title={label}
//         aria-label={label}
//         className="group relative flex aspect-[2/1] w-full flex-col items-center justify-center overflow-hidden
//                    rounded-2xl border border-gray-200/60 dark:border-white/10
//                    bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm shadow-sm
//                    text-gray-700 dark:text-[#C7C9D1]
//                    transition-all duration-200 ease-out
//                    hover:-translate-y-0.5 hover:shadow-md
//                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white
//                    dark:focus-visible:ring-offset-[#0B1220]"
//         style={{
//           ['--accent' as any]: accent,
//         }}
//       >
//         <span
//           className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200
//                      group-hover:opacity-100"
//           style={{
//             background:
//               backgroundByLabel[label] ??
//               `radial-gradient(100px circle at var(--mouse-x, 100%) var(--mouse-y, 100%), ${accent} 5%, transparent 60%)`,
//           }}
//         />
//         <span
//           className="relative mb-1 text-2xl sm:text-3xl text-gray-500 dark:text-[#9B9FB5]
//                      transition-transform duration-200 group-hover:-translate-y-0.5"
//           style={{ color: "var(--accent)" }}
//         >
//           {icon}
//         </span>
//         <span
//           className="relative text-sm sm:text-base font-medium tracking-tight
//                      text-gray-900 dark:text-white transition-colors"
//         >
//           {label}
//         </span>
//       </button>
//     </div>
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
        return "#EAB308";
      case "XMR":
        return "#F97316";
      case "XRP":
        return "#25A768";
      default:
        return "#3B82F6";
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
      {/* Container - Fully Responsive */}
      <div className="flex h-full flex-col rounded-2xl border border-gray-200/60 dark:border-white/10
                      bg-white/70 dark:bg-[#110f20] bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)] backdrop-blur-sm shadow-sm">
        
        {/* Action Buttons Grid - Responsive padding and gap */}
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
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

      {/* Modals */}
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
      {bridgeOpen && (
        <BridgeModal 
          currentChain={currentChain} 
          onClose={() => setBridgeOpen(false)} 
        />
      )}
    </>
  );
}

/* ===============================================
   ACTION BUTTON - Fully Responsive
=============================================== */
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
      className="h-full rounded-xl sm:rounded-2xl p-px"
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
                   rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-white/10
                   bg-white/70 dark:bg-[#110f20] bg-[radial-gradient(circle_at_30%_20%,#120a22_0%,#131124_70%)] backdrop-blur-sm shadow-sm
                   text-gray-700 dark:text-[#C7C9D1]
                   transition-all duration-200 ease-out
                   hover:-translate-y-0.5 hover:shadow-md
                   active:translate-y-0 active:shadow-sm
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
                   focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0B1220]
                   touch-manipulation"
        style={{
          ['--accent' as any]: accent,
        }}
      >
        {/* Hover gradient effect */}
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200
                     group-hover:opacity-100"
          style={{
            background:
              backgroundByLabel[label] ??
              `radial-gradient(100px circle at var(--mouse-x, 100%) var(--mouse-y, 100%), ${accent} 5%, transparent 60%)`,
          }}
        />

        {/* Icon - Responsive sizes */}
        <span
          className="relative mb-0.5 sm:mb-1 text-xl sm:text-2xl md:text-3xl
                     text-gray-500 dark:text-[#9B9FB5]
                     transition-transform duration-200 group-hover:-translate-y-0.5"
          style={{ color: "var(--accent)" }}
        >
          {icon}
        </span>

        {/* Label - Responsive text size */}
        <span
          className="relative text-xs sm:text-sm md:text-base font-medium tracking-tight
                     text-gray-900 dark:text-white transition-colors"
        >
          {label}
        </span>
      </button>
    </div>
  );
}