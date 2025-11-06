export default function Badges() {
  return (
    <section className="container max-w-7xl px-6 pb-6 flex justify-center">
      <div className="flex flex-wrap gap-3 text-xs">
        <Badge>Wallet + Payments</Badge>
        <Badge>7 coins supported</Badge>
        <Badge>USDT on ERC-20 / TRC-20 / SPL</Badge>
        <Badge>Crypto-only (no fiat)</Badge>
        <Badge>Merchant APIs & Webhooks</Badge>
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
