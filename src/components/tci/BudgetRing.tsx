'use client';

import { formatGTQ } from '@/lib/tci-format';

/**
 * Anillo de presupuesto — mismo estilo que el ring de utilización del
 * Financial Dashboard (gradiente Visa, trazo redondeado, 700ms de transición).
 */
export function BudgetRing({
  spent,
  budget,
  size = 132,
  gradientId = 'missionRingGrad',
}: {
  spent: number;
  budget: number;
  size?: number;
  gradientId?: string;
}) {
  const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  const stroke = size >= 120 ? 9 : 6;
  const r = size / 2 - stroke * 1.5;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * pct) / 100;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1434CB" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 -rotate-90 origin-center"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-800 leading-none">{pct}%</span>
        <span className="text-[10px] text-slate-400 mt-1">ejecutado</span>
        <span className="text-[10px] font-semibold text-slate-600 mt-0.5">{formatGTQ(spent)}</span>
      </div>
    </div>
  );
}

/** Barra de progreso compacta — para tablas y tarjetas de entidad. */
export function MiniProgress({
  value,
  max,
  width,
  colors = ['#1434CB', '#6366f1'],
}: {
  value: number;
  max: number;
  width?: number;
  colors?: [string, string];
}) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="h-1.5 rounded-full overflow-hidden bg-slate-100" style={width ? { width } : undefined}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})` }}
      />
    </div>
  );
}
