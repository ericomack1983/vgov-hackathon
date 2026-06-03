import type { ReactNode } from 'react';
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { LangProvider } from './i18n';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument-serif', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' });

export default function SupplierLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${dmSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      style={{
        fontFamily: 'var(--font-dm-sans, DM Sans, ui-sans-serif, system-ui, sans-serif)',
        '--brand-primary':      '#003F8F',
        '--brand-accent':       '#D42027',
        '--brand-sidebar':      '#080D1E',
        '--brand-hero-from':    '#0A0F28',
        '--brand-hero-to':      '#030818',
        '--brand-gold':         '#D4AF37',
        '--brand-status-ok':    '#16a34a',
        '--brand-status-warn':  '#d97706',
        '--brand-status-muted': '#64748b',
      } as React.CSSProperties}
    >
      <LangProvider>{children}</LangProvider>
    </div>
  );
}
