import Link from "next/link";

const Hero = () => {
  return (
    <>
      <section
        id="home"
        className="relative z-10 overflow-x-clip overflow-y-hidden bg-white pb-16 pt-[120px] dark:bg-black md:pb-[120px] md:pt-[150px] xl:pb-[160px] xl:pt-[180px] 2xl:pb-[200px] 2xl:pt-[210px]"
      >
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="mx-auto max-w-[900px] text-center">
                <h1 className="mb-5 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight">
                  A custodial wallet <span className="text-primary">and</span> crypto payment
                  system for your business.
                </h1>

                <p className="mb-6 text-base !leading-relaxed text-body-color dark:text-body-color-dark sm:text-lg md:text-xl">
                  Accept and track on-chain payments from individuals or institutions.
                  Works with <strong>TRX, ETH, XMR, SOL, BTC, XRP, DOGE</strong> and{" "}
                  <strong>USDT</strong> on <strong>ERC-20 / TRC-20 / SPL</strong>. No fiat
                  deposits or withdrawals. In-wallet ramp via swap/bridge only.
                </p>

                {/* Supported assets line */}
                {/* <div className="mb-10 flex flex-wrap items-center justify-center gap-2 text-xs">
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary">
                    TRX • ETH • XMR • SOL • BTC • XRP • DOGE
                  </span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-600 dark:text-emerald-300">
                    USDT: ERC-20 • TRC-20 • SPL
                  </span>
                  <span className="rounded-full border border-slate-300/40 bg-slate-100/40 px-3 py-1 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                    Crypto-only (no fiat)
                  </span>
                </div> */}

                <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <Link
                    href="/signup"
                    className="rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80"
                  >
                    Get started
                  </Link>
                  <Link
                    href="#features"
                    className="inline-block rounded-xl bg-black px-8 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-black/90 dark:bg-white/10 dark:text-white dark:hover:bg-white/5"
                  >
                    See features
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* keep your decorative SVGs below as-is */}
      </section>
    </>
  );
};

export default Hero;
