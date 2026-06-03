'use client';

import { motion } from 'framer-motion';
import {
  Search, ArrowRight, FileText, CreditCard, BarChart3,
  Building2, ShieldCheck, Globe,
} from 'lucide-react';
import { VisaLogo } from '@visa/nova-react';
import { useLang } from '../i18n';

interface Props {
  onSignIn: () => void;
  onSignUp: () => void;
}

/* ── Panama shield mark ─────────────────────────────────────────────── */
function PanamaShield() {
  return (
    <svg width="22" height="26" viewBox="0 0 52 61" fill="none" aria-hidden>
      <path d="M26 2 L50 10 L50 36 Q50 56 26 62 Q2 56 2 36 L2 10 Z"
        fill="#0a1540" stroke="rgba(212,175,55,0.6)" strokeWidth="1.5" />
      <clipPath id="hpc"><path d="M26 2 L50 10 L50 36 Q50 56 26 62 Q2 56 2 36 L2 10 Z" /></clipPath>
      <g clipPath="url(#hpc)">
        <rect x="2" y="2" width="24" height="30" fill="rgba(0,63,143,0.65)" />
        <rect x="26" y="32" width="24" height="30" fill="rgba(212,32,39,0.55)" />
        <polygon points="14,8 15.2,11.6 19,11.6 16,13.8 17.2,17.4 14,15.2 10.8,17.4 12,13.8 9,11.6 12.8,11.6"
          fill="#D4AF37" opacity="0.95" />
      </g>
    </svg>
  );
}

const FEATURE_ICONS = { document: FileText, 'card-generic': CreditCard, analytics: BarChart3 };

/* ── Animation presets ──────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function HeroPage({ onSignIn, onSignUp }: Props) {
  const { t, lang, setLang } = useLang();

  const statValues = ['18,400+', '$2.1B', '142', '24h'];
  const statLabels = [
    t('hero.stats.0.label'), t('hero.stats.1.label'), t('hero.stats.2.label'), t('hero.stats.3.label'),
  ];
  const featureTitles = [t('hero.features.0.title'), t('hero.features.1.title'), t('hero.features.2.title')];
  const featureDescs  = [t('hero.features.0.desc'),  t('hero.features.1.desc'),  t('hero.features.2.desc')];
  const featureIcons  = ['document', 'card-generic', 'analytics'] as const;

  const tags = lang === 'es'
    ? ['Tecnología', 'Salud', 'Infraestructura', 'Servicios Profesionales', 'Suministros']
    : ['Technology', 'Health', 'Infrastructure', 'Professional Services', 'Supplies'];

  const serif = 'var(--font-instrument-serif, Georgia, serif)';
  const mono  = 'var(--font-jetbrains-mono, monospace)';

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans">

      {/* ── Sticky frosted nav ───────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-white/[0.06]"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(3,6,26,0.82)' }}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[rgba(212,175,55,0.3)] bg-[rgba(0,63,143,0.45)]">
              <PanamaShield />
            </div>
            <div className="leading-tight">
              <div className="text-[0.95rem] font-bold text-white">{t('nav.portal')}</div>
              <div className="text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(212,175,55,0.72)]">{t('nav.sub')}</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 opacity-75 sm:flex">
              <span className="text-[0.62rem] uppercase tracking-[0.1em] text-white/50">{t('nav.poweredBy')}</span>
              <VisaLogo style={{ height: 16 }} />
            </div>
            <button
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              className="min-w-9 rounded-md px-2 py-1 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              {t('nav.lang')}
            </button>
            <button
              onClick={onSignIn}
              className="hidden rounded-lg border border-white/20 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:block"
            >
              {t('nav.signIn')}
            </button>
            <button
              onClick={onSignUp}
              className="rounded-lg bg-[#003F8F] px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-[#003F8F]/30 transition-all hover:bg-[#0049a6] hover:shadow-[#003F8F]/40"
            >
              {t('nav.register')}
            </button>
          </div>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center overflow-hidden px-5 pb-20 pt-20 text-center sm:px-8"
        style={{ background: 'linear-gradient(160deg, #0A0F28 0%, #030818 100%)' }}
      >
        {/* animated ambient orbs */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-[6%] -top-[12%] h-[520px] w-[520px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,63,143,0.22) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-[14%] -left-[6%] h-[400px] w-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,32,39,0.12) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
          className="z-10 mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-md">
          <Building2 className="h-3.5 w-3.5 text-[rgba(212,175,55,0.85)]" />
          <span className="text-[0.7rem] uppercase tracking-[0.14em] text-[rgba(212,175,55,0.85)]">
            {lang === 'es' ? 'República de Panamá — DGCP' : 'Republic of Panama — DGCP'}
          </span>
        </motion.div>

        <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="z-10 max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-normal leading-[1.06] text-white"
          style={{ fontFamily: serif }}>
          {t('hero.headline')}{' '}
          <span className="italic text-[#D4AF37]">{t('hero.headlineItalic')}</span>
        </motion.h1>

        <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
          className="z-10 mb-9 mt-5 max-w-xl text-base leading-relaxed text-white/60">
          {t('hero.sub')}
        </motion.p>

        {/* glass search */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="z-10 w-full max-w-2xl">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder={t('hero.searchPlaceholder')}
                className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.07] pl-10 pr-4 text-sm text-white placeholder:text-white/40 backdrop-blur-md transition-colors focus:border-[#003F8F] focus:bg-white/10 focus:outline-none"
              />
            </div>
            <button className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#003F8F] px-6 text-sm font-semibold text-white shadow-lg shadow-[#003F8F]/30 transition-all hover:bg-[#0049a6] hover:shadow-[#003F8F]/50">
              {t('hero.searchBtn')} <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-white/40">{t('hero.tagsLabel')}</span>
            {tags.map((tag) => (
              <button key={tag}
                className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/65 transition-all hover:border-white/25 hover:bg-white/10 hover:text-white">
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────── */}
      <section className="bg-[#003F8F] px-5 py-9 sm:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
          {statValues.map((val, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex cursor-default flex-col items-center text-center transition-transform hover:-translate-y-1">
              <span className="text-[clamp(1.6rem,3vw,2.5rem)] font-bold text-white" style={{ fontFamily: mono }}>{val}</span>
              <span className="mt-1 text-sm text-white/65">{statLabels[i]}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {lang === 'es' ? 'Todo lo que necesitas para vender al Estado' : 'Everything you need to sell to the government'}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {featureTitles.map((title, i) => {
              const Icon = FEATURE_ICONS[featureIcons[i]] || FileText;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-[#003F8F]/30 hover:shadow-xl hover:shadow-slate-900/5">
                  <div className="mb-5 flex items-center justify-center rounded-2xl border border-[#003F8F]/12 bg-[#003F8F]/[0.07] transition-colors group-hover:bg-[#003F8F]/12"
                    style={{ height: 52, width: 52 }}>
                    <Icon className="h-[22px] w-[22px] text-[#003F8F]" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{featureDescs[i]}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8" style={{ background: 'linear-gradient(135deg, #0A0F28, #0B1E4A)' }}>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-normal text-white" style={{ fontFamily: serif }}>
            {lang === 'es' ? 'Empieza a vender al Estado hoy' : 'Start selling to the government today'}
          </h2>
          <p className="max-w-md text-white/55">
            {lang === 'es'
              ? 'Registro gratuito. Sin cuotas. Tus primeros pagos en 48 horas.'
              : 'Free registration. No fees. Your first payments within 48 hours.'}
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <button onClick={onSignUp}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003F8F] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#003F8F]/30 transition-all hover:bg-[#0049a6] hover:shadow-[#003F8F]/50">
              {t('nav.register')} <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={onSignIn}
              className="rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              {t('nav.signIn')}
            </button>
          </div>
        </div>
      </section>

      {/* ── Compliance footer ────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] bg-[#030612] px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-white/30" />
            <span className="text-[0.7rem] tracking-[0.05em] text-white/30">{t('hero.compliance')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-white/20" />
            <span className="text-[0.7rem] text-white/20">{t('nav.poweredBy')}</span>
            <VisaLogo style={{ height: 12, opacity: 0.4 }} />
          </div>
        </div>
      </footer>
    </div>
  );
}
