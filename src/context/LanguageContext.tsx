'use client';

/**
 * Portal language. English is the default; Spanish and Portuguese are opt-in
 * from the header switcher and remembered per browser.
 *
 * The stored choice lives in localStorage and is read through an external store
 * so the server snapshot and the client's first paint agree.
 */

import {
  createContext, useContext, useEffect, useCallback, useMemo,
  useSyncExternalStore, type ReactNode,
} from 'react';
import { DEFAULT_LANG, LANGUAGES, translate, type Lang } from '@/lib/i18n/dictionaries';

const STORAGE_KEY = 'vgov:lang';
const CHANGE_EVENT = 'vgov:lang-change';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a key for the active language. */
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function isLang(value: string | null): value is Lang {
  return !!value && LANGUAGES.some((l) => l.code === value);
}

/**
 * localStorage is the source of truth, read through useSyncExternalStore rather
 * than copied into state inside an effect. That keeps the server snapshot
 * (English) separate from the client's, so hydration matches without the
 * setState-in-effect round trip — and a change in one tab reaches the others.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getSnapshot(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLang(stored) ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG; // private mode
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_LANG);

  // Keep <html lang> honest: screen readers and browser translation both use it.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* noop */ }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

/** Shorthand for components that only need the translator. */
export function useT(): (key: string) => string {
  return useLanguage().t;
}
