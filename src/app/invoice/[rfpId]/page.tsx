'use client';

import { use, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import Link from 'next/link';
import {
  ArrowLeft, FileText, CheckCircle2, Send, CreditCard,
  Zap, AlertTriangle, Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { InvoiceAnalysisPanel } from '@/components/ai/InvoiceAnalysisPanel';
import type { PipelineResult } from '@/ai/types';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

export default function InvoicePage({ params }: { params: Promise<{ rfpId: string }> }) {
  const { rfpId } = use(params);
  const { rfps, suppliers } = useProcurement();

  const [panelOpen, setPanelOpen] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);

  const rfp     = rfps.find(r => r.id === rfpId);
  const winnerId = rfp?.overrideWinnerId ?? rfp?.selectedWinnerId ?? rfp?.evaluationResults?.[0]?.supplier.id;
  const winner   = suppliers.find(s => s.id === winnerId);
  const amount   = rfp?.evaluationResults?.find(s => s.supplier.id === winnerId)?.bid.amount
                ?? rfp?.bids.find(b => b.supplierId === winnerId)?.amount
                ?? rfp?.budgetCeiling ?? 0;

  const invoiceNo = `INV-${rfpId?.toUpperCase().replace('rfp-', '')}-${new Date().getFullYear()}`;
  const approved  = result?.approval?.approved ?? null;

  if (!rfp || !winner) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Invoice data not found. Please award a supplier first.</p>
        <Link href="/rfp" className="mt-4 inline-flex text-sm text-[#1434CB]">← Back to RFPs</Link>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl"
      >
        {/* ── Back nav ── */}
        <Link href={`/rfp/${rfpId}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors">
          <ArrowLeft size={15} /> Back to {rfp.title}
        </Link>

        {/* ── Page header ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}>
            <FileText size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Invoice Step</h1>
            <p className="text-xs text-slate-400">Supplier generates &amp; submits invoice · AI validates · Payment unlocked</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50">
            <span className="text-[10px] font-bold text-[#1434CB] uppercase tracking-wider">Step 2 of 3</span>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="flex items-center gap-0 mb-8">
          {['RFP Awarded', 'Invoice', 'Payment'].map((step, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                i === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                i === 1 ? 'bg-[#1434CB] text-white shadow-sm' :
                'bg-slate-100 text-slate-400'
              }`}>
                {i === 0 && <CheckCircle2 size={11} />}
                {i === 1 && <FileText size={11} />}
                {i === 2 && <CreditCard size={11} />}
                {step}
              </div>
              {i < 2 && <div className="flex-1 h-px bg-slate-200 mx-2" />}
            </div>
          ))}
        </div>

        {/* ── Invoice meta card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">Supplier</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{winner.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">Invoice Amount</p>
              <p className="text-sm font-bold text-[#1434CB] mt-0.5">{fmt(amount)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">Invoice No.</p>
              <p className="text-sm font-mono text-slate-700 mt-0.5">{invoiceNo}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">RFP</p>
              <p className="text-sm text-slate-700 mt-0.5 truncate">{rfp.title}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">Category</p>
              <p className="text-sm text-slate-700 mt-0.5">{rfp.category}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">Date</p>
              <p className="text-sm text-slate-700 mt-0.5">{format(new Date(), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* ── AI Analysis preview card ── */}
        <div
          className="rounded-2xl overflow-hidden relative mb-5"
          style={{
            background: 'linear-gradient(160deg,#060e24 0%,#0b1735 50%,#07102e 100%)',
            border: '1px solid rgba(74,123,255,0.14)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(74,123,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(74,123,255,0.04) 1px,transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="relative z-10 px-6 py-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}>
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest">AI Analysis Engine</p>
                <p className="text-sm font-semibold text-white">Invoice Validation & Approval Pipeline</p>
              </div>
            </div>

            {/* Pipeline steps preview */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { icon: Zap, label: 'RAG Context', sub: 'Supplier history, limits' },
                { icon: Zap, label: 'Validation', sub: 'Risk & compliance' },
                { icon: Zap, label: '4D Scoring', sub: 'Confidence score' },
                { icon: Zap, label: 'Decision', sub: 'Auto or manual' },
              ].map(({ icon: Icon, label, sub }, i) => (
                <div key={i}
                  className="rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Icon size={12} className="text-indigo-400 mb-1" />
                  <p className="text-[10px] font-bold text-white/80">{label}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Result state */}
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] text-slate-500"
                >
                  Click <span className="text-indigo-400 font-semibold">Send Invoice</span> to launch the AI analysis pipeline
                </motion.p>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: approved ? 'rgba(6,78,59,0.3)' : 'rgba(78,49,4,0.3)',
                    border: `1px solid ${approved ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  }}
                >
                  {approved
                    ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    : <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-bold ${approved ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {approved ? 'Invoice approved — payment triggered' : 'Invoice flagged for manual review'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {invoiceNo} · {fmt(amount)} · Score: {result.validation?.score}/100
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    approved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {approved ? 'Approved' : 'Review'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-3">
          {!result ? (
            <motion.button
              onClick={() => setPanelOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}
            >
              <motion.div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', transform: 'skewX(-20deg)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
              />
              <Send size={15} className="relative z-10" />
              <span className="relative z-10">Send Invoice</span>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 280 }}
            >
              <Link
                href={`/payment/${rfpId}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 24px rgba(16,185,129,0.35)' }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', transform: 'skewX(-20deg)' }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
                />
                <CreditCard size={15} className="relative z-10" />
                <span className="relative z-10">Proceed to Payment</span>
              </Link>
            </motion.div>
          )}

          <Link href={`/rfp/${rfpId}`}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors px-2">
            Cancel
          </Link>
        </div>
      </motion.div>

      {/* ── AI Analysis Panel modal ── */}
      <AnimatePresence>
        {panelOpen && (
          <InvoiceAnalysisPanel
            rfpId={rfpId}
            supplierId={winner.id}
            supplierName={winner.name}
            amount={amount}
            description={rfp.title}
            invoiceNo={invoiceNo}
            onClose={() => setPanelOpen(false)}
            onComplete={(res) => {
              setResult(res);
              // Auto-close panel 1.5s after done state shows
              setTimeout(() => setPanelOpen(false), 8_000);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
