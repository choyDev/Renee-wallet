"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

type WalletBadges = Record<string, number>;

type SidebarContextType = {
  // UI state (from your first file)
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  activeItem: string | null;
  openSubmenu: string | null;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setIsHovered: (isHovered: boolean) => void;
  setActiveItem: (item: string | null) => void;
  toggleSubmenu: (item: string) => void;

  // Badges (from your second file)
  walletBadges: WalletBadges;
  setWalletBadge: (path: string, value: number | null | undefined) => void;
  setWalletBadgesBulk: (entries: Record<string, number | null | undefined>) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}

export function SidebarProvider({
  children,
  initialWalletBadges = {},
}: {
  children: React.ReactNode;
  initialWalletBadges?: WalletBadges;
}) {
  // --- UI state
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleSidebar = () => setIsExpanded((p) => !p);
  const toggleMobileSidebar = () => setIsMobileOpen((p) => !p);
  const toggleSubmenu = (item: string) =>
    setOpenSubmenu((prev) => (prev === item ? null : item));

  // --- Badges state
  const [walletBadges, setWalletBadges] = useState<WalletBadges>(initialWalletBadges);

  const setWalletBadge = useCallback((path: string, value?: number | null) => {
    setWalletBadges((prev) => {
      const next = { ...prev };
      const v = Number(value ?? 0);
      if (!v || v <= 0) delete next[path];
      else next[path] = v;
      return next;
    });
  }, []);

  const setWalletBadgesBulk = useCallback(
    (entries: Record<string, number | null | undefined>) => {
      setWalletBadges((prev) => {
        const next = { ...prev };
        for (const [path, val] of Object.entries(entries)) {
          const v = Number(val ?? 0);
          if (!v || v <= 0) delete next[path];
          else next[path] = v;
        }
        return next;
      });
    },
    []
  );

  return (
    <SidebarContext.Provider
      value={{
        isExpanded: isMobile ? false : isExpanded,
        isMobileOpen,
        isHovered,
        activeItem,
        openSubmenu,
        toggleSidebar,
        toggleMobileSidebar,
        setIsHovered,
        setActiveItem,
        toggleSubmenu,
        walletBadges,
        setWalletBadge,
        setWalletBadgesBulk,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
