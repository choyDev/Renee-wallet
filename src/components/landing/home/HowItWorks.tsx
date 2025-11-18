import SectionShell from "@/components/landing/ui/SectionShell";
import SectionTitle from "../Common/SectionTitle";
import { IconType } from "react-icons";
import { FiUserPlus, FiFileText, FiZap, FiCreditCard } from "react-icons/fi";

type Step = { title: string; desc: string; Icon: IconType };

const steps: Step[] = [
  {
    title: "1. Create account",
    desc:
      "Get custodial wallets for TRX, ETH, XMR, SOL, BTC, XRP, DOGE. USDT supported on ERC-20 / TRC-20 / SPL.",
    Icon: FiUserPlus,
  },
  {
    title: "2. Generate request/invoice",
    desc:
      "Create a checkout link with amount, memo, and allowed coins—or let the payer pick.",
    Icon: FiFileText,
  },
  {
    title: "3. Payer sends on-chain",
    desc:
      "We detect the payment and track confirmations per network; status updates via webhook.",
    Icon: FiZap,
  },
  {
    title: "4. Settle & manage",
    desc:
      "Funds sit in your wallet. Optionally swap or bridge inside the app. No fiat off-ramp.",
    Icon: FiCreditCard,
  },
];

export default function HowItWorks() {
  return (
    <SectionShell id="how-it-works" className="scroll-mt-24 md:scroll-mt-28">
      <SectionTitle
        title="How it works"
        paragraph="Create requests, let payers choose a supported coin, and we track confirmations on-chain. Funds arrive to your custodial wallet; optional swap/bridge is available. No fiat."
        center
      />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        {steps.map(({ title, desc, Icon }) => (
          <div
            key={title}
            className="
              group relative flex flex-col items-center text-center
              rounded-2xl border border-[var(--brand-600)]/50 dark:border-white/10 bg-[rgba(255,255,255,0.05)]
              p-8 shadow-[0_0_0_rgba(124,74,255,0)]
              transition-all duration-300
              hover:-translate-y-[6px]
              hover:border-[var(--brand-600)]
              hover:shadow-[0_20px_48px_rgba(110,59,255,0.18)]
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

            {/* Foreground */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className="
                  mb-6 flex h-[60px] w-[60px] items-center justify-center rounded-xl
                  bg-[var(--brand-600)]/10 text-[var(--brand-400)]
                  transition-all duration-300
                  group-hover:bg-gradient-to-tr
                  group-hover:from-[var(--brand-600)]/30
                  group-hover:to-[var(--brand-400)]/30
                "
              >
                <Icon className="text-2xl" />
              </div>

              <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">
                {title}
              </h3>
              <p className="text-[15px] leading-relaxed text-body-color dark:text-slate-400">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
