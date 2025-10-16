'use client';

import Script from 'next/script';
import { useEffect } from 'react';

type Lang = { name: string; title: string };

declare global {
  interface Window {
    __GOOGLE_TRANSLATION_CONFIG__?: {
      defaultLanguage: string;
      languages: Lang[];
    };
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

// This renders the hidden host element and loads the Google script.
// Put it once in your root layout.
export default function GoogleTranslateProvider({
  defaultLanguage = 'en',
  languages = [{ name: 'en', title: 'English' }, { name: 'tr', title: 'Türkçe' }],
}: {
  defaultLanguage?: string;
  languages?: Lang[];
}) {
  // make config available before the google script runs
  useEffect(() => {
    window.__GOOGLE_TRANSLATION_CONFIG__ = { defaultLanguage, languages };
  }, [defaultLanguage, languages]);

  return (
    <>
      {/* Hidden host element for Google translator UI */}
      <div id="google_translate_element" className="hidden" />

      {/* Your tiny initializer (equivalent to assets/translation.js) */}
      <Script id="gt-init" strategy="afterInteractive">{`
        function TranslateInit() {
          if (!window.__GOOGLE_TRANSLATION_CONFIG__) return;
          new google.translate.TranslateElement({
            pageLanguage: window.__GOOGLE_TRANSLATION_CONFIG__.defaultLanguage,
            includedLanguages: window.__GOOGLE_TRANSLATION_CONFIG__.languages.map(l => l.name).join(','),
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: true
          }, 'google_translate_element');
        }
        window.googleTranslateElementInit = TranslateInit;
      `}</Script>

      {/* Load Google Website Translator */}
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
