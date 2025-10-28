
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  ChevronDownIcon,
} from "../icons/index";

import {
  FaTachometerAlt,  // Dashboard
  FaWallet,         // Wallet
  FaUserCircle,     // Profile
  FaCog,            // Settings
  FaQuestionCircle, // Support
  FaIdCard,         // KYC
  FaExchangeAlt,    // Transaction
} from "react-icons/fa";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// ----------------------------
// Only Main Nav Items
// ----------------------------
const navItems = [
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
      { name: "Bitcoin (BTC)", path: "/wallet/btc" },
      { name: "Ethereum (ETH)", path: "/wallet/eth" },
      { name: "Solana (SOL)", path: "/wallet/sol" },
      { name: "Tron (TRX)", path: "/wallet/trx" },
      { name: "XRP", path: "/wallet/xrp" },
      { name: "Monero (XMR)", path: "/wallet/xmr" },
      { name: "Dogecoin (DOGE)", path: "/wallet/doge" },
    ],
  },
  {
    icon: <FaExchangeAlt className="w-5 h-5" />,
    name: "Transaction",
    path: "/transaction"
  },

  {
    icon: <FaUserCircle className="w-5 h-5" />,
    name: "Profile",
    path: "/profile"
  },
  {
    icon: <FaIdCard className="w-5 h-5" />,
    name: "KYC",
    path: "/kyc-verification"
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


// ----------------------------
// Component
// ----------------------------
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let matchedIndex: number | null = null;

    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        // open if main path or any sub-item path matches current URL
        const isWalletSection =
          pathname === nav.path ||
          nav.subItems.some((subItem) => pathname.startsWith(subItem.path));

        if (isWalletSection) {
          matchedIndex = index;
        }
      }
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


  const router = useRouter();
  // ----------------------------
  // Render Menu
  // ----------------------------
  const renderMenuItems = (navItems: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <Link
              href={nav.path ?? "#"}
              onClick={(e) => {
                e.preventDefault(); // prevent default navigation first
                handleSubmenuToggle(index); // toggle submenu
                // then navigate programmatically
                router.push(nav.path!);
              }}
              className={`menu-item group ${openSubmenu === index ? "menu-item-active" : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
            >
              <span
                className={`${openSubmenu === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu === index ? "rotate-180 text-brand-500" : ""
                    }`}
                />
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
                  className={`${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
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
                    ? `${subMenuHeight[`main-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
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
                ))}
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
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo-light.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
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
