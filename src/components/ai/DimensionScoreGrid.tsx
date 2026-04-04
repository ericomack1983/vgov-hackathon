'use client';

import { DimensionScores } from '@/lib/mock-data/types';

interface DimensionScoreGridProps {
  dimensions: DimensionScores;
}

const COLS: { key: keyof DimensionScores; label: string; visa?: boolean }[] = [
  { key: 'price',       label: 'Price' },
  { key: 'delivery',    label: 'Delivery' },
  { key: 'reliability', label: 'Reliability' },
  { key: 'compliance',  label: 'Compliance' },
  { key: 'risk',        label: 'Risk' },
  { key: 'vsms',        label: 'VSMS Score', visa: true },
];

export function DimensionScoreGrid({ dimensions }: DimensionScoreGridProps) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {COLS.map(({ key, label, visa }) => (
        <div key={key} className={visa ? 'bg-[#1434CB]/5 rounded-lg px-2 py-1.5 border border-[#1434CB]/20' : ''}>
          <p className={`text-xs capitalize ${visa ? 'text-[#1434CB] font-semibold' : 'text-slate-500'}`}>
            {label}
          </p>
          <p className={`text-xl font-semibold ${visa ? 'text-[#1434CB]' : 'text-slate-900'}`}>
            {Number(dimensions[key].toFixed(0))}
          </p>
          {visa && <p className="text-[9px] text-[#1434CB]/60 font-medium">via Visa API</p>}
        </div>
      ))}
    </div>
  );
}
