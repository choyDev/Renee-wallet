import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="relative overflow-x-clip py-20">
      <div className="container max-w-7xl px-6">
        <div
          className="
            relative rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] p-10 text-center
            shadow-[0_0_0_rgba(124,74,255,0)]
            transition-all duration-300
            hover:-translate-y-[6px]
            hover:border-[var(--brand-600)]
            hover:shadow-[0_20px_48px_rgba(110,59,255,0.18)]
          "
        >
          {/* Glow ring */}
          <div
            className="
              pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-xl
              bg-gradient-to-br from-[var(--brand-600)]/15 via-transparent to-[var(--brand-400)]/10
              transition-opacity duration-300 group-hover:opacity-100
            "
          />

          {/* TITLE */}
          <h3 className="text-3xl font-semibold text-white mb-3">
            Start accepting crypto payments
          </h3>

          {/* TEXT */}
          <p className="text-slate-400 mb-8">
            TRX, ETH, XMR, SOL, BTC, XRP, DOGE — plus USDT on ERC-20 / TRC-20 / SPL.
            No fiat rails.
          </p>

          {/* BUTTONS */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">

            {/* Primary button */}
            <Link
              href="/signup"
              className="w-45 relative inline-flex items-center justify-center px-10 py-3.5 text-[15px] font-semibold text-white rounded-sm
                    bg-[linear-gradient(135deg,var(--brand-500)_0%,var(--brand-300)_100%)]
                    shadow-[0_6px_20px_var(--brand-500-50)]
                    transition-all duration-300 hover:-translate-y-[3px]
                    hover:shadow-[0_6px_20px_var(--brand-500-65)]
                    active:scale-[0.98]"
            >
              <span className="relative z-10">Get started</span>

              {/* glow on hover */}
              <span
                className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 blur-[20px]
                    bg-[linear-gradient(135deg,var(--brand-500)_0%,var(--brand-300)_100%)]
                    transition-opacity duration-300"
              />
            </Link>


            {/* === SECONDARY BUTTON === */}
            <Link
              href="#features"
              className="w-45 inline-flex items-center justify-center px-10 py-3.5 text-[15px] font-semibold text-white/85
                    rounded-sm border border-[var(--white-10)] bg-[var(--white-5)] backdrop-blur-sm 
                    shadow-[0_6px_20px_var(--brand-500-30)]
                    transition-all duration-300 hover:-translate-y-[3px]
                    hover:border-[var(--brand-300)]
                    hover:bg-[var(--brand-500-30)] hover:text-white
                    hover:shadow-[0_6px_20px_var(--brand-500-50)]"
            >
              See features
            </Link>

          </div>
        </div>
      </div>
    </section>
  );
}
