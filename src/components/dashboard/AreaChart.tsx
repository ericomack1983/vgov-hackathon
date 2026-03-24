'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '@/lib/mock-data/types';
import { transactionsToChartPoints, ChartPoint } from '@/lib/chart-utils';

interface AreaChartProps {
  transactions: Transaction[];
}

const W     = 560;
const H     = 260;
const PAD_L = 64;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 32;

const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const formatY = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

// ── MCG static series ─────────────────────────────────────────────────────
// x: normalized 0→1 over the Jan 15 – Mar 1 range (4 waypoints)
// y: cumulative spend in dollars at each waypoint
const MCG_SERIES = [
  { key: 'Supermarket', color: '#3b82f6', points: [18_000, 38_000, 60_000, 82_000] },
  { key: 'Shopping',    color: '#ec4899', points: [20_000, 42_000, 65_000, 78_000] },
  { key: 'Airline',     color: '#8b5cf6', points: [25_000, 48_000, 58_000, 62_000] },
  { key: 'Groceries',   color: '#22c55e', points: [12_000, 24_000, 38_000, 48_000] },
  { key: 'Restaurant',  color: '#f97316', points: [8_000,  16_000, 26_000, 32_000] },
  { key: 'Gas',         color: '#f59e0b', points: [3_000,  7_000,  11_000, 14_000] },
] as const;

// Normalized x positions of the 4 waypoints (Jan 15, Feb 1, Feb 15, Mar 1)
const MCG_X_NORM = [0, 0.37, 0.63, 1.0];

export function AreaChart({ transactions }: AreaChartProps) {
  const [hovered, setHovered]       = useState<ChartPoint | null>(null);
  const [mouseX,  setMouseX]        = useState<number | null>(null);
  const [activeMcg, setActiveMcg]   = useState<string | null>(null);

  // ── Existing cumulative line ───────────────────────────────────────────
  const raw    = transactionsToChartPoints(transactions, PLOT_W, PLOT_H, 0);
  const points = raw.map((p) => ({ ...p, x: p.x + PAD_L, y: p.y + PAD_T }));

  if (points.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="13" fill="#94a3b8">
          No transaction data
        </text>
      </svg>
    );
  }

  const maxVal   = Math.max(...points.map((p) => p.value));
  const gridPcts = [0, 0.33, 0.66, 1];
  const gridLines = gridPcts.map((pct) => ({
    y:     PAD_T + PLOT_H * (1 - pct),
    value: maxVal * pct,
  }));

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${lineD} L${points[points.length - 1].x},${PAD_T + PLOT_H} L${PAD_L},${PAD_T + PLOT_H} Z`;

  const nearestToMouse = mouseX !== null
    ? points.reduce((best, p) => Math.abs(p.x - mouseX) < Math.abs(best.x - mouseX) ? p : best)
    : null;

  // ── MCG line coords ────────────────────────────────────────────────────
  function mcgToSvgPoints(values: readonly number[]) {
    return MCG_X_NORM.map((nx, i) => ({
      x: PAD_L + nx * PLOT_W,
      y: PAD_T + PLOT_H - (values[i] / maxVal) * PLOT_H,
      value: values[i],
    }));
  }

  const mcgLines = MCG_SERIES.map((s) => ({
    ...s,
    svgPts: mcgToSvgPoints(s.points),
  }));

  // Find hovered MCG point (nearest x snap)
  const hoveredMcgPts = mouseX !== null
    ? mcgLines.map((s) => {
        const nearest = s.svgPts.reduce((best, p) =>
          Math.abs(p.x - mouseX) < Math.abs(best.x - mouseX) ? p : best
        );
        return { key: s.key, color: s.color, value: nearest.value };
      })
    : null;

  return (
    <div className="space-y-3">
      <div className="relative group">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full overflow-visible"
          onMouseMove={(e) => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            setMouseX(((e.clientX - rect.left) / rect.width) * W);
          }}
          onMouseLeave={() => { setMouseX(null); setHovered(null); }}
        >
          <defs>
            <linearGradient id="ag-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#4f46e5" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={PAD_L} y1={gl.y} x2={PAD_L + PLOT_W} y2={gl.y}
                stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 3"
              />
              <text
                x={PAD_L - 8} y={gl.y}
                textAnchor="end" dominantBaseline="middle"
                fontSize="10" fill="#94a3b8"
              >
                {formatY(gl.value)}
              </text>
            </g>
          ))}

          {/* Crosshair */}
          {nearestToMouse && (
            <line
              x1={nearestToMouse.x} y1={PAD_T}
              x2={nearestToMouse.x} y2={PAD_T + PLOT_H}
              stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" opacity={0.5}
            />
          )}

          {/* Cumulative total fill */}
          <path d={areaD} fill="url(#ag-base)" />

          {/* Cumulative total line (dim when MCG focused) */}
          <path
            d={lineD}
            fill="none"
            stroke="#4f46e5"
            strokeWidth={activeMcg ? 1 : 2}
            strokeLinejoin="round"
            opacity={activeMcg ? 0.25 : 0.9}
            style={{ transition: 'all 0.2s' }}
          />

          {/* MCG lines */}
          {mcgLines.map((s) => {
            const isActive  = activeMcg === s.key;
            const isDimmed  = activeMcg !== null && !isActive;
            const d = s.svgPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            return (
              <g key={s.key}>
                {/* Wider invisible hit area */}
                <path d={d} fill="none" stroke="transparent" strokeWidth={12}
                  onMouseEnter={() => setActiveMcg(s.key)}
                  onMouseLeave={() => setActiveMcg(null)}
                  style={{ cursor: 'crosshair' }}
                />
                <path
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeLinejoin="round"
                  strokeWidth={isActive ? 2.5 : 1.5}
                  opacity={isDimmed ? 0.15 : isActive ? 1 : 0.7}
                  style={{
                    transition: 'all 0.2s',
                    filter: isActive ? `drop-shadow(0 0 5px ${s.color}99)` : 'none',
                  }}
                />
                {/* Dots */}
                {s.svgPts.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x} cy={p.y}
                    r={isActive ? 4.5 : 2.5}
                    fill={s.color}
                    stroke="white"
                    strokeWidth={1.5}
                    opacity={isDimmed ? 0.15 : isActive ? 1 : 0.7}
                    style={{ transition: 'all 0.2s' }}
                  />
                ))}
              </g>
            );
          })}

          {/* Total line dots */}
          {points.map((p, i) => {
            const isNearest = nearestToMouse === p;
            return (
              <motion.circle
                key={i}
                cx={p.x} cy={p.y}
                fill="#4f46e5"
                stroke="white"
                strokeWidth={2}
                animate={{
                  r:       isNearest ? 6 : 3,
                  opacity: activeMcg ? 0.2 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                onMouseEnter={() => setHovered(p)}
              />
            );
          })}

          {/* X labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x} y={PAD_T + PLOT_H + PAD_B * 0.65}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fill={nearestToMouse === p ? '#4f46e5' : '#64748b'}
              fontWeight={nearestToMouse === p ? '700' : '400'}
            >
              {p.label}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {nearestToMouse && (
            <motion.div
              key={nearestToMouse.label}
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute pointer-events-none z-10"
              style={{
                left: `${(nearestToMouse.x / W) * 100}%`,
                top:  `${(nearestToMouse.y / H) * 100}%`,
                transform: 'translate(-50%, calc(-100% - 14px))',
              }}
            >
              <div className="bg-slate-900 text-white rounded-xl shadow-2xl px-3.5 py-2.5 border border-slate-700/60 whitespace-nowrap min-w-[160px]">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  {nearestToMouse.label}
                </p>
                <p className="text-white font-bold text-[15px] leading-none mb-2">
                  {formatY(nearestToMouse.value)}
                </p>
                {hoveredMcgPts && (
                  <div className="space-y-1 border-t border-slate-700 pt-2">
                    {hoveredMcgPts
                      .slice()
                      .sort((a, b) => b.value - a.value)
                      .map((m) => (
                        <div key={m.key} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
                            <span className="text-slate-400 text-[10px]">{m.key}</span>
                          </div>
                          <span className="text-slate-200 text-[10px] font-semibold tabular-nums">
                            {formatY(m.value)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700/60 rotate-45 mx-auto -mt-[5px]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 border-t border-slate-100">
        <button
          className="flex items-center gap-1.5 group/leg"
          onMouseEnter={() => setActiveMcg(null)}
        >
          <div className="w-3 h-0.5 bg-indigo-500 rounded-full" />
          <span className="text-[11px] text-slate-500 group-hover/leg:text-slate-700 transition-colors">Total</span>
        </button>
        {MCG_SERIES.map((s) => (
          <button
            key={s.key}
            className="flex items-center gap-1.5 group/leg"
            onMouseEnter={() => setActiveMcg(s.key)}
            onMouseLeave={() => setActiveMcg(null)}
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span
              className="text-[11px] transition-colors"
              style={{ color: activeMcg === s.key ? s.color : '#64748b' }}
            >
              {s.key}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
