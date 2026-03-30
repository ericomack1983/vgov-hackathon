'use client';

import { ScoredBid } from '@/lib/mock-data/types';
import { BestValueBadge } from './BestValueBadge';
import { ScoreBar } from './ScoreBar';
import { ScoreRadarChart } from './ScoreRadarChart';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface RankedSupplierRowProps {
  scoredBid: ScoredBid;
  isSelected?: boolean;
  isAiBest?: boolean;
  onSelect?: () => void;
}

const DIMENSIONS = ['price', 'delivery', 'reliability', 'compliance', 'risk', 'vaa'] as const;

export function RankedSupplierRow({ scoredBid, isSelected, isAiBest, onSelect }: RankedSupplierRowProps) {
  const hasVisa = !!scoredBid.supplier.vaaScore;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border transition-all border-l-4 overflow-hidden',
        onSelect && 'cursor-pointer',
        isSelected
          ? 'border-[#1434CB] border-l-#1434CB shadow-md ring-2 ring-[#D6DFFA]'
          : onSelect
          ? 'border-slate-200 border-l-transparent hover:border-[#A5B8F3] hover:shadow-sm'
          : isAiBest
          ? 'border-l-#1434CB'
          : 'border-l-transparent'
      )}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="flex items-stretch">

        {/* Left — compact info + score bars */}
        <div className="flex-1 min-w-0 p-4 space-y-3">

          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-mono">#{scoredBid.rank}</span>
              <span className="text-base font-semibold text-slate-900 leading-tight">
                {scoredBid.supplier.name}
              </span>
              {isAiBest && <BestValueBadge />}
              {hasVisa && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1434CB]/8 border border-[#1434CB]/20 text-[10px] font-bold text-[#1434CB] tracking-wide">
                  <svg viewBox="0 0 72 24" aria-label="Visa" className="h-2.5 w-auto shrink-0">
                    <path fill="currentColor" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
                  </svg>
                  Accepted
                </span>
              )}
              {isSelected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1434CB]">
                  <CheckCircle2 size={12} className="text-[#1434CB]" />
                  Selected
                </span>
              )}
            </div>
            <div className="shrink-0">
              <span className="text-2xl font-bold text-slate-900">{Number(scoredBid.composite.toFixed(0))}</span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
          </div>

          {/* Compact score bars */}
          <div className="space-y-1.5">
            {DIMENSIONS.map((dim) => (
              <ScoreBar
                key={dim}
                score={scoredBid.dimensions[dim]}
                isWinner={isSelected ?? scoredBid.isWinner}
                label={dim}
              />
            ))}
          </div>
        </div>

        {/* Right — radar chart */}
        <div className="shrink-0 flex items-center justify-center border-l border-slate-100 bg-slate-50/50 px-2">
          <ScoreRadarChart dimensions={scoredBid.dimensions} size={170} />
        </div>

      </div>
    </div>
  );
}
