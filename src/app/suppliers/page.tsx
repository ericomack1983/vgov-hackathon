'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Search, X, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import { SupplierCard } from '@/components/procurement/SupplierCard';
import type { Supplier } from '@/lib/mock-data/types';
import createGlobe from 'cobe';

// ── Globe markers ──────────────────────────────────────────────────────────────
const GLOBE_MARKERS = [
  { id: 'nyc', location: [40.7,  -74.0 ] as [number, number], label: 'NYC' },
  { id: 'lon', location: [51.5,   -0.1 ] as [number, number], label: 'LHR' },
  { id: 'fra', location: [48.9,    2.3 ] as [number, number], label: 'FRA' },
  { id: 'dxb', location: [25.2,   55.3 ] as [number, number], label: 'DXB' },
  { id: 'sin', location: [ 1.3,  103.8 ] as [number, number], label: 'SIN' },
  { id: 'tok', location: [35.7,  139.7 ] as [number, number], label: 'TYO' },
  { id: 'syd', location: [-33.9, 151.2 ] as [number, number], label: 'SYD' },
  { id: 'gru', location: [-23.5,  -46.6] as [number, number], label: 'GRU' },
];

// LOG_STEPS index → marker ids
const STEP_MARKERS: Record<number, string[]> = {
  0: ['nyc'],
  1: ['lon', 'fra'],
  2: ['dxb', 'sin'],
  3: ['tok', 'syd'],
  4: ['gru'],
};

const LOG_STEPS = [
  { tag: 'AUTH',    color: '#60a5fa', label: 'Authenticating with Visa OAuth 2.0 endpoint',    delay: 200  },
  { tag: 'NETWORK', color: '#a78bfa', label: 'Scanning Visa Commercial Network nodes',          delay: 900  },
  { tag: 'MCC',     color: '#34d399', label: 'Resolving Merchant Category Codes (MCC)',         delay: 1600 },
  { tag: 'VERIFY',  color: '#fbbf24', label: 'Validating B2B payment product acceptance',       delay: 2300 },
  { tag: 'SCORE',   color: '#f472b6', label: 'Computing Visa Supplier Matching Service scores', delay: 3000 },
];

const DONE_DELAY  = 3700;
const CLOSE_DELAY = 5000;
const GLOBE_SIZE  = 460;

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCount({ target }: { target: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsub = rounded.on('change', setDisplay);
    const ctrl = animate(count, target, { duration: 1.2, ease: 'easeOut' });
    return () => { unsub(); ctrl.stop(); };
  }, [target]);

  return <span>{display}</span>;
}

// ── Cobe globe ────────────────────────────────────────────────────────────────
function VisaGlobe({ activeMarkerIds }: { activeMarkerIds: Set<string> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef  = useRef<ReturnType<typeof createGlobe> | null>(null);
  const phiRef    = useRef(0.5);
  const rafRef    = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let timer: ReturnType<typeof setTimeout>;

    const init = () => {
      if (globeRef.current) return;
      globeRef.current = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width:  GLOBE_SIZE,
        height: GLOBE_SIZE,
        phi: phiRef.current,
        theta: 0.2,
        dark: 1,
        diffuse: 1.8,
        mapSamples: 24000,
        mapBrightness: 9,
        baseColor:   [0.08, 0.13, 0.40],
        markerColor: [0.25, 0.55, 1.00],
        glowColor:   [0.05, 0.10, 0.50],
        markers: GLOBE_MARKERS.map((m) => ({ location: m.location, size: 0.04 })),
        opacity: 0.9,
      });

      const tick = () => {
        phiRef.current += 0.004;
        globeRef.current?.update({ phi: phiRef.current, theta: 0.2 });
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      canvas.style.opacity = '0';
      requestAnimationFrame(() => {
        canvas.style.transition = 'opacity 1s ease';
        canvas.style.opacity = '1';
      });
    };

    timer = setTimeout(init, 120);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
      globeRef.current?.destroy();
      globeRef.current = null;
    };
  }, []);

  return (
    <div
      className="relative overflow-hidden flex items-center justify-center"
      style={{ width: GLOBE_SIZE, height: 220, margin: '0 auto' }}
    >
      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse 100% 90% at 50% 50%, transparent 35%, #07102e 80%)',
        }}
      />

      {/* CSS-anchor labels */}
      <style>{`
        @keyframes ping-ring-visa {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0;   }
        }
      `}</style>

      {GLOBE_MARKERS.map((m) => {
        const isActive = activeMarkerIds.has(m.id);
        return (
          <div
            key={m.id}
            style={{
              position: 'absolute',
              // @ts-ignore — CSS Anchor Positioning (Chrome 125+)
              positionAnchor: `--cobe-${m.id}`,
              bottom: 'anchor(center)',
              left:   'anchor(center)',
              translate: '-50% 50%',
              width: 44, height: 44,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 20,
              opacity:    `var(--cobe-visible-${m.id}, 0)`,
              filter:     `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 6px))`,
              transition: 'opacity 0.35s, filter 0.35s',
            }}
          >
            {isActive && <>
              <span style={{
                position: 'absolute', inset: 0,
                border: '1.5px solid #4a7bff', borderRadius: '50%', opacity: 0,
                animation: 'ping-ring-visa 1.8s ease-out infinite 0s',
              }} />
              <span style={{
                position: 'absolute', inset: 0,
                border: '1.5px solid #4a7bff', borderRadius: '50%', opacity: 0,
                animation: 'ping-ring-visa 1.8s ease-out infinite 0.7s',
              }} />
            </>}

            <span style={{
              width: isActive ? 10 : 7,
              height: isActive ? 10 : 7,
              borderRadius: '50%',
              background: isActive ? '#4a7bff' : 'rgba(74,123,255,0.35)',
              boxShadow: isActive ? '0 0 0 2.5px #07102e, 0 0 0 4px #4a7bff, 0 0 10px #1434CB' : 'none',
              transition: 'all 0.4s ease',
            }} />

            {isActive && (
              <span style={{
                marginTop: 4,
                fontSize: 8,
                fontWeight: 700,
                fontFamily: 'monospace',
                color: '#93bbff',
                whiteSpace: 'nowrap',
                textShadow: '0 0 8px #1434CB',
                letterSpacing: '0.05em',
              }}>
                {m.label}
              </span>
            )}
          </div>
        );
      })}

      <canvas
        ref={canvasRef}
        style={{
          width:  GLOBE_SIZE,
          height: GLOBE_SIZE,
          flexShrink: 0,
          touchAction: 'none',
          borderRadius: '50%',
          marginTop: 40,
        }}
      />
    </div>
  );
}

// ── Main loader ───────────────────────────────────────────────────────────────
function VisaApiLoader({ supplierCount }: { supplierCount: number }) {
  const [activeMarkerIds, setActiveMarkerIds] = useState<Set<string>>(new Set());
  const [activeSteps, setActiveSteps]         = useState<Set<number>>(new Set());
  const [done, setDone]                       = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Log steps + activate markers per step
    LOG_STEPS.forEach((s, i) => {
      timers.push(setTimeout(() => {
        setActiveSteps((prev) => new Set([...prev, i]));
        const ids = STEP_MARKERS[i] ?? [];
        if (ids.length) {
          setActiveMarkerIds((prev) => new Set([...prev, ...ids]));
        }
      }, s.delay));
    });

    timers.push(setTimeout(() => setDone(true), DONE_DELAY));
    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = done ? 100 : Math.round((activeMarkerIds.size / GLOBE_MARKERS.length) * 92);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: -12 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[540px] mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #07102e 0%, #0d1b3e 60%, #0a1628 100%)',
          boxShadow: '0 0 0 1px rgba(99,130,255,0.15), 0 32px 80px rgba(0,0,0,0.7), 0 0 80px rgba(20,52,203,0.12)',
        }}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 flex items-center gap-3 border-b border-white/6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1434CB] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 71 23" fill="none" aria-label="Visa" className="h-3.5 w-auto">
                <path fill="white" fillRule="evenodd" clipRule="evenodd" d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"/>
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight tracking-tight">Visa Supplier Intelligence</p>
              <p className="text-white/35 text-[10px] font-mono mt-0.5">api.visa.com · commercial-products/v1</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!done ? (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#60a5fa] font-mono uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />
                Scanning
              </span>
            ) : (
              <motion.span
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-widest"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Complete
              </motion.span>
            )}
          </div>
        </div>

        {/* ── Globe ── */}
        <div className="pt-3 pb-1">
          <VisaGlobe activeMarkerIds={activeMarkerIds} />
        </div>

        {/* Progress bar */}
        <div className="mx-4 mb-3 h-px bg-white/6 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(to right, #1434CB, #6366f1, #60a5fa)' }}
          />
        </div>

        {/* ── Log feed ── */}
        <div className="px-4 pb-4 space-y-1.5">
          {LOG_STEPS.map((step, i) => {
            const isVisible = activeSteps.has(i);
            const isLatest  = isVisible && i === Math.max(...[...activeSteps]);
            return (
              <AnimatePresence key={i}>
                {isVisible && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="flex items-center gap-2.5 font-mono"
                  >
                    <span className="text-white/20 text-[10px] select-none">›</span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        color: step.color,
                        background: `${step.color}18`,
                        border: `1px solid ${step.color}30`,
                      }}
                    >
                      {step.tag}
                    </span>
                    <span className={`text-[11px] ${isLatest && !done ? 'text-white/90' : 'text-white/35'}`}>
                      {step.label}
                      {isLatest && !done && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          className="ml-0.5 inline-block w-1.5 h-3 bg-white/60 align-middle"
                        />
                      )}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        {/* ── Result ── */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mx-4 mb-5 rounded-xl px-4 py-3.5 flex items-center gap-4"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(20,52,203,0.1))',
                border: '1px solid rgba(52,211,153,0.25)',
                boxShadow: '0 0 24px rgba(16,185,129,0.08)',
              }}
            >
              <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold leading-tight">
                  <AnimatedCount target={supplierCount} /> suppliers matched &amp; verified
                </p>
                <p className="text-emerald-400/70 text-[10px] font-mono mt-0.5">
                  Visa Network eligibility confirmed · VSMS scores computed
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-emerald-400 text-xs font-bold font-mono">100%</p>
                <p className="text-white/25 text-[9px] font-mono">coverage</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

type ComplianceFilter = 'All' | Supplier['complianceStatus'];
type SortKey = 'rating-desc' | 'rating-asc' | 'delivery-asc' | 'risk-asc';

const COMPLIANCE_OPTIONS: ComplianceFilter[] = ['All', 'Compliant', 'Pending Review', 'Non-Compliant'];

/* nova-styles palette tokens — inactive / active pill colours */
const COMPLIANCE_STYLES: Record<ComplianceFilter, React.CSSProperties> = {
  All:             { background: '#F5F5F5',          color: '#4a4a4a' },
  Compliant:       { background: '#d6f2c4',          color: '#2C6849' },
  'Pending Review':{ background: '#ffef99',          color: '#875903' },
  'Non-Compliant': { background: '#ffd6e9',          color: '#AD2929' },
};

const COMPLIANCE_ACTIVE: Record<ComplianceFilter, React.CSSProperties> = {
  All:             { background: '#1434CB',          color: '#ffffff' },
  Compliant:       { background: '#2C6849',          color: '#ffffff' },
  'Pending Review':{ background: '#875903',          color: '#ffffff' },
  'Non-Compliant': { background: '#AD2929',          color: '#ffffff' },
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'rating-desc',  label: 'Rating: High → Low' },
  { value: 'rating-asc',   label: 'Rating: Low → High' },
  { value: 'delivery-asc', label: 'Fastest Delivery' },
  { value: 'risk-asc',     label: 'Lowest Risk' },
];

function sortSuppliers(list: Supplier[], sort: SortKey): Supplier[] {
  return [...list].sort((a, b) => {
    switch (sort) {
      case 'rating-desc':  return b.rating - a.rating;
      case 'rating-asc':   return a.rating - b.rating;
      case 'delivery-asc': return a.deliveryAvgDays - b.deliveryAvgDays;
      case 'risk-asc':     return a.riskScore - b.riskScore;
    }
  });
}

export default function SuppliersPage() {
  const { suppliers } = useProcurement();

  const [query, setQuery]           = useState('');
  const [compliance, setCompliance] = useState<ComplianceFilter>('All');
  const [sort, setSort]             = useState<SortKey>('rating-desc');
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowLoader(false), CLOSE_DELAY);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let list = suppliers;

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }

    if (compliance !== 'All') {
      list = list.filter((s) => s.complianceStatus === compliance);
    }

    return sortSuppliers(list, sort);
  }, [suppliers, query, compliance, sort]);

  const hasActiveFilter = query.trim() !== '' || compliance !== 'All' || sort !== 'rating-desc';

  function clearFilters() {
    setQuery('');
    setCompliance('All');
    setSort('rating-desc');
  }

  return (
    <>
    <AnimatePresence>
      {showLoader && <VisaApiLoader supplierCount={suppliers.length} />}
    </AnimatePresence>
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#000000' }}>Supplier Registry</h1>
          <p className="mt-0.5 text-sm" style={{ color: '#4a4a4a' }}>Browse and manage registered suppliers.</p>
        </div>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-lg"
          style={{ background: '#F5F5F5', color: '#4a4a4a' }}
        >
          {filtered.length} / {suppliers.length}
        </span>
      </div>

      {/* Search + Sort bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4a4a4a' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suppliers…"
            className="w-full pl-9 pr-9 py-2 text-sm bg-white rounded-xl focus:outline-none focus:ring-2 transition"
            style={{
              border: '1px solid rgba(0,0,0,0.12)',
              color: '#000000',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#1434CB'; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition"
              style={{ color: '#4a4a4a' }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="relative">
          <SlidersHorizontal size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4a4a4a' }} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="pl-8 pr-4 py-2 text-sm bg-white rounded-xl focus:outline-none appearance-none cursor-pointer font-medium transition"
            style={{
              border: '1px solid rgba(0,0,0,0.12)',
              color: '#000000',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)',
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Compliance filter pills */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {COMPLIANCE_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setCompliance(opt)}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={compliance === opt ? COMPLIANCE_ACTIVE[opt] : COMPLIANCE_STYLES[opt]}
          >
            {opt}
          </button>
        ))}

        <AnimatePresence>
          {hasActiveFilter && (
            <motion.button
              key="clear"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition"
              style={{ color: '#AD2929', background: '#ffd6e9', border: '1px solid rgba(173,41,41,0.2)' }}
            >
              <X size={11} />
              Clear
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-10 bg-white rounded-2xl p-10 text-center"
          style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}
        >
          <p className="text-sm font-semibold" style={{ color: '#000000' }}>No suppliers match your filters</p>
          <p className="mt-1 text-xs" style={{ color: '#4a4a4a' }}>Try adjusting your search or clearing the filters.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-xs font-semibold transition"
            style={{ color: '#1434CB' }}
          >
            Clear all filters
          </button>
        </motion.div>
      ) : (
        <motion.div layout className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((supplier) => (
              <motion.div
                key={supplier.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <SupplierCard supplier={supplier} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
    </>
  );
}
