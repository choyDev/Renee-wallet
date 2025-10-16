'use client';

import Script from 'next/script';
import {useEffect, useState} from 'react';

type Lang = { name: string; title: string };

function shouldLoadGoogleTranslate(): boolean {
  // Look for googtrans cookie and see if target != 'en'
  const m = (typeof document !== 'undefined' ? document.cookie : '').match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!m) return false; // no cookie => don't load
  const parts = decodeURIComponent(m[1]).split('/'); // "/en/tr"
  const to = (parts[2] || 'en').toLowerCase();
  return to !== 'en';
}

export default function GoogleTranslateProvider({
  defaultLanguage = 'en',
  languages = [
    { name: 'en', title: 'English' },
    { name: 'tr', title: 'Türkçe' },
  ],
}: {
  defaultLanguage?: string;
  languages?: Lang[];
}) {
  const [loadGT, setLoadGT] = useState(false);

  // Decide on the client whether to load the translator
  useEffect(() => {
    setLoadGT(shouldLoadGoogleTranslate());
  }, []);

  // Serialize config for the init
  const cfg = JSON.stringify({ defaultLanguage, languages });

  return (
    <>
      {/* host element for Google widget (kept hidden) */}
      <div id="google_translate_element" className="hidden notranslate" />

      {loadGT && (
        <>
          {/* Make config available before the external script runs */}
          <Script id="gt-config" strategy="afterInteractive">
            {`window.__GOOGLE_TRANSLATION_CONFIG__ = ${cfg};`}
          </Script>

          {/* Define init (idempotent) before loading Google */}
          <Script id="gt-init" strategy="afterInteractive">{`
            (function () {
              if (window.__gt_initialized__) return;
              window.__gt_initialized__ = true;
              window.googleTranslateElementInit = function TranslateInit() {
                var cfg = window.__GOOGLE_TRANSLATION_CONFIG__ || {};
                if (!window.google || !window.google.translate) return;
                try {
                  new window.google.translate.TranslateElement(
                    {
                      pageLanguage: cfg.defaultLanguage || 'en',
                      // include only what you need; keeping 'en' is fine too
                      includedLanguages: (Array.isArray(cfg.languages)
                        ? cfg.languages.map(function (l) { return l.name; })
                        : ['tr']).join(','),
                      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                      autoDisplay: false,
                      multilanguagePage: true
                    },
                    'google_translate_element'
                  );
                } catch (e) {}
              };
            })();
          `}</Script>

          {/* Load Google only when we actually need translation */}
          <Script
            src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
            strategy="afterInteractive"
          />
        </>
      )}
    </>
  );
}
