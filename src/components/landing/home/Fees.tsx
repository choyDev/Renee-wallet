import Security from "@/components/landing/home/Security";

export default function Fees() {
  return (
    <section id="pricing" className="relative overflow-x-clip py-16 md:py-24">
      <div className="container max-w-7xl px-6">
        {/* Responsive grid: mobile=1, md=2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
          
          {/* FEES */}
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-4">Fees</h2>
            <p className="text-slate-400 text-base max-w-md mx-auto md:mx-0">
              Crypto-only. All costs are transparent before the payer sends.
            </p>

            <div className="mt-8 space-y-6">
              <FeeItem label="Network fee" value="Actual on-chain fee per network" />
              <FeeItem label="Processing fee" value="Configurable %" />
              <FeeItem label="Swap/Bridge (optional)" value="Quoted before execution" />
            </div>
          </div>

          {/* SECURITY */}
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-4">Security & Reliability</h2>
            <Security />
          </div>

        </div>
      </div>
    </section>
  );
}

function FeeItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="
        group relative flex flex-col items-center text-center
        rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)]
        p-6 transition-all duration-300
        hover:-translate-y-[6px]
        hover:border-[var(--brand-600)]
        hover:shadow-[0_20px_48px_rgba(110,59,255,0.18)]
        w-full
      "
    >
      {/* Glow ring */}
      <div
        className="
          absolute inset-0 rounded-2xl opacity-0 blur-xl
          bg-gradient-to-br
          from-[var(--brand-600)]/10
          via-transparent
          to-[var(--brand-400)]/5
          transition-opacity duration-300
          group-hover:opacity-100
        "
      />

      <div className="relative z-10">
        <div className="text-slate-300 font-medium">{label}</div>
        <div className="mt-1 text-lg font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}
