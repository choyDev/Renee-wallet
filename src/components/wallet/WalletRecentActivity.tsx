"use client";

export default function WalletRecentActivity() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121B2E] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
          📊 Recent Activity
        </h4>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Connect a wallet to see transactions.
      </p>
    </div>
  );
}
