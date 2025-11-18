import Breadcrumb from "@/components/landing/Common/Breadcrumb";
import Contact from "@/components/landing/Contact";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Page | Free Next.js Template for Startup and SaaS",
  description: "This is Contact Page for Startup Nextjs Template",
  // other metadata
};

const ContactPage = () => {
  return (
    <>
    
      {/* <Breadcrumb
        pageName="Contact Page"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. In varius eros eget sapien consectetur ultrices. Ut quis dapibus libero."
      /> */}
      
      <div className="pt-18 lg:pt-22 pb-10 lg:pb-20">
        <Contact showBackButton={true}/>
      </div>
    </>
  );
};

export default ContactPage;
