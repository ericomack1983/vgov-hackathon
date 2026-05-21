'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  FileText, Building2, Shield, CheckCircle2,
  CreditCard, Zap, Clock,
} from 'lucide-react';
import { usePayment } from '@/context/PaymentContext';

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
          <svg viewBox="0 0 71 23" fill="none" className="h-2 w-auto opacity-35">
            <path fill="white" fillRule="evenodd" clipRule="evenodd" d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"/>
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
  rfpTitle?: string;
  onClose: () => void;
}

export function InvoiceOverlay({ rfpId, amount, supplierName, rfpTitle, onClose }: Props) {
  const router = useRouter();
  const { addNotification } = usePayment();
  const [phase, setPhase] = useState<Phase>('generating');
  const notifiedRef = useRef(false);
  const invoiceNo = `INV-${rfpId.toUpperCase().replace('rfp-','')}-2026`;

  /* ── Auto-start sequence on mount ────────────────────────────── */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('sending'),   700);
    const t2 = setTimeout(() => setPhase('verifying'), 1900);
    const t3 = setTimeout(() => setPhase('done'),      2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  /* ── Fire notification when verification completes ───────────── */
  useEffect(() => {
    if (phase === 'done' && !notifiedRef.current) {
      notifiedRef.current = true;
      addNotification({
        id: `invoice-${rfpId}-${Date.now()}`,
        type: 'procurement',
        title: `Invoice Verified — ${invoiceNo}`,
        message: `${supplierName} · ${fmt(amount)} · Validated via Visa B2B rails`,
        timestamp: new Date().toISOString(),
        read: false,
        emailType: 'invoice-verified',
        invoiceNo,
        amount,
        supplierName,
        rfpTitle,
        orderId: rfpId,
      });
    }
  }, [phase, rfpId, invoiceNo, amount, supplierName, rfpTitle, addNotification]);


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
          <div className="relative flex items-stretch justify-between px-4 mb-10" style={{ height: 148 }}>

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
