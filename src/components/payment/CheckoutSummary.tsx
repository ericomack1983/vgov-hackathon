'use client';

import type { PaymentMethod } from '@/lib/mock-data/types';
import type { SelectableCard } from './PaymentMethodSelector';

interface CheckoutSummaryProps {
  supplierName: string;
  amount: number;
  method: PaymentMethod | null;
  orderId: string;
  selectedCard?: SelectableCard | null;
}

const METHOD_BADGE: Record<PaymentMethod, string> = {
  USD:  'bg-indigo-100 text-indigo-700',
  USDC: 'bg-purple-100 text-purple-700',
  Card: 'bg-emerald-100 text-emerald-700',
};

export function CheckoutSummary({ supplierName, amount, method, orderId, selectedCard }: CheckoutSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Checkout Summary</h3>
      <div className="divide-y divide-slate-100">
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-slate-500">Supplier</span>
          <span className="text-sm font-medium text-slate-900">{supplierName}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-slate-500">Amount</span>
          <span className="text-sm font-medium text-slate-900">${amount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-slate-500">Payment Method</span>
          {method ? (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${METHOD_BADGE[method]}`}>
              {method}
            </span>
          ) : (
            <span className="text-sm text-slate-400">Not selected</span>
          )}
        </div>
        {method === 'Card' && selectedCard && (
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-slate-500">Card</span>
            <span className="text-sm font-mono font-medium text-slate-800">
              {selectedCard.brand} •••• {selectedCard.last4}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-slate-500">Order ID</span>
          <span className="text-sm font-mono text-slate-600">{orderId}</span>
        </div>
      </div>
    </div>
  );
}
