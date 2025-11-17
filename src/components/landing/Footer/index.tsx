"use client";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="relative z-10 bg-[#14121c] pt-20 pb-10 border-t border-white/10">
      <div className="container mx-auto px-6 text-center">
        {/* LOGO + DESCRIPTION */}
        <div className="flex flex-col items-center justify-center mb-10">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 group">
            <Image
              src="/images/logo/logo-dark.svg"
              alt="Renee Wallet"
              width={40}
              height={40}
              className="opacity-90 group-hover:opacity-100 transition"
            />
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#6e3bff] to-[#a855f7] bg-clip-text text-transparent">
              Renee Wallet
            </span>
          </Link>
          <p className="max-w-xl text-sm leading-relaxed text-slate-400">
            Simple, compliant crypto wallet for businesses and individuals.<br/>  
            Supports TRX, ETH, XMR, SOL, BTC, XRP, DOGE and USDT on ERC-20 / TRC-20 / SPL.
          </p>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="flex flex-wrap justify-center gap-8 text-sm mb-10">
          {/* <FooterLink href="/">Home</FooterLink>
          <FooterLink href="/features">Features</FooterLink>
          <FooterLink href="/about">About</FooterLink>
          <FooterLink href="/pricing">Pricing</FooterLink> */}
          <FooterLink href="/contact">Contact</FooterLink>
          <FooterLink href="/privacy">Privacy Policy</FooterLink>
        </div>

        {/* SOCIAL ICONS */}
        <div className="flex justify-center gap-6 mb-10">
          <SocialIcon href="https://twitter.com">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 16.5 2a4.48 4.48 0 0 0-4.5 4.5c0 .35.04.7.11 1.03A12.8 12.8 0 0 1 3 3.6a4.48 4.48 0 0 0 1.39 6A4.4 4.4 0 0 1 2.8 9v.05a4.48 4.48 0 0 0 3.6 4.4 4.52 4.52 0 0 1-2.04.08A4.48 4.48 0 0 0 7.5 17a9 9 0 0 1-5.6 1.9A9.15 9.15 0 0 1 1 18.9a12.8 12.8 0 0 0 7 2c8.4 0 13-7 13-13v-.6A9.3 9.3 0 0 0 23 3Z" />
            </svg>
          </SocialIcon>
          <SocialIcon href="https://github.com">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 .5C5.4.5 0 5.9 0 12.4c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.2.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.5-1.5-1.9-1.5-1.9-1.2-.8.1-.8.1-.8 1.4.1 2.2 1.5 2.2 1.5 1.2 2.1 3.2 1.5 4 .9.1-.9.4-1.5.7-1.8-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.4-2.3 1.1-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.1a10.9 10.9 0 0 1 5.8 0c2.2-1.4 3.2-1.1 3.2-1.1.6 1.6.2 2.8.1 3.1.7.8 1.1 1.8 1.1 3.1 0 4.6-2.7 5.6-5.3 5.9.4.3.8 1 .8 2v3c0 .3.2.6.8.6 4.8-1.6 8.2-6.1 8.2-11.4C24 5.9 18.6.5 12 .5Z" />
            </svg>
          </SocialIcon>
          <SocialIcon href="https://linkedin.com">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M20.45 20.45H16.9v-5.4c0-1.29-.02-2.95-1.8-2.95-1.81 0-2.09 1.42-2.09 2.87v5.48H9.46V9h3.4v1.56h.05c.47-.9 1.63-1.84 3.35-1.84 3.58 0 4.24 2.36 4.24 5.43v6.3ZM5.34 7.43a1.96 1.96 0 1 1 0-3.92 1.96 1.96 0 0 1 0 3.92ZM6.99 20.45H3.7V9h3.29v11.45ZM22.22 0H1.78C.8 0 0 .8 0 1.78v20.44C0 23.2.8 24 1.78 24h20.44A1.78 1.78 0 0 0 24 22.22V1.78A1.78 1.78 0 0 0 22.22 0Z" />
            </svg>
          </SocialIcon>
        </div>

        {/* COPYRIGHT */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#6e3bff40] to-transparent mb-6" />
        <p className="text-xs text-slate-500">© 2025 Renee. All rights reserved.</p>

        {/* GLOW DECORATION */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#6e3bff20] via-transparent to-transparent blur-3xl pointer-events-none" />
      </div>
    </footer>
  );
};

export default Footer;

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-slate-400 hover:text-[#a855f7] transition duration-300 font-medium"
    >
      {children}
    </Link>
  );
}

function SocialIcon({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2.5 rounded-md border border-white/10 text-slate-400 hover:text-[#a855f7] hover:border-[#6e3bff]/40 transition duration-300"
    >
      {children}
    </Link>
  );
}
