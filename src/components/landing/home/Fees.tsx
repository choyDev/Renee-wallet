import Image from "next/image";

export default function Fees() {
  return (
    <section id="pricing" className="relative overflow-x-clip">
      <div className="container max-w-7xl px-6 py-12 grid items-center gap-10 md:grid-cols-2">
        {/* LEFT: content */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Fees</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Transparent and configurable. Final fees are confirmed before each credit.
          </p>

          <div className="mt-6 grid gap-6">
            <FeeItem label="Deposit fee" value="Configurable %" />
            <FeeItem label="Conversion fee" value="Configurable %" />
            <FeeItem label="Network fee" value="Actual network cost" />
          </div>

          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Final fees are shown before each conversion.
          </p>
        </div>

        {/* RIGHT: illustration with precise sizing/position */}
        {/* <div className="relative h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px]">
          <FeesArt className="absolute right-[-6%] top-[-4%] h-[115%] w-[115%] md:right-[-4%] md:top-[-6%] md:h-[120%] md:w-[120%]" />
        </div> */}
        <div className="flex items-center justify-center">
          <Image
            src="/images/png/fee.png" // move the chosen PNG into /public/illustrations
            alt="TRON network illustration"
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
      {/* gradient ring */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/25 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />
      <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
        <div className="text-slate-600 dark:text-slate-300 text-sm">{label}</div>
        <div className="text-xl font-semibold mt-1 text-slate-900 dark:text-white">{value}</div>
      </div>
    </div>
  );
}
