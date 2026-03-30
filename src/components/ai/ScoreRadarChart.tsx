'use client';

import { DimensionScores } from '@/lib/mock-data/types';

interface ScoreRadarChartProps {
  dimensions: DimensionScores;
  size?: number;
}

const AXES: (keyof DimensionScores)[] = ['price', 'delivery', 'reliability', 'compliance', 'risk'];
const GRID_LEVELS = [25, 50, 75, 100];

function getPoint(score: number, axisIndex: number, radius: number, center: number) {
  const angle = (axisIndex * 2 * Math.PI) / 5 - Math.PI / 2;
  const r = (score / 100) * radius;
  return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
}

function pointsString(scores: number[], radius: number, center: number): string {
  return scores.map((s, i) => {
    const p = getPoint(s, i, radius, center);
    return `${p.x},${p.y}`;
  }).join(' ');
}

export function ScoreRadarChart({ dimensions, size = 280 }: ScoreRadarChartProps) {
  const CENTER = size / 2;
  const RADIUS = size / 2 - 30;

  const dataScores = AXES.map((key) => dimensions[key]);
  const dataPoints = pointsString(dataScores, RADIUS, CENTER);

  return (
    <div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {/* Grid pentagons */}
        {GRID_LEVELS.map((level) => (
          <polygon
            key={level}
            points={pointsString(AXES.map(() => level), RADIUS, CENTER)}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {AXES.map((_, i) => {
          const end = getPoint(100, i, RADIUS, CENTER);
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={end.x}
              y2={end.y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis labels */}
        {AXES.map((axis, i) => {
          const labelPoint = getPoint(110, i, RADIUS, CENTER);
          return (
            <text
              key={axis}
              x={labelPoint.x}
              y={labelPoint.y}
              fontSize="11"
              fill="#64748b"
              textAnchor="middle"
              dominantBaseline="middle"
              className="capitalize"
            >
              {axis}
            </text>
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPoints}
          fill="rgba(79, 70, 229, 0.2)"
          stroke="#1434CB"
          strokeWidth="2"
        />

        {/* Data point dots */}
        {AXES.map((key, i) => {
          const p = getPoint(dimensions[key], i, RADIUS, CENTER);
          return <circle key={key} cx={p.x} cy={p.y} r="3" fill="#1434CB" />;
        })}
      </svg>

      {/* Screen reader data table */}
      <div className="sr-only">
        <table>
          <caption>Dimension Scores</caption>
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {AXES.map((axis) => (
              <tr key={axis}>
                <td>{axis}</td>
                <td>{dimensions[axis]}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
