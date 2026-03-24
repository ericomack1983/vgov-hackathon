'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Wifi, ChevronDown, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';

type Brand = 'Visa' | 'Mastercard' | 'Amex';
type CardType = 'credit' | 'debit';
type IssueStep = 'validating' | 'contacting' | 'generating' | 'vpa' | 'vpc' | 'issued';

const BRAND_BG: Record<Brand, string> = {
  Visa:       'from-[#1434CB] to-[#0a1f8f]',
  Mastercard: 'from-[#EB001B] to-[#a80013]',
  Amex:       'from-[#007BC1] to-[#005a8e]',
};

const BRAND_LABEL: Record<Brand, string> = {
  Visa: 'VISA', Mastercard: 'MC', Amex: 'AMEX',
};

const ISSUE_STEPS: { key: IssueStep; label: string; duration: number; visaLogo?: boolean }[] = [
  { key: 'validating',  label: 'Validating request…',                         duration: 900  },
  { key: 'contacting',  label: 'Contacting issuer network…',                  duration: 1400 },
  { key: 'generating',  label: 'Generating card details…',                    duration: 1100 },
  { key: 'vpa',         label: 'Creating VPA (Pseudo Accounts)…',             duration: 1200, visaLogo: true },
  { key: 'vpc',         label: 'Applying Visa Payment Controls…',             duration: 1000, visaLogo: true },
  { key: 'issued',      label: 'Card issued successfully!',                   duration: 0    },
];

function randomLast4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

interface IssuedCard {
  holderName: string;
  brand: Brand;
  type: CardType;
  supplierName: string;
  last4: string;
  expiry: string;
  spendLimit?: string;
  cardAcceptorId?: string;
  allowOnline: boolean;
  allowIntl: boolean;
  allowRecurring: boolean;
}

// Live card preview
function CardPreview({ holderName, brand, type, flipped, issuedLast4 }: {
  holderName: string;
  brand: Brand;
  type: CardType;
  flipped: boolean;
  issuedLast4?: string;
}) {
  const displayName = holderName.trim() || 'CARD HOLDER';
  const now = new Date();
  const expiry = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear() + 3).slice(-2)}`;

  return (
    <motion.div
      animate={{ rotateY: flipped ? 0 : 0, scale: flipped ? 1.03 : 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative w-full max-w-sm mx-auto h-48 rounded-2xl bg-gradient-to-br ${BRAND_BG[brand]} overflow-hidden shadow-2xl select-none`}
    >
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-6 w-48 h-48 rounded-full bg-white/5" />

      {/* Chip */}
      <div className="absolute top-10 left-6 w-9 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner grid grid-cols-2 gap-px p-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-sm bg-yellow-600/40" />
        ))}
      </div>

      {/* Wifi / contactless */}
      <div className="absolute top-10 left-16">
        <Wifi size={14} className="text-white/60 rotate-90" />
      </div>

      {/* Brand label */}
      <div className="absolute top-5 right-5">
        <span className="text-white font-black tracking-widest text-sm">{BRAND_LABEL[brand]}</span>
      </div>

      {/* Card number */}
      <div className="absolute top-1/2 left-6 -translate-y-1/2">
        <p className="font-mono text-white text-lg tracking-[0.22em]">
          {issuedLast4
            ? `•••• •••• •••• ${issuedLast4}`
            : '•••• •••• •••• ••••'}
        </p>
      </div>

      {/* Bottom row */}
      <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
        <div>
          <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Card Holder</p>
          <p className="text-white text-xs font-semibold tracking-wide uppercase truncate max-w-[160px]">
            {displayName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Expires</p>
          <p className="text-white text-xs font-semibold">{expiry}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Type</p>
          <p className="text-white text-xs font-semibold capitalize">{type}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Issuance overlay animation
function IssuanceOverlay({ brand, onDone }: { brand: Brand; onDone: (last4: string) => void }) {
  const [completedSteps, setCompletedSteps] = useState<IssueStep[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [last4] = useState(randomLast4);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    function runStep(idx: number) {
      if (idx >= ISSUE_STEPS.length) return;
      const step = ISSUE_STEPS[idx];

      if (step.key === 'issued') {
        setCompletedSteps((p) => [...p, step.key]);
        setCurrentIdx(idx);
        setTimeout(() => setDone(true), 600);
        setTimeout(() => onDone(last4), 2200);
        return;
      }

      timeout = setTimeout(() => {
        setCompletedSteps((p) => [...p, step.key]);
        setCurrentIdx(idx + 1);
        runStep(idx + 1);
      }, step.duration);
    }

    runStep(0);
    return () => clearTimeout(timeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-sm flex flex-col items-center gap-6"
      >
        {/* Animated ring */}
        <div className="relative w-20 h-20">
          {!done ? (
            <>
              <motion.div
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${BRAND_BG[brand]} opacity-20`}
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className={`absolute inset-2 rounded-full bg-gradient-to-br ${BRAND_BG[brand]}`} />
              <Loader2 size={28} className="absolute inset-0 m-auto text-white animate-spin" />
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center"
            >
              <CheckCircle size={36} className="text-white" strokeWidth={2.5} />
            </motion.div>
          )}
        </div>

        {/* Title */}
        <div className="text-center">
          <p className="text-base font-bold text-slate-900">
            {done ? 'Card Issued!' : 'Requesting Card…'}
          </p>
          {done && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-slate-500 mt-1"
            >
              Ending in <span className="font-mono font-bold text-slate-800">{last4}</span>
            </motion.p>
          )}
        </div>

        {/* Steps */}
        <div className="w-full space-y-3">
          {ISSUE_STEPS.map((step, i) => {
            const isComplete = completedSteps.includes(step.key);
            const isActive   = i === currentIdx && !isComplete;
            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: i <= currentIdx ? 1 : 0.3, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  {isComplete ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <CheckCircle size={18} className="text-emerald-500" strokeWidth={2.5} />
                    </motion.div>
                  ) : isActive ? (
                    <Loader2 size={16} className="text-indigo-500 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  {step.visaLogo && (
                    <span className={`inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide border
                      ${isComplete ? 'bg-[#1434CB]/8 border-[#1434CB]/20 text-[#1434CB]' : isActive ? 'bg-[#1434CB]/10 border-[#1434CB]/30 text-[#1434CB]' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                      <svg viewBox="0 0 72 24" aria-label="Visa" className="h-2.5 w-auto shrink-0">
                        <path fill="currentColor" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
                      </svg>
                      API
                    </span>
                  )}
                  <span className={`text-sm leading-tight ${isComplete ? 'text-slate-700 font-medium' : isActive ? 'text-indigo-600 font-semibold' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CardsPage() {
  const { suppliers } = useProcurement();

  const [holderName, setHolderName]     = useState('');
  const [brand, setBrand]               = useState<Brand>('Visa');
  const [cardType, setCardType]         = useState<CardType>('credit');
  const [supplierId, setSupplierId]     = useState('');
  const [purpose, setPurpose]           = useState('');
  const [spendLimit, setSpendLimit]         = useState('');
  const [cardAcceptorId, setCardAcceptorId] = useState('');
  const [allowOnline, setAllowOnline]       = useState(true);
  const [allowIntl, setAllowIntl]       = useState(false);
  const [allowRecurring, setAllowRecurring] = useState(true);

  const [isRequesting, setIsRequesting] = useState(false);
  const [issuedCard, setIssuedCard]     = useState<IssuedCard | null>(null);

  const inputClass = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-slate-800 placeholder:text-slate-400 transition';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!holderName.trim() || !supplierId) return;
    setIsRequesting(true);
  }

  function handleIssuanceDone(last4: string) {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const now = new Date();
    setIssuedCard({
      holderName: holderName.trim(),
      brand,
      type: cardType,
      supplierName: supplier?.name ?? '',
      last4,
      expiry: `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear() + 3).slice(-2)}`,
      spendLimit: spendLimit || undefined,
      cardAcceptorId: cardAcceptorId.trim() || undefined,
      allowOnline,
      allowIntl,
      allowRecurring,
    });
    setIsRequesting(false);
  }

  function resetForm() {
    setHolderName('');
    setBrand('Visa');
    setCardType('credit');
    setSupplierId('');
    setPurpose('');
    setSpendLimit('');
    setCardAcceptorId('');
    setAllowOnline(true);
    setAllowIntl(false);
    setAllowRecurring(true);
    setIssuedCard(null);
  }

  return (
    <>
      <AnimatePresence>
        {isRequesting && (
          <IssuanceOverlay brand={brand} onDone={handleIssuanceDone} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <h1 className="text-xl font-semibold text-slate-900">Card Issuance</h1>
        <p className="mt-1 text-sm text-slate-500">Request a new virtual card from the issuer network.</p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* Left — Live card preview */}
          <div className="flex flex-col items-center gap-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider self-start">Preview</p>
            <AnimatePresence mode="wait">
              {issuedCard ? (
                <motion.div
                  key="issued"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-full"
                  style={{ perspective: 1000 }}
                >
                  <CardPreview
                    holderName={issuedCard.holderName}
                    brand={issuedCard.brand}
                    type={issuedCard.type}
                    flipped
                    issuedLast4={issuedCard.last4}
                  />
                  {/* Issued details */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3"
                  >
                    {[
                      { label: 'Supplier',    value: issuedCard.supplierName },
                      { label: 'Card Type',   value: issuedCard.type.charAt(0).toUpperCase() + issuedCard.type.slice(1) },
                      { label: 'Network',     value: issuedCard.brand },
                      { label: 'Card Number', value: `•••• •••• •••• ${issuedCard.last4}` },
                      { label: 'Expiry',      value: issuedCard.expiry },
                      ...(issuedCard.spendLimit ? [{ label: 'Spend Limit', value: `$${Number(issuedCard.spendLimit).toLocaleString()}` }] : []),
                      ...(issuedCard.cardAcceptorId ? [{ label: 'Card Acceptor ID', value: issuedCard.cardAcceptorId }] : []),
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">{row.label}</span>
                        <span className="font-semibold text-slate-800 font-mono">{row.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">Controls</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Online',      on: issuedCard.allowOnline    },
                          { label: 'International',on: issuedCard.allowIntl     },
                          { label: 'Recurring',   on: issuedCard.allowRecurring },
                        ].map(({ label, on }) => (
                          <span key={label} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${on ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            {on ? '✓' : '✕'} {label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={resetForm}
                      className="w-full mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors pt-2 border-t border-slate-100"
                    >
                      Request another card
                    </button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="preview" className="w-full" style={{ perspective: 1000 }}>
                  <CardPreview
                    holderName={holderName}
                    brand={brand}
                    type={cardType}
                    flipped={false}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — Form */}
          {!issuedCard && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5"
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Card Details</p>

              {/* Holder name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Card Holder Name</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. John Harrington"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  required
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Network</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Visa', 'Mastercard', 'Amex'] as Brand[]).map((b) => {
                    const disabled = b !== 'Visa';
                    return (
                      <button
                        key={b}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && setBrand(b)}
                        title={disabled ? 'Not available in this system' : undefined}
                        className={`relative py-2 rounded-xl text-xs font-bold border transition-all ${
                          brand === b
                            ? `bg-gradient-to-br ${BRAND_BG[b]} text-white border-transparent shadow`
                            : disabled
                            ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {BRAND_LABEL[b]}
                        {disabled && (
                          <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-slate-200 text-slate-400 rounded-full px-1 py-0.5 leading-none">
                            N/A
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Card Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['credit', 'debit'] as CardType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCardType(t)}
                      className={`py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
                        cardType === t
                          ? 'bg-indigo-600 text-white border-transparent shadow'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assign to Supplier</label>
                <div className="relative">
                  <select
                    className={inputClass + ' appearance-none pr-8'}
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    required
                  >
                    <option value="">Select supplier…</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Purpose <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Procurement payments"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 pt-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={13} /> Limits &amp; Controls
                </p>
              </div>

              {/* Spend limit */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Spending Limit ($) <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  className={inputClass}
                  placeholder="e.g. 50000"
                  value={spendLimit}
                  onChange={(e) => setSpendLimit(e.target.value)}
                />
              </div>

              {/* Card Acceptor ID */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Card Acceptor ID <span className="text-slate-400 font-normal">(POS terminal)</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. POS-00482-TX"
                  value={cardAcceptorId}
                  onChange={(e) => setCardAcceptorId(e.target.value)}
                  maxLength={24}
                />
                <p className="text-[11px] text-slate-400 mt-1">The terminal ID where this card is authorized to transact.</p>
              </div>

              {/* Toggle controls */}
              <div className="space-y-3">
                {[
                  { label: 'Online transactions',      sub: 'Allow e-commerce & virtual payments', value: allowOnline,    set: setAllowOnline    },
                  { label: 'International payments',   sub: 'Allow cross-border transactions',      value: allowIntl,      set: setAllowIntl      },
                  { label: 'Recurring charges',        sub: 'Allow subscriptions & auto-billing',   value: allowRecurring, set: setAllowRecurring },
                ].map(({ label, sub, value, set }) => (
                  <div key={label} className="flex items-center justify-between gap-3 py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{sub}</p>
                    </div>
                    <button type="button" onClick={() => set(!value)} className="shrink-0">
                      {value
                        ? <ToggleRight size={28} className="text-indigo-500" />
                        : <ToggleLeft  size={28} className="text-slate-300" />}
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={!holderName.trim() || !supplierId}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Request Card from Issuer
              </button>
            </motion.form>
          )}
        </div>
      </motion.div>
    </>
  );
}
