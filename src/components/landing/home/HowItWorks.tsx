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
        paragraph="Sign up and complete KYC to activate your wallet. Deposit Turkish Lira using your unique reference code—we’ll automatically convert it to USDT at the best available rate and credit your TRON or Solana address. Fees are shown upfront; withdrawals are disabled."
        center
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <BlockCard
            title="Sign up & verify (KYC)"
            icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/85">
                    <path fill="currentColor" d="M3 7a3 3 0 0 1 3-3h11a1 1 0 1 1 0 2H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 1 1 0 2H6a3 3 0 0 1-3-3V7z" />
                </svg>
            }
        >
            <span className="font-medium text-slate-900 dark:text-white">Create your account</span> and complete personal or corporate KYC to activate wallet services.
        </BlockCard>

        <BlockCard
            title="Wallets issued: TRON & Solana"
            icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/85">
                    <path fill="currentColor" d="M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z" />
                </svg>
            }
        >
            On approval, secure custodial addresses are generated for TRC-20 (TRON) and SPL (Solana).
        </BlockCard>

        <BlockCard title="Deposit TRY with your reference"
            icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/85">
                    <path fill="currentColor" d="M4 12a8 8 0 1 1 16 0a8 8 0 0 1-16 0zm7-4h2v8h-2V8z" />
                </svg>
            }
        >
            Send Turkish Lira to the bank account shown in your dashboard using your unique reference code.
        </BlockCard>

        <BlockCard title="Auto-convert to USDT & credit"
            icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/85">
                    <path fill="currentColor" d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
                </svg>
            }
        >
            We execute the best-rate conversion to USDT and credit your chosen chain. Fees are shown upfront. (Withdrawals are disabled.)
        </BlockCard>
      </div>
    </SectionShell>
  );
}