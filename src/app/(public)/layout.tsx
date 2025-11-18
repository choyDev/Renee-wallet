"use client";

import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import ScrollToTop from "@/components/landing/ScrollToTop";
import { Inter } from "next/font/google";
import "@/styles/index.css";

const inter = Inter({ subsets: ["latin"] });

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`min-h-screen bg-[var(--bg-body)] text-[var(--text-main)] transition-colors duration-300 ${inter.className}`}
    >
      <Providers>
        <Header />
        <main className="relative z-10">{children}</main>
        <Footer />
        <ScrollToTop />
      </Providers>
    </div>
  );
}

import { Providers } from "./providers";

