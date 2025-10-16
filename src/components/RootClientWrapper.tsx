"use client";

import { ThemeProvider } from "next-themes";
import GoogleTranslateProvider from "@/components/i18n/GoogleTranslateProvider";

export default function RootClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div id="google_translate_element_container"></div>

      <div id="app_content" translate="yes">
        {children}
      </div>

      <GoogleTranslateProvider
        defaultLanguage="en"
        languages={[
          { name: "en", title: "English" },
          { name: "tr", title: "Türkçe" },
        ]}
      />
    </ThemeProvider>
  );
}
