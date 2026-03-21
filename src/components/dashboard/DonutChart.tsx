'use client';

import { DonutSegment } from '@/lib/chart-utils';

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
}

const RADIUS = 70;
const STROKE_WIDTH = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({ segments }: DonutChartProps) {
  let accumulatedOffset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox="0 0 200 200"
        className="w-full max-w-[200px]"
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle
          cx={100}
          cy={100}
          r={RADIUS}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={STROKE_WIDTH}
        />

        {/* Segments */}
        {segments.map((segment, i) => {
          const dashLength = segment.percentage * CIRCUMFERENCE;
          const offset = -accumulatedOffset;
          accumulatedOffset += dashLength;

          return (
            <circle
              key={i}
              cx={100}
              cy={100}
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${dashLength} ${CIRCUMFERENCE}`}
              strokeDashoffset={offset}
              transform="rotate(-90 100 100)"
            />
          );
        })}

        {/* Center text */}
        <text
          x={100}
          y={96}
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill="#1e293b"
        >
          {segments.length > 0
            ? `${Math.round(segments[0].percentage * 100)}%`
            : '0%'}
        </text>
        <text
          x={100}
          y={112}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
        >
          {segments.length > 0 ? segments[0].label : 'No data'}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-slate-600">{segment.label}</span>
            <span className="text-slate-900 font-medium ml-auto">
              ${segment.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
