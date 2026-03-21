'use client';

import { CreditCard, Wallet } from 'lucide-react';

interface ComparisonPanelProps {
  method: 'USD' | 'USDC';
  settlementTime: string;
}

export function ComparisonPanel({ method, settlementTime }: ComparisonPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Settlement Comparison</h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Traditional Rail */}
        <div
          className={`bg-slate-50 rounded-xl p-6 relative ${
            method === 'USD' ? 'ring-2 ring-indigo-600' : ''
          }`}
        >
          {method === 'USD' && (
            <span className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              Selected
            </span>
          )}
          <CreditCard size={24} className="text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-900">Traditional Rail</p>
          <ul className="mt-3 space-y-2">
            <li className="text-xs text-slate-600">USD via Visa</li>
            <li className="text-xs text-slate-600">Settlement: T+2 (2 business days)</li>
            <li className="text-xs text-slate-600">Fee: ~2.5%</li>
          </ul>
        </div>

        {/* Blockchain Rail */}
        <div
          className={`bg-purple-50 rounded-xl p-6 relative ${
            method === 'USDC' ? 'ring-2 ring-indigo-600' : ''
          }`}
        >
          {method === 'USDC' && (
            <span className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              Selected
            </span>
          )}
          <Wallet size={24} className="text-purple-700 mb-3" />
          <p className="text-sm font-semibold text-slate-900">Blockchain Rail</p>
          <ul className="mt-3 space-y-2">
            <li className="text-xs text-purple-700">USDC on Polygon</li>
            <li className="text-xs text-purple-700">Settlement: Instant</li>
            <li className="text-xs text-purple-700">Fee: &lt; $0.01</li>
          </ul>
        </div>
      </div>

      <p className="text-sm text-slate-500 text-center mt-4">
        Settlement completed in {settlementTime}
      </p>
    </div>
  );
}
