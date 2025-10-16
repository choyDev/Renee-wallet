
// import React from "react";
// import { FaEthereum } from "react-icons/fa";
// import { SiTether, SiSolana } from "react-icons/si";
// import { BsCurrencyBitcoin } from "react-icons/bs";

// const TronIcon = ({ className = "w-5 h-5 text-[#FF060A]" }) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     viewBox="0 0 32 32"
//     fill="currentColor"
//     className={className}
//   >
//     <path d="M16 2 2 5.5l12.6 24.5L30 5.5 16 2zm0 2.2 10.3 2.6-10.3 20.2L5.7 4.8 16 4.2zm-4.2 3.3L16 17.3l4.2-9.8h-8.4z" />
//   </svg>
// );

// const TransactionTable = () => {
//   const activities = [
//     {
//       coin: "USDT",
//       transaction: "Withdraw USDT",
//       amount: "$653.10",
//       id: "0x82f17bd6a1e3b7c94ab2a4fd93f72e8c1120b0e1",
//       date: "Oct 10, 2025",
//       status: "Completed",
//       fee: "0.75 USDT",
//     },
//     {
//       coin: "TRX",
//       transaction: "Deposit TRX",
//       amount: "$1,200.00",
//       id: "TQnSxVt7W12bZa9YJvH8zLgxj9PRbmw34q",
//       date: "Oct 12, 2025",
//       status: "Pending",
//       fee: "0.12 TRX",
//     },
//     {
//       coin: "SOL",
//       transaction: "Withdraw SOL",
//       amount: "$856.45",
//       id: "6bK3y6sds8Fk7GQWvD5zqzcfA5K8eXUZhRRTyGvdjz4t",
//       date: "Oct 13, 2025",
//       status: "Completed",
//       fee: "0.01 SOL",
//     },
//     {
//       coin: "TRX",
//       transaction: "Withdraw TRX",
//       amount: "$342.55",
//       id: "TXp3nYBwh2nT7p7Mq4Rk8e1vWf8zC2aN5D",
//       date: "Oct 14, 2025",
//       status: "Declined",
//       fee: "0.10 TRX",
//     },
//     {
//       coin: "USDT",
//       transaction: "Deposit USDT",
//       amount: "$5,500.00",
//       id: "0x91a3ef0c67de8b23b56ca01a7b2f56c6a4d7e23f",
//       date: "Oct 15, 2025",
//       status: "Completed",
//       fee: "0.50 USDT",
//     },
//     {
//       coin: "SOL",
//       transaction: "Deposit SOL",
//       amount: "$2,145.00",
//       id: "8nR2p2Q2Fyzj8aNzzs1q8fR94xkWcTuHx1phZZVdnfDa",
//       date: "Oct 15, 2025",
//       status: "Pending",
//       fee: "0.02 SOL",
//     },
//   ];

//   const getIcon = (coin: string) => {
//     switch (coin) {
//       case "TRX":
//         return <TronIcon className="w-5 h-5 text-[#FF060A]" />;
//       case "ETH":
//         return <FaEthereum className="text-[#4B70C6] w-5 h-5" />;
//       case "USDT":
//         return <SiTether className="text-[#26A17B] w-5 h-5" />;
//       case "SOL":
//         return <SiSolana className="text-[#14F195] w-5 h-5" />;
//       default:
//         return <BsCurrencyBitcoin className="text-gray-400 w-5 h-5" />;
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "Completed":
//         return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
//       case "Pending":
//         return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
//       case "Declined":
//         return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
//       default:
//         return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
//     }
//   };

//   // ✅ Helper to shorten hashes visually like Etherscan style
//   const shortenId = (id: string) =>
//     id.length > 16 ? `${id.slice(0, 6)}...${id.slice(-6)}` : id;

//   return (
//     <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121B2E] p-6 shadow-sm">
//       <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-5 text-lg">
//         Recent Activities
//       </h3>

//       <div className="overflow-x-auto">
//         <table className="w-full text-sm rounded-lg">
//           <thead>
//             <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
//               <th className="text-left py-3 px-4">Coin</th>
//               <th className="text-left py-3 px-4">Transaction</th>
//               <th className="text-left py-3 px-4">Tx Hash</th>
//               <th className="text-left py-3 px-4">Date</th>
//               <th className="text-left py-3 px-4">Status</th>
//               <th className="text-left py-3 px-4">Fees</th>
//             </tr>
//           </thead>

//           <tbody>
//             {activities.map((a, i) => (
//               <tr
//                 key={i}
//                 className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1A2235]/40 transition"
//               >
//                 {/* Coin Column */}
//                 <td className="py-4 px-4 flex items-center gap-2 font-medium text-gray-800 dark:text-white/90">
//                   {getIcon(a.coin)}
//                   <span>{a.coin}</span>
//                 </td>

//                 {/* Transaction */}
//                 <td className="py-4 px-4">
//                   <span className="font-semibold text-gray-800 dark:text-white/90 mr-1">
//                     {a.amount}
//                   </span>
//                   <span className="text-gray-500 dark:text-gray-400">
//                     {a.transaction}
//                   </span>
//                 </td>

//                 {/* Transaction Hash */}
//                 <td className="py-4 px-4 text-gray-500 dark:text-gray-400 font-mono text-[13px]">
//                   <a
//                     href="#"
//                     className="hover:text-blue-500 transition"
//                     title={a.id}
//                   >
//                     {shortenId(a.id)}
//                   </a>
//                 </td>

//                 {/* Date */}
//                 <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
//                   {a.date}
//                 </td>

//                 {/* Status */}
//                 <td className="py-4 px-4">
//                   <span
//                     className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
//                       a.status
//                     )}`}
//                   >
//                     {a.status}
//                   </span>
//                 </td>

//                 {/* Fees */}
//                 <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
//                   {a.fee}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default TransactionTable;

import TransactionTable from "@/components/transaction/transaction";

export default function TransactionPage() {
  return (
    <main className="p-6">
      <TransactionTable />
    </main>
  );
}
