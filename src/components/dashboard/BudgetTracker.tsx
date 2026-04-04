'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, TrendingUp, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { Transaction } from '@/lib/mock-data/types';
import { MOCK_RFPS } from '@/lib/mock-data/rfps';

// ── helpers ────────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}
function fmtFull(n: number) { return '$' + Math.round(n).toLocaleString(); }

function useCountUp(target: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(target * eased));
      if (p < 1) frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);
  return display;
}

// ── Category colours ──────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'IT Infrastructure':     '#60a5fa',
  'Cybersecurity':         '#f87171',
  'Office Supplies':       '#34d399',
  'Data & Analytics':      '#a78bfa',
  'Facilities':            '#fbbf24',
  'Professional Services': '#22d3ee',
};
function catColor(cat: string) { return CATEGORY_COLORS[cat] ?? '#94a3b8'; }

const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH_SHORT = ['J','F','M','A','M','J','J','A','S','O','N','D'];

// ── Data types ────────────────────────────────────────────────────────────────
interface BreakdownItem { category: string; amount: number }
interface ChartPoint {
  label: string;
  monthIndex: number;
  actual: number;
  committedRecurring: number; // future installments NOT yet in actuals
  isCurrent: boolean;
  breakdown: BreakdownItem[];      // actual spend breakdown
  recurringBreakdown: BreakdownItem[]; // committed recurring breakdown
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function SpendTooltip({ datum, year }: { datum: ChartPoint; year: number }) {
  const sorted = [...datum.breakdown].sort((a, b) => b.amount - a.amount);
  const recurSorted = [...datum.recurringBreakdown].sort((a, b) => b.amount - a.amount);
  const total = datum.actual + datum.committedRecurring;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none select-none"
      style={{ width: 210 }}
    >
      <div
        className="rounded-xl px-3.5 py-3 shadow-2xl"
        style={{
          background: 'linear-gradient(160deg,#0d1b3e 0%,#0a1428 100%)',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
        }}
      >
        <p className="text-[10px] font-bold text-indigo-300/70 uppercase tracking-widest mb-0.5">
          {MONTH_NAMES[datum.monthIndex]} · {year}
        </p>
        <p className="text-xl font-black text-white leading-none mb-3">{fmt(total)}</p>

        {sorted.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {sorted.map(item => (
              <div key={item.category} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catColor(item.category) }} />
                  <span className="text-[11px] text-slate-300 truncate">{item.category}</span>
                </div>
                <span className="text-[11px] font-semibold text-white flex-shrink-0">{fmt(item.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {recurSorted.length > 0 && (
          <>
            {sorted.length > 0 && <div className="h-px bg-white/10 my-2" />}
            <p className="text-[9px] font-bold text-indigo-300/60 uppercase tracking-widest mb-1.5">Committed Recurring</p>
            {recurSorted.map(item => (
              <div key={item.category} className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 border border-dashed"
                    style={{ borderColor: catColor(item.category), background: 'transparent' }} />
                  <span className="text-[11px] text-slate-400 truncate">{item.category}</span>
                </div>
                <span className="text-[11px] font-semibold text-indigo-300 flex-shrink-0">{fmt(item.amount)}</span>
              </div>
            ))}
          </>
        )}

        {sorted.length === 0 && recurSorted.length === 0 && (
          <p className="text-[11px] text-slate-500">No spend recorded</p>
        )}
      </div>
      <div className="flex justify-center">
        <div className="w-3 h-3 -mt-1.5 rotate-45"
          style={{ background: '#0a1428', border: '1px solid rgba(99,102,241,0.25)', borderTop: 'none', borderLeft: 'none' }}
        />
      </div>
    </motion.div>
  );
}

// ── Dual-line spend chart ─────────────────────────────────────────────────────
const VW = 260, VH = 110;
const PAD = { l: 38, r: 4, t: 10, b: 18 };
const CW = VW - PAD.l - PAD.r;
const CH = VH - PAD.t - PAD.b;

function fmtAxis(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`;
  return n === 0 ? '$0' : `$${n}`;
}

function niceMax(raw: number) {
  if (raw <= 0) return 100_000;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalised = raw / mag;
  const ceil = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return ceil * mag;
}

function yTicks(max: number, count = 4): number[] {
  const step = max / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(step * i));
}

function SpendChart({
  data, year, currentMonth, onHover,
}: { data: ChartPoint[]; year: number; currentMonth: number; onHover?: (idx: number | null) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const N = data.length;

  const notify = (idx: number | null) => { setHovered(idx); onHover?.(idx); };

  const rawMax = Math.max(
    ...data.map(d => d.actual),
    ...data.map(d => d.actual + d.committedRecurring),
    1,
  );
  const maxVal = niceMax(rawMax);
  const ticks  = yTicks(maxVal);

  const xOf = (i: number) => PAD.l + (N <= 1 ? CW / 2 : (i / (N - 1)) * CW);
  const yOf = (v: number) => PAD.t + CH * (1 - Math.min(v / maxVal, 1));
  const bottom = PAD.t + CH;

  // Polyline points
  const actualPts   = data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.actual).toFixed(1)}`).join(' ');
  const committedPts = data.map((d, i) =>
    `${xOf(i).toFixed(1)},${yOf(d.actual + d.committedRecurring).toFixed(1)}`
  ).join(' ');

  // Area paths
  const areaPath = (pts: string) => {
    const coords = pts.split(' ');
    return `M ${PAD.l} ${bottom} L ${coords.join(' L ')} L ${xOf(N - 1).toFixed(1)} ${bottom} Z`;
  };

  // Voronoi-style hover zones — midpoint between adjacent data points
  const zoneLeft  = (i: number) => i === 0     ? PAD.l        : (xOf(i - 1) + xOf(i)) / 2;
  const zoneRight = (i: number) => i === N - 1 ? PAD.l + CW   : (xOf(i) + xOf(i + 1)) / 2;

  // Tooltip left % in container
  const tipLeft = hovered !== null ? `${((xOf(hovered) / VW) * 100).toFixed(1)}%` : '50%';

  return (
    <div className="relative w-full">
      {/* Legend */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded-full bg-[#1434CB]" />
          <span className="text-[9px] text-slate-500 font-medium">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="4" className="overflow-visible">
            <line x1="0" y1="2" x2="14" y2="2" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round" />
          </svg>
          <span className="text-[9px] text-slate-500 font-medium">+ Committed</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height: 110 }}>
        <defs>
          <linearGradient id="actual-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1434CB" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1434CB" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="committed-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis gridlines + labels */}
        {ticks.map((tick) => {
          const y = yOf(tick).toFixed(1);
          return (
            <g key={tick}>
              <line
                x1={PAD.l} y1={y} x2={PAD.l + CW} y2={y}
                stroke="#e2e8f0" strokeWidth="0.6"
              />
              <text
                x={PAD.l - 4} y={parseFloat(y) + 2.5}
                textAnchor="end" fontSize="7"
                fill="#94a3b8"
              >
                {fmtAxis(tick)}
              </text>
            </g>
          );
        })}

        {/* Area fills */}
        <path d={areaPath(committedPts)} fill="url(#committed-fill)" />
        <path d={areaPath(actualPts)}   fill="url(#actual-fill)"    />

        {/* Committed line (dashed purple) */}
        <polyline points={committedPts} fill="none" stroke="#818cf8" strokeWidth="1.4"
          strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Actual line (blue solid) */}
        <polyline points={actualPts} fill="none" stroke="#1434CB" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Month labels */}
        {data.map((d, i) => (
          <text key={i} x={xOf(i).toFixed(1)} y={VH - 2}
            textAnchor="middle" fontSize="8"
            fill={d.isCurrent ? '#1434CB' : '#94a3b8'}
            fontWeight={d.isCurrent ? '700' : '400'}
          >{d.label}</text>
        ))}

        {/* Voronoi hover hit areas — full-height, no gaps */}
        {data.map((d, i) => {
          const lx = zoneLeft(i);
          const rx = zoneRight(i);
          return (
            <rect key={i}
              x={lx.toFixed(1)} y={PAD.t}
              width={(rx - lx).toFixed(1)} height={CH + 4}
              fill="transparent"
              className="cursor-default"
              onMouseEnter={() => notify(i)}
              onMouseLeave={() => notify(null)}
            />
          );
        })}

        {/* Hover column highlight */}
        {hovered !== null && (
          <rect
            x={zoneLeft(hovered).toFixed(1)} y={PAD.t}
            width={(zoneRight(hovered) - zoneLeft(hovered)).toFixed(1)} height={CH}
            fill="rgba(99,102,241,0.05)" rx="2"
            pointerEvents="none"
          />
        )}

        {/* Hover dots + guide */}
        {hovered !== null && (
          <>
            <line
              x1={xOf(hovered).toFixed(1)} y1={PAD.t}
              x2={xOf(hovered).toFixed(1)} y2={bottom}
              stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3 3"
              pointerEvents="none"
            />
            <circle cx={xOf(hovered).toFixed(1)} cy={yOf(data[hovered].actual).toFixed(1)}
              r="3.5" fill="#1434CB" pointerEvents="none" />
            {data[hovered].committedRecurring > 0 && (
              <circle cx={xOf(hovered).toFixed(1)}
                cy={yOf(data[hovered].actual + data[hovered].committedRecurring).toFixed(1)}
                r="3.5" fill="#818cf8" pointerEvents="none" />
            )}
          </>
        )}
      </svg>

      {/* Tooltip — above the chart */}
      <AnimatePresence>
        {hovered !== null && (
          <div className="absolute z-50" style={{
            bottom: '100%', marginBottom: 8,
            left: tipLeft, transform: 'translateX(-50%)',
          }}>
            <SpendTooltip datum={data[hovered]} year={year} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Donut gauge (with optional committed arc) ──────────────────────────────────
interface DonutGaugeProps {
  pct: number;
  committedPct?: number;
  isHighlighted?: boolean; // true when driven by chart hover
  size?: number;
  strokeWidth?: number;
  gradStart: string;
  gradEnd: string;
  id: string;
}

function DonutGauge({ pct, committedPct, isHighlighted = false, size = 148, strokeWidth = 20, gradStart, gradEnd, id }: DonutGaugeProps) {
  const clamped   = Math.min(Math.max(pct, 0), 100);
  const clampedC  = Math.min(Math.max(committedPct ?? pct, 0), 100);
  const cx = size / 2, cy = size / 2;
  const r  = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const filledLength    = (clamped / 100) * circumference;
  const committedLength = (clampedC / 100) * circumference;

  const toXY = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const startDot = toXY(-90);
  const endDot   = toXY(-90 + (clamped / 100) * 360);

  const dotR   = strokeWidth / 2 + 1;
  const gradId = `donut-grad-${id}`;
  const glowId = `donut-glow-${id}`;

  return (
    <svg width={size} height={size} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={gradStart} stopOpacity="0.85" />
          <stop offset="100%" stopColor={gradEnd} />
        </linearGradient>
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={isHighlighted ? 10 : 6} result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={gradStart}
        strokeOpacity={isHighlighted ? 0.12 : 0.22} strokeWidth={strokeWidth} />

      {/* Committed extension arc */}
      {clampedC > clamped && (
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={gradStart}
          strokeOpacity={isHighlighted ? 0.85 : 0.55}
          strokeWidth={isHighlighted ? strokeWidth * 0.7 : strokeWidth * 0.55}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          animate={{
            strokeDashoffset: circumference - committedLength,
            strokeOpacity: isHighlighted ? 0.85 : 0.55,
            strokeWidth: isHighlighted ? strokeWidth * 0.7 : strokeWidth * 0.55,
          }}
          initial={{ strokeDashoffset: circumference }}
          transition={{ duration: 0.55, ease: [0.33, 1, 0.68, 1] }}
        />
      )}

      {/* Actual filled arc */}
      {filledLength > 0 && (
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          animate={{
            strokeDashoffset: circumference - filledLength,
            strokeWidth: isHighlighted ? strokeWidth * 1.15 : strokeWidth,
          }}
          initial={{ strokeDashoffset: circumference, strokeWidth }}
          transition={{ duration: 0.55, ease: [0.33, 1, 0.68, 1] }}
        />
      )}

      {/* Start dot */}
      <circle cx={startDot.x} cy={startDot.y} r={isHighlighted ? dotR * 1.3 : dotR}
        fill={gradStart} fillOpacity={0.75} filter={`url(#${glowId})`} />

      {/* End dot */}
      {filledLength > 0 && (
        <motion.circle
          cx={endDot.x} cy={endDot.y}
          fill={gradEnd}
          filter={`url(#${glowId})`}
          animate={{ r: isHighlighted ? dotR * 1.4 : dotR, opacity: 1 }}
          initial={{ r: dotR, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </svg>
  );
}

// ── Status chip ────────────────────────────────────────────────────────────────
function StatusChip({ pct }: { pct: number }) {
  if (pct >= 90) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
      <AlertTriangle size={9} /> Critical
    </span>
  );
  if (pct >= 70) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
      <AlertTriangle size={9} /> Watch
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
      <CheckCircle2 size={9} /> On Track
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface BudgetTrackerProps {
  transactions: Transaction[];
  annualBudget: number;
}

export function BudgetTracker({ transactions, annualBudget }: BudgetTrackerProps) {
  const now = new Date('2026-04-02T00:00:00.000Z');
  const currentYear  = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth(); // 0-based
  const monthlyBudget = annualBudget / 12;

  // Lifted from SpendChart so gauge can react
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  // rfpId → category lookup
  const rfpCategoryMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const rfp of MOCK_RFPS) m.set(rfp.id, rfp.category);
    return m;
  }, []);

  // committed recurring per month: pending/scheduled installments NOT yet in actuals
  const committedMap = useMemo(() => {
    const map = new Map<number, { total: number; breakdown: BreakdownItem[] }>();
    for (const rfp of MOCK_RFPS) {
      if (!rfp.recurring) continue;
      for (const inst of rfp.recurring.installments) {
        if (inst.status === 'paid') continue; // already in actuals
        const d = new Date(inst.dueDate);
        if (d.getUTCFullYear() !== currentYear) continue;
        const m = d.getUTCMonth();
        const cat = rfp.category;
        const prev = map.get(m) ?? { total: 0, breakdown: [] };
        const bd = prev.breakdown.find(b => b.category === cat);
        if (bd) bd.amount += inst.amount; else prev.breakdown.push({ category: cat, amount: inst.amount });
        map.set(m, { total: prev.total + inst.amount, breakdown: prev.breakdown });
      }
    }
    return map;
  }, [currentYear]);

  const metrics = useMemo(() => {
    const settled = transactions.filter(t => t.status === 'Settled');

    const ytdSpent = settled
      .filter(t => new Date(t.createdAt).getUTCFullYear() === currentYear)
      .reduce((s, t) => s + t.amount, 0);

    const monthSpent = settled
      .filter(t => {
        const d = new Date(t.createdAt);
        return d.getUTCFullYear() === currentYear && d.getUTCMonth() === currentMonth;
      })
      .reduce((s, t) => s + t.amount, 0);

    // Annual committed = ytdSpent + all pending/scheduled this year
    const annualCommittedExtra = Array.from(committedMap.values()).reduce((s, v) => s + v.total, 0);
    const annualCommitted = ytdSpent + annualCommittedExtra;

    // Monthly committed = monthSpent + pending installments this month
    const monthCommittedExtra = committedMap.get(currentMonth)?.total ?? 0;
    const monthCommitted = monthSpent + monthCommittedExtra;

    // Build full-year chart data (all 12 months)
    const chartData: ChartPoint[] = Array.from({ length: 12 }, (_, m) => {
      const monthTxns = settled.filter(t => {
        const d = new Date(t.createdAt);
        return d.getUTCFullYear() === currentYear && d.getUTCMonth() === m;
      });
      const actual = monthTxns.reduce((s, t) => s + t.amount, 0);

      const catMap = new Map<string, number>();
      for (const t of monthTxns) {
        const cat = rfpCategoryMap.get(t.rfpId) ?? 'Other';
        catMap.set(cat, (catMap.get(cat) ?? 0) + t.amount);
      }
      const breakdown: BreakdownItem[] = Array.from(catMap.entries()).map(([category, amount]) => ({ category, amount }));
      const committed = committedMap.get(m);

      return {
        label: MONTH_SHORT[m],
        monthIndex: m,
        actual,
        committedRecurring: committed?.total ?? 0,
        isCurrent: m === currentMonth,
        breakdown,
        recurringBreakdown: committed?.breakdown ?? [],
      };
    });

    const daysElapsed = Math.max(1, Math.round(
      (now.getTime() - new Date(Date.UTC(currentYear, 0, 1)).getTime()) / 86400000
    ));
    const dailyBurnRate = ytdSpent / daysElapsed;
    const annualForecast = dailyBurnRate * 365;
    const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
    const daysLeftInMonth = daysInMonth - now.getUTCDate();

    return {
      ytdSpent,
      monthSpent,
      monthCommitted,
      annualCommitted,
      annualRemaining: annualBudget - ytdSpent,
      monthlyRemaining: monthlyBudget - monthSpent,
      annualPct:   Math.min(Math.round((ytdSpent / annualBudget) * 100), 100),
      annualCommittedPct: Math.min(Math.round((annualCommitted / annualBudget) * 100), 100),
      monthlyPct:  Math.min(Math.round((monthSpent / monthlyBudget) * 100), 100),
      monthlyCommittedPct: Math.min(Math.round((monthCommitted / monthlyBudget) * 100), 100),
      dailyBurnRate,
      annualForecast,
      daysElapsed,
      daysLeftInMonth,
      daysInMonth,
      chartData,
    };
  }, [transactions, annualBudget, monthlyBudget, currentYear, currentMonth, rfpCategoryMap, committedMap]);

  const annualCount  = useCountUp(metrics.annualRemaining);
  const monthlyCount = useCountUp(metrics.monthlyRemaining, 700);

  // When a chart month is hovered, drive the monthly gauge with that month's data
  const hoveredPoint = hoveredMonthIdx !== null ? metrics.chartData[hoveredMonthIdx] : null;
  const activeMonthPct = hoveredPoint
    ? Math.min(Math.round((hoveredPoint.actual / monthlyBudget) * 100), 100)
    : metrics.monthlyPct;
  const activeMonthCommittedPct = hoveredPoint
    ? Math.min(Math.round(((hoveredPoint.actual + hoveredPoint.committedRecurring) / monthlyBudget) * 100), 100)
    : metrics.monthlyCommittedPct;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden
      shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.06)]">

      {/* ── header bar ─── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}>
            <Zap size={13} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Budget Tracker</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Live · FY 2026</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Total Budget</p>
          <p className="text-sm font-bold text-slate-800">{fmt(annualBudget)}</p>
        </div>
      </div>

      <div className="h-px bg-slate-100 mx-5" />

      {/* ── two panels ─── */}
      <div className="grid grid-cols-2 divide-x divide-slate-100">

        {/* ── Annual ─── */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays size={11} /> Annual Budget
            </span>
            <StatusChip pct={metrics.annualPct} />
          </div>

          <div className="relative flex justify-center">
            <DonutGauge
              pct={metrics.annualPct}
              committedPct={metrics.annualCommittedPct}
              id="annual"
              size={148}
              strokeWidth={20}
              gradStart="#818cf8"
              gradEnd="#1434CB"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] font-black text-slate-900 leading-none">{metrics.annualPct}%</span>
              <span className="text-[10px] text-slate-400 font-medium mt-1">Remaining</span>
              <motion.span
                className="text-[11px] font-bold text-[#1434CB] leading-tight mt-0.5"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              >
                {fmt(annualCount)}
              </motion.span>
            </div>
          </div>

          {/* Committed pill */}
          {metrics.annualCommitted > metrics.ytdSpent && (
            <div className="flex items-center justify-between rounded-lg bg-indigo-50/70 border border-indigo-100 px-2.5 py-1.5">
              <div className="flex items-center gap-1.5">
                <svg width="10" height="4"><line x1="0" y1="2" x2="10" y2="2" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round"/></svg>
                <span className="text-[9px] text-slate-500 font-medium">+ Committed recurring</span>
              </div>
              <span className="text-[10px] font-bold text-[#6366f1]">{fmt(metrics.annualCommitted - metrics.ytdSpent)}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
              <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wide">YTD Spent</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{fmt(metrics.ytdSpent)}</p>
              <p className="text-[9px] text-slate-400">{metrics.annualPct}% of budget</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
              <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wide">Burn / Day</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{fmt(metrics.dailyBurnRate)}</p>
              <p className="text-[9px] text-slate-400">{metrics.daysElapsed}d elapsed</p>
            </div>
          </div>

          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-2.5 flex items-center gap-2">
            <TrendingUp size={12} className="text-[#1434CB] shrink-0" />
            <div>
              <p className="text-[9px] text-slate-500 font-medium">Projected annual spend</p>
              <p className="text-xs font-bold text-[#1434CB]">{fmt(metrics.annualForecast)}</p>
            </div>
          </div>
        </div>

        {/* ── Monthly ─── */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays size={11} /> Monthly Budget
            </span>
            <StatusChip pct={metrics.monthlyPct} />
          </div>

          <div className="relative flex justify-center">
            <DonutGauge
              pct={activeMonthPct}
              committedPct={activeMonthCommittedPct}
              isHighlighted={hoveredPoint !== null}
              id="monthly"
              size={148}
              strokeWidth={20}
              gradStart="#7dd3fc"
              gradEnd="#6366f1"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {hoveredPoint ? (
                  <motion.div key={hoveredPoint.monthIndex}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }} transition={{ duration: 0.18 }}>
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                      {MONTH_NAMES[hoveredPoint.monthIndex]}
                    </span>
                    <span className="text-[20px] font-black text-slate-900 leading-tight">{fmt(hoveredPoint.actual)}</span>
                    {hoveredPoint.committedRecurring > 0 && (
                      <span className="text-[9px] font-semibold text-[#818cf8] mt-0.5">
                        +{fmt(hoveredPoint.committedRecurring)} recurring
                      </span>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="default" className="flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }} transition={{ duration: 0.18 }}>
                    <span className="text-[22px] font-black text-slate-900 leading-none">{metrics.monthlyPct}%</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-1">Remaining</span>
                    <span className="text-[11px] font-bold text-[#6366f1] leading-tight mt-0.5">{fmt(monthlyCount)}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Committed pill */}
          {metrics.monthCommitted > metrics.monthSpent && (
            <div className="flex items-center justify-between rounded-lg bg-indigo-50/70 border border-indigo-100 px-2.5 py-1.5">
              <div className="flex items-center gap-1.5">
                <svg width="10" height="4"><line x1="0" y1="2" x2="10" y2="2" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round"/></svg>
                <span className="text-[9px] text-slate-500 font-medium">+ Committed recurring</span>
              </div>
              <span className="text-[10px] font-bold text-[#6366f1]">{fmt(metrics.monthCommitted - metrics.monthSpent)}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
              <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wide">This Month</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{fmt(metrics.monthSpent)}</p>
              <p className="text-[9px] text-slate-400">{metrics.monthlyPct}% of monthly</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
              <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wide">Monthly Cap</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{fmt(monthlyBudget)}</p>
              <p className="text-[9px] text-slate-400">{fmtFull(monthlyBudget)} total</p>
            </div>
          </div>

          {/* Dual-line spend chart — full panel width */}
          <div className="pt-1">
            <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wide mb-1">
              Monthly Spend · FY 2026
            </p>
            <SpendChart data={metrics.chartData} year={currentYear} currentMonth={currentMonth} onHover={setHoveredMonthIdx} />
          </div>
        </div>
      </div>

      {/* ── footer progress ─── */}
      <div className="px-5 pb-4 pt-1">
        <div className="flex justify-between text-[9px] text-slate-400 mb-1.5 font-medium">
          <span>FY 2026 utilization — {metrics.annualPct}% actual · {metrics.annualCommittedPct}% with committed</span>
          <span>{fmt(metrics.annualRemaining)} remaining</span>
        </div>
        {/* Committed bar (background) */}
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden relative">
          <motion.div className="h-full rounded-full absolute inset-y-0 left-0"
            style={{ background: 'rgba(129,140,248,0.4)' }}
            initial={{ width: 0 }}
            animate={{ width: `${metrics.annualCommittedPct}%` }}
            transition={{ duration: 1.3, ease: 'easeOut', delay: 0.15 }}
          />
          <motion.div className="h-full rounded-full absolute inset-y-0 left-0"
            style={{ background: 'linear-gradient(to right, #1434CB, #6366f1)' }}
            initial={{ width: 0 }}
            animate={{ width: `${metrics.annualPct}%` }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>
    </div>
  );
}
