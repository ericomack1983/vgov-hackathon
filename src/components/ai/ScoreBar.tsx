'use client';

interface ScoreBarProps {
  score: number;
  isWinner?: boolean;
  label?: string;
}

export function ScoreBar({ score, isWinner, label }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-3">
      {label && (
        <span
          className="text-[11px] w-20 text-right capitalize"
          style={{ color: '#4a4a4a' }}
        >
          {label}
        </span>
      )}
      <div
        className="h-1.5 flex-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.07)' }}
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label} score` : 'Score'}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            background: isWinner ? '#1434CB' : 'rgba(20,52,203,0.25)',
          }}
        />
      </div>
      <span
        className="text-[11px] font-semibold min-w-[2.5rem] text-right tabular-nums"
        style={{ color: isWinner ? '#000000' : '#4a4a4a' }}
      >
        {Number(score.toFixed(2))}
      </span>
    </div>
  );
}
