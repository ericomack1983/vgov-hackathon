'use client';

import { CreditCard, Wallet } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selected: 'USD' | 'USDC' | null;
  onSelect: (method: 'USD' | 'USDC') => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({ selected, onSelect, disabled }: PaymentMethodSelectorProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <button
        type="button"
        onClick={() => onSelect('USD')}
        className={`rounded-xl p-6 cursor-pointer transition-all text-left border-2 ${
          selected === 'USD'
            ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
            : 'border-slate-200 bg-white hover:shadow-md'
        }`}
      >
        <CreditCard size={24} className={selected === 'USD' ? 'text-indigo-600' : 'text-slate-400'} />
        <p className="mt-3 text-sm font-semibold text-slate-900">Pay with USD</p>
        <p className="mt-1 text-xs text-slate-500">Visa Network - Settlement T+2</p>
      </button>

      <button
        type="button"
        onClick={() => onSelect('USDC')}
        className={`rounded-xl p-6 cursor-pointer transition-all text-left border-2 ${
          selected === 'USDC'
            ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
            : 'border-slate-200 bg-white hover:shadow-md'
        }`}
      >
        <Wallet size={24} className={selected === 'USDC' ? 'text-indigo-600' : 'text-slate-400'} />
        <p className="mt-3 text-sm font-semibold text-slate-900">Pay with USDC</p>
        <p className="mt-1 text-xs text-slate-500">Polygon Network - Instant Settlement</p>
      </button>
    </div>
  );
}
