'use client';

import { DimensionScores } from '@/lib/mock-data/types';

interface DimensionScoreGridProps {
  dimensions: DimensionScores;
}

const DIMENSION_ORDER: (keyof DimensionScores)[] = [
  'price',
  'delivery',
  'reliability',
  'compliance',
  'risk',
];

export function DimensionScoreGrid({ dimensions }: DimensionScoreGridProps) {
  return (
    <div className="grid grid-cols-5 gap-4">
      {DIMENSION_ORDER.map((key) => (
        <div key={key}>
          <p className="text-xs text-slate-500 capitalize">{key}</p>
          <p className="text-xl font-semibold text-slate-900">{dimensions[key]}</p>
        </div>
      ))}
    </div>
  );
}
