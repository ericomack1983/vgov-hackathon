'use client';

import { motion } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { useUI } from '@/context/UIContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { RFPStatus } from '@/lib/mock-data/types';

const statusVariant: Record<RFPStatus, 'default' | 'success' | 'warning' | 'error'> = {
  Draft: 'default',
  Open: 'warning',
  Evaluating: 'warning',
  Awarded: 'success',
  Paid: 'success',
};

export default function RfpPage() {
  const { rfps } = useProcurement();
  const { role } = useUI();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Procurement Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Create and track RFPs across all stages.</p>
        </div>
        {role === 'gov' && (
          <Link
            href="/rfp/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Create RFP
          </Link>
        )}
      </div>

      {rfps.length === 0 ? (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-slate-900">No procurement requests yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Create your first RFP to start the procurement process.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Budget</th>
                <th className="px-4 py-3 text-left">Deadline</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Bids</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rfps.map((rfp) => (
                <tr key={rfp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/rfp/${rfp.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {rfp.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{rfp.category}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    ${rfp.budgetCeiling.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {format(new Date(rfp.deadline), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={rfp.status} variant={statusVariant[rfp.status]} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{rfp.bids.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
