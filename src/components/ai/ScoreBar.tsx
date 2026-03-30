'use client';

import { cn } from '@/lib/utils';

interface ScoreBarProps {
  score: number;
  isWinner?: boolean;
  label?: string;
}

export function ScoreBar({ score, isWinner, label }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-3">
      {label && (
        <span className="text-xs text-slate-500 w-20 text-right capitalize">{label}</span>
      )}
      <div
        className="h-2 flex-1 rounded-full bg-slate-200"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label} score` : 'Score'}
      >
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-500',
            isWinner ? 'bg-[#1434CB]' : 'bg-slate-400'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-700 min-w-[2rem] text-right">
        {Number(score.toFixed(2))}
      </span>
    </div>
  );
}
