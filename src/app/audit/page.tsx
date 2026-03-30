'use client';

import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import { usePayment } from '@/context/PaymentContext';
import { useUI } from '@/context/UIContext';
import { buildAuditTrail } from '@/lib/audit-utils';
import { AuditEventRow } from '@/components/audit/AuditEventRow';
import { ProcurementCard } from '@/components/procurement/ProcurementCard';
import dynamic from 'next/dynamic';

const ExportPDFButton = dynamic(
  () => import('@/components/audit/ExportPDFButton').then((m) => m.ExportPDFButton),
  { ssr: false }
);

export default function AuditPage() {
  const { rfps } = useProcurement();
  const { transactions } = usePayment();
  const { role } = useUI();

  const events = useMemo(() => buildAuditTrail(rfps, transactions), [rfps, transactions]);
  const reportRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-[#1434CB]" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Audit Trail</h1>
            <p className="text-sm text-slate-500">Compliance log of all procurement events</p>
          </div>
        </div>
        <ExportPDFButton reportRef={reportRef} />
      </div>

      {/* Role info banner */}
      {role !== 'auditor' && role !== 'gov' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          Switch to Auditor or Gov Officer role to view the full audit trail.
        </div>
      )}

      {/* Event count */}
      <div className="flex items-center justify-between mt-6">
        <h2 className="text-sm font-semibold text-slate-700">Overview & Active RFPs</h2>
        <p className="text-sm text-slate-500">{events.length} events recorded</p>
      </div>

      {/* Active Procurements Overview */}
      {rfps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {rfps.slice(0, 2).map((rfp) => (
            <ProcurementCard key={rfp.id} rfp={rfp} />
          ))}
        </div>
      )}

      {/* Report content (captured for PDF) */}
      <div ref={reportRef}>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            VGov - Procurement - Audit Report
          </h2>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-slate-500">No audit events recorded</p>
              <p className="text-xs text-slate-400 mt-1">
                Events will appear as procurement activities occur.
              </p>
            </div>
          ) : (
            <div>
              {events.map((event) => (
                <AuditEventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Transaction Summary */}
        {transactions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Transaction Summary</h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Order ID</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Method</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-600">Amount</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Supplier</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-2 font-mono text-xs text-slate-600">{tx.orderId}</td>
                      <td className="px-4 py-2 text-slate-700">{tx.method}</td>
                      <td className="px-4 py-2 text-right text-slate-900 font-medium">
                        ${tx.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-slate-700">{tx.supplierName}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            tx.status === 'Settled'
                              ? 'bg-emerald-100 text-emerald-700'
                              : tx.status === 'Processing'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
