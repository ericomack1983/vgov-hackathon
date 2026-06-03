'use client';

import { motion } from 'framer-motion';
import { VisaLogo } from '@visa/nova-react';
import {
  VisaSearchLow,
  VisaArrowForwardTiny,
  VisaDocumentLow,
  VisaCardGenericLow,
  VisaAnalyticsLow,
  VisaGovernmentLow,
  VisaSecurityLow,
  VisaSignatureLow,
} from '@visa/nova-icons-react';
import type { ComponentType } from 'react';
import { useLang } from '../i18n';
import { LanguageToggle } from './LanguageToggle';
import { FeaturedProducts } from './FeaturedProducts';
import esDict from '../i18n/es.json';
import enDict from '../i18n/en.json';
import styles from '../marketplace.module.css';

interface Props {
  onSignIn: () => void;
  onSignUp: () => void;
}

const dicts = { es: esDict, en: enDict } as const;

/* Feature icons keyed by the `icon` field in the i18n dictionaries */
const FEATURE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  document: VisaDocumentLow,
  'card-generic': VisaCardGenericLow,
  analytics: VisaAnalyticsLow,
};
/* Trust-badge icons, in dictionary order: compliance · security · legal */
const TRUST_ICONS = [VisaGovernmentLow, VisaSignatureLow, VisaSecurityLow];

/* Panama shield mark (decorative) */
function PanamaShield() {
  return (
    <svg width="20" height="24" viewBox="0 0 52 61" fill="none" aria-hidden>
      <path d="M26 2 L50 10 L50 36 Q50 56 26 62 Q2 56 2 36 L2 10 Z"
        fill="#0a1540" stroke="rgba(20,52,203,0.6)" strokeWidth="1.5" />
      <clipPath id="mh-shield"><path d="M26 2 L50 10 L50 36 Q50 56 26 62 Q2 56 2 36 L2 10 Z" /></clipPath>
      <g clipPath="url(#mh-shield)">
        <rect x="2" y="2" width="24" height="30" fill="rgba(27,77,255,0.7)" />
        <rect x="26" y="32" width="24" height="30" fill="rgba(255,45,85,0.6)" />
        <polygon points="14,8 15.2,11.6 19,11.6 16,13.8 17.2,17.4 14,15.2 10.8,17.4 12,13.8 9,11.6 12.8,11.6"
          fill="#22d3ee" opacity="0.95" />
      </g>
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function MarketplaceHero({ onSignIn, onSignUp }: Props) {
  const { lang } = useLang();
  const d = dicts[lang];
  const h = d.hero;

  return (
    <div className={styles.root} data-theme="dark">
      {/* ── 1 · Sticky frosted-glass nav ─────────────────────────────── */}
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <a className={styles.brand} href="#" aria-label={d.nav.portal}>
            <span className={styles.brandMark}><PanamaShield /></span>
            <span className={styles.brandText}>
              <span className={styles.brandName}>{d.nav.portal}</span>
              <span className={styles.brandSub}>{d.nav.sub}</span>
            </span>
          </a>

          <div className={styles.navActions}>
            <span className={styles.poweredBy}>
              <span className={styles.poweredByLabel}>{d.nav.poweredBy}</span>
              <VisaLogo style={{ height: 15 }} />
            </span>
            {/* Language toggle, top-right */}
            <LanguageToggle />
            <button type="button" onClick={onSignIn} className={styles.navSignIn}>
              {d.nav.signIn}
            </button>
            <button type="button" onClick={onSignUp} className={styles.navCta}>
              {d.nav.register}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero canvas with mesh/orb depth ──────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.mesh} aria-hidden />
        <motion.div className={styles.orbA} aria-hidden
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.95, 0.6] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className={styles.orbB} aria-hidden
          animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.8, 0.45] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />

        {/* 2 · Eyebrow badge with live pulse dot */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className={styles.badge}>
          <span className={styles.pulse} aria-hidden>
            <span className={styles.pulseDot} />
            <span className={styles.pulseRing} />
          </span>
          <span className={styles.badgeStatus}>{h.badgeStatus}</span>
          <span className={styles.badgeDivider} aria-hidden />
          <span className={styles.badgeText}>{h.badge}</span>
        </motion.div>

        {/* 3 · Gradient headline */}
        <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show" className={styles.headline}>
          {h.headline}{' '}
          <span className={styles.headlineAccent}>{h.headlineAccent}</span>
        </motion.h1>

        {/* 4 · Subheadline */}
        <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show" className={styles.sub}>
          {h.sub}
        </motion.p>

        {/* 5 · Dual CTA */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className={styles.ctaRow}>
          <button type="button" onClick={onSignIn} className={styles.ctaPrimary}>
            {h.ctaPrimary} <VisaArrowForwardTiny />
          </button>
          <button type="button" onClick={onSignUp} className={styles.ctaGhost}>
            {h.ctaSecondary} <VisaArrowForwardTiny />
          </button>
        </motion.div>

        {/* 6 · Search bar with backdrop blur + category chips */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className={styles.searchWrap}>
          <div className={styles.search}>
            <VisaSearchLow className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder={h.searchPlaceholder}
              aria-label={h.searchPlaceholder}
            />
            <button type="button" className={styles.searchBtn}>{h.searchBtn}</button>
          </div>
          <div className={styles.chips}>
            <span className={styles.chipsLabel}>{h.tagsLabel}</span>
            {h.tags.map((tag) => (
              <button key={tag} type="button" className={styles.chip}>{tag}</button>
            ))}
          </div>
        </motion.div>

        {/* 7 · 4-stat trust bar in a frosted card */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" className={styles.statCard}>
          {h.stats.map((s, i) => (
            <div key={i} className={styles.stat}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── 8 · 3-column feature card grid with hover-reveal arrow ────── */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>{h.featuresTitle}</h2>
        <div className={styles.featureGrid}>
          {h.features.map((f, i) => {
            const Icon = FEATURE_ICONS[f.icon] ?? VisaDocumentLow;
            return (
              <motion.article key={i} className={styles.featureCard}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }}>
                <span className={styles.featureIcon}><Icon /></span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
                <span className={styles.featureMore}>
                  {h.featureMore} <VisaArrowForwardTiny className={styles.featureArrow} />
                </span>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* ── Featured products carousel ───────────────────────────────── */}
      <FeaturedProducts />

      {/* ── Conversion CTA card (sits above the trust/footer strip) ───── */}
      <section className={styles.ctaSection}>
        <motion.div
          className={styles.ctaCard}
          initial={{ opacity: 0, y: 48, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.ctaGlow} aria-hidden />
          <motion.h2 className={styles.ctaTitle}
            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}>
            {h.ctaTitle}
          </motion.h2>
          <motion.p className={styles.ctaCardSub}
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
            {h.ctaSub}
          </motion.p>
          <motion.div className={styles.ctaCardRow}
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            <button type="button" onClick={onSignUp} className={styles.ctaPrimary}>
              {h.ctaPrimaryBtn} <VisaArrowForwardTiny />
            </button>
            <button type="button" onClick={onSignIn} className={styles.ctaGhost}>
              {h.ctaSecondaryBtn}
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── 9 · Trust badge row (compliance · security · legal) ───────── */}
      <section className={styles.trust}>
        <p className={styles.trustTitle}>{h.trustTitle}</p>
        <div className={styles.trustRow}>
          {h.trustBadges.map((b, i) => {
            const Icon = TRUST_ICONS[i] ?? VisaSecurityLow;
            return (
              <div key={i} className={styles.trustBadge}>
                <span className={styles.trustIcon}><Icon /></span>
                <span className={styles.trustText}>
                  <span className={styles.trustName}>{b.title}</span>
                  <span className={styles.trustDesc}>{b.desc}</span>
                </span>
              </div>
            );
          })}
        </div>
        <p className={styles.compliance}>{h.compliance}</p>
      </section>
    </div>
  );
}
