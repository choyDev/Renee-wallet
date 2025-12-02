
"use client";

import { useEffect, useState } from "react";
import {
  SiTether, SiSolana, SiDogecoin, SiMonero, SiXrp
} from "react-icons/si";
import { FaEthereum, FaBitcoin } from "react-icons/fa";
import { FiList } from "react-icons/fi";
import { TransactionTableSkeleton } from "@/components/skeleton/SkeletonLoaders";

/* Tron Icon */
const TronIcon = ({ className = "w-5 h-5 text-[#FF060A]" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className={className}>
    <path d="M16 2 2 5.5l12.6 24.5L30 5.5 16 2zm0 2.2 10.3 2.6-10.3 20.2L5.7 4.8 16 4.2zm-4.2 3.3L16 17.3l4.2-9.8h-8.4z" />
  </svg>
);

export default function AdminTransactionTable() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    load();
  }, [page]);

  async function load() {
    setLoading(true);

    const res = await fetch(
      `/api/admin/transactions?page=${page}&limit=${limit}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    setTxs(data.transactions || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  /** GET EXPLORER URL */
  const getExplorerUrl = (token: string, hash: string | null) => {
    if (!hash) return null;

    switch (token) {
      case "BTC":
        return `https://blockstream.info/testnet/tx/${hash}`;
      case "ETH":
        return `https://sepolia.etherscan.io/tx/${hash}`;
      case "TRX":
        return `https://nile.tronscan.org/#/transaction/${hash}`;
      case "SOL":
        return `https://solscan.io/tx/${hash}`;
      case "DOGE":
        return `https://doge-testnet-explorer.qed.me/tx/${hash}`;
      case "XRP":
        return `https://testnet.xrpl.org/transactions/${hash}`;
      case "XMR":
        return `https://testnet.xmrchain.net/search?value=${hash}`;
      default:
        return null;
    }
  };

  const getIcon = (sym: string) => {
    switch (sym) {
      case "TRX": return <TronIcon />;
      case "ETH": return <FaEthereum className="text-[#627EEA]" />;
      case "USDT": return <SiTether className="text-[#26A17B]" />;
      case "SOL": return <SiSolana className="text-[#14F195]" />;
      case "BTC": return <FaBitcoin className="text-[#F7931A]" />;
      case "DOGE": return <SiDogecoin className="text-[#C2A633]" />;
      case "XMR": return <SiMonero className="text-[#FF6600]" />;
      case "XRP": return <SiXrp className="text-[#25A768]" />;
      default: return <SiTether className="text-[#26A17B]" />;
    }
  };

  const shorten = (hash?: string) =>
    hash && hash.length > 16
      ? `${hash.slice(0, 6)}...${hash.slice(-6)}`
      : hash || "—";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "Completed":
        return "bg-green-600 text-white";
      case "PENDING":
      case "Pending":
        return "bg-yellow-400 text-black";
      case "FAILED":
      case "Declined":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="space-y-6">

      <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex gap-2 items-center">
        <FiList /> All Transactions
      </h1>

      <div className="bg-white dark:bg-[#1A1730] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">

        {loading ? (
          <TransactionTableSkeleton />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-600 dark:text-gray-300 border-b dark:border-gray-800 text-sm">
                  <th className="py-2">Coin</th>
                  <th className="py-2">From User</th>
                  <th className="py-2">To User</th>
                  <th className="py-2">Tx Hash</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Fee</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>

              <tbody className="text-sm text-gray-800 dark:text-gray-200">
                {txs.map((tx) => {
                  const explorer = getExplorerUrl(tx.token, tx.txHash);

                  return (
                    <tr key={tx.id} className="border-t dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5">

                      {/* COIN */}
                      <td className="py-2 flex items-center gap-2">
                        {getIcon(tx.token)} {tx.token}
                      </td>

                      {/* FROM USER */}
                      <td className="py-2">
                        {tx.fromUser ? (
                          <>
                            <div className="font-medium">{tx.fromUser.full_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{tx.fromUser.email}</div>
                          </>
                        ) : (
                          <span className="text-gray-500">{tx.fromAddress}</span>
                        )}
                      </td>

                      {/* TO USER */}
                      <td className="py-2">
                        {tx.toUser ? (
                          <>
                            <div className="font-medium">{tx.toUser.full_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{tx.toUser.email}</div>
                          </>
                        ) : (
                          <span className="text-gray-500">{tx.toAddress}</span>
                        )}
                      </td>

                      {/* TX HASH */}
                      <td className="py-2">
                        {explorer ? (
                          <span
                            className="font-mono text-blue-600 dark:text-blue-400 underline cursor-pointer"
                            onClick={() => window.open(explorer, "_blank")}
                          >
                            {shorten(tx.txHash)}
                          </span>
                        ) : (
                          <span className="font-mono text-gray-500">{shorten(tx.txHash)}</span>
                        )}
                      </td>

                      {/* AMOUNT */}
                      <td className="py-2">{tx.amount}</td>

                      {/* FEE */}
                      <td className="py-2">{tx.fee ?? "—"}</td>

                      {/* STATUS */}
                      <td className="py-2">
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>

                      {/* DATE */}
                      <td className="py-2">{new Date(tx.createdAt).toLocaleDateString()}</td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-4">

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-gray-400 dark:bg-gray-500 rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-gray-400 dark:bg-gray-500 rounded disabled:opacity-50"
          >
            Next
          </button>

        </div>

      </div>
    </div>
  );
}
