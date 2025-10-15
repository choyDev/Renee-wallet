export default function Badges() {
  return (
    <section className="container max-w-7xl px-6 pb-6 flex justify-center">
        <div className="flex flex-wrap gap-3 text-xs">
            <Badge>Custodial (server keys)</Badge>
            <Badge>TRON (TRC-20) & Solana (SPL)</Badge>
            <Badge>Auto conversion</Badge>
            <Badge>KYC personal & corporate</Badge>
            <Badge>On-ramp inside wallet</Badge>
        </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs dark:bg-primary/20 dark:text-[#aab8ff] dark:border-primary/40">
      {children}
    </span>
  );
}

