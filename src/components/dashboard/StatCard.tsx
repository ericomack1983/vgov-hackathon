'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ label, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-2xl font-semibold text-slate-900 mt-2">{value}</div>
      {trend && (
        <div className={`text-xs mt-1 ${trendUp ? 'text-emerald-500' : 'text-slate-400'}`}>
          {trend}
        </div>
      )}
    </div>
  );
}
