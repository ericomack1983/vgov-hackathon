'use client';

import { use, useState } from 'react';
import { motion } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { useUI } from '@/context/UIContext';
import { RFPStatusTimeline } from '@/components/procurement/RFPStatusTimeline';
import { StatusBadge } from '@/components/shared/StatusBadge';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { RFPStatus } from '@/lib/mock-data/types';

const statusVariant: Record<RFPStatus, 'default' | 'success' | 'warning' | 'error'> = {
  Draft: 'default',
  Open: 'warning',
  Evaluating: 'warning',
  Awarded: 'success',
  Paid: 'success',
};

export default function RfpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { rfps, updateRFP } = useProcurement();
  const { role } = useUI();

  const rfp = rfps.find((r) => r.id === id);

  if (!rfp) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Link
          href="/rfp"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to RFPs
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-slate-900">RFP not found</p>
          <p className="mt-2 text-sm text-slate-500">
            The procurement request you are looking for does not exist.
          </p>
        </div>
      </motion.div>
    );
  }

  function handlePublish() {
    updateRFP(rfp!.id, { status: 'Open' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Link
        href="/rfp"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to RFPs
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-xl font-semibold text-slate-900">{rfp.title}</h1>
        <StatusBadge status={rfp.status} variant={statusVariant[rfp.status]} />
      </div>

      <div className="mb-6">
        <RFPStatusTimeline currentStatus={rfp.status} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Description</h2>
        <p className="text-sm text-slate-700">{rfp.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-xs text-slate-500">Category</p>
            <p className="text-sm font-medium text-slate-900">{rfp.category}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Budget</p>
            <p className="text-sm font-medium text-slate-900">${rfp.budgetCeiling.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Deadline</p>
            <p className="text-sm font-medium text-slate-900">
              {format(new Date(rfp.deadline), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Created</p>
            <p className="text-sm font-medium text-slate-900">
              {format(new Date(rfp.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {role === 'gov' && rfp.status === 'Draft' && (
        <div className="mt-4">
          <button
            onClick={handlePublish}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Publish RFP
          </button>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Submitted Bids</h2>
          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
            {rfp.bids.length}
          </span>
        </div>

        {rfp.bids.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-500">No bids submitted yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Delivery</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rfp.bids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {bid.supplierName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      ${bid.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{bid.deliveryDays} days</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                      {bid.notes}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {format(new Date(bid.submittedAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
