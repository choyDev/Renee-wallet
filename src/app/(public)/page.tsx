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
import Security from "@/components/landing/home/Security";
import FinalCTA from "@/components/landing/home/FinalCTA";
import ScrollUp from "@/components/landing/Common/ScrollUp";
import Contact from "@/components/landing/Contact";

export const metadata = {
  title: "Renee — Hot Wallet for TRY → USDT",
  description: "Custodial wallet with KYC, TRON & Solana support, and automatic TRY→USDT conversion.",
};

export default function Home() {
  return (
    <>
      <ScrollUp />
      <Hero />
      <Badges />
      <Features />
      <HowItWorks />
      <Fees />
      <Security />
      <FinalCTA />
      <Contact />
    </>
  );
}
