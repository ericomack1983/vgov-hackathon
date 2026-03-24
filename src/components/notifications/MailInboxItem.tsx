'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronDown, Building2, CheckCircle2, Shield, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Notification } from '@/lib/mock-data/types';

// ── Pending authorization email (card details to supplier) ───────────────────
function PendingAuthEmail({ n }: { n: Notification }) {
  const date = format(new Date(n.timestamp), 'MMMM d, yyyy');
  const time = format(new Date(n.timestamp), 'h:mm a');

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden font-sans">

      {/* Email client chrome */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">From</span>
          <span className="bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full border border-indigo-100">
            payments@vgov.gov
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">To</span>
          <span className="text-slate-700">
            {n.supplierName
              ? `${n.supplierName.toLowerCase().replace(/\s+/g, '.')}@supplier.com`
              : 'supplier@company.com'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">Re</span>
          <span className="text-slate-700 font-medium text-amber-700">
            [ACTION REQUIRED] Payment Authorization — Order {n.orderId ?? 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">Date</span>
          <span>{date} at {time}</span>
        </div>
      </div>

      {/* Header banner */}
      <div className="bg-amber-500 px-8 pt-7 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center shrink-0">
            <Building2 size={28} className="text-white" />
          </div>
          <div>
            <p className="text-white text-[11px] font-bold tracking-[0.2em] uppercase opacity-80">United States Government</p>
            <p className="text-white text-lg font-bold leading-tight mt-0.5">VGov Procurement Office</p>
            <p className="text-white/70 text-[11px] mt-0.5">Office of Financial Operations · Payments Division</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <div className="bg-white/15 border border-white/25 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Clock size={12} className="text-white/80" />
            <span className="text-white text-xs font-semibold">Payment Pending — Action Required</span>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Shield size={12} className="text-white/70" />
            <span className="text-white/90 text-xs font-semibold">Card Details Enclosed</span>
          </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-transparent" />

      {/* Body */}
      <div className="px-8 py-7 space-y-5 bg-white">
        <p className="text-sm text-slate-700 leading-relaxed">
          Dear <span className="font-semibold text-slate-900">{n.supplierName ?? 'Supplier'}</span>,
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          A payment has been <span className="font-semibold text-amber-700">authorized and is pending processing</span>.
          The VGov Procurement Platform has issued the following card credentials for order{' '}
          <span className="font-mono font-semibold text-slate-800">{n.orderId ?? 'N/A'}</span>.
          Please process this payment at your point-of-sale terminal immediately.
        </p>

        {/* Action required banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Action Required</p>
            <p className="text-sm text-amber-800 leading-relaxed">
              Enter the card details below at your POS terminal to collect the funds.
              Once processed, upload your receipt to the VGov Reconciliation Portal.
            </p>
          </div>
        </div>

        {/* Card visual */}
        {n.cardLast4 && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Authorized Payment Card</p>
            <div className="relative w-full rounded-2xl bg-gradient-to-br from-[#1434CB] to-[#0a1f8f] p-5 overflow-hidden shadow-lg">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -left-4 w-36 h-36 rounded-full bg-white/5" />
              <div className="flex items-start justify-between relative z-10 mb-6">
                <div className="w-9 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner grid grid-cols-2 gap-px p-1">
                  {[...Array(4)].map((_, i) => <div key={i} className="rounded-sm bg-yellow-600/40" />)}
                </div>
                <span className="text-white font-black tracking-widest text-sm">VISA</span>
              </div>
              <p className="font-mono text-white text-lg tracking-[0.22em] relative z-10 mb-5">
                •••• •••• •••• {n.cardLast4}
              </p>
              <div className="flex justify-between relative z-10">
                <div>
                  <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Card Holder</p>
                  <p className="text-white text-xs font-semibold tracking-wide uppercase">{n.cardHolder ?? 'CARD HOLDER'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Expires</p>
                  <p className="text-white text-xs font-semibold font-mono">{n.cardExpiry ?? '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment details */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Details</p>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { label: 'Order Reference', value: n.orderId ?? 'N/A',                                   mono: true  },
              { label: 'Payment Amount',  value: n.amount ? `$${n.amount.toLocaleString()} USD` : '—', bold: true  },
              { label: 'Card Number',     value: n.cardLast4 ? `•••• •••• •••• ${n.cardLast4}` : '—', mono: true  },
              { label: 'Expiry Date',     value: n.cardExpiry ?? '—',                                  mono: true  },
              { label: 'Card Holder',     value: n.cardHolder ?? '—'                                               },
              { label: 'Payee',           value: n.supplierName ?? '—',                                bold: true  },
              { label: 'Status',          value: 'Pending Processing',                                 amber: true },
            ].map(({ label, value, mono, bold, amber }) => (
              <div key={label} className="flex justify-between items-center px-5 py-3">
                <span className="text-xs text-slate-500 font-medium">{label}</span>
                {amber ? (
                  <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">⏳ {value}</span>
                ) : (
                  <span className={`text-sm ${mono ? 'font-mono text-slate-600' : ''} ${bold ? 'font-bold text-slate-900' : 'text-slate-700 font-medium'}`}>
                    {value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          For questions, contact{' '}
          <span className="text-indigo-600 font-medium">support@vgov.gov</span> referencing Order{' '}
          <span className="font-mono font-semibold text-slate-800">{n.orderId ?? 'N/A'}</span>.
        </p>
        <p className="text-sm text-slate-600">
          Sincerely,<br />
          <span className="font-semibold text-slate-800">Office of Financial Operations</span><br />
          <span className="text-slate-500 text-xs">VGov Procurement Platform · United States Government</span>
        </p>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 px-8 py-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <Building2 size={14} className="text-white/70" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">VGov Procurement Platform</p>
            <p className="text-white/40 text-[10px]">Authorized Government Use Only</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield size={11} className="text-amber-400" />
          <span className="text-amber-400 text-[10px] font-semibold">256-bit Encrypted · Visa Secured</span>
        </div>
      </div>
    </div>
  );
}

// ── Full email receipt template ───────────────────────────────────────────────
function GovEmailTemplate({ n }: { n: Notification }) {
  const date = format(new Date(n.timestamp), 'MMMM d, yyyy');
  const time = format(new Date(n.timestamp), 'h:mm a');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">

      {/* Email client chrome */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">From</span>
          <span className="bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-100">
            {n.supplierName
              ? `${n.supplierName.toLowerCase().replace(/\s+/g, '.')}@supplier.com`
              : 'supplier@company.com'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">To</span>
          <span className="text-slate-700">procurement@vgov.gov</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">Re</span>
          <span className="text-slate-700 font-medium">Payment Receipt – Order {n.orderId ?? 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">Date</span>
          <span>{date} at {time}</span>
        </div>
      </div>

      {/* Supplier header banner */}
      <div className="bg-emerald-600 px-8 pt-8 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center shrink-0">
            <Building2 size={28} className="text-white" />
          </div>
          <div>
            <p className="text-white text-[11px] font-bold tracking-[0.2em] uppercase opacity-80">Supplier</p>
            <p className="text-white text-lg font-bold leading-tight mt-0.5">{n.supplierName ?? 'Supplier'}</p>
            <p className="text-white/60 text-[11px] mt-0.5">Accounts Receivable · Finance Department</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <CheckCircle2 size={12} className="text-white/80" />
            <span className="text-white text-xs font-semibold tracking-wide">Payment Received & Confirmed</span>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Shield size={12} className="text-white/70" />
            <span className="text-white/90 text-xs font-semibold tracking-wide">Official Receipt</span>
          </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-300 to-transparent" />

      {/* Body */}
      <div className="px-8 py-7 space-y-5 bg-white">
        <p className="text-sm text-slate-700 leading-relaxed">
          Dear <span className="font-semibold text-slate-900">VGov Procurement Office</span>,
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          This message confirms that the payment for Order{' '}
          <span className="font-mono font-semibold text-slate-800">{n.orderId ?? 'N/A'}</span> has been
          successfully received and processed. Please retain this receipt for your financial records and audit trail.
        </p>

        {/* Payment summary */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Summary</p>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { label: 'Order Reference', value: n.orderId ?? 'N/A',                                      mono: true },
              { label: 'Payment Amount',  value: n.amount ? `$${n.amount.toLocaleString()} USD` : '—',    bold: true },
              { label: 'Payment Method',  value: n.fundMethod === 'USDC' ? 'USDC (Polygon)' : 'Card (Visa)'           },
              { label: 'Settlement Date', value: date                                                                  },
              { label: 'Payee',           value: n.supplierName ?? '—',                                   bold: true },
              { label: 'Status',          value: 'Settled',                                                ok: true   },
            ].map(({ label, value, mono, bold, ok }) => (
              <div key={label} className="flex justify-between items-center px-5 py-3">
                <span className="text-xs text-slate-500 font-medium">{label}</span>
                {ok ? (
                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">✓ {value}</span>
                ) : (
                  <span className={`text-sm ${mono ? 'font-mono text-slate-600' : ''} ${bold ? 'font-bold text-slate-900' : 'text-slate-700 font-medium'}`}>
                    {value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          For any queries regarding this payment, please contact our accounts team at{' '}
          <span className="text-emerald-600 font-medium">
            {n.supplierName
              ? `ar@${n.supplierName.toLowerCase().replace(/\s+/g, '')}.com`
              : 'ar@supplier.com'}
          </span>{' '}
          referencing Order <span className="font-mono font-semibold text-slate-800">{n.orderId ?? 'N/A'}</span>.
        </p>
        <p className="text-sm text-slate-600">
          Sincerely,<br />
          <span className="font-semibold text-slate-800">{n.supplierName ?? 'Supplier'}</span><br />
          <span className="text-slate-500 text-xs">Accounts Receivable · Finance Department</span>
        </p>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 px-8 py-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <Building2 size={14} className="text-white/70" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">{n.supplierName ?? 'Supplier'}</p>
            <p className="text-white/40 text-[10px]">Official Payment Receipt</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield size={11} className="text-emerald-400" />
          <span className="text-emerald-400 text-[10px] font-semibold">Verified · Visa Secured</span>
        </div>
      </div>
    </div>
  );
}

// ── Mail inbox card ───────────────────────────────────────────────────────────
interface Props {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

export function MailInboxItem({ notification: n, onMarkRead }: Props) {
  const [open, setOpen] = useState(false);
  const isPending = n.paymentStatus === 'pending';

  const handleToggle = () => {
    setOpen((v) => !v);
    if (!n.read) onMarkRead(n.id);
  };

  const unreadBorderClass = isPending
    ? 'border-amber-200 bg-amber-50/30'
    : 'border-indigo-200 bg-indigo-50/30';

  const iconBgClass = n.read
    ? 'bg-slate-100'
    : isPending ? 'bg-amber-500' : 'bg-indigo-600';

  const senderColorClass = n.read
    ? 'text-slate-400'
    : isPending ? 'text-amber-600' : 'text-indigo-600';

  const dotColorClass = isPending ? 'bg-amber-500' : 'bg-indigo-500';

  const amountColorClass = isPending ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-colors ${n.read ? 'border-slate-200' : unreadBorderClass}`}>

      {/* Preview row */}
      <button onClick={handleToggle} className="w-full text-left p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBgClass}`}>
            {isPending
              ? <Clock size={16} className={n.read ? 'text-slate-400' : 'text-white'} />
              : <Mail size={16} className={n.read ? 'text-slate-400' : 'text-white'} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs font-semibold truncate ${senderColorClass}`}>
                  {isPending
                    ? 'payments@vgov.gov'
                    : n.supplierName
                      ? `${n.supplierName.toLowerCase().replace(/\s+/g, '.')}@supplier.com`
                      : 'supplier@company.com'
                  }
                </span>
                {!n.read && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorClass}`} />}
              </div>
              <span className="text-xs text-slate-400 shrink-0">{format(new Date(n.timestamp), 'MMM d, h:mm a')}</span>
            </div>
            <p className={`text-sm truncate ${n.read ? 'font-medium text-slate-600' : 'font-bold text-slate-900'}`}>
              {isPending
                ? `[Action Required] Payment Authorization — ${n.orderId ?? 'Order'}`
                : `Payment Receipt — ${n.orderId ?? 'Order'}`
              }
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-slate-400 truncate">
                {isPending
                  ? `$${n.amount?.toLocaleString()} to ${n.supplierName} · Pending Processing`
                  : `$${n.amount?.toLocaleString()} from ${n.supplierName} · Payment Confirmed`
                }
              </p>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                <span className={`text-xs font-bold ${amountColorClass}`}>${n.amount?.toLocaleString()}</span>
                <motion.span
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex text-slate-400"
                >
                  <ChevronDown size={13} />
                </motion.span>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded email */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-4">
              {isPending ? <PendingAuthEmail n={n} /> : <GovEmailTemplate n={n} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
