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
      <div className={`bg-[#FCFCFC] dark:bg-black ${inter.className}`}>
        <Providers>
          <Header />
          {children}
          <Footer />
          <ScrollToTop />
        </Providers>
      </div>
  );
}

import { Providers } from "./providers";

