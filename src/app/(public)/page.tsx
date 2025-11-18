// import AboutSectionOne from "@/components/About/AboutSectionOne";
// import AboutSectionTwo from "@/components/About/AboutSectionTwo";
// import Blog from "@/components/Blog";
// import Brands from "@/components/Brands";
// import ScrollUp from "@/components/Common/ScrollUp";
// import Contact from "@/components/Contact";
// import Features from "@/components/Features";
// import Hero from "@/components/Hero";
// import Pricing from "@/components/Pricing";
// import Testimonials from "@/components/Testimonials";
// import Video from "@/components/Video";
// import { Metadata } from "next";

// export const metadata: Metadata = {
//   title: "Free Next.js Template for Startup and SaaS",
//   description: "This is Home for Startup Nextjs Template",
//   // other metadata
// };

// export default function Home() {
//   return (
//     <>
//       <ScrollUp />
//       <Hero />
//       <Features />
//       <Video />
//       <Brands />
//       <AboutSectionOne />
//       <AboutSectionTwo />
//       <Testimonials />
//       <Pricing />
//       <Blog />
//       <Contact />
//     </>
//   );
// }


import Hero from "@/components/landing/home/Hero";
import Badges from "@/components/landing/home/Badges";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/home/HowItWorks";
import Fees from "@/components/landing/home/Fees";
import FinalCTA from "@/components/landing/home/FinalCTA";
import ScrollUp from "@/components/landing/Common/ScrollUp";
import Contact from "@/components/landing/Contact";
import "@/styles/index.css";

export const metadata = {
  title: "Renee — Wallet + Crypto Payments",
  description:
    "Custodial wallet and lightweight crypto payment system. TRX, ETH, XMR, SOL, BTC, XRP, DOGE + USDT on ERC-20/TRC-20/SPL.",
};

export default function Home() {
  return (
    <>
      {/* Background FX (global) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[var(--bg-body)] transition-colors duration-500">
        {/* TOP STREAKS (narrow, tall, blurred, start at top) */}
        <div className="absolute inset-x-0 -top-24 h-[100vh]">
          {/* LEFT */}
          <div
            className="absolute left-[10%] opacity-80"
            style={{
              width: "var(--streak-w-1)",
              height: "100%",
              filter: `blur(var(--streak-blur))`,
              transform: `translateX(var(--streak-pos-1)) rotate(20deg)`,
              background: "var(--streak-1)",
            }}
          />

          {/* CENTER */}
          <div
            className="absolute left-1/2 opacity-90"
            style={{
              width: "var(--streak-w-2)",
              height: "100%",
              filter: `blur(var(--streak-blur))`,
              transform: `translateX(var(--streak-pos-2)) rotate(20deg)`,
              background: "var(--streak-2)",
            }}
          />

          {/* RIGHT */}
          <div
            className="absolute right-[12%] opacity-75"
            style={{
              width: "var(--streak-w-3)",
              height: "100%",
              filter: `blur(var(--streak-blur))`,
              transform: `translateX(var(--streak-pos-3)) rotate(20deg)`,
              background: "var(--streak-3)",
            }}
          />
        </div>

        {/* SIDE VIGNETTES */}
        {/* <div className="absolute -left-28 top-0 bottom-0 w-[42vw] blur-[70px] opacity-35
    bg-[radial-gradient(85%_65%_at_0%_15%,#020617e6,transparent_70%)]" />
        <div className="absolute -right-28 top-0 bottom-0 w-[45vw] blur-[70px] opacity-35
    bg-[radial-gradient(85%_65%_at_100%_10%,#020617e6,transparent_70%)]" /> */}

        {/* BOTTOM FADE */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-[var(--bg-body)]" />
      </div>

      <ScrollUp />
      <main className="relative">
        <Hero />
        <Badges />
        <Features />
        <HowItWorks />
        <Fees />
        <FinalCTA />
        <Contact />
      </main>
    </>
  );
}
