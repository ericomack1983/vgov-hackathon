'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DonutSegment } from '@/lib/chart-utils';

interface DonutChartProps {
  segments: DonutSegment[];
}

const RADIUS       = 70;
const STROKE       = 26;
const STROKE_HOVER = 44;
const CIRC         = 2 * Math.PI * RADIUS;

export function DonutChart({ segments }: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  let offset = 0;

  const active = hovered !== null ? segments[hovered] : segments[0] ?? null;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-full max-w-[200px]">
        <svg viewBox="0 0 200 200" className="w-full" style={{ overflow: 'visible' }}>
          {/* Track */}
          <circle cx={100} cy={100} r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />

          {segments.map((seg, i) => {
            const dash   = seg.percentage * CIRC;
            const sOff   = -offset;
            offset      += dash;
            const isHov  = hovered === i;
            const sw     = isHov ? STROKE_HOVER : STROKE;
            const r      = isHov ? RADIUS : RADIUS;

            return (
              <motion.circle
                key={i}
                cx={100} cy={100} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={sw}
                strokeDasharray={`${dash} ${CIRC}`}
                strokeDashoffset={sOff}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                animate={{
                  strokeWidth: isHov ? STROKE_HOVER : STROKE,
                  filter: isHov ? `drop-shadow(0 0 22px ${seg.color}cc)` : 'none',
                  opacity: hovered !== null && !isHov ? 0.14 : 1,
                }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}

          {/* Center content */}
          <AnimatePresence mode="wait">
            <motion.g
              key={active?.label ?? 'empty'}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.18 }}
              style={{ transformOrigin: '100px 100px' }}
            >
              <text x={100} y={92} textAnchor="middle" fontSize={hovered !== null ? "22" : "18"} fontWeight="800" fill="#1e293b">
                {active ? `${Math.round(active.percentage * 100)}%` : '0%'}
              </text>
              <text x={100} y={109} textAnchor="middle" fontSize="10" fill="#64748b">
                {active?.label ?? 'No data'}
              </text>
              {active && (
                <text x={100} y={122} textAnchor="middle" fontSize="9" fontWeight="600"
                  fill={hovered !== null ? active.color : '#94a3b8'}>
                  ${active.value.toLocaleString()}
                </text>
              )}
            </motion.g>
          </AnimatePresence>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 w-full">
        {segments.map((seg, i) => (
          <motion.div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            animate={{ opacity: hovered !== null && hovered !== i ? 0.4 : 1 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2.5 text-sm cursor-default px-2 py-1.5 rounded-lg"
            style={{ background: hovered === i ? `${seg.color}12` : 'transparent' }}
          >
            <motion.span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
              animate={{ scale: hovered === i ? 1.4 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            />
            <span className="text-slate-600 flex-1">{seg.label}</span>
            <span className="font-semibold text-slate-900">${seg.value.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
