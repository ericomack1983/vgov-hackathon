'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { useUI } from '@/context/UIContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CreateRFPForm } from '@/components/procurement/CreateRFPForm';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
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
  const [showModal, setShowModal] = useState(false);

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
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#1434CB] hover:bg-[#0F27B0] text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Create RFP
          </button>
        )}
      </div>

      {/* Create RFP Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900">Create New RFP</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-5">
                  <CreateRFPForm onClose={() => setShowModal(false)} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {rfps.length === 0 ? (
        <div
          className="mt-8 bg-white rounded-2xl p-10 text-center"
          style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}
        >
          <p className="text-sm font-semibold" style={{ color: '#000000' }}>No procurement requests yet</p>
          <p className="mt-1 text-xs" style={{ color: '#4a4a4a' }}>
            Create your first RFP to start the procurement process.
          </p>
        </div>
      ) : (
        <div
          className="bg-white rounded-2xl overflow-hidden mt-6"
          style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F5F5F5', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Title','Category','Budget','Deadline','Status','Bids'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: '#4a4a4a' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rfps.map((rfp, i) => (
                <tr
                  key={rfp.id}
                  className="transition-colors"
                  style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : undefined }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#F9FAFB'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                >
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/rfp/${rfp.id}`}
                      className="text-sm font-medium transition-colors"
                      style={{ color: '#1434CB' }}
                    >
                      {rfp.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-sm" style={{ color: '#4a4a4a' }}>{rfp.category}</td>
                  <td className="px-4 py-3.5 text-sm font-medium tabular-nums" style={{ color: '#000000' }}>
                    ${rfp.budgetCeiling.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-sm" style={{ color: '#4a4a4a' }}>
                    {format(new Date(rfp.deadline), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={rfp.status} variant={statusVariant[rfp.status]} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#F5F5F5', color: '#4a4a4a' }}
                    >
                      {rfp.bids.length}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
