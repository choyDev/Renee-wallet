// import { Outfit } from 'next/font/google';
// import './globals.css';

// import { SidebarProvider } from '@/context/SidebarContext';
// import { ThemeProvider } from '@/context/ThemeContext';

// const outfit = Outfit({
//   subsets: ["latin"],
// });

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body className={`${outfit.className} dark:bg-gray-900`}>
//         <ThemeProvider>
//           <SidebarProvider>{children}</SidebarProvider>
//         </ThemeProvider>
//       </body>
//     </html>
//   );
// }


"use client";

import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import GoogleTranslateProvider from "@/components/i18n/GoogleTranslateProvider";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent dark/light flicker before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>

      <body className={`${outfit.className} bg-white dark:bg-gray-900`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
        >
          {children}
          <GoogleTranslateProvider
            defaultLanguage="en"
            languages={[
              { name: "en", title: "English" },
              { name: "tr", title: "Türkçe" },
            ]}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
