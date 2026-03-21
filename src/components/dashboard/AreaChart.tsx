'use client';

import { Transaction } from '@/lib/mock-data/types';
import { transactionsToChartPoints, buildAreaPath } from '@/lib/chart-utils';

interface AreaChartProps {
  transactions: Transaction[];
}

const WIDTH = 500;
const HEIGHT = 200;
const PADDING = 30;

export function AreaChart({ transactions }: AreaChartProps) {
  const points = transactionsToChartPoints(transactions, WIDTH, HEIGHT, PADDING);
  const areaPath = buildAreaPath(points, WIDTH, HEIGHT);

  if (points.length === 0) {
    return (
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        <text
          x={WIDTH / 2}
          y={HEIGHT / 2}
          textAnchor="middle"
          fontSize="14"
          fill="#94a3b8"
        >
          No transaction data
        </text>
      </svg>
    );
  }

  const gridYPositions = [0.25, 0.5, 0.75].map(
    (pct) => PADDING + (HEIGHT - PADDING * 2) * (1 - pct)
  );

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridYPositions.map((y, i) => (
        <line
          key={i}
          x1={PADDING}
          y1={y}
          x2={WIDTH - PADDING}
          y2={y}
          stroke="#e2e8f0"
          strokeDasharray="4"
        />
      ))}

      {/* Area path */}
      <path
        d={areaPath}
        fill="url(#areaGradient)"
        stroke="#4f46e5"
        strokeWidth={2}
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#4f46e5" />
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={HEIGHT - 8}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}
