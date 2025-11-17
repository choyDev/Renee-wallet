"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { ChevronDownIcon } from "../icons/index";

import {
  FaTachometerAlt,  // Dashboard
  FaWallet,         // Wallet
  FaUserCircle,     // Profile
  FaCog,            // Settings
  FaQuestionCircle, // Support
  FaIdCard,         // KYC
  FaExchangeAlt,    // Transaction
} from "react-icons/fa";

type SubItem = { name: string; path: string; pro?: boolean; new?: boolean };
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
};

// ----------------------------
// Only Main Nav Items
// ----------------------------
const navItems: NavItem[] = [
  {
    icon: <FaTachometerAlt className="w-5 h-5" />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <FaWallet className="w-5 h-5" />,
    name: "My Wallet",
    path: "/wallet",
    subItems: [
      { name: "Ethereum", path: "/wallet/eth" },
      { name: "Solana", path: "/wallet/sol" },
      { name: "Bitcoin", path: "/wallet/btc" },
      { name: "Tron", path: "/wallet/trx" },
      { name: "XRP Ledger", path: "/wallet/xrp" },
      { name: "Monero", path: "/wallet/xmr" },
      { name: "Dogecoin", path: "/wallet/doge" },
    ],
  },
  {
    icon: <FaUserCircle className="w-5 h-5" />,
    name: "Profile",
    path: "/profile",
  },
  {
    icon: <FaIdCard className="w-5 h-5" />,
    name: "KYC",
    path: "/kyc-verification",
  },
  {
    icon: <FaCog className="w-5 h-5" />,
    name: "Settings",
    path: "/settings",
  },
  {
    icon: <FaQuestionCircle className="w-5 h-5" />,
    name: "Support",
    path: "/support",
  },
];

// compact USD badge formatter
const fmtUsdShort = (n: number) =>
  n >= 1000 ? `$${Math.round(n).toLocaleString()}` : `$${n.toFixed(2)}`;

// ----------------------------
// Component
// ----------------------------
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, walletBadges } = useSidebar() as {
    isExpanded: boolean;
    isMobileOpen: boolean;
    isHovered: boolean;
    setIsHovered: (v: boolean) => void;
    walletBadges?: Record<string, number>;
  };

  const pathname = usePathname();
  const router = useRouter();

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Active if exact or nested (/path or /path/child)
  const isActive = useCallback(
    (path: string) => pathname === path || pathname.startsWith(path + "/"),
    [pathname]
  );

  const parentWalletTotal = React.useMemo(() => {
    if (!walletBadges) return 0;
    let sum = 0;
    for (const [path, val] of Object.entries(walletBadges)) {
      if (path.startsWith("/wallet/")) sum += Number(val ?? 0);
    }
    return sum;
  }, [walletBadges]);

  const inWalletSection =
    pathname === "/wallet" || pathname.startsWith("/wallet/");

  const badgeClass = (active: boolean) =>
    `${active ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`;

  // Auto-open Wallet submenu when on /wallet or any /wallet/*
  useEffect(() => {
    let matchedIndex: number | null = null;
    navItems.forEach((nav, index) => {
      if (!nav.subItems) return;
      const open =
        pathname === nav.path ||
        nav.subItems.some((s) => pathname === s.path || pathname.startsWith(s.path + "/"));
      if (open) matchedIndex = index;
    });
    setOpenSubmenu(matchedIndex);
  }, [pathname]);

  // Update submenu height when opened
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `main-${openSubmenu}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prev) => (prev === index ? null : index));
  };

  // ----------------------------
  // Render Menu
  // ----------------------------
  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <Link
              href={nav.path ?? "#"}
              onClick={(e) => {
                e.preventDefault();              // toggle without losing scroll
                handleSubmenuToggle(index);
                if (nav.path) router.push(nav.path); // still navigate to parent
              }}
              className={`menu-item group ${openSubmenu === index ? "menu-item-active" : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
            >
              <span
                className={`${openSubmenu === index ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="ml-auto flex items-center gap-2">
                  {/* Only show for the Wallet parent */}
                  {nav.name === "My Wallet" && (
                    <span
                      className={badgeClass(inWalletSection)}
                      title="Total USD across all chains"
                      suppressHydrationWarning
                    >
                      {fmtUsdShort(parentWalletTotal)}
                    </span>
                  )}
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu === index ? "rotate-180 text-brand-500" : ""
                      }`}
                  />
                </span>
              )}
            </Link>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {/* Submenu */}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`main-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu === index
                    ? `${subMenuHeight[`main-${index}`] ?? 0}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => {
                  const total = walletBadges?.[subItem.path] ?? 0;
                  const hasTotal = typeof total === "number" && total >= 0;

                  return (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                          }`}
                      >
                        {subItem.name}

                        <span className="flex items-center gap-1 ml-auto">
                          {/* Total USD badge (always available if set in context) */}
                          {hasTotal && (
                            <span
                              className={`${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              title="Total USD (native + USDT)"
                              suppressHydrationWarning
                            >
                              {fmtUsdShort(total!)}
                            </span>
                          )}

                          {/* other flags remain */}
                          {subItem.new && (
                            <span
                              className={`${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  // ----------------------------
  // Render Sidebar
  // ----------------------------
  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-4 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/">
          {isExpanded || isHovered ? (
            <div className="flex flex-row items-center gap-2">
              <Image
                className="dark:hidden"
                src="/images/logo/logo-light.svg"
                alt="Logo"
                width={44}
                height={44}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={44}
                height={44}
              />
              <span
                className="hidden dark:block text-2xl font-bold tracking-tight bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, #6e3bff 0%, #a855f7 100%)",
                }}
              >
                Renee Wallet
              </span>
              </div>
          ) : (
            <Image src="/images/logo/logo-dark.svg" alt="Logo" width={50} height={50} />
          )}
        </Link>
      </div>

      {/* Navigation (Only navItems) */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">{renderMenuItems(navItems)}</div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
