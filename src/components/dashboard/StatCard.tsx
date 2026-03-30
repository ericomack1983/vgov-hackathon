'use client';

import { ReactNode, useRef, useEffect, useState } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  /** 0-100 — shows an animated gradient bar when provided */
  progress?: number;
  /** gradient stop colors e.g. ['#3b82f6','#8b5cf6'] */
  gradientColors?: [string, string];
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendUp,
  progress,
  gradientColors = ['#1434CB', '#6366f1'],
}: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 6;
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };
    const onLeave = () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
      setHovered(false);
    };
    const onEnter = () => setHovered(true);

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mouseleave', onLeave);
    return () => {
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseenter', onEnter);
      card.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-xl border border-slate-200 p-5 transition-all duration-300 ease-out
        shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.06)]
        hover:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_12px_32px_rgba(0,0,0,0.12)]"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>

      <div className="text-2xl font-semibold text-slate-900 mt-2">{value}</div>

      {trend && (
        <div className={`text-xs mt-1 font-medium ${trendUp ? 'text-emerald-500' : 'text-slate-400'}`}>
          {trendUp ? '↑ ' : ''}{trend}
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${hovered ? Math.min(progress + 6, 100) : progress}%`,
              background: `linear-gradient(to right, ${gradientColors[0]}, ${gradientColors[1]})`,
            }}
          />
        </div>
      )}
    </div>
  );
}
