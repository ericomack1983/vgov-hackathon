'use client';

import { use, useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { usePayment } from '@/context/PaymentContext';
import { useSettlement, SettlementCompleteData } from '@/hooks/useSettlement';
import { SettlementAnimation } from '@/components/payment/SettlementAnimation';
import {
  ArrowLeft, ArrowRight, CheckCircle, CreditCard,
  DollarSign, Coins, Bell, ShieldCheck, CheckCircle2, XCircle, AlertCircle,
  Clock, Mail,
} from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import type { PaymentMethod, PaymentCard } from '@/lib/mock-data/types';

// ─── types ────────────────────────────────────────────────────────────────────
type Step = 'card-select' | 'card-confirm' | 'fund-select' | 'auth' | 'processing' | 'done';
type FundMethod = 'USD' | 'USDC';

interface SelectableCard extends Pick<PaymentCard, 'id' | 'brand' | 'last4' | 'type' | 'holderName' | 'status' | 'expiry'> {
  supplierName: string;
}

// ─── constants ────────────────────────────────────────────────────────────────
const STEPS: Step[] = ['card-select', 'card-confirm', 'fund-select', 'auth', 'processing', 'done'];

const BRAND_BG: Record<PaymentCard['brand'], string> = {
  Visa:       'from-[#1434CB] to-[#0a1f8f]',
  Mastercard: 'from-[#EB001B] to-[#a80013]',
  Amex:       'from-[#007BC1] to-[#005a8e]',
};
const BRAND_DOT: Record<PaymentCard['brand'], string> = {
  Visa: 'bg-[#1434CB]', Mastercard: 'bg-[#EB001B]', Amex: 'bg-[#007BC1]',
};
const BRAND_LABEL: Record<PaymentCard['brand'], string> = {
  Visa: 'VISA', Mastercard: 'MC', Amex: 'AMEX',
};

// ─── step indicator ───────────────────────────────────────────────────────────
function StepDots({ current }: { current: Step }) {
  const visible: Step[] = ['card-select', 'card-confirm', 'fund-select', 'auth', 'processing'];
  const idx = visible.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {visible.map((s, i) => (
        <div key={s} className={`rounded-full transition-all duration-300 ${
          i < idx  ? 'w-2 h-2 bg-indigo-400' :
          i === idx ? 'w-6 h-2 bg-indigo-600' :
                     'w-2 h-2 bg-slate-200'
        }`} />
      ))}
    </div>
  );
}

// ─── card visual ──────────────────────────────────────────────────────────────
function CardVisual({ card }: { card: SelectableCard }) {
  return (
    <div className={`relative w-full rounded-2xl bg-gradient-to-br ${BRAND_BG[card.brand]} p-6 overflow-hidden shadow-xl`}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-4 w-40 h-40 rounded-full bg-white/5" />
      <div className="flex items-start justify-between relative z-10 mb-8">
        <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 grid grid-cols-2 gap-px p-1 shadow-inner">
          {[...Array(4)].map((_, i) => <div key={i} className="rounded-sm bg-yellow-600/40" />)}
        </div>
        <span className="text-white font-black tracking-widest text-sm">{BRAND_LABEL[card.brand]}</span>
      </div>
      <p className="font-mono text-white text-xl tracking-[0.22em] relative z-10 mb-6">
        •••• •••• •••• {card.last4}
      </p>
      <div className="flex justify-between relative z-10">
        <div>
          <p className="text-[9px] text-white/50 uppercase tracking-widest">Card Holder</p>
          <p className="text-white text-sm font-semibold">{card.holderName}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-white/50 uppercase tracking-widest">Type</p>
          <p className="text-white text-sm font-semibold capitalize">{card.type}</p>
        </div>
      </div>
    </div>
  );
}

// ─── push notification simulation ─────────────────────────────────────────────
function PushAuthStep({ amount, supplier, onApprove, onDeny }: {
  amount: number; supplier: string; onApprove: () => void; onDeny: () => void;
}) {
  const [notifVisible, setNotifVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setNotifVisible(true), 600); return () => clearTimeout(t); }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-base font-semibold text-slate-900">Authenticate Payment</p>
        <p className="text-sm text-slate-500 mt-1">A push notification has been sent to your registered device.</p>
      </div>

      {/* Phone mockup */}
      <div className="relative w-56">
        <div className="bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl border-4 border-slate-800">
          <div className="bg-slate-100 rounded-[2rem] overflow-hidden h-96 relative flex flex-col">
            {/* Status bar */}
            <div className="bg-slate-900 px-5 py-2 flex items-center justify-between">
              <span className="text-white text-[10px] font-medium">9:41</span>
              <div className="w-16 h-4 bg-slate-700 rounded-full" />
              <div className="flex gap-1">
                <div className="w-3 h-2 rounded-sm bg-white/60" />
                <div className="w-1 h-2 rounded-sm bg-white/40" />
              </div>
            </div>
            {/* Screen */}
            <div className="flex-1 bg-gradient-to-b from-slate-800 to-slate-900 flex items-start justify-center pt-6 px-3">
              <AnimatePresence>
                {notifVisible && (
                  <motion.div
                    initial={{ opacity: 0, y: -30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="w-full bg-white/95 backdrop-blur rounded-2xl p-3 shadow-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
                        <Bell size={12} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-900">VGov · Payment</p>
                        <p className="text-[9px] text-slate-400">now</p>
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-800">Approve Payment?</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      ${amount.toLocaleString()} → {supplier}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={onDeny}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 border border-red-100"
                      >
                        Deny
                      </button>
                      <button
                        onClick={onApprove}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600 text-white"
                      >
                        Approve
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-800 rounded-full z-10" />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <ShieldCheck size={13} className="text-indigo-400" />
        Secured by VGov Authentication
      </div>
    </div>
  );
}

// ─── done step ────────────────────────────────────────────────────────────────
function DoneStep({ bidAmount, fundMethod, selectedCard, winner, orderId, isCnp }: {
  bidAmount: number;
  fundMethod: string | null;
  selectedCard: { last4: string } | null;
  winner: { name: string } | undefined;
  orderId: string;
  isCnp?: boolean;
}) {
  const [notifVisible, setNotifVisible] = useState(false);
  useEffect(() => {
    if (isCnp) return;
    const t = setTimeout(() => setNotifVisible(true), 3000);
    return () => clearTimeout(t);
  }, [isCnp]);

  return (
    <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="flex flex-col items-center gap-6 py-8">

      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${isCnp ? 'bg-emerald-500 shadow-emerald-200' : 'bg-amber-400 shadow-amber-200'}`}
      >
        {isCnp
          ? <CheckCircle2 size={40} className="text-white" strokeWidth={2} />
          : <Clock size={40} className="text-white" strokeWidth={2} />
        }
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-center">
        <p className="text-xl font-bold text-slate-900">{isCnp ? 'Payment Executed' : 'Payment Pending'}</p>
        <p className="text-sm text-slate-500 mt-1">
          ${bidAmount.toLocaleString()} {isCnp ? 'processed instantly via STP' : `dispatched via ${fundMethod} · Card •••• ${selectedCard?.last4}`}
        </p>
      </motion.div>

      {/* Receipt summary */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 w-full max-w-xs space-y-2.5 text-sm"
      >
        {[
          { label: 'Recipient', value: winner?.name ?? '' },
          { label: 'Amount',    value: `$${bidAmount.toLocaleString()}` },
          { label: 'Method',    value: isCnp ? 'USD · STP' : (fundMethod ?? '') },
          ...(!isCnp ? [{ label: 'Card', value: `•••• ${selectedCard?.last4}` }] : []),
          { label: 'Order ID',  value: orderId },
          ...(isCnp ? [{ label: 'Status', value: '✓ Executed' }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span className="text-slate-400">{label}</span>
            <span className={`font-semibold font-mono ${label === 'Status' ? 'text-emerald-600' : 'text-slate-800'}`}>{value}</span>
          </div>
        ))}
      </motion.div>

      {/* Push notification — Card Present only */}
      <AnimatePresence>
        {notifVisible && !isCnp && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="w-full max-w-xs bg-slate-900 rounded-2xl p-4 flex items-start gap-3 shadow-2xl border border-slate-700"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <Bell size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white">VGov · Payments</p>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">Payment slip received. Check your <span className="text-indigo-400 font-semibold">Inbox</span> for the supplier payment receipt.</p>
            </div>
            <motion.div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 mt-1" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className={`w-full max-w-xs flex gap-2.5 items-start rounded-xl px-4 py-3 ${isCnp ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}
      >
        {isCnp
          ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
          : <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
        }
        <p className={`text-xs leading-snug ${isCnp ? 'text-emerald-800' : 'text-amber-800'}`}>
          {isCnp
            ? <><span className="font-semibold">Funds transferred.</span> This payment was processed automatically via Visa STP. No further action required.</>
            : <><span className="font-semibold">Next step:</span> The supplier must share the payment receipt. Upload it in <Link href="/reconciliation" className="underline font-semibold hover:text-amber-900">Reconciliation</Link> to close out this transaction.</>
          }
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} className="flex gap-3">
        <Link href="/dashboard" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
          Dashboard
        </Link>
        {!isCnp && (
          <Link href="/notifications" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
            <Mail size={14} />
            Check Inbox
          </Link>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function PaymentCheckoutPage({ params }: { params: Promise<{ rfpId: string }> }) {
  const { rfpId } = use(params);
  const { rfps, suppliers, updateRFP } = useProcurement();
  const { transactions, addTransaction, addNotification } = usePayment();

  const rfp    = rfps.find((r) => r.id === rfpId);
  const winner = rfp ? suppliers.find((s) => s.id === rfp.selectedWinnerId) : undefined;

  const bidAmount = useMemo(() => {
    if (!rfp) return 0;
    if (rfp.evaluationResults?.length) {
      const w = rfp.evaluationResults.find((sb) => sb.supplier.id === rfp.selectedWinnerId);
      return w?.bid.amount ?? 0;
    }
    return rfp.bids.find((b) => b.supplierId === rfp.selectedWinnerId)?.amount ?? 0;
  }, [rfp]);

  const balances = useMemo(() => {
    const settled = transactions.filter((t) => t.status === 'Settled');
    return {
      usd:  10_000_000 - settled.filter((t) => t.method === 'USD').reduce((s, t) => s + t.amount, 0),
      usdc: 500_000    - settled.filter((t) => t.method === 'USDC').reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions]);

  const allCards = useMemo<SelectableCard[]>(() =>
    suppliers.flatMap((s) =>
      (s.cards ?? []).filter((c) => c.status === 'active' && c.brand === 'Visa').map((c) => ({ ...c, supplierName: s.name }))
    ), [suppliers]);

  const [step, setStep]               = useState<Step>('card-select');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [fundMethod, setFundMethod]   = useState<FundMethod | null>(null);
  const [usdSubMethod, setUsdSubMethod] = useState<'cnp' | 'card-present' | null>(null);
  const [orderId]                     = useState(() => 'ORD-' + uuidv4().slice(0, 8).toUpperCase());

  const selectedCard = allCards.find((c) => c.id === selectedCardId) ?? null;
  const paymentMethod: PaymentMethod  = fundMethod ?? 'USD';

  const handleComplete = useCallback((data: SettlementCompleteData) => {
    if (!rfp || !winner) return;
    const txId = 'tx-' + uuidv4().slice(0, 8);
    addTransaction({
      id: txId, rfpId: rfp.id, supplierId: winner.id, supplierName: winner.name,
      amount: bidAmount, method: paymentMethod, status: 'Settled' as const,
      txHash: data.txHash, orderId,
      createdAt: data.startedAt || new Date().toISOString(),
      settledAt: new Date().toISOString(),
    });
    addNotification({
      id: 'notif-' + uuidv4().slice(0, 8), type: 'payment',
      title: usdSubMethod === 'cnp' ? 'Payment Executed' : `${paymentMethod} Payment Settled`,
      message: `$${bidAmount.toLocaleString()} to ${winner.name}`,
      timestamp: new Date().toISOString(), read: false,
      transactionId: txId, txHash: data.txHash,
      cardLast4: selectedCard?.last4,
      cardExpiry: selectedCard ? (() => { const now = new Date(); return `${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getFullYear()+3).slice(-2)}`; })() : undefined,
      cardHolder: selectedCard?.holderName,
      cardBrand: selectedCard?.brand,
      orderId,
      amount: bidAmount,
      supplierName: winner.name,
      fundMethod: paymentMethod,
      paymentStatus: 'settled',
      paymentMode: paymentMethod === 'USD' ? (usdSubMethod ?? undefined) : undefined,
    });
    updateRFP(rfp.id, { status: 'Paid' });
    setStep('done');
  }, [rfp, winner, paymentMethod, bidAmount, orderId, addTransaction, addNotification, updateRFP]);

  const { state, start } = useSettlement(handleComplete);

  const handleStart = useCallback((method: 'USD' | 'USDC' | 'Card', oid: string) => {
    const isCnp = method === 'USD' && usdSubMethod === 'cnp';
    if (winner && !isCnp) {
      addNotification({
        id: 'notif-pending-' + uuidv4().slice(0, 8),
        type: 'payment',
        title: `Payment Authorization Sent`,
        message: `Card details sent to ${winner.name} — awaiting processing`,
        timestamp: new Date().toISOString(),
        read: false,
        cardLast4: selectedCard?.last4,
        cardExpiry: selectedCard?.expiry,
        cardHolder: selectedCard?.holderName,
        cardBrand: selectedCard?.brand,
        orderId: oid,
        amount: bidAmount,
        supplierName: winner.name,
        fundMethod: method,
        paymentStatus: 'pending',
        paymentMode: 'card-present',
      });
    }
    const mode = method === 'USD' ? (usdSubMethod ?? undefined) : undefined;
    start(method, oid, mode);
  }, [winner, selectedCard, bidAmount, usdSubMethod, addNotification, start]);

  const slideProps = {
    initial:    { opacity: 0, x: 24 },
    animate:    { opacity: 1, x: 0  },
    exit:       { opacity: 0, x: -24 },
    transition: { duration: 0.25, ease: 'easeOut' },
  };

  if (!rfp || (rfp.status !== 'Awarded' && rfp.status !== 'Paid')) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Link href="/rfp" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft size={16} /> Back to RFPs
        </Link>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm font-semibold text-slate-900">Payment not available</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Link href={`/rfp/${rfpId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
        <ArrowLeft size={16} /> Back to RFP
      </Link>
      <h1 className="text-xl font-semibold text-slate-900">Payment Checkout</h1>
      <p className="text-sm text-slate-500 mb-6">{rfp.title} · <span className="font-semibold text-slate-700">${bidAmount.toLocaleString()}</span> → {winner?.name}</p>

      {step !== 'done' && <StepDots current={step} />}

      <AnimatePresence mode="wait">

        {/* ── Step 1: Card Selection ── */}
        {step === 'card-select' && (
          <motion.div key="card-select" {...slideProps} className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">Select a payment card</p>
            {allCards.length === 0 ? (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
                <CreditCard size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No registered cards available.</p>
                <Link href="/cards" className="text-xs text-indigo-600 font-medium mt-2 inline-block">Issue a card →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {allCards.map((card) => {
                  const sel = card.id === selectedCardId;
                  return (
                    <motion.button
                      key={card.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all ${
                        sel ? 'border-indigo-400 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-200'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${BRAND_DOT[card.brand]}`}>
                        <span className="text-[9px] font-black text-white">{BRAND_LABEL[card.brand]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{card.brand} •••• {card.last4}</p>
                        <p className="text-xs text-slate-400">{card.type.charAt(0).toUpperCase() + card.type.slice(1)} · {card.supplierName}</p>
                      </div>
                      <p className="text-xs text-slate-500 hidden sm:block">{card.holderName}</p>
                      {sel && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                          <CheckCircle2 size={18} className="text-indigo-500" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep('card-confirm')}
                disabled={!selectedCardId}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Card Confirmation ── */}
        {step === 'card-confirm' && selectedCard && (
          <motion.div key="card-confirm" {...slideProps} className="space-y-6 max-w-sm mx-auto">
            <p className="text-sm font-semibold text-slate-700 text-center">Confirm card selection</p>
            <CardVisual card={selectedCard} />
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2.5">
              {[
                { label: 'Network',     value: selectedCard.brand },
                { label: 'Card Number', value: `•••• •••• •••• ${selectedCard.last4}` },
                { label: 'Card Holder', value: selectedCard.holderName },
                { label: 'Type',        value: selectedCard.type.charAt(0).toUpperCase() + selectedCard.type.slice(1) },
                { label: 'Assigned to', value: selectedCard.supplierName },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-semibold text-slate-800 font-mono">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('card-select')} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Change Card
              </button>
              <button onClick={() => setStep('fund-select')} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2">
                Use This Card <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Funding Mechanism ── */}
        {step === 'fund-select' && (
          <motion.div key="fund-select" {...slideProps} className="space-y-5 max-w-sm mx-auto">
            <p className="text-sm font-semibold text-slate-700 text-center">Choose funding source</p>

            <div className="space-y-3">
              {([
                { m: 'USD'  as FundMethod, label: 'Pay with USD',  sub: `Balance: $${balances.usd.toLocaleString()}`,  Icon: DollarSign, color: 'indigo' },
                { m: 'USDC' as FundMethod, label: 'Pay with USDC', sub: `Balance: $${balances.usdc.toLocaleString()}`, Icon: Coins,       color: 'purple' },
              ] as const).map(({ m, label, sub, Icon, color }) => {
                const sel = fundMethod === m;
                return (
                  <motion.button
                    key={m}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setFundMethod(m); if (m !== 'USD') setUsdSubMethod(null); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all ${
                      sel
                        ? `border-${color}-400 bg-${color}-50 shadow-sm`
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sel ? `bg-${color}-600` : 'bg-slate-100'}`}>
                      <Icon size={18} className={sel ? 'text-white' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${sel ? `text-${color}-900` : 'text-slate-800'}`}>{label}</p>
                      <p className={`text-xs ${sel ? `text-${color}-500` : 'text-slate-400'}`}>{sub}</p>
                    </div>
                    {sel && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                        <CheckCircle2 size={18} className={`text-${color}-500`} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* USD sub-method picker */}
            <AnimatePresence>
              {fundMethod === 'USD' && (
                <motion.div
                  key="usd-sub"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Processing mode</p>
                    {([
                      {
                        id: 'cnp' as const,
                        label: 'Card-not-Present / STP',
                        sub: 'Straight-Through Processing — no physical card required',
                        icon: '⚡',
                      },
                      {
                        id: 'card-present' as const,
                        label: 'Card Present',
                        sub: 'Supplier processes card at POS terminal',
                        icon: '💳',
                      },
                    ]).map(({ id, label, sub, icon }) => {
                      const sel = usdSubMethod === id;
                      return (
                        <motion.button
                          key={id}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setUsdSubMethod(id)}
                          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all ${
                            sel
                              ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xl shrink-0">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${sel ? 'text-indigo-900' : 'text-slate-800'}`}>{label}</p>
                            <p className={`text-xs mt-0.5 ${sel ? 'text-indigo-500' : 'text-slate-400'}`}>{sub}</p>
                          </div>
                          {sel && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                              <CheckCircle2 size={18} className="text-indigo-500 shrink-0" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Order summary */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="font-bold text-slate-900">${bidAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Card</span><span className="font-mono text-slate-700">•••• {selectedCard?.last4}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Recipient</span><span className="text-slate-700">{winner?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Order</span><span className="font-mono text-slate-500 text-xs">{orderId}</span></div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('card-confirm')} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Back
              </button>
              <button
                onClick={() => setStep('auth')}
                disabled={!fundMethod || (fundMethod === 'USD' && !usdSubMethod)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
              >
                Authenticate <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Push Auth ── */}
        {step === 'auth' && (
          <motion.div key="auth" {...slideProps}>
            <PushAuthStep
              amount={bidAmount}
              supplier={winner?.name ?? ''}
              onApprove={() => { setStep('processing'); handleStart(paymentMethod, orderId); }}
              onDeny={() => setStep('fund-select')}
            />
          </motion.div>
        )}

        {/* ── Step 5: Processing ── */}
        {step === 'processing' && (
          <motion.div key="processing" {...slideProps} className="space-y-6">
            <SettlementAnimation state={state} method={paymentMethod} />
            {!state.currentStep.includes('settled') && (
              <div className="flex items-center justify-center gap-2">
                <motion.div className="w-2 h-2 rounded-full bg-indigo-600" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                <span className="text-sm text-slate-500">Processing payment…</span>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Done ── */}
        {step === 'done' && (
          <DoneStep
            bidAmount={bidAmount}
            fundMethod={fundMethod}
            selectedCard={selectedCard}
            winner={winner}
            orderId={orderId}
            isCnp={usdSubMethod === 'cnp'}
          />
        )}

      </AnimatePresence>
    </motion.div>
  );
}
