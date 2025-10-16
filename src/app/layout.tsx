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


import { Outfit } from "next/font/google";
import "./globals.css";
<<<<<<< HEAD
import GoogleTranslateProvider from '@/components/i18n/GoogleTranslateProvider';
=======

>>>>>>> 6b96a81b8bc7c5badbf001bdd3f61a58f7c37855

const outfit = Outfit({
  subsets: ["latin"],
});

<<<<<<< HEAD
=======


>>>>>>> 6b96a81b8bc7c5badbf001bdd3f61a58f7c37855
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} bg-white dark:bg-gray-900`}>
        {children}
        <GoogleTranslateProvider
          defaultLanguage="en"
          languages={[
            { name: 'en', title: 'English' },
            { name: 'tr', title: 'Türkçe' }
          ]}
        />
      </body>
    </html>
  );
}
