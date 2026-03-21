'use client';

import { Bot } from 'lucide-react';

interface ExplainabilityPanelProps {
  narrative: string;
}

export function ExplainabilityPanel({ narrative }: ExplainabilityPanelProps) {
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
      <div className="flex items-center gap-2">
        <Bot size={20} className="text-indigo-600" />
        <span className="text-sm font-semibold text-indigo-900">AI Analysis</span>
      </div>
      <p className="mt-3 text-sm text-slate-700 leading-relaxed">{narrative}</p>
    </div>
  );
}
