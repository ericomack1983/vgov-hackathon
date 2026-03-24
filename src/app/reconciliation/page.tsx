'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayment } from '@/context/PaymentContext';
import {
  FileCheck, Search, Filter, DollarSign, Wallet, FileText,
  Upload, X, CheckCircle2, AlertCircle, ImageIcon, FileIcon,
  CloudUpload,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

// ── Slip states ───────────────────────────────────────────────────────────────
type SlipStatus = 'none' | 'uploaded';

interface UploadedSlip {
  name: string;
  size: number;
  type: string;
}

// ── Upload modal ──────────────────────────────────────────────────────────────
interface UploadModalProps {
  orderId: string;
  supplierName: string;
  onClose: () => void;
  onConfirm: (file: UploadedSlip) => void;
}

function UploadModal({ orderId, supplierName, onClose, onConfirm }: UploadModalProps) {
  const [dragging, setDragging] = useState(false);
  const [staged, setStaged] = useState<UploadedSlip | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) return;
    setStaged({ name: file.name, size: file.size, type: file.type });
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = () => {
    if (!staged) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setDone(true);
      setTimeout(() => onConfirm(staged), 900);
    }, 1600);
  };

  const fileIcon = staged?.type === 'application/pdf'
    ? <FileIcon size={20} className="text-red-500" />
    : <ImageIcon size={20} className="text-blue-500" />;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 16, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-900">Upload Payment Slip</p>
            <p className="text-xs text-slate-400 mt-0.5">{orderId} · {supplierName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="flex flex-col items-center gap-3 py-8"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Slip uploaded successfully</p>
                <p className="text-xs text-slate-400">Reconciliation entry closed out.</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Drop zone */}
                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
                    dragging
                      ? 'border-indigo-400 bg-indigo-50'
                      : staged
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={onInputChange}
                  />
                  {staged ? (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                        {fileIcon}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-800 truncate max-w-[220px]">{staged.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{(staged.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setStaged(null); }}
                        className="text-xs text-slate-400 hover:text-slate-600 underline"
                      >
                        Replace
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <CloudUpload size={20} className="text-slate-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-700">
                          {dragging ? 'Drop file here' : 'Click or drag to upload'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">PDF, PNG, JPG, WEBP</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Info note */}
                <div className="flex gap-2 items-start bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 mt-3">
                  <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    The supplier must share this slip to confirm receipt of funds. Uploading will close out this reconciliation entry.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!staged || uploading}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        Confirm Upload
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReconciliationPage() {
  const { transactions } = usePayment();
  const [slips, setSlips] = useState<Record<string, SlipStatus>>({});
  const [modalTx, setModalTx] = useState<{ id: string; orderId: string; supplierName: string } | null>(null);

  const metrics = useMemo(() => {
    let usdTotal = 0;
    let usdcTotal = 0;
    let pendingCount = 0;

    transactions.forEach(tx => {
      if (tx.status === 'Settled') {
        if (tx.method === 'USD') usdTotal += tx.amount;
        else usdcTotal += tx.amount;
      } else {
        pendingCount++;
      }
    });

    return { usdTotal, usdcTotal, totalCount: transactions.length, pendingCount };
  }, [transactions]);

  const slipsUploaded = Object.values(slips).filter(s => s === 'uploaded').length;

  const handleSlipConfirmed = (txId: string) => {
    setSlips(prev => ({ ...prev, [txId]: 'uploaded' }));
    setModalTx(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reconciliation</h1>
        <p className="text-sm text-slate-500">
          Verify and audit structured settlements across networks.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Transactions"
          value={`${metrics.totalCount}`}
          icon={<FileText size={18} />}
        />
        <StatCard
          label="Pending Clearance"
          value={`${metrics.pendingCount}`}
          icon={<FileCheck size={18} />}
        />
        <StatCard
          label="Settled Value (USD)"
          value={`$${metrics.usdTotal.toLocaleString()}`}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Settled Value (USDC)"
          value={`$${metrics.usdcTotal.toLocaleString()}`}
          icon={<Wallet size={18} />}
        />
      </div>

      {/* Slip upload progress banner */}
      {transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
            slipsUploaded === transactions.length
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          {slipsUploaded === transactions.length
            ? <CheckCircle2 size={16} className="shrink-0" />
            : <AlertCircle size={16} className="shrink-0" />
          }
          <span>
            {slipsUploaded === transactions.length
              ? 'All payment slips received — reconciliation complete.'
              : `${transactions.length - slipsUploaded} transaction${transactions.length - slipsUploaded !== 1 ? 's' : ''} awaiting payment slip from supplier.`
            }
          </span>
        </motion.div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Transaction Ledger</h2>
          <div className="flex gap-2 text-slate-400">
            <button className="p-1.5 hover:bg-slate-50 hover:text-slate-600 rounded transition-colors" title="Search">
              <Search size={16} />
            </button>
            <button className="p-1.5 hover:bg-slate-50 hover:text-slate-600 rounded transition-colors" title="Filter">
              <Filter size={16} />
            </button>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="text-sm text-slate-500 p-8 text-center bg-slate-50">
            No transactions correspond to this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 w-[160px]">Order ID</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 w-[120px]">Method</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 w-[140px]">Amount</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500">Supplier</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 text-center">Payment Slip</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...transactions]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((tx) => {
                    const slipStatus = slips[tx.id] ?? 'none';
                    const isReconciled = slipStatus === 'uploaded';
                    return (
                      <motion.tr
                        key={tx.id}
                        layout
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-[13px] font-mono text-slate-500">
                          {tx.orderId}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600 px-2.5 py-1 text-xs font-semibold">
                            {tx.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          ${tx.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                          {tx.supplierName}
                        </td>

                        {/* Payment slip column */}
                        <td className="px-6 py-4 text-center">
                          <AnimatePresence mode="wait">
                            {isReconciled ? (
                              <motion.span
                                key="done"
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700"
                              >
                                <CheckCircle2 size={11} />
                                Slip Received
                              </motion.span>
                            ) : (
                              <motion.button
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setModalTx({ id: tx.id, orderId: tx.orderId, supplierName: tx.supplierName })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100"
                              >
                                <Upload size={11} />
                                Upload Slip
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </td>

                        {/* Status column */}
                        <td className="px-6 py-4 text-right">
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={isReconciled ? 'reconciled' : 'incomplete'}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                isReconciled
                                  ? 'bg-teal-50 text-teal-700'
                                  : 'bg-red-50 text-red-500'
                              }`}
                            >
                              {isReconciled ? 'Reconciled' : 'Incomplete'}
                            </motion.span>
                          </AnimatePresence>
                        </td>
                      </motion.tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload modal */}
      <AnimatePresence>
        {modalTx && (
          <UploadModal
            key={modalTx.id}
            orderId={modalTx.orderId}
            supplierName={modalTx.supplierName}
            onClose={() => setModalTx(null)}
            onConfirm={() => handleSlipConfirmed(modalTx.id)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
