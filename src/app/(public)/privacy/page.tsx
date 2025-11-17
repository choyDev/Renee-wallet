import Breadcrumb from "@/components/landing/Common/Breadcrumb";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy&Policy Page | Free Next.js Template for Startup and SaaS",
  description: "This is Privacy&Policy Page for Startup Nextjs Template",
  // other metadata
};

const PrivacyPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="Privacy Policy"
        description="Your privacy is important to us. This policy explains how we collect, use, and protect your information when you use our services."
      />
      {/* <Contact /> */}
    </>
  );
};

export default PrivacyPage;
