import Image from "next/image";

export default function Security() {
  return (
    <section id="security" className="relative overflow-x-clip py-10">
      <div className="container max-w-7xl px-6 grid items-center gap-10 md:grid-cols-1">
        <div className="rounded-2xl border border-[var(--brand-600)]/50 dark:border-white/10 bg-[#ffffff0d] p-8 shadow-[0_0_0_rgba(124,74,255,0)]
                        hover:border-[#6e3bff] hover:shadow-[0_20px_48px_#6e3bff2e] transition-all duration-300">
          {/* <h3 className="text-2xl font-bold text-white mb-6">Security & Reliability</h3> */}
          <ul className="space-y-3 text-slate-400">
            {[
              "Encrypted custody and strict access controls",
              "HTTPS, rate limiting, audit logs",
              "Signed webhooks for merchant callbacks",
              "Daily database & metadata backups"
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-[#a855f7]">✔</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* <div className="flex justify-center">
          <Image
            src="/images/png/security.png"
            alt="Security illustration"
            width={1270}
            height={722}
            className="rounded-2xl shadow-[0_20px_48px_#6e3bff2e]"
          />
        </div> */}
      </div>
    </section>
  );
}
