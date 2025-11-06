import Image from "next/image";

export default function Fees() {
  return (
    <section id="pricing" className="relative overflow-x-clip">
      <div className="container max-w-7xl px-6 py-12 grid items-center gap-10 md:grid-cols-2">
        {/* LEFT: content */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Fees</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Crypto-only. All costs are shown up-front before the payer sends.
          </p>

          <div className="mt-6 grid gap-6">
            <FeeItem label="Network fee" value="Actual on-chain fee per network" />
            <FeeItem label="Processing fee" value="Configurable %" />
            <FeeItem label="Swap/Bridge (optional)" value="Quoted before execution" />
          </div>

          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            No fiat deposits/withdrawals. USDT supported on ERC-20 / TRC-20 / SPL.
          </p>
        </div>

        {/* RIGHT: illustration */}
        <div className="flex items-center justify-center">
          <Image
            src="/images/png/fee.png"
            alt="Fees illustration"
            width={1270}
            height={722}
            className="rounded-xl object-cover opacity-80"
            priority
          />
        </div>
      </div>
    </section>
  );
}

function FeeItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="group relative rounded-2xl p-[1px]">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/25 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />
      <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
        <div className="text-slate-600 dark:text-slate-300 text-sm">{label}</div>
        <div className="text-xl font-semibold mt-1 text-slate-900 dark:text-white">{value}</div>
      </div>
    </div>
  );
}
