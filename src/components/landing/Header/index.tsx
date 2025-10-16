"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggler from "./ThemeToggler";
import menuData from "./menuData";
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';

const Header = () => {
  // Navbar toggle
  const [navbarOpen, setNavbarOpen] = useState(false);
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  // Sticky Navbar
  const [sticky, setSticky] = useState(false);
  const handleStickyNavbar = () => {
    if (window.scrollY >= 80) {
      setSticky(true);
    } else {
      setSticky(false);
    }
  };

  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState<string>("");

  useEffect(() => {
    const sync = () => setActiveHash(window.location.hash || "");
    sync(); // set on first render
    window.addEventListener("hashchange", sync, { passive: true });
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // When route changes to anything that's not "/", clear anchor highlight
  useEffect(() => {
    if (pathname !== "/") setActiveHash("");
  }, [pathname]);

  const isAnchorPath = (p?: string) => !!p && (p.startsWith("#") || p.startsWith("/#"));
  const normHash = (p: string) => (p.startsWith("/#") ? p.slice(1) : p); // "/#features" -> "#features"

  // Active rule:
  // - Home: active when on "/" AND no anchor selected
  // - Anchors: active when on "/" AND their hash matches activeHash
  // - Other routes: active by pathname
  const isActive = (p: string) => {
    if (isAnchorPath(p)) return pathname === "/" && activeHash === normHash(p);
    if (p === "/") return pathname === "/" && activeHash === "";
    return pathname === p;
  };

  return (
    <>
      {/* <header
        className={`header top-0 left-0 z-40 flex w-full items-center ${
          sticky
            ? "dark:bg-gray-dark dark:shadow-sticky-dark shadow-sticky fixed z-9999 bg-white/80 backdrop-blur-xs transition"
            : "bg-transparent"
        }`}
      > */}
      <header
        className={`sticky top-0 left-0 z-[9999] flex w-full items-center backdrop-blur ${
          sticky
            ? "bg-white/80 shadow-sticky transition dark:bg-gray-dark dark:shadow-sticky-dark"
            : "bg-transparent"
        }`}
      >
        <div className="container">
          <div className="relative -mx-4 flex items-center justify-between">
            <div className="w-60 max-w-full px-4 xl:mr-12">
              <Link
                href="/"
                className={`header-logo block w-full ${
                  sticky ? "py-5 lg:py-2" : "py-8"
                } `}
              >
                <Image
                  src="/images/logo/logo-light.svg"
                  alt="logo"
                  width={140}
                  height={30}
                  className="w-full dark:hidden"
                />
                <Image
                  src="/images/logo/logo-dark.svg"
                  alt="logo"
                  width={140}
                  height={30}
                  className="hidden w-full dark:block"
                />
              </Link>
            </div>
            <div className="flex w-full items-center justify-between px-4">
              <div>
                <button
                  onClick={navbarToggleHandler}
                  id="navbarToggler"
                  aria-label="Mobile Menu"
                  className="ring-primary absolute top-1/2 right-4 block translate-y-[-50%] rounded-lg px-3 py-[6px] focus:ring-2 lg:hidden"
                >
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "top-[7px] rotate-45" : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "opacity-0" : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "top-[-8px] -rotate-45" : " "
                    }`}
                  />
                </button>
                <nav
                  id="navbarCollapse"
                  className={`navbar border-body-color/50 dark:border-body-color/20 dark:bg-dark absolute right-0 z-30 w-[250px] rounded border-[.5px] bg-white px-6 py-4 duration-300 lg:visible lg:static lg:w-auto lg:border-none lg:!bg-transparent lg:p-0 lg:opacity-100 ${
                    navbarOpen
                      ? "visibility top-full opacity-100"
                      : "invisible top-[120%] opacity-0"
                  }`}
                >
                  <ul className="block lg:flex lg:space-x-12">
                    {menuData.map((m) => {
                      if (!m.path) return null;
                      const anchor = isAnchorPath(m.path);

                      return (
                        <li key={m.id} className="group relative">
                          <Link
                            href={m.path}
                            prefetch={false}
                            onClick={(e) => {
                              if (anchor) {
                                // smooth scroll + set hash
                                e.preventDefault();
                                const id = normHash(m.path!).slice(1);
                                document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                history.replaceState(null, "", normHash(m.path!));
                                setActiveHash(normHash(m.path!));
                              } else if (m.path === "/") {
                                // clear anchor highlight when going Home
                                setActiveHash("");
                              }
                              // close mobile menu if open
                              setNavbarOpen(false);
                            }}
                            className={`flex py-2 text-base lg:mr-0 lg:inline-flex lg:px-0 lg:py-6 ${
                              isActive(m.path)
                                ? "text-primary dark:text-white"
                                : "text-dark hover:text-primary dark:text-white/70 dark:hover:text-white"
                            }`}
                          >
                            {m.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
              <div className="flex items-center justify-end pr-16 lg:pr-0">
                <Link
                  href="/signin"
                  className="text-dark hidden px-7 py-3 text-base font-medium hover:opacity-70 md:block dark:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="ease-in-up shadow-btn hover:shadow-btn-hover bg-primary hover:bg-primary/90 hidden rounded-xs px-8 py-3 text-base font-medium text-white transition duration-300 md:block md:px-9 lg:px-6 xl:px-9"
                >
                  Sign Up
                </Link>
                <div>
                  <ThemeToggler />
                </div>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
