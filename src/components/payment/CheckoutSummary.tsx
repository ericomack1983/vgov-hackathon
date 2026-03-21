'use client';

interface CheckoutSummaryProps {
  supplierName: string;
  amount: number;
  method: 'USD' | 'USDC' | null;
  orderId: string;
}

export function CheckoutSummary({ supplierName, amount, method, orderId }: CheckoutSummaryProps) {
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
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                method === 'USD'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {method}
            </span>
          ) : (
            <span className="text-sm text-slate-400">Not selected</span>
          )}
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-slate-500">Order ID</span>
          <span className="text-sm font-mono text-slate-600">{orderId}</span>
        </div>
      </div>
    </div>
  );
}
