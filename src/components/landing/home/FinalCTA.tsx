import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="relative overflow-x-clip">
      <div className="container max-w-7xl px-6 py-16">
        <div className="relative rounded-2xl border border-primary/20 bg-primary/10 p-8 text-center dark:border-primary/25 dark:bg-primary/15">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[36rem] rounded-full bg-primary/25 blur-[100px]" />
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Start accepting crypto payments
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            TRX, ETH, XMR, SOL, BTC, XRP, DOGE — plus USDT on ERC-20 / TRC-20 / SPL. No fiat rails.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="rounded-xl bg-primary px-6 py-3 text-white font-medium hover:opacity-90">
              Get started
            </Link>
            <Link href="#features" className="rounded-xl border border-primary/40 px-6 py-3 text-primary hover:bg-primary/10">
              See features
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
