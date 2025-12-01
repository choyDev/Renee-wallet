"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { ChevronDownIcon } from "../icons/index";

// USER icons
import {
  FaTachometerAlt,
  FaWallet,
  FaUserCircle,
  FaCog,
  FaQuestionCircle,
  FaIdCard,
  FaExchangeAlt,
} from "react-icons/fa";

// ADMIN icons (lucide)
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Receipt,
  Repeat,
  Settings,
  Wallet,
  LogOut,
} from "lucide-react";

import { jwtDecode } from "jwt-decode";

type SubItem = { name: string; path: string };
type UserNavItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
  subItems?: SubItem[];
};

type AdminNavItem = {
  name: string;
  href: string;
  icon: any;
};

// =============================
//   � ROLE DETECTION
// =============================
const getUserRole = () => {
  if (typeof window === "undefined") return "user";
  return localStorage.getItem("role") || "user";
};

// =============================
// USER NAV ITEMS (YOUR ORIGINAL)
// =============================
const userNavItems = [
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

// =============================
// ADMIN NAV ITEMS
// =============================
const adminNavItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "KYC", href: "/admin/kyc", icon: ShieldCheck },
  { name: "Transactions", href: "/admin/transactions", icon: Receipt },
  { name: "Swap Monitor", href: "/admin/swap", icon: Repeat },
  { name: "Assets", href: "/admin/assets", icon: Wallet },
  { name: "Fee Settings", href: "/admin/settings/fees", icon: Settings },
];

// =============================
// USD SHORT FORMATTER
// =============================
export const fmtUsdShort = (n: number) => {
  const num = n >= 1000 ? Math.round(n).toLocaleString("en-US") : n.toFixed(2);
  return (
    <span className="notranslate" translate="no">
      ${num}
    </span>
  );
};

// =============================
// MAIN MERGED SIDEBAR COMPONENT
// =============================
const AppSidebar: React.FC = () => {
  const role = getUserRole(); // "admin" or "user"

  const router = useRouter();
  const pathname = usePathname();

  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    walletBadges,
  } = useSidebar();

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  // Auto-expand current submenu
  useEffect(() => {
    let matched: number | null = null;
    userNavItems.forEach((nav, index) => {
      if (!nav.subItems) return;
      const open =
        pathname === nav.path ||
        nav.subItems.some((s) => pathname.startsWith(s.path));
      if (open) matched = index;
    });
    setOpenSubmenu(matched);
  }, [pathname]);

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

  // =============================
  // ADMIN SIDEBAR RENDER
  // =============================
  if (role === "admin") {
    const logout = async () => {
      document.cookie =
        "token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0";
      localStorage.removeItem("role");
      router.push("/signin");
    };

    return (
      <aside
        className={`
    fixed flex flex-col top-0 left-0 px-5 
    bg-white dark:bg-[#110f20] dark:border-gray-800 text-gray-900
    h-screen border-r border-gray-200 
    transition-all duration-300 ease-in-out z-50

    ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
    ${isMobileOpen ? "translate-x-0 pt-20" : "-translate-x-full"}
    lg:translate-x-0
  `}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* LOGO */}
        <div
          className={`py-4 hidden lg:flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
            }`}
        >
          <Link href="/admin">
            <div className="flex flex-row items-center gap-2">
              <Image
                className=""
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={44}
                height={44}
              />
              {(isExpanded || isHovered) && (
                <span
                  className="text-2xl font-bold tracking-tight bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #6e3bff 0%, #a855f7 100%)",
                  }}
                >
                  Renee Wallet
                </span>
              )}
            </div>
          </Link>
        </div>

        <div className={"p-4 border-b border-black/10 dark:border-white/10 text-lg font-semibold text-[#374151] dark:text-[#D1D5DB]"}>
          Admin Panel
        </div>

        {/* NAV */}
        <nav className="flex flex-col gap-4 mt-4">
          {adminNavItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href ?? ""}
                className={`menu-item ${active ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={
                    active ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }
                >
                  <item.icon className="w-5 h-5" />
                </span>

                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}
        {/* <button
          onClick={logout}
          className="menu-item menu-item-inactive mt-auto mb-6"
        >
          <span className="menu-item-icon-inactive">
            <LogOut className="w-5 h-5" />
          </span>
          {(isExpanded || isHovered) && (
            <span className="menu-item-text">Logout</span>
          )}
        </button> */}
      </aside>
    );
  } else {

    // =============================
    // USER SIDEBAR (your original)
    // =============================
    return (
      <aside
        className={`fixed flex flex-col top-0 px-5 left-0 bg-white dark:bg-[#110f20] dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
      ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
      ${isMobileOpen ? "translate-x-0 pt-20" : "-translate-x-full"}
      lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className={`py-4 hidden lg:flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
          <Link href="/">
            {isExpanded || isHovered ? (
              <div className="flex flex-row items-center gap-2">
                <Image
                  className="dark:hidden"
                  src="/images/logo/logo-dark.svg"
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
                  className="dark:block text-2xl font-bold tracking-tight bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #6e3bff 0%, #a855f7 100%)",
                  }}
                >
                  Renee Wallet
                </span>
              </div>
            ) : (
              <Image
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={44}
                height={44}
              />
            )}
          </Link>
        </div>

        {/* Render User nav */}
        <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
          <nav className="mb-6">{renderMenuItems(userNavItems)}</nav>
        </div>
      </aside>
    );
  }

  // ----------------------------
  // RENDER USER MENU ITEMS
  // ----------------------------
  function renderMenuItems(items: UserNavItem[]) {
    return (
      <ul className="flex flex-col gap-4">
        {items.map((nav: UserNavItem, index: number) => (
          <li key={nav.name}>
            {nav.subItems ? (
              <>
                <Link
                  href={nav.path ?? "#"}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmenuToggle(index);
                    if (nav.path) router.push(nav.path);
                  }}
                  className={`menu-item group ${openSubmenu === index ? "menu-item-active" : "menu-item-inactive"} cursor-pointer`}
                >
                  <span className={openSubmenu === index ? "menu-item-icon-active" : "menu-item-icon-inactive"}>{nav.icon}</span>

                  {(isExpanded || isHovered || isMobileOpen) && (
                    <>
                      <span className="menu-item-text">{nav.name}</span>
                      <span className="ml-auto flex items-center gap-2">
                        {nav.name === "My Wallet" && (
                          <span className={isActive(nav.path) ? "menu-dropdown-badge-active menu-dropdown-badge" : "menu-dropdown-badge-inactive menu-dropdown-badge"}>
                            {fmtUsdShort(parentWalletTotal)}
                          </span>
                        )}
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${openSubmenu === index ? "rotate-180 text-brand-500" : ""}`} />
                      </span>
                    </>
                  )}
                </Link>

                {/* SUBMENU */}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <div
                    ref={(el: HTMLDivElement | null) => {
                      subMenuRefs.current[`main-${index}`] = el;
                    }}
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      height: openSubmenu === index ? `${subMenuHeight[`main-${index}`] ?? 0}px` : "0px",
                    }}
                  >
                    <ul className="mt-2 space-y-1 ml-9">
                      {nav.subItems.map((sub: SubItem) => {
                        const total = walletBadges?.[sub.path] ?? 0;
                        return (
                          <li key={sub.name}>
                            <Link
                              href={sub.path}
                              className={`menu-dropdown-item ${isActive(sub.path)
                                ? "menu-dropdown-item-active"
                                : "menu-dropdown-item-inactive"
                                }`}
                            >
                              {sub.name}
                              <span className="ml-auto">
                                {typeof total === "number" && (
                                  <span
                                    className={`${isActive(sub.path)
                                      ? "menu-dropdown-badge-active"
                                      : "menu-dropdown-badge-inactive"
                                      } menu-dropdown-badge`}
                                  >
                                    {fmtUsdShort(total)}
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
              </>
            ) : (
              <Link
                href={nav.path ?? ""}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span className={isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )}
          </li>
        ))}
      </ul>
    );
  }
};

export default AppSidebar;
