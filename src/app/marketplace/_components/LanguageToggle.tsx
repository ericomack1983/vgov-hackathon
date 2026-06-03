'use client';

import { useLang, type Lang } from '../i18n';
import styles from '../marketplace.module.css';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

/**
 * Segmented ES | EN language switch. Functional — writes through to the
 * LangProvider (which persists to localStorage). The active segment is
 * driven by context state, so every string on the page updates instantly.
 */
export function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <div className={styles.langToggle} role="group" aria-label="Language / Idioma">
      {LANGS.map(({ code, label }) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            className={`${styles.langOption} ${active ? styles.langOptionActive : ''}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
