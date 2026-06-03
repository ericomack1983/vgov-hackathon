'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import es from './es.json';
import en from './en.json';

export type Lang = 'es' | 'en';

const dicts = { es, en } as const;
const STORAGE_KEY = 'pc-marketplace-lang';

function resolve(obj: unknown, path: string): string {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const k of parts) {
    if (cur && typeof cur === 'object') cur = (cur as Record<string, unknown>)[k];
    else return path;
  }
  return typeof cur === 'string' ? cur : path;
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangCtx>({ lang: 'es', setLang: () => {}, t: (k) => k });

export function LangProvider({ children }: { children: ReactNode }) {
  // Server + first client render always use 'es' (Spanish default) to avoid
  // hydration mismatch; the stored preference is applied after mount.
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en') setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    } catch {
      /* localStorage unavailable — selection still works for the session */
    }
  };

  const t = (key: string) => resolve(dicts[lang], key);
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
