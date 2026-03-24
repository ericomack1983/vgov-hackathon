'use client';

import { motion } from 'framer-motion';
import { CreditCard, Coins } from 'lucide-react';
import { usePayment } from '@/context/PaymentContext';

export default function TransactionsPage() {
  const { transactions } = usePayment();

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const latestId = sorted[0]?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-semibold text-slate-900">Transactions</h1>
      <p className="text-sm text-slate-500">
        {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
      </p>

      {sorted.length === 0 ? (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-500">No transactions yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Completed payments will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Method</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Supplier</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Order ID</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((tx) => {
                  const isLatest = tx.id === latestId;
                  return (
                  <motion.tr
                    key={tx.id}
                    initial={isLatest ? { backgroundColor: '#eef2ff' } : false}
                    animate={isLatest ? { backgroundColor: '#ffffff' } : {}}
                    transition={{ duration: 2.5, ease: 'easeOut' }}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {tx.method === 'USD' ? (
                          <>
                            <div className="w-6 h-6 rounded-md bg-[#1434CB]/10 flex items-center justify-center">
                              <CreditCard size={12} className="text-[#1434CB]" />
                            </div>
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">
                              USD
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center">
                              <Coins size={12} className="text-purple-500" />
                            </div>
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">
                              USDC
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">${tx.amount.toLocaleString()}</span>
                        {isLatest && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                            Latest
                          </span>
                        )}
                      </div>
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
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                      {tx.orderId}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
