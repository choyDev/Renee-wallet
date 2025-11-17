"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import menuData from "./menuData";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import ThemeToggler from "./ThemeToggler";

const Header = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState<string>("");

  useEffect(() => {
    const sync = () => setActiveHash(window.location.hash || "");
    sync();
    window.addEventListener("hashchange", sync, { passive: true });
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (pathname !== "/") setActiveHash("");
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY >= 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAnchorPath = (p?: string) => !!p && (p.startsWith("#") || p.startsWith("/#"));
  const normHash = (p?: string) => (p ? (p.startsWith("/#") ? p.slice(1) : p) : "");

  const isActive = (p?: string) => {
    if (!p) return false;
    if (isAnchorPath(p)) return pathname === "/" && activeHash === normHash(p);
    if (p === "/") return pathname === "/" && activeHash === "";
    return pathname === p;
  };

  return (
    <header
      className={`fixed top-0 left-0 z-[9999] w-full transition-all duration-500 ${
        sticky ? "bg-[var(--bg-body)]/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4 md:py-5">
        {/* ---------------- LOGO ---------------- */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo/logo-dark.svg"
            alt="Renee Wallet"
            width={36}
            height={36}
            className="rounded"
          />
          <span
            className="text-2xl font-bold tracking-tight bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg,var(--brand-600) 0%,var(--brand-400) 100%)",
            }}
          >
            Renee Wallet
          </span>
        </Link>

        {/* ---------------- NAV MENU (Desktop + Mobile) ---------------- */}
        <nav
          className={`
            absolute right-0 top-[65px] z-50 w-[230px] rounded-lg 
            border border-white/10 bg-[var(--white-10)]/95 backdrop-blur-md p-4
            transition-all duration-300 md:static md:block md:w-auto md:border-none md:bg-transparent md:p-0
            ${
              navbarOpen
                ? "opacity-100 translate-y-1 pointer-events-auto"
                : "opacity-0 -translate-y-2 pointer-events-none md:opacity-100 md:translate-y-0 md:pointer-events-auto"
            }
          `}
        >
          <ul className="flex flex-col space-y-3 md:flex-row md:items-center md:space-x-8 md:space-y-0">
            {menuData.map((m) => {
              if (!m.path) return null;
              const anchor = isAnchorPath(m.path);

              return (
                <li key={m.id}>
                  <Link
                    href={m.path}
                    prefetch={false}
                    onClick={(e) => {
                      if (anchor) {
                        e.preventDefault();
                        const id = m.path ? normHash(m.path).slice(1) : "";
                        document.getElementById(id)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                        history.replaceState(null, "", normHash(m.path));
                        setActiveHash(normHash(m.path));
                      } else if (m.path === "/") {
                        setActiveHash("");
                      }
                      setNavbarOpen(false);
                    }}
                    className={`relative block px-2 py-2 text-base font-medium transition md:px-0 md:py-0 ${
                      isActive(m.path)
                        ? "text-[var(--brand-600)]"
                        : "text-slate-300 hover:text-[var(--brand-600)]"
                    }`}
                  >
                    {m.title}
                  </Link>
                </li>
              );
            })}

            {/* ---- MOBILE LANGUAGE SWITCHER ---- */}
            <li className="block md:hidden pt-3 border-t border-white/10">
              <LanguageSwitcher />
            </li>
          </ul>
        </nav>

        {/* ---------------- RIGHT SIDE ---------------- */}
        <div className="flex items-center gap-4">
          {/* Desktop Login/Register */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/signin"
              className="rounded-md border border-[var(--brand-600)]/40 bg-[var(--brand-600)]/10 px-6 py-2 text-sm font-medium text-[var(--brand-600)] hover:bg-[var(--white-5)] transition-all duration-300"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-[var(--brand-600)] px-6 py-2 text-sm font-semibold text-white shadow-[0_0_15px_#6e3bff70] hover:bg-[var(--brand-500)] hover:shadow-[0_0_25px_#6e3bff90] transition-all duration-300"
            >
              Sign Up
            </Link>
          </div>

          <ThemeToggler />

          {/* Desktop Language Switcher */}
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setNavbarOpen(!navbarOpen)}
            className="md:hidden text-slate-200 hover:text-[var(--brand-600)] transition"
          >
            {navbarOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
