export default function Badges() {
  return (
    <section className="flex flex-wrap justify-center gap-3 py-6">
      {[
        'Wallet + Payments',
        '7 Coins',
        'USDT ERC-20/TRC-20/SPL',
        'Crypto-Only',
        'Merchant APIs'
      ].map(b => (
        <span
          key={b}
          className="
            px-4 py-1.5 rounded-full text-sm
            border border-[var(--brand-600)]/30
            bg-[var(--brand-600)]/10
            text-[#b68cff]
          "
        >
          {b}
        </span>
      ))}
    </section>
  );
}
