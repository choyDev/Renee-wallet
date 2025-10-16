'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { setCookie, parseCookies, destroyCookie } from 'nookies';
import { Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';

type Lang = { name: string; title: string };
const COOKIE = 'googtrans';

function setGoogTransCookie(from: string, to: string) {
  const value = `/${from}/${to}`;
  const opts = { path: '/', maxAge: 60 * 60 * 24 * 365 };
  setCookie(null, COOKIE, value, opts);
  // sometimes Google keeps another cookie on a different path; force-set again
  try { destroyCookie(null, COOKIE, { path: '/' }); setCookie(null, COOKIE, value, opts); } catch {}
}

function getCurrentLang(defaultLang: string) {
  const val = parseCookies()[COOKIE];
  if (!val) return defaultLang;
  const parts = val.split('/');
  return parts[2] || defaultLang;
}

export default function LanguageSwitcher({
  languages = [
    { name: 'en', title: 'English' },
    { name: 'tr', title: 'Türkçe' }
  ],
  defaultLanguage = 'en'
}: {
  languages?: Lang[];
  defaultLanguage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(defaultLanguage);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setCurrent(getCurrentLang(defaultLanguage));
  }, [defaultLanguage]);

  // ✅ Close on outside click, touch, Esc, scroll, or route change
  useEffect(() => {
    const onPointerDown = (e: Event) => {
      const el = rootRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && !el.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = () => setOpen(false);

    // capture phase so it fires before other handlers; works for touch too
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, []);

  // Close if the route changes
  useEffect(() => { setOpen(false); }, [pathname]);

  function select(lang: string) {
    setGoogTransCookie(defaultLanguage, lang);
    setCurrent(lang);
    // widget reads cookie on load
    window.location.reload();
  }

  const currentLabel = useMemo(
    () => languages.find(l => l.name === current)?.title ?? current.toUpperCase(),
    [current, languages]
  );

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium
                   hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${currentLabel}`}
      >
        <Globe size={18} />
        <span>{currentLabel}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg
                     dark:border-white/10 dark:bg-black/80 backdrop-blur"
        >
          {languages.map(l => (
            <button
              key={l.name}
              role="option"
              aria-selected={current === l.name}
              onClick={() => select(l.name)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm
                ${current === l.name
                  ? 'bg-brand-100 text-brand-500 dark:bg-white/10 dark:text-brand-400'
                  : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200'}`}
            >
              {l.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
