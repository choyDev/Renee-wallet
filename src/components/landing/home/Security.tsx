import Image from "next/image";

export default function Security() {
  return (
    <section id="security" className="relative overflow-x-clip">
      <div className="container max-w-7xl px-6 py-12 grid items-center gap-10 md:grid-cols-2">
        {/* LEFT: art */}
        {/* <div className="relative order-1 h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px] md:order-none">
          <SecurityArt className="absolute left-[-8%] top-[-8%] h-[120%] w-[120%] md:left-[-6%] md:top-[-6%]" />
        </div> */}
        <div className="flex items-center justify-center">
          <Image
            src="/images/png/security.png" // move the chosen PNG into /public/illustrations
            alt="TRON network illustration"
            width={1270}  
            height={722}
            className="rounded-xl object-cover opacity-80"
            priority
          />
        </div>

        {/* RIGHT: content card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_8px_24px_rgba(2,6,23,0.25)] backdrop-blur ring-1 ring-white/[0.04]">
          <h3 className="text-xl font-semibold text-black dark:text-white">Security & Compliance</h3>
          <ul className="mt-4 grid gap-3 text-slate-900 dark:text-slate-300 md:grid-cols-1">
            <Item> AES-256-GCM encrypted private keys (server only) </Item>
            <Item> HTTPS, rate limiting, audit logs </Item>
            <Item> KYC-gated access, role-based admin </Item>
            <Item> Daily database & metadata backups </Item>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-[3px] inline-grid h-5 w-5 place-items-center rounded-md bg-primary/20 text-primary">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
          <path fill="currentColor" d="M9.5 16.2 5.8 12.5l1.4-1.4 2.3 2.3 6.3-6.3 1.4 1.4z"/>
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}
