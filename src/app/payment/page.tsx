'use client';

import { motion } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PaymentPage() {
  const { rfps, suppliers } = useProcurement();

  const awardedRfps = rfps.filter((r) => r.status === 'Awarded');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Payments</h1>

      {awardedRfps.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <CreditCard size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-900">No pending payments</p>
          <p className="mt-2 text-sm text-slate-500">
            Award a supplier on an RFP to proceed with payment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {awardedRfps.map((rfp) => {
            const winner = suppliers.find((s) => s.id === rfp.selectedWinnerId);
            const bidAmount = (() => {
              if (rfp.evaluationResults && rfp.evaluationResults.length > 0) {
                const winnerResult = rfp.evaluationResults.find(
                  (sb) => sb.supplier.id === rfp.selectedWinnerId
                );
                return winnerResult ? winnerResult.bid.amount : 0;
              }
              const winnerBid = rfp.bids.find((b) => b.supplierId === rfp.selectedWinnerId);
              return winnerBid ? winnerBid.amount : 0;
            })();

            return (
              <div
                key={rfp.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{rfp.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Awarded to {winner?.name || 'Unknown'} &mdash; ${bidAmount.toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/payment/${rfp.id}`}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Proceed to Payment
                  <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
