// import Link from "next/link";

// export default function HowItWorks() {
//   return (
//     <section id="how-it-works" className="container max-w-7xl px-6 py-12 justify-center text-center">
//       <h2 className="text-5xl font-semibold text-slate-900 dark:text-white">How it works</h2>
//       <ol className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4 list-decimal list-inside text-slate-700 dark:text-slate-300">
//         <li><span className="font-medium text-slate-900 dark:text-white">Create account</span> and complete KYC.</li>
//         <li>Get your TRON & Solana addresses in the dashboard.</li>
//         <li>Deposit TRY to the bank account with your reference code.</li>
//         <li>We auto-convert to USDT and credit your on-chain wallet.</li>
//       </ol>
//       <div className="mt-8">
//         <Link href="/signup" className="inline-block px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/80 transition">Create account</Link>
//       </div>
//     </section>
//   );
// }



import BlockCard from "@/components/landing/ui/BlockCard";
import SectionShell from "@/components/landing/ui/SectionShell";
import SectionTitle from "../Common/SectionTitle";

export default function HowItWorks() {
  return (
    <SectionShell id="how-it-works" className="scroll-mt-24 md:scroll-mt-28">
      <SectionTitle
        title="How it works"
        paragraph="Create payment requests, let payers choose a supported coin, and we track confirmations on-chain. Funds arrive to your custodial wallet; optional swap/bridge is available inside the app. No fiat."
        center
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <BlockCard
          title="1. Create account"
          icon={<svg viewBox="0 0 24 24" className="h-4 w-4 text-white/85"><path fill="currentColor" d="M3 7a3 3 0 0 1 3-3h11a1 1 0 1 1 0 2H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 1 1 0 2H6a3 3 0 0 1-3-3V7z"/></svg>}
        >
          Get custodial wallets for TRX, ETH, XMR, SOL, BTC, XRP, DOGE. USDT supported on ERC-20 / TRC-20 / SPL.
        </BlockCard>

        <BlockCard
          title="2. Generate request/invoice"
          icon={<svg viewBox="0 0 24 24" className="h-4 w-4 text-white/85"><path fill="currentColor" d="M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z"/></svg>}
        >
          Create a checkout link with amount, memo, and allowed coins—or let the payer pick.
        </BlockCard>

        <BlockCard
          title="3. Payer sends on-chain"
          icon={<svg viewBox="0 0 24 24" className="h-4 w-4 text-white/85"><path fill="currentColor" d="M4 12a8 8 0 1 1 16 0a8 8 0 0 1-16 0zm7-4h2v8h-2V8z"/></svg>}
        >
          We detect the payment and track confirmations per network; status updates via webhook.
        </BlockCard>

        <BlockCard
          title="4. Settle & manage"
          icon={<svg viewBox="0 0 24 24" className="h-4 w-4 text-white/85"><path fill="currentColor" d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"/></svg>}
        >
          Funds sit in your wallet. Optionally swap/bridge inside the app. No fiat off-ramp.
        </BlockCard>
      </div>
    </SectionShell>
  );
}
