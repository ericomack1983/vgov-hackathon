'use client';

import { useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  VisaCartLow,
  VisaArrowBackTiny,
  VisaArrowForwardTiny,
  VisaConnectionsLow,
  VisaDeviceLaptopLow,
  VisaCategoryLow,
  VisaSecurityFirewallLow,
  VisaDevicePrinterLow,
  VisaDeviceServerLow,
} from '@visa/nova-icons-react';
import { useLang } from '../i18n';
import esDict from '../i18n/es.json';
import enDict from '../i18n/en.json';
import styles from '../marketplace.module.css';

const dicts = { es: esDict, en: enDict } as const;

/* Per-product visual data, keyed by index (not copy). Thumbnails are bundled
   SVGs in public/marketplace/products/ — same-origin, zero network dependency. */
const PRODUCT_IMAGES = [
  '/marketplace/products/cisco-catalyst.svg',     // network switch — Cisco
  '/marketplace/products/lenovo-thinkpad.svg',    // ThinkPad laptop — Lenovo
  '/marketplace/products/herman-miller-chair.svg',// office chair — Herman Miller
  '/marketplace/products/fortinet-fortigate.svg', // server / security — Fortinet
  '/marketplace/products/canon-imagerunner.svg',  // office printer — Canon
  '/marketplace/products/dell-poweredge.svg',     // server rack — Dell
];
const PRODUCT_GRADS = [
  'linear-gradient(135deg, rgba(27,77,255,0.35), rgba(34,211,238,0.18))',
  'linear-gradient(135deg, rgba(20,52,203,0.35), rgba(27,77,255,0.18))',
  'linear-gradient(135deg, rgba(45,212,191,0.30), rgba(34,211,238,0.16))',
  'linear-gradient(135deg, rgba(255,45,85,0.28), rgba(20,52,203,0.18))',
  'linear-gradient(135deg, rgba(34,211,238,0.30), rgba(27,77,255,0.16))',
  'linear-gradient(135deg, rgba(20,52,203,0.32), rgba(255,45,85,0.16))',
];
const FALLBACK_ICONS: ComponentType<{ className?: string }>[] = [
  VisaConnectionsLow, VisaDeviceLaptopLow, VisaCategoryLow,
  VisaSecurityFirewallLow, VisaDevicePrinterLow, VisaDeviceServerLow,
];

export function FeaturedProducts() {
  const { lang } = useLang();
  const f = dicts[lang].featured;
  const trackRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const amount = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <section className={styles.featured}>
      <div className={styles.featuredHead}>
        <div>
          <h2 className={styles.featuredTitle}>{f.title}</h2>
          <p className={styles.featuredSub}>{f.subtitle}</p>
        </div>
        <button type="button" className={styles.viewMore}>
          {f.viewMore} <VisaArrowForwardTiny />
        </button>
      </div>

      <div className={styles.carousel}>
        <button
          type="button"
          className={`${styles.carBtn} ${styles.carBtnPrev}`}
          onClick={() => scrollBy(-1)}
          aria-label={f.prev}
        >
          <VisaArrowBackTiny />
        </button>

        <div className={styles.track} ref={trackRef}>
          {f.products.map((p, i) => {
            const Icon = FALLBACK_ICONS[i % FALLBACK_ICONS.length];
            return (
              <article key={p.name} data-card className={styles.productCard}>
                <div className={styles.productImg} style={{ background: PRODUCT_GRADS[i % PRODUCT_GRADS.length] }}>
                  {failed[i] ? (
                    <Icon className={styles.productGlyph} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={PRODUCT_IMAGES[i % PRODUCT_IMAGES.length]}
                      alt={p.name}
                      className={styles.productPhoto}
                      loading="lazy"
                      decoding="async"
                      onError={() => setFailed((s) => ({ ...s, [i]: true }))}
                    />
                  )}
                  <span className={styles.productScrim} aria-hidden />
                </div>
                <div className={styles.productBody}>
                  <span className={styles.productCat}>{p.category}</span>
                  <h3 className={styles.productName}>{p.name}</h3>
                  <span className={styles.productPrice}>{p.price}</span>
                  <button type="button" className={styles.addBtn} aria-label={`${f.addToCart} — ${p.name}`}>
                    <VisaCartLow /> {f.addToCart}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <button
          type="button"
          className={`${styles.carBtn} ${styles.carBtnNext}`}
          onClick={() => scrollBy(1)}
          aria-label={f.next}
        >
          <VisaArrowForwardTiny />
        </button>
      </div>
    </section>
  );
}
