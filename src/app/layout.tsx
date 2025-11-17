import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import RootClientWrapper from "@/components/RootClientWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Renee Wallet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
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

      <body className="font-inter bg-white dark:bg-[linear-gradient(145deg,#1C1A2F_0%,#12111F_40%,#080A12_100%)]">
        <RootClientWrapper>{children}</RootClientWrapper>
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3",
            success: {
              iconTheme: { primary: "#10B981", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#EF4444", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
