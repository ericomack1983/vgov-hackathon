'use client';

import { Sparkles } from 'lucide-react';

export function BestValueBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
      style={{ background: '#fcc015', color: '#1A1F71' }}
      aria-label="AI recommended best value supplier"
    >
      <Sparkles size={10} />
      Best Value
    </span>
  );
}
