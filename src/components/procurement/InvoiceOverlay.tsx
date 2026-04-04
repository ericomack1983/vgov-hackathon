'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  FileText, Building2, Shield, CheckCircle2,
  CreditCard, Zap, Clock,
} from 'lucide-react';

type Phase = 'generating' | 'sending' | 'verifying' | 'done';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

/* ── Compact invoice document ──────────────────────────────────── */
function InvoiceDoc({ amount, from, invoiceNo }: { amount: number; from: string; invoiceNo: string }) {
  return (
    <div
      className="w-36 rounded-xl overflow-hidden select-none"
      style={{
        background: 'linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%)',
        border: '1px solid rgba(99,102,241,0.5)',
        boxShadow: '0 8px 32px rgba(20,52,203,0.4), 0 0 0 1px rgba(99,102,241,0.2)',
      }}
    >
      <div className="px-3 py-1.5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,#1434CB,#4f46e5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-1">
          <FileText size={9} className="text-white/80" />
          <span className="text-[8px] font-bold text-white/90 uppercase tracking-widest">Invoice</span>
        </div>
        <span className="text-[7px] font-mono text-white/50">#{invoiceNo}</span>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        <div>
          <p className="text-[7px] text-indigo-400/60 uppercase tracking-wider">Amount</p>
          <p className="text-sm font-black text-white leading-tight">{fmt(amount)}</p>
        </div>
        <div className="h-px bg-white/5" />
        <div>
          <p className="text-[7px] text-indigo-400/60 uppercase tracking-wider">From</p>
          <p className="text-[9px] text-white/80 font-medium truncate">{from}</p>
        </div>
        <div className="h-px bg-white/5" />
        <div className="flex items-center justify-between">
          <span className="text-[7px] text-indigo-400/50 font-mono">Visa B2B</span>
          <svg viewBox="0 0 72 24" className="h-2 w-auto opacity-35">
            <path fill="white" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Status chips ──────────────────────────────────────────────── */
const CHIPS = [
  { label: 'Invoice Generated',  phases: ['sending','verifying','done'] },
  { label: 'Transmitted',        phases: ['verifying','done'] },
  { label: 'Signature Verified', phases: ['done'] },
  { label: 'Amount Matched',     phases: ['done'] },
];

interface Props {
  rfpId: string;
  amount: number;
  supplierName: string;
  onClose: () => void;
}

export function InvoiceOverlay({ rfpId, amount, supplierName, onClose }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('generating');
  const invoiceNo = `INV-${rfpId.toUpperCase().replace('rfp-','')}-2026`;

  /* ── Auto-start sequence on mount ────────────────────────────── */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('sending'),   700);
    const t2 = setTimeout(() => setPhase('verifying'), 1900);
    const t3 = setTimeout(() => setPhase('done'),      2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleProceed = () => {
    onClose();
    router.push(`/payment/${rfpId}`);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ background: 'rgba(4,9,27,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{ scale: 0.92,    opacity: 0, y: 16 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg,#060e24 0%,#0b1735 50%,#07102e 100%)',
          border: '1px solid rgba(74,123,255,0.2)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
        }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(74,123,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(74,123,255,0.04) 1px,transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 50%,rgba(20,52,203,0.13) 0%,transparent 70%)' }}
        />

        <div className="relative z-10 p-6">

          {/* ── Header ── */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}>
              <FileText size={14} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest">Invoice Processing</p>
              <h3 className="text-base font-bold text-white leading-tight">Supplier Invoice Verification</h3>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={phase}
                  initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }} transition={{ duration: 0.15 }}
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: phase === 'done' ? '#6ee7b7' : 'rgba(148,180,255,0.6)' }}
                >
                  {phase === 'generating' && 'Generating'}
                  {phase === 'sending'    && 'Transmitting'}
                  {phase === 'verifying'  && 'Verifying'}
                  {phase === 'done'       && 'Verified ✓'}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Animation stage ── */}
          <div className="relative flex items-stretch justify-between px-4 mb-5" style={{ height: 148 }}>

            {/* connection line — sits at vertical midpoint of the icon row */}
            <div className="absolute inset-x-4 pointer-events-none" style={{ top: 28 }}>
              <div className="h-px w-full"
                style={{ background: 'linear-gradient(to right,rgba(99,102,241,0.15),rgba(20,52,203,0.25),rgba(99,102,241,0.15))' }} />
            </div>

            {/* animated dashes while sending */}
            {phase === 'sending' && (
              <motion.div
                className="absolute h-px pointer-events-none"
                style={{
                  top: 28, left: '22%', right: '22%',
                  background: 'repeating-linear-gradient(to right,rgba(99,102,241,0.6) 0,rgba(99,102,241,0.6) 6px,transparent 6px,transparent 14px)',
                  backgroundSize: '14px 1px',
                }}
                animate={{ backgroundPositionX: ['0px', '14px'] }}
                transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
              />
            )}

            {/* ── Supplier node ── */}
            <div className="flex flex-col items-center gap-2 w-24 shrink-0 pt-1">
              <motion.div
                className="w-14 h-14 rounded-xl flex items-center justify-center relative"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  border: `1px solid ${phase === 'generating' ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.3)'}`,
                  transition: 'border-color 0.3s',
                }}
                animate={phase === 'generating' ? {
                  boxShadow: ['0 0 0 0 rgba(99,102,241,0)','0 0 0 10px rgba(99,102,241,0.18)','0 0 0 0 rgba(99,102,241,0)'],
                } : { boxShadow: '0 0 0 0 transparent' }}
                transition={{ duration: 0.9, repeat: phase === 'generating' ? Infinity : 0 }}
              >
                <Building2 size={22} className="text-indigo-400" />
                {phase === 'generating' && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: '#4f46e5' }}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    <Zap size={8} className="text-white" />
                  </motion.div>
                )}
              </motion.div>
              <div className="text-center">
                <p className="text-[8px] font-bold text-indigo-300/55 uppercase tracking-widest">Supplier</p>
                <p className="text-[10px] text-white/70 font-medium leading-tight line-clamp-2">{supplierName}</p>
              </div>
            </div>

            {/* ── Invoice center ── */}
            <div className="flex-1 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {phase === 'generating' && (
                    <motion.div
                      key="ghost"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.15 } }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <InvoiceDoc amount={amount} from={supplierName} invoiceNo={invoiceNo} />
                    </motion.div>
                  )}

                  {phase === 'sending' && (
                    <motion.div
                      key="traveling"
                      initial={{ x: -72, opacity: 0, scale: 0.8, rotate: -6 }}
                      animate={{ x: 0,   opacity: 1, scale: 1,   rotate: 0 }}
                      exit={{ x: 0, opacity: 1, scale: 1, transition: { duration: 0 } }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <InvoiceDoc amount={amount} from={supplierName} invoiceNo={invoiceNo} />
                    </motion.div>
                  )}

                  {(phase === 'verifying' || phase === 'done') && (
                    <motion.div key="static" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
                      <InvoiceDoc amount={amount} from={supplierName} invoiceNo={invoiceNo} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Gov system node ── */}
            <div className="flex flex-col items-center gap-2 w-24 shrink-0 pt-1">
              <motion.div
                className="w-14 h-14 rounded-xl flex items-center justify-center relative"
                animate={{
                  background: phase === 'done' ? 'rgba(16,185,129,0.18)' : 'rgba(20,52,203,0.13)',
                  borderColor: phase === 'done'
                    ? 'rgba(16,185,129,0.55)'
                    : phase === 'verifying' ? 'rgba(74,123,255,0.7)' : 'rgba(20,52,203,0.35)',
                  boxShadow: phase === 'verifying'
                    ? '0 0 0 8px rgba(20,52,203,0.12)'
                    : phase === 'done' ? '0 0 20px rgba(16,185,129,0.3)' : '0 0 0 0 transparent',
                }}
                transition={{ duration: 0.4 }}
                style={{ border: '1px solid rgba(20,52,203,0.35)' }}
              >
                <AnimatePresence mode="wait">
                  {phase === 'done' ? (
                    <motion.div key="check"
                      initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 550, damping: 20 }}>
                      <CheckCircle2 size={24} className="text-emerald-400" />
                    </motion.div>
                  ) : (
                    <motion.div key="shield" exit={{ opacity: 0, scale: 0.8 }}>
                      <Shield size={22} className={phase === 'verifying' ? 'text-[#7fb3ff]' : 'text-[#1434CB]'} />
                    </motion.div>
                  )}
                </AnimatePresence>
                {phase === 'verifying' && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{ border: '2px solid rgba(74,123,255,0.4)', borderTopColor: '#6366f1' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </motion.div>
              <div className="text-center">
                <p className="text-[8px] font-bold text-blue-300/55 uppercase tracking-widest">Gov Portal</p>
                <p className="text-[10px] text-white/70 font-medium">Procurement</p>
              </div>
            </div>
          </div>

          {/* ── Status chips ── */}
          <div className="flex items-center gap-1.5 mb-5 flex-wrap">
            {CHIPS.map((chip, i) => {
              const done = chip.phases.includes(phase);
              return (
                <motion.div
                  key={i}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-semibold"
                  animate={{
                    background: done ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)',
                    borderColor: done ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)',
                    color: done ? '#6ee7b7' : 'rgba(148,180,255,0.35)',
                    opacity: done ? 1 : 0.6,
                  }}
                  transition={{ duration: 0.35 }}
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {done
                    ? <CheckCircle2 size={8} />
                    : <Clock size={8} />}
                  {chip.label}
                </motion.div>
              );
            })}
          </div>

          {/* ── Confirmation strip + CTA ── */}
          <AnimatePresence>
            {phase === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
                className="space-y-3"
              >
                {/* Confirmation strip */}
                <div
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{
                    background: 'rgba(6,78,59,0.3)',
                    border: '1px solid rgba(16,185,129,0.3)',
                  }}
                >
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-emerald-300">Invoice received and verified</p>
                    <p className="text-[9px] text-emerald-500/70 mt-0.5 truncate">
                      {invoiceNo} · {fmt(amount)} · Validated via Visa B2B rails
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Verified</span>
                  </div>
                </div>

                {/* Proceed button */}
                <motion.button
                  onClick={handleProceed}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full relative overflow-hidden rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg,#059669,#10b981)',
                    boxShadow: '0 4px 24px rgba(16,185,129,0.35)',
                  }}
                >
                  {/* shimmer */}
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)', transform: 'skewX(-20deg)' }}
                    animate={{ x: ['-120%', '220%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
                  />
                  <CreditCard size={15} className="relative z-10" />
                  <span className="relative z-10">Proceed to Payment</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
