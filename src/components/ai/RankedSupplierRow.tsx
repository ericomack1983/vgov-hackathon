'use client';

import { ScoredBid } from '@/lib/mock-data/types';
import { BestValueBadge } from './BestValueBadge';
import { ScoreBar } from './ScoreBar';
import { ScoreRadarChart } from './ScoreRadarChart';
import { CheckCircle2 } from 'lucide-react';

interface RankedSupplierRowProps {
  scoredBid: ScoredBid;
  isSelected?: boolean;
  isAiBest?: boolean;
  onSelect?: () => void;
}

const DIMENSIONS = ['price', 'delivery', 'reliability', 'compliance', 'risk', 'vsms'] as const;

/* nova-styles Visa wordmark — inline so we keep zero deps */
function VisaWordmark() {
  return (
    <svg viewBox="0 0 71 23" fill="none" aria-label="Visa" style={{ height: 10, width: 'auto' }}>
      <path
        fill="#1434CB"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"
      />
    </svg>
  );
}

export function RankedSupplierRow({ scoredBid, isSelected, isAiBest, onSelect }: RankedSupplierRowProps) {
  const hasVisa = !!scoredBid.supplier.vsmsScore;
  const score   = Number(scoredBid.composite.toFixed(0));

  return (
    <div
      className="relative overflow-hidden rounded-2xl transition-all duration-200"
      style={{
        background: isSelected ? '#F5F8FF' : '#ffffff',
        border: isSelected
          ? '1.5px solid #1434CB'
          : '1px solid rgba(0,0,0,0.08)',
        boxShadow: isSelected
          ? '0 4px 15px -1px rgba(20,52,203,0.12)'
          : '0 1px 3px 0 rgba(0,0,0,0.05)',
        cursor: onSelect ? 'pointer' : 'default',
      }}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      {/* Top accent — gold for AI best, blue for selected override */}
      {(isSelected || isAiBest) && (
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: isAiBest ? '#fcc015' : '#1434CB' }}
        />
      )}

      <div className="flex items-stretch">
        {/* ── Left: info + score bars ── */}
        <div className="flex-1 min-w-0 p-5 space-y-3 pt-6">

          {/* Header row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Rank pill */}
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: '#F5F5F5', color: '#4a4a4a' }}
              >
                #{scoredBid.rank}
              </span>

              <span className="text-[15px] font-semibold" style={{ color: '#000000' }}>
                {scoredBid.supplier.name}
              </span>

              {isAiBest && <BestValueBadge />}

              {hasVisa && (
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: '#EEF2FF',
                    color: '#1434CB',
                    border: '1px solid rgba(20,52,203,0.15)',
                  }}
                >
                  <VisaWordmark />
                  Accepted
                </span>
              )}

              {isSelected && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold"
                  style={{ color: '#1434CB' }}
                >
                  <CheckCircle2 size={11} />
                  Selected
                </span>
              )}
            </div>

            {/* Composite score */}
            <div className="shrink-0 flex items-baseline gap-0.5">
              <span className="text-2xl font-bold" style={{ color: '#000000' }}>{score}</span>
              <span className="text-xs" style={{ color: '#4a4a4a' }}>/100</span>
            </div>
          </div>

          {/* Score bars */}
          <div className="space-y-2">
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

        {/* ── Right: radar chart ── */}
        <div
          className="shrink-0 flex items-center justify-center px-3"
          style={{
            borderLeft: '1px solid rgba(0,0,0,0.06)',
            background: '#F9FAFB',
          }}
        >
          <ScoreRadarChart dimensions={scoredBid.dimensions} size={160} />
        </div>
      </div>
    </div>
  );
}
