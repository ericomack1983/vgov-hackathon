'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronDown, Building2, CheckCircle2, Shield, Clock, AlertCircle, FileText } from 'lucide-react';
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
          <span className="bg-[#EEF1FD] text-indigo-700 font-medium px-2 py-0.5 rounded-full border border-[#D6DFFA]">
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
          <span className="text-[#1434CB] font-medium">support@vgov.gov</span> referencing Order{' '}
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

// ── Invoice verified email (Supplier → Gov) ───────────────────────────────────
function InvoiceVerifiedEmail({ n }: { n: Notification }) {
  const date = format(new Date(n.timestamp), 'MMMM d, yyyy');
  const time = format(new Date(n.timestamp), 'h:mm a');
  const supplierEmail = n.supplierName
    ? `invoices@${n.supplierName.toLowerCase().replace(/\s+/g, '')}.com`
    : 'invoices@supplier.com';

  function fmt(amount: number) {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  }

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden font-sans">

      {/* Email client chrome */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">From</span>
          <span className="bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full border border-indigo-100">
            {supplierEmail}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">To</span>
          <span className="text-slate-700">procurement@vgov.gov</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">Re</span>
          <span className="text-slate-700 font-medium">
            Invoice Verified — {n.invoiceNo ?? 'N/A'}{n.rfpTitle ? ` · ${n.rfpTitle}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">Attach</span>
          <span className="flex items-center gap-1 bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full border border-slate-200">
            <FileText size={10} />
            {n.invoiceNo ?? 'invoice'}.pdf
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 w-10">Date</span>
          <span>{date} at {time}</span>
        </div>
      </div>

      {/* Header banner — indigo */}
      <div className="px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #1434CB 0%, #4f46e5 100%)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center shrink-0">
            <Building2 size={28} className="text-white" />
          </div>
          <div>
            <p className="text-white text-[11px] font-bold tracking-[0.2em] uppercase opacity-80">Supplier</p>
            <p className="text-white text-lg font-bold leading-tight mt-0.5">{n.supplierName ?? 'Supplier'}</p>
            <p className="text-white/60 text-[11px] mt-0.5">Accounts Payable · Finance Department</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <CheckCircle2 size={12} className="text-emerald-300" />
            <span className="text-white text-xs font-semibold tracking-wide">Invoice Verified via Visa B2B</span>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Shield size={12} className="text-white/70" />
            <span className="text-white/90 text-xs font-semibold tracking-wide">Signature Validated</span>
          </div>
        </div>
      </div>

      <div className="h-1" style={{ background: 'linear-gradient(to right, #4f46e5, #818cf8, transparent)' }} />

      {/* Body */}
      <div className="px-8 py-7 space-y-5 bg-white">
        <p className="text-sm text-slate-700 leading-relaxed">
          Dear <span className="font-semibold text-slate-900">VGov Procurement Office</span>,
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Please find attached our verified invoice{' '}
          <span className="font-mono font-semibold text-slate-800">{n.invoiceNo ?? 'N/A'}</span> for the recent
          procurement{n.rfpTitle ? <>{' '}of <span className="font-semibold text-slate-800">{n.rfpTitle}</span></> : ''}.
          The invoice has been digitally signed and validated through the Visa B2B payment rails. All amounts
          and terms are as agreed.
        </p>

        {/* Invoice attachment preview */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Invoice Attachment</p>
          <div
            className="w-full rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)',
              border: '1px solid rgba(99,102,241,0.4)',
              boxShadow: '0 8px 32px rgba(20,52,203,0.2)',
            }}
          >
            {/* Invoice header */}
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #1434CB, #4f46e5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-white/80" />
                <span className="text-xs font-bold text-white/90 uppercase tracking-widest">Invoice</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/50">#{n.invoiceNo}</span>
                <span className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Verified</span>
                </span>
              </div>
            </div>
            {/* Invoice body */}
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] text-indigo-400/60 uppercase tracking-wider mb-0.5">Total Amount</p>
                <p className="text-2xl font-black text-white">{n.amount ? fmt(n.amount) : '—'}</p>
              </div>
              <div>
                <p className="text-[9px] text-indigo-400/60 uppercase tracking-wider mb-0.5">Invoice Date</p>
                <p className="text-sm text-white/80 font-medium">{date}</p>
              </div>
              <div>
                <p className="text-[9px] text-indigo-400/60 uppercase tracking-wider mb-0.5">From</p>
                <p className="text-sm text-white/80 font-semibold">{n.supplierName ?? '—'}</p>
              </div>
              <div>
                <p className="text-[9px] text-indigo-400/60 uppercase tracking-wider mb-0.5">To</p>
                <p className="text-sm text-white/80 font-semibold">VGov Procurement</p>
              </div>
              {n.rfpTitle && (
                <div className="col-span-2">
                  <p className="text-[9px] text-indigo-400/60 uppercase tracking-wider mb-0.5">Description</p>
                  <p className="text-sm text-white/70">{n.rfpTitle}</p>
                </div>
              )}
              <div className="col-span-2 flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[9px] text-indigo-400/50 font-mono">Visa B2B · {n.invoiceNo}</span>
                <svg viewBox="0 0 72 24" className="h-3 w-auto opacity-40">
                  <path fill="white" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction summary table */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Purchase Summary</p>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { label: 'Invoice Number',   value: n.invoiceNo ?? 'N/A',                                         mono: true  },
              { label: 'Purchase Amount',  value: n.amount ? `$${n.amount.toLocaleString()} USD` : '—',         bold: true  },
              { label: 'Supplier',         value: n.supplierName ?? '—',                                        bold: true  },
              ...(n.rfpTitle ? [{ label: 'Description', value: n.rfpTitle }] : []),
              { label: 'Invoice Date',     value: date                                                                       },
              { label: 'Payment Rails',    value: 'Visa B2B'                                                                 },
              { label: 'Validation',       value: 'Signature Verified · Amount Matched',                        ok: true    },
            ].map(({ label, value, mono, bold, ok }: { label: string; value: string; mono?: boolean; bold?: boolean; ok?: boolean }) => (
              <div key={label} className="flex justify-between items-center px-5 py-3">
                <span className="text-xs text-slate-500 font-medium">{label}</span>
                {ok ? (
                  <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">✓ {value}</span>
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
          Please process payment at your earliest convenience. For any questions, contact our accounts team at{' '}
          <span className="text-indigo-600 font-medium">{supplierEmail}</span> referencing invoice{' '}
          <span className="font-mono font-semibold text-slate-800">{n.invoiceNo ?? 'N/A'}</span>.
        </p>
        <p className="text-sm text-slate-600">
          Sincerely,<br />
          <span className="font-semibold text-slate-800">{n.supplierName ?? 'Supplier'}</span><br />
          <span className="text-slate-500 text-xs">Accounts Payable · Finance Department</span>
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
            <p className="text-white/40 text-[10px]">Official Invoice Submission</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield size={11} className="text-indigo-400" />
          <span className="text-indigo-400 text-[10px] font-semibold">Verified · Visa B2B Secured</span>
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
  const isInvoiceVerified = n.emailType === 'invoice-verified';
  const isPending = !isInvoiceVerified && n.paymentStatus === 'pending';

  const handleToggle = () => {
    setOpen((v) => !v);
    if (!n.read) onMarkRead(n.id);
  };

  const unreadBorderClass = isInvoiceVerified
    ? 'border-indigo-200 bg-indigo-50/20'
    : isPending
      ? 'border-amber-200 bg-amber-50/30'
      : 'border-[#A5B8F3] bg-[#EEF1FD]/30';

  const iconBgClass = n.read
    ? 'bg-slate-100'
    : isInvoiceVerified ? 'bg-indigo-600' : isPending ? 'bg-amber-500' : 'bg-[#1434CB]';

  const senderColorClass = n.read
    ? 'text-slate-400'
    : isInvoiceVerified ? 'text-indigo-600' : isPending ? 'text-amber-600' : 'text-[#1434CB]';

  const dotColorClass = isInvoiceVerified ? 'bg-indigo-500' : isPending ? 'bg-amber-500' : 'bg-[#1434CB]';

  const amountColorClass = isInvoiceVerified ? 'text-indigo-600' : isPending ? 'text-amber-600' : 'text-emerald-600';

  const senderLabel = isInvoiceVerified
    ? (n.supplierName ? `invoices@${n.supplierName.toLowerCase().replace(/\s+/g, '')}.com` : 'invoices@supplier.com')
    : isPending
      ? 'payments@vgov.gov'
      : n.supplierName
        ? `${n.supplierName.toLowerCase().replace(/\s+/g, '.')}@supplier.com`
        : 'supplier@company.com';

  const subjectLabel = isInvoiceVerified
    ? `Invoice Verified — ${n.invoiceNo ?? n.orderId ?? 'Invoice'}`
    : isPending
      ? `[Action Required] Payment Authorization — ${n.orderId ?? 'Order'}`
      : `Payment Receipt — ${n.orderId ?? 'Order'}`;

  const previewLabel = isInvoiceVerified
    ? `${n.amount ? `$${n.amount.toLocaleString()}` : ''} · ${n.supplierName} · Invoice Verified via Visa B2B`
    : isPending
      ? `$${n.amount?.toLocaleString()} to ${n.supplierName} · Pending Processing`
      : `$${n.amount?.toLocaleString()} from ${n.supplierName} · Payment Confirmed`;

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-colors ${n.read ? 'border-slate-200' : unreadBorderClass}`}>

      {/* Preview row */}
      <button onClick={handleToggle} className="w-full text-left p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBgClass}`}>
            {isInvoiceVerified
              ? <FileText size={16} className={n.read ? 'text-slate-400' : 'text-white'} />
              : isPending
                ? <Clock size={16} className={n.read ? 'text-slate-400' : 'text-white'} />
                : <Mail size={16} className={n.read ? 'text-slate-400' : 'text-white'} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs font-semibold truncate ${senderColorClass}`}>{senderLabel}</span>
                {!n.read && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorClass}`} />}
              </div>
              <span className="text-xs text-slate-400 shrink-0">{format(new Date(n.timestamp), 'MMM d, h:mm a')}</span>
            </div>
            <p className={`text-sm truncate ${n.read ? 'font-medium text-slate-600' : 'font-bold text-slate-900'}`}>
              {subjectLabel}
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-slate-400 truncate">{previewLabel}</p>
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
              {isInvoiceVerified
                ? <InvoiceVerifiedEmail n={n} />
                : isPending
                  ? <PendingAuthEmail n={n} />
                  : <GovEmailTemplate n={n} />
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
