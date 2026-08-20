'use client';

/**
 * Language switcher for the header — a frosted pill showing the active language,
 * opening a small menu of the three the portal ships with.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { LANGUAGES } from '@/lib/i18n/dictionaries';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape — a menu pinned open over the app is
  // worse than one that needs a second click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('app.language')}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          height: 40, padding: '0 12px',
          background: open ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.13)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: 9999,
          cursor: 'pointer',
          color: 'white',
          transition: 'background 0.18s',
        }}
      >
        <Globe size={16} strokeWidth={2} style={{ opacity: 0.85, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>{active.short}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              minWidth: 184,
              background: 'white',
              borderRadius: 14,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 16px 40px rgba(3,10,40,0.22)',
              overflow: 'hidden',
              zIndex: 60,
            }}
          >
            <p style={{
              fontSize: 10, fontWeight: 700, color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              padding: '10px 14px 6px',
            }}>
              {t('app.language')}
            </p>

            {LANGUAGES.map((l) => {
              const selected = l.code === lang;
              return (
                <button
                  key={l.code}
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px',
                    background: selected ? 'rgba(20,52,203,0.06)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.background = 'rgba(0,0,0,0.035)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = selected ? 'rgba(20,52,203,0.06)' : 'transparent';
                  }}
                >
                  <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{l.flag}</span>
                  <span style={{
                    flex: 1, fontSize: 13,
                    fontWeight: selected ? 700 : 500,
                    color: selected ? '#1434CB' : '#374151',
                  }}>
                    {l.label}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                    color: selected ? '#1434CB' : '#c4c9d4',
                  }}>
                    {l.short}
                  </span>
                  {selected && <Check size={13} color="#1434CB" strokeWidth={3} style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
