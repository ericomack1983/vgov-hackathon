'use client';

import { Transaction } from '@/lib/mock-data/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  limit?: number;
}

export function RecentTransactions({ transactions, limit = 5 }: RecentTransactionsProps) {
  const sorted = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="text-sm font-semibold text-slate-700 px-4 py-3 bg-slate-50">
          Recent Transactions
        </div>
        <div className="text-sm text-slate-500 p-6 text-center">No transactions yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="text-sm font-semibold text-slate-700 px-4 py-3 bg-slate-50">
        Recent Transactions
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-4 py-2 text-xs font-medium text-slate-500">Method</th>
              <th className="px-4 py-2 text-xs font-medium text-slate-500">Amount</th>
              <th className="px-4 py-2 text-xs font-medium text-slate-500">Supplier</th>
              <th className="px-4 py-2 text-xs font-medium text-slate-500">Status</th>
              <th className="px-4 py-2 text-xs font-medium text-slate-500">Date</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx) => (
              <tr key={tx.id} className="border-b border-slate-50">
                <td className="px-4 py-3">
                  {tx.method === 'USD' ? (
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">
                      USD
                    </span>
                  ) : (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">
                      USDC
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  ${tx.amount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{tx.supplierName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      tx.status === 'Settled'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {new Date(tx.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
