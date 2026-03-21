'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { useUI } from '@/context/UIContext';
import { BidFormModal } from '@/components/procurement/BidFormModal';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function BidsPage() {
  const { rfps } = useProcurement();
  const { role } = useUI();
  const [selectedRfp, setSelectedRfp] = useState<{ id: string; title: string } | null>(null);

  const openRfps = rfps.filter((r) => r.status === 'Open');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <h1 className="text-xl font-semibold text-slate-900">Submit Bids</h1>
      <p className="mt-1 text-sm text-slate-500">
        Browse open procurement requests and submit your bids.
      </p>

      {openRfps.length === 0 ? (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-slate-900">No open RFPs available</p>
          <p className="mt-2 text-sm text-slate-500">
            There are no open procurement requests to bid on right now.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {openRfps.map((rfp) => (
            <div
              key={rfp.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={16} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-900">{rfp.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{rfp.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <StatusBadge status={rfp.category} />
                    <span>Budget: ${rfp.budgetCeiling.toLocaleString()}</span>
                    <span>Deadline: {format(new Date(rfp.deadline), 'MMM d, yyyy')}</span>
                    <span>{rfp.bids.length} bid{rfp.bids.length !== 1 ? 's' : ''} submitted</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRfp({ id: rfp.id, title: rfp.title })}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors ml-4 shrink-0"
                >
                  Submit Bid
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BidFormModal
        isOpen={!!selectedRfp}
        rfpId={selectedRfp?.id || ''}
        rfpTitle={selectedRfp?.title || ''}
        onClose={() => setSelectedRfp(null)}
      />
    </motion.div>
  );
}
