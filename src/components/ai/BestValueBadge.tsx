'use client';

import { Sparkles } from 'lucide-react';

export function BestValueBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 bg-[#1434CB] text-white px-3 py-1 rounded-full text-xs font-semibold"
      aria-label="AI recommended best value supplier"
    >
      <Sparkles size={12} />
      Best Value
    </span>
  );
}
