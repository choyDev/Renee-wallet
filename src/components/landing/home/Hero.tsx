import Link from "next/link";

const Hero = () => {
  return (
    <section
      id="home"
      className="relative z-10 overflow-hidden bg-transparent pb-20 pt-[140px] md:pb-[140px] md:pt-[170px] xl:pb-[170px] xl:pt-[190px]"
    >
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="mx-auto max-w-[950px] text-center">

              {/* === TITLE WITH BRAND GRADIENT === */}
              <h1
                className="mb-4 text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--brand-600) 0%, var(--brand-400) 100%)",
                }}
              >
                Wallet <span className="text-violet-300">+</span> Crypto Payment System
              </h1>

              {/* === DESCRIPTION === */}
              <p className="mx-auto mb-10 max-w-3xl text-base text-slate-300/90 sm:text-lg md:text-xl">
                Accept and track on-chain payments. Works with{" "}
                <strong className="text-white">
                  TRX, ETH, XMR, SOL, BTC, XRP, DOGE
                </strong>{" "}
                and <strong className="text-white">USDT</strong> on{" "}
                <strong className="text-white">ERC-20 / TRC-20 / SPL</strong>. No fiat rails;
                optional in-wallet swap/bridge.
              </p>

              {/* === BUTTONS === */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">


                {/* === PRIMARY (GAVINWOOD) BUTTON === */}
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
        </div>
      </div>
    </section>
  );
};

export default Hero;
