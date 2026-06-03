'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { VisaLogo } from '@visa/nova-react';
import styles from './SidebarCard.module.css';

/**
 * Premium floating Visa card — a laminated-glass payment card that gently
 * glides in 3D, responds to the cursor with subtle parallax, and sweeps a
 * specular highlight across its face. GPU-only (transform/opacity), respects
 * prefers-reduced-motion, and is purely decorative (role="img").
 *
 * Tunable via CSS variables on the root element (see `vars` below).
 */
const SPRING = { stiffness: 140, damping: 18, mass: 0.4 } as const;

export function SidebarCard() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Cursor position within the card, normalised to [-0.5, 0.5].
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-9, 9]), SPRING);
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), SPRING);
  // Specular glare follows the cursor for a laminated-glass feel.
  const glareX = useTransform(px, [-0.5, 0.5], [20, 80]);
  const glareY = useTransform(py, [-0.5, 0.5], [10, 90]);

  function onMove(e: React.MouseEvent) {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    setHovered(false);
    px.set(0);
    py.set(0);
  }

  const vars = {
    '--card-blue': '#2150ff',
    '--card-blue-deep': '#0e2196',
    '--card-navy': '#0a1568',
    '--card-gold': '#f7b600',
    '--card-radius': '14px',
  } as React.CSSProperties;

  return (
    <div style={{ ...vars, padding: '20px 14px 14px', perspective: 900 }}>
      {/* Ambient float + slow autonomous 3D drift (CSS keyframes — see
          SidebarCard.module.css; reduced-motion handled there). */}
      <div className={reduce ? undefined : styles.float}>

        {/* Card — cursor parallax + hover lift */}
        <motion.div
          ref={ref}
          role="img"
          aria-label="Visa commercial payment card"
          onMouseMove={onMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={onLeave}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1.586',
            borderRadius: 'var(--card-radius)',
            rotateX: reduce ? 0 : rotX,
            rotateY: reduce ? 0 : rotY,
            transformStyle: 'preserve-3d',
            overflow: 'hidden',
            cursor: 'default',
            background:
              'linear-gradient(135deg, var(--card-blue) 0%, #1434CB 55%, var(--card-blue-deep) 100%)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: hovered
              ? '0 22px 44px -12px rgba(6,14,80,0.75), inset 0 1px 0 rgba(255,255,255,0.4)'
              : '0 14px 30px -14px rgba(6,14,80,0.6), inset 0 1px 0 rgba(255,255,255,0.28)',
            transition: 'box-shadow 0.4s ease',
          }}
          animate={reduce ? undefined : { y: hovered ? -8 : 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        >
          {/* Brand artwork: dark "V" wedges + gold sweep */}
          <svg
            viewBox="0 0 320 200"
            preserveAspectRatio="none"
            aria-hidden
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <defs>
              <linearGradient id="sc-navy" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0c1f8c" />
                <stop offset="1" stopColor="var(--card-navy)" />
              </linearGradient>
            </defs>
            {/* right (thick) arm of the V */}
            <path d="M182 -4 L334 -4 L334 70 L188 204 L150 204 Z" fill="url(#sc-navy)" opacity="0.92" />
            {/* left (thin) arm of the V */}
            <path d="M120 -4 L150 -4 L176 204 L150 204 Z" fill="url(#sc-navy)" opacity="0.55" />
            {/* gold accent sweep */}
            <path
              d="M150 -6 C150 70, 150 120, 172 206"
              fill="none"
              stroke="var(--card-gold)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          {/* Laminated soft top-light */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background:
                'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.28) 0%, transparent 45%)',
              pointerEvents: 'none',
            }}
          />

          {/* Cursor-tracked specular highlight */}
          <motion.div
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              opacity: hovered ? 0.9 : 0.5,
              transition: 'opacity 0.4s ease',
              background: useTransform(
                [glareX, glareY],
                ([x, y]: number[]) =>
                  `radial-gradient(60% 60% at ${x}% ${y}%, rgba(255,255,255,0.4) 0%, transparent 55%)`,
              ),
            }}
          />

          {/* Periodic gloss sweep (CSS keyframes) */}
          {!reduce && (
            <div
              className={styles.sweep}
              style={{
                position: 'absolute', top: 0, bottom: 0, width: '45%',
                pointerEvents: 'none', filter: 'blur(2px)',
                background:
                  'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
              }}
            />
          )}

          {/* Secondary counter-sweep — softer, opposite direction (CSS keyframes) */}
          {!reduce && (
            <div
              className={styles.counterSweep}
              style={{
                position: 'absolute', top: 0, bottom: 0, width: '28%',
                pointerEvents: 'none', filter: 'blur(3px)',
                background:
                  'linear-gradient(75deg, transparent 0%, rgba(255,255,255,0.32) 50%, transparent 100%)',
              }}
            />
          )}

          {/* Drifting holographic sheen — iridescent laminate (CSS keyframes) */}
          {!reduce && (
            <div
              className={styles.sheen}
              style={{
                position: 'absolute', inset: '-25%', pointerEvents: 'none',
                mixBlendMode: 'screen', opacity: hovered ? 0.32 : 0.2,
                transition: 'opacity 0.4s ease',
                background:
                  'linear-gradient(115deg, transparent 28%, rgba(34,211,238,0.7) 44%, rgba(124,140,255,0.6) 54%, rgba(247,182,0,0.5) 64%, transparent 78%)',
              }}
            />
          )}

          {/* Foreground content (lifted in 3D) */}
          <div
            style={{
              position: 'absolute', inset: 0, padding: '11% 9%',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              transform: 'translateZ(18px)',
            }}
          >
            {/* Chip + contactless */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7%' }}>
              <div
                style={{
                  width: '20%', aspectRatio: '1.3', borderRadius: 4,
                  background: 'linear-gradient(135deg, #f4e2a8 0%, #d9b455 45%, #f6e6ad 100%)',
                  boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.3)',
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr',
                  gap: 1, padding: 2, overflow: 'hidden',
                }}
                aria-hidden
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ background: 'rgba(120,90,20,0.35)', borderRadius: 1 }} />
                ))}
              </div>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden style={{ opacity: 0.92 }}>
                {[5, 9, 13].map((r, i) => (
                  <path
                    key={i}
                    d={`M${8 + i * 2} ${12 - r * 0.7} A ${r} ${r} 0 0 1 ${8 + i * 2} ${12 + r * 0.7}`}
                    stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round"
                  />
                ))}
              </svg>
            </div>

            {/* Visa wordmark */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
              <VisaLogo style={{ height: 22, '--v-logo-color': 'white' } as React.CSSProperties} />
            </div>
          </div>

          {/* Crisp edge light */}
          <div
            style={{
              position: 'absolute', inset: 0, borderRadius: 'var(--card-radius)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)', pointerEvents: 'none',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
