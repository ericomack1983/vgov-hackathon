'use client';

import { ScoredBid } from '@/lib/mock-data/types';
import { BestValueBadge } from './BestValueBadge';
import { DimensionScoreGrid } from './DimensionScoreGrid';
import { ScoreBar } from './ScoreBar';
import { cn } from '@/lib/utils';

interface RankedSupplierRowProps {
  scoredBid: ScoredBid;
  onSelect?: () => void;
}

const DIMENSIONS = ['price', 'delivery', 'reliability', 'compliance', 'risk'] as const;

export function RankedSupplierRow({ scoredBid, onSelect }: RankedSupplierRowProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 hover:bg-slate-50 transition-colors border-l-4',
        scoredBid.isWinner ? 'border-l-indigo-600' : 'border-l-transparent'
      )}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      {/* Top row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 font-mono">#{scoredBid.rank}</span>
          <span className="text-lg font-semibold text-slate-900">
            {scoredBid.supplier.name}
          </span>
          {scoredBid.isWinner && <BestValueBadge />}
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-slate-900">{scoredBid.composite}</span>
          <span className="text-sm text-slate-400">/100</span>
        </div>
      </div>

      {/* Dimension score grid */}
      <div className="mt-4">
        <DimensionScoreGrid dimensions={scoredBid.dimensions} />
      </div>

      {/* Score bars */}
      <div className="mt-4 space-y-2">
        {DIMENSIONS.map((dim) => (
          <ScoreBar
            key={dim}
            score={scoredBid.dimensions[dim]}
            isWinner={scoredBid.isWinner}
            label={dim}
          />
        ))}
      </div>
    </div>
  );
}
