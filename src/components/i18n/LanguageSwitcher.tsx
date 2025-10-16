'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {Globe} from 'lucide-react';

type Lang = { name: 'en' | 'tr'; title: string };
const COOKIE = 'googtrans';

// --- cookie helpers (domain-safe) ---
function isLocalHost(host: string) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}
function getRootDomain(hostname: string) {
  const slds = ['co.uk','com.au','com.tr','gov.tr','edu.tr','org.tr','net.tr'];
  const parts = hostname.split('.').filter(Boolean);
  if (parts.length <= 1) return hostname;
  const lastTwo = parts.slice(-2).join('.');
  const lastThree = parts.slice(-3).join('.');
  return slds.includes(lastTwo) ? lastThree : lastTwo;
}

function writeCookie(name: string, value: string, domain?: string) {
  const maxAge = 365 * 24 * 60 * 60;
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    'path=/',
    `max-age=${maxAge}`,
    'samesite=lax',
  ];
  if (domain) attrs.push(`domain=${domain}`);
  if (location.protocol === 'https:') attrs.push('secure');
  document.cookie = attrs.join('; ');
}

function deleteCookie(name: string, domain?: string) {
  const attrs = [
    `${name}=`,
    'path=/',
    'max-age=0',
    'samesite=lax',
  ];
  if (domain) attrs.push(`domain=${domain}`);
  if (location.protocol === 'https:') attrs.push('secure');
  document.cookie = attrs.join('; ');
}

function setGoogTransCookieAllScopes(value: string, cookieDomain?: string) {
  const host = window.location.hostname;
  const local = isLocalHost(host);
  const root = cookieDomain || `.${getRootDomain(host)}`;

  // Always write host-only (works for localhost + any host)
  writeCookie(COOKIE, value);
  // Also write root domain in prod (subdomains)
  if (!local) writeCookie(COOKIE, value, root);
}

function clearGoogTransCookieAllScopes(cookieDomain?: string) {
  const host = window.location.hostname;
  const local = isLocalHost(host);
  const root = cookieDomain || `.${getRootDomain(host)}`;

  // Delete on current host (host-only cookie)
  deleteCookie(COOKIE);
  // Delete on root domain in prod
  if (!local) deleteCookie(COOKIE, root);

  // Some browsers need overwrite-then-delete
  for (const v of ['', '/en/en', '/en/tr', '/auto/tr', '/auto/en']) {
    writeCookie(COOKIE, v);
    deleteCookie(COOKIE);
    if (!local) {
      writeCookie(COOKIE, v, root);
      deleteCookie(COOKIE, root);
    }
  }
}

function getCurrentLang(defaultLang: 'en'|'tr'): 'en'|'tr' {
  const m = (document.cookie || '').match(/(?:^|; )googtrans=([^;]+)/);
  if (!m) return defaultLang;
  const parts = decodeURIComponent(m[1]).split('/');
  return (parts[2] as any) || defaultLang;
}

export default function LanguageSwitcher({
  languages = [
    { name: 'en', title: 'English' },
    { name: 'tr', title: 'Türkçe' }
  ],
  defaultLanguage = 'en',
  cookieDomain = "reneewallet.io",
}: {
  languages?: Lang[];
  defaultLanguage?: 'en' | 'tr';
  cookieDomain?: string;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<'en'|'tr'>(defaultLanguage);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(getCurrentLang(defaultLanguage));
  }, [defaultLanguage]);

  // close on outside / Esc / scroll
  useEffect(() => {
    const onPointerDown = (e: Event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = () => setOpen(false);

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, []);

  function select(lang: 'en'|'tr') {
    if (lang === 'en') {
      // Back to English: clear and normalize to /en/en so translation stops
      clearGoogTransCookieAllScopes(/* cookieDomain for prod only, NOT ".localhost" */);
      setGoogTransCookieAllScopes('/en/en');
    } else {
      setGoogTransCookieAllScopes('/en/tr');
    }
    // Reload so Google applies/removes styles
    window.location.reload();
  }

  const label = useMemo(
    () => languages.find(l => l.name === current)?.title ?? current.toUpperCase(),
    [current, languages]
  );

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-black font-medium
                   hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${label}`}
      >
        <Globe size={18} />
        <span>{label}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg
                     dark:border-white/10 dark:bg-black/80 backdrop-blur notranslate"
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
