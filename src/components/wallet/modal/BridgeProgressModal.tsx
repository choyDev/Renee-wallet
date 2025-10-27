// "use client";

// import React, { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FiCheckCircle, FiLoader, FiX } from "react-icons/fi";
// import { FaLock, FaExchangeAlt } from "react-icons/fa";

// interface Props {
//   onClose: () => void;
//   fromNetwork: string;
//   toNetwork: string;
//   amount: string;
// }

// export default function BridgeProgressModal({ onClose, fromNetwork, toNetwork, amount }: Props) {
//   const [step, setStep] = useState(0);
//   const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");

//   useEffect(() => {
//     // Simulate step progress (for demo — later hook this to backend bridge API)
//     const sequence = [
//       { delay: 1500, nextStep: 1 }, // Locking
//       { delay: 2000, nextStep: 2 }, // Confirming
//       { delay: 2500, nextStep: 3 }, // Minted
//     ];

//     let timeoutIds: NodeJS.Timeout[] = [];

//     sequence.forEach((s, i) => {
//       timeoutIds.push(
//         setTimeout(() => {
//           setStep(s.nextStep);
//           if (s.nextStep === 3) setStatus("success");
//         }, s.delay * (i + 1))
//       );
//     });

//     return () => timeoutIds.forEach(clearTimeout);
//   }, []);

//   const steps = [
//     { label: "Locking USDT", icon: <FaLock />, id: 1 },
//     { label: "Confirming Cross-Chain Transaction", icon: <FaExchangeAlt />, id: 2 },
//     { label: `Minting on ${toNetwork}`, icon: <FiCheckCircle />, id: 3 },
//   ];

//   return (
//     <AnimatePresence>
//       <motion.div
//         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//       >
//         <motion.div
//           className="relative w-full max-w-md rounded-2xl shadow-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-white/10 p-6 space-y-6"
//           initial={{ scale: 0.9, opacity: 0, y: 20 }}
//           animate={{ scale: 1, opacity: 1, y: 0 }}
//           exit={{ scale: 0.9, opacity: 0, y: 20 }}
//           transition={{ type: "spring", stiffness: 250, damping: 22 }}
//         >
//           {/* Close Button */}
//           <button
//             onClick={onClose}
//             className="absolute right-4 top-4 text-gray-400 hover:text-white transition"
//           >
//             <FiX size={22} />
//           </button>

//           {/* Title */}
//           <div className="text-center">
//             <h2 className="text-xl font-semibold text-white">Bridging In Progress</h2>
//             <p className="text-gray-400 text-sm mt-1">
//               {`Transferring ${amount} USDT from ${fromNetwork} → ${toNetwork}`}
//             </p>
//           </div>

//           {/* Progress Steps */}
//           <div className="space-y-4 mt-6">
//             {steps.map((s, i) => {
//               const isActive = step >= s.id;
//               const isDone = step > s.id;
//               const isCurrent = step === s.id;
//               return (
//                 <motion.div
//                   key={s.id}
//                   className={`flex items-center gap-3 p-3 rounded-xl border ${
//                     isDone
//                       ? "border-green-500/30 bg-green-500/10"
//                       : isCurrent
//                       ? "border-blue-500/30 bg-blue-500/10"
//                       : "border-white/10 bg-white/5"
//                   } transition`}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                 >
//                   <div
//                     className={`p-2 rounded-full ${
//                       isDone
//                         ? "bg-green-500/20 text-green-400"
//                         : isCurrent
//                         ? "bg-blue-500/20 text-blue-400"
//                         : "bg-gray-700 text-gray-500"
//                     }`}
//                   >
//                     {isDone ? <FiCheckCircle /> : s.icon}
//                   </div>
//                   <div className="flex-1">
//                     <p
//                       className={`text-sm ${
//                         isDone
//                           ? "text-green-400"
//                           : isCurrent
//                           ? "text-blue-400"
//                           : "text-gray-400"
//                       }`}
//                     >
//                       {s.label}
//                     </p>
//                   </div>
//                   {isCurrent && (
//                     <motion.div
//                       animate={{ rotate: 360 }}
//                       transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
//                     >
//                       <FiLoader className="text-blue-400" />
//                     </motion.div>
//                   )}
//                 </motion.div>
//               );
//             })}
//           </div>

//           {/* Final Status */}
//           {status === "success" && (
//             <motion.div
//               className="text-center text-green-400 font-medium mt-4"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//             >
//               ✅ Bridge Completed Successfully!
//             </motion.div>
//           )}
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiLoader, FiX, FiAlertTriangle } from "react-icons/fi";
import { FaLock, FaExchangeAlt } from "react-icons/fa";

export default function BridgeProgressModal({ onClose, fromNetwork, toNetwork, token, amount, bridgeData }: any) {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");

  useEffect(() => {
    const poll = async () => {
      const res = await fetch(`/api/bridge/status?id=${bridgeData.bridge.id}`);
      const data = await res.json();
      if (data.status === "LOCKED") setStep(2);
      else if (data.status === "MINTED") setStep(3);
      else if (data.status === "COMPLETED") {
        setStep(4);
        setStatus("success");
      } else if (data.status === "FAILED") {
        setStatus("failed");
      }
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [bridgeData]);

  const steps = [
    { id: 1, label: `Locking ${token} on ${fromNetwork}`, icon: <FaLock /> },
    { id: 2, label: "Confirming cross-chain transfer", icon: <FaExchangeAlt /> },
    { id: 3, label: `Minting ${token} on ${toNetwork}`, icon: <FiCheckCircle /> },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md rounded-2xl shadow-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-white/10 p-6 space-y-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 250, damping: 22 }}
        >
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white transition">
            <FiX size={22} />
          </button>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">Bridging In Progress</h2>
            <p className="text-gray-400 text-sm mt-1">
              {`Transferring ${amount} ${token} from ${fromNetwork} → ${toNetwork}`}
            </p>
          </div>

          <div className="space-y-4 mt-6">
            {steps.map((s) => {
              const isDone = step > s.id;
              const isActive = step === s.id;
              return (
                <motion.div
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isDone
                      ? "border-green-500/30 bg-green-500/10"
                      : isActive
                      ? "border-blue-500/30 bg-blue-500/10"
                      : "border-white/10 bg-white/5"
                  } transition`}
                >
                  <div
                    className={`p-2 rounded-full ${
                      isDone
                        ? "bg-green-500/20 text-green-400"
                        : isActive
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-700 text-gray-500"
                    }`}
                  >
                    {isDone ? <FiCheckCircle /> : s.icon}
                  </div>
                  <p className={`text-sm ${isDone ? "text-green-400" : isActive ? "text-blue-400" : "text-gray-400"}`}>
                    {s.label}
                  </p>
                  {isActive && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    >
                      <FiLoader className="text-blue-400" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {status === "success" && (
            <motion.div className="text-center text-green-400 font-medium mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ✅ Bridge Completed Successfully!
            </motion.div>
          )}

          {status === "failed" && (
            <motion.div className="text-center text-red-400 font-medium mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <FiAlertTriangle className="inline mr-1" /> Bridge Failed. Please try again.
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
