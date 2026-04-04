'use client';

import { use, useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import Link from 'next/link';
import {
  ArrowLeft, FileText, CheckCircle2, Send, Building2,
  Shield, CreditCard, Zap, Clock, Hash,
} from 'lucide-react';
import { format } from 'date-fns';

type Phase = 'idle' | 'generating' | 'sending' | 'verifying' | 'done';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

/* ── Invoice document card ─────────────────────────────────────── */
function InvoiceDoc({ amount, from, to, invoiceNo }: {
  amount: number; from: string; to: string; invoiceNo: string;
}) {
  return (
    <div
      className="w-40 rounded-xl overflow-hidden select-none"
      style={{
        background: 'linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%)',
        border: '1px solid rgba(99,102,241,0.4)',
        boxShadow: '0 8px 32px rgba(20,52,203,0.35), 0 0 0 1px rgba(99,102,241,0.15)',
      }}
    >
      {/* header */}
      <div className="px-3 py-2 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,#1434CB,#4f46e5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-1.5">
          <FileText size={10} className="text-white/80" />
          <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest">Invoice</span>
        </div>
        <span className="text-[8px] font-mono text-white/50">#{invoiceNo}</span>
      </div>
      {/* body */}
      <div className="px-3 py-2.5 space-y-2">
        <div>
          <p className="text-[7px] text-indigo-400/60 uppercase tracking-wider font-semibold">Amount</p>
          <p className="text-sm font-black text-white leading-tight">{fmt(amount)}</p>
        </div>
        <div className="h-px bg-white/5" />
        <div className="space-y-1">
          <div>
            <p className="text-[7px] text-indigo-400/60 uppercase tracking-wider">From</p>
            <p className="text-[9px] text-white/80 font-medium leading-tight truncate">{from}</p>
          </div>
          <div>
            <p className="text-[7px] text-indigo-400/60 uppercase tracking-wider">To</p>
            <p className="text-[9px] text-white/80 font-medium leading-tight truncate">{to}</p>
          </div>
        </div>
        <div className="h-px bg-white/5" />
        <div className="flex items-center justify-between">
          <span className="text-[7px] text-indigo-400/60 font-mono">Visa B2B</span>
          <svg viewBox="0 0 72 24" className="h-2.5 w-auto opacity-40">
            <path fill="white" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function InvoicePage({ params }: { params: Promise<{ rfpId: string }> }) {
  const { rfpId } = use(params);
  const { rfps, suppliers } = useProcurement();
  const [phase, setPhase] = useState<Phase>('idle');

  const rfp = rfps.find(r => r.id === rfpId);
  const winnerId = rfp?.overrideWinnerId ?? rfp?.selectedWinnerId ?? rfp?.evaluationResults?.[0]?.supplier.id;
  const winner   = suppliers.find(s => s.id === winnerId);
  const amount   = rfp?.evaluationResults?.find(s => s.supplier.id === winnerId)?.bid.amount
                ?? rfp?.bids.find(b => b.supplierId === winnerId)?.amount
                ?? rfp?.budgetCeiling ?? 0;

  const invoiceNo = `INV-${rfpId?.toUpperCase().replace('rfp-','')}-${new Date().getFullYear()}`;

  /* ── Animation sequence ───────────────────────────────────────── */
  function handleSend() {
    setPhase('generating');
    setTimeout(() => setPhase('sending'),   600);
    setTimeout(() => setPhase('verifying'), 1800);
    setTimeout(() => setPhase('done'),      2600);
  }

  if (!rfp || !winner) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Invoice data not found. Please award a supplier first.</p>
        <Link href="/rfp" className="mt-4 inline-flex text-sm text-[#1434CB]">← Back to RFPs</Link>
      </div>
    );
  }

  return (
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
          <p className="text-xs text-slate-400">Supplier generates &amp; submits invoice · Gov system verifies · Payment unlocked</p>
        </div>
        {/* Step badge */}
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

      {/* ── Animation canvas ── */}
      <div
        className="rounded-2xl overflow-hidden relative mb-5"
        style={{
          minHeight: 280,
          background: 'linear-gradient(160deg,#060e24 0%,#0b1735 50%,#07102e 100%)',
          border: '1px solid rgba(74,123,255,0.14)',
        }}
      >
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(74,123,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(74,123,255,0.05) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(20,52,203,0.12) 0%,transparent 70%)' }}
        />

        <div className="relative z-10 flex items-center justify-between px-10 py-10">

          {/* ── Supplier node ── */}
          <div className="flex flex-col items-center gap-3 w-32">
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.35)',
              }}
              animate={phase === 'generating' ? {
                boxShadow: ['0 0 0 0 rgba(99,102,241,0)', '0 0 0 12px rgba(99,102,241,0.2)', '0 0 0 0 rgba(99,102,241,0)'],
              } : {}}
              transition={{ duration: 0.8, repeat: phase === 'generating' ? Infinity : 0 }}
            >
              <Building2 size={24} className="text-indigo-400" />
              {phase === 'generating' && (
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Zap size={8} className="text-white" />
                </motion.div>
              )}
            </motion.div>
            <div className="text-center">
              <p className="text-[9px] font-bold text-indigo-300/70 uppercase tracking-widest">Supplier</p>
              <p className="text-[11px] text-white/80 font-medium leading-tight text-center">{winner.name}</p>
            </div>
          </div>

          {/* ── Animated invoice travels center ── */}
          <div className="flex-1 flex items-center justify-center relative h-20">

            {/* Connection line */}
            <div className="absolute inset-x-0 top-1/2 h-px"
              style={{ background: 'linear-gradient(to right,rgba(99,102,241,0.2),rgba(20,52,203,0.2))' }}
            />

            {/* Traveling invoice */}
            <AnimatePresence>
              {(phase === 'sending' || phase === 'verifying') && (
                <motion.div
                  initial={{ x: -80, opacity: 0, scale: 0.7, rotate: -8 }}
                  animate={phase === 'verifying'
                    ? { x: 80, opacity: 0, scale: 0.6, rotate: 4, transition: { duration: 0.5, ease: 'easeIn' } }
                    : { x: 0,  opacity: 1, scale: 1,   rotate: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] } }
                  }
                  exit={{ opacity: 0 }}
                  style={{ position: 'absolute' }}
                >
                  <InvoiceDoc amount={amount} from={winner.name} to="Gov Procurement" invoiceNo={invoiceNo} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Idle + generating: ghost invoice */}
            <AnimatePresence>
              {(phase === 'idle' || phase === 'generating') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: phase === 'generating' ? [0.3, 0.6, 0.3] : 0.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, repeat: phase === 'generating' ? Infinity : 0 }}
                >
                  <InvoiceDoc amount={amount} from={winner.name} to="Gov Procurement" invoiceNo={invoiceNo} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phase label */}
            <AnimatePresence mode="wait">
              <motion.p
                key={phase}
                className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                style={{ color: 'rgba(148,180,255,0.6)' }}
              >
                {phase === 'idle'       && 'Awaiting invoice submission'}
                {phase === 'generating' && '⚡ Generating invoice...'}
                {phase === 'sending'    && '→ Transmitting via Visa B2B rails...'}
                {phase === 'verifying'  && '🔍 Verifying invoice...'}
                {phase === 'done'       && '✅ Invoice verified'}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* ── Gov system node ── */}
          <div className="flex flex-col items-center gap-3 w-32">
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
              style={{
                background: phase === 'done'
                  ? 'rgba(16,185,129,0.18)'
                  : 'rgba(20,52,203,0.15)',
                border: phase === 'done'
                  ? '1px solid rgba(16,185,129,0.5)'
                  : '1px solid rgba(20,52,203,0.4)',
                transition: 'background 0.4s, border-color 0.4s',
              }}
              animate={phase === 'verifying' ? {
                boxShadow: ['0 0 0 0 rgba(20,52,203,0)', '0 0 0 16px rgba(20,52,203,0.25)', '0 0 0 0 rgba(20,52,203,0)'],
              } : phase === 'done' ? {
                boxShadow: '0 0 24px rgba(16,185,129,0.35)',
              } : {}}
              transition={{ duration: 0.7, repeat: phase === 'verifying' ? Infinity : 0 }}
            >
              <AnimatePresence mode="wait">
                {phase === 'done' ? (
                  <motion.div key="check"
                    initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
                    <CheckCircle2 size={26} className="text-emerald-400" />
                  </motion.div>
                ) : (
                  <motion.div key="shield" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Shield size={24} className={phase === 'verifying' ? 'text-[#7fb3ff]' : 'text-[#1434CB]'} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Verification spinner ring */}
              {phase === 'verifying' && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{ border: '2px solid rgba(74,123,255,0.5)', borderTopColor: '#1434CB' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </motion.div>
            <div className="text-center">
              <p className="text-[9px] font-bold text-blue-300/70 uppercase tracking-widest">Gov System</p>
              <p className="text-[11px] text-white/80 font-medium">Procurement Portal</p>
            </div>
          </div>
        </div>

        {/* ── Done: confirmation strip ── */}
        <AnimatePresence>
          {phase === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="mx-5 mb-5 rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(6,78,59,0.35)',
                border: '1px solid rgba(16,185,129,0.35)',
              }}
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 size={14} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-emerald-300">Invoice received and verified</p>
                <p className="text-[10px] text-emerald-500/70 mt-0.5">
                  {invoiceNo} · {fmt(amount)} · Validated via Visa B2B network
                </p>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Verified</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Status chips row ── */}
        <div className="px-6 pb-5 flex items-center gap-2">
          {[
            { label: 'Invoice Generated',    done: ['generating','sending','verifying','done'].includes(phase) },
            { label: 'Transmitted',          done: ['verifying','done'].includes(phase) },
            { label: 'Signature Verified',   done: phase === 'done' },
            { label: 'Amount Matched',       done: phase === 'done' },
          ].map((chip, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold"
              style={{
                background: chip.done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                border: chip.done ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: chip.done ? '#6ee7b7' : 'rgba(148,180,255,0.4)',
              }}
              animate={{ opacity: chip.done ? 1 : 0.5 }}
            >
              {chip.done ? <CheckCircle2 size={9} /> : <Clock size={9} />}
              {chip.label}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex items-center gap-3">
        {phase === 'idle' && (
          <motion.button
            onClick={handleSend}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}
          >
            {/* shimmer */}
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', transform: 'skewX(-20deg)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
            />
            <Send size={15} className="relative z-10" />
            <span className="relative z-10">Send Invoice</span>
          </motion.button>
        )}

        {(phase === 'generating' || phase === 'sending' || phase === 'verifying') && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white/60 bg-slate-800 border border-slate-700"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Zap size={15} className="text-indigo-400" />
            </motion.div>
            Processing...
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 280 }}
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
  );
}
