import Link from "next/link";

const Hero = () => {
  return (
    <section
      id="home"
      className="relative z-10 overflow-hidden bg-transparent pb-20 pt-[190px] md:pb-[100px] md:pt-[230px] xl:pb-[130px] xl:pt-[250px]"
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
              <p className="mb-6 py-8 text-base !leading-relaxed text-body-color dark:text-body-color-dark sm:text-lg md:text-xl">
                Accept and track on-chain payments. Works with{" "}
                <strong>
                  TRX, ETH, XMR, SOL, <br /> BTC, XRP, DOGE
                </strong>{" "} 
                and <strong>USDT</strong> on{" "}
                <strong>ERC-20 / TRC-20 / SPL</strong>. <br />
                No fiat rails;
                optional in-wallet swap/bridge.
              </p>

              {/* === BUTTONS === */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">


                {/* === PRIMARY BUTTON === */}
                <Link
                  href="/signup"
                  className="min-w-44 relative inline-flex items-center justify-center px-8 py-3 text-[18px] font-semibold text-white rounded-sm
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
                  className="min-w-44 inline-flex items-center justify-center px-8 py-3 text-[18px] font-semibold text-white
                    rounded-sm border border-[var(--white-10)] bg-[var(--brand-600)]/80 dark:bg-[var(--brand-500-50)] backdrop-blur-sm 
                    shadow-[0_6px_20px_var(--brand-500-30)]
                    transition-all duration-300 hover:-translate-y-[3px]
                    hover:text-white
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
