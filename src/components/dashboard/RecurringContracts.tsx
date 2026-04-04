'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, ChevronDown, ChevronUp, AlertCircle,
  CheckCircle2, Clock, CalendarClock, Building2,
} from 'lucide-react';
import { RFP, RecurringInstallment } from '@/lib/mock-data/types';

// ── helpers ────────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string): number {
  const now = new Date('2026-04-02T00:00:00.000Z');
  const target = new Date(iso);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

const INTERVAL_LABEL: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  biannual: 'Bi-Annual',
  annual: 'Annual',
};

const INTERVAL_COLOR: Record<string, string> = {
  monthly:   'bg-violet-50 text-violet-700 border-violet-200',
  quarterly: 'bg-sky-50 text-sky-700 border-sky-200',
  biannual:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  annual:    'bg-emerald-50 text-emerald-700 border-emerald-200',
};

// ── Installment dot timeline ───────────────────────────────────────────────────
function InstallmentDots({ installments }: { installments: RecurringInstallment[] }) {
  const MAX_DOTS = 12;
  const show = installments.slice(0, MAX_DOTS);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {show.map((inst, i) => {
        let cls = '';
        let title = '';
        if (inst.status === 'paid') {
          cls = 'bg-emerald-500';
          title = `Paid ${inst.paidAt ? fmtDate(inst.paidAt) : ''}`;
        } else if (inst.status === 'pending') {
          cls = 'bg-amber-400 ring-2 ring-amber-300 ring-offset-1 animate-pulse';
          title = `Pending — due ${fmtDate(inst.dueDate)}`;
        } else if (inst.status === 'overdue') {
          cls = 'bg-red-500 ring-2 ring-red-300 ring-offset-1';
          title = `Overdue since ${fmtDate(inst.dueDate)}`;
        } else {
          cls = 'bg-slate-200';
          title = `Scheduled ${fmtDate(inst.dueDate)}`;
        }
        return (
          <div
            key={inst.id}
            className={`w-2.5 h-2.5 rounded-full transition-all ${cls}`}
            title={title}
          />
        );
      })}
      {installments.length > MAX_DOTS && (
        <span className="text-[9px] text-slate-400 font-medium ml-0.5">
          +{installments.length - MAX_DOTS}
        </span>
      )}
    </div>
  );
}

// ── Next installment chip ──────────────────────────────────────────────────────
function NextDueChip({ installment }: { installment: RecurringInstallment }) {
  const days = daysUntil(installment.dueDate);

  if (installment.status === 'pending') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
        <AlertCircle size={11} className="text-amber-500 shrink-0" />
        <div>
          <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wide">Payment Pending</p>
          <p className="text-xs font-bold text-amber-800">{fmt(installment.amount)} · {fmtDate(installment.dueDate)}</p>
        </div>
      </div>
    );
  }

  if (installment.status === 'overdue') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200">
        <AlertCircle size={11} className="text-red-500 shrink-0" />
        <div>
          <p className="text-[9px] font-semibold text-red-700 uppercase tracking-wide">Overdue</p>
          <p className="text-xs font-bold text-red-800">{fmt(installment.amount)} · {Math.abs(days)}d ago</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
      <CalendarClock size={11} className="text-[#1434CB] shrink-0" />
      <div>
        <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">
          Next · {days >= 0 ? `in ${days}d` : `${Math.abs(days)}d ago`}
        </p>
        <p className="text-xs font-bold text-slate-800">{fmt(installment.amount)} · {fmtDate(installment.dueDate)}</p>
      </div>
    </div>
  );
}

// ── Per-contract row ───────────────────────────────────────────────────────────
function ContractRow({ rfp }: { rfp: RFP }) {
  const [expanded, setExpanded] = useState(false);
  const rec = rfp.recurring!;

  const paidCount   = rec.installments.filter(i => i.status === 'paid').length;
  const paidAmount  = paidCount * rec.installmentAmount;
  const totalAmount = rec.totalInstallments * rec.installmentAmount;
  const pct         = Math.round((paidCount / rec.totalInstallments) * 100);

  const nextDue = rec.installments.find(
    i => i.status === 'pending' || i.status === 'scheduled' || i.status === 'overdue'
  );
  const hasPending = rec.installments.some(i => i.status === 'pending' || i.status === 'overdue');

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${hasPending ? 'border-amber-200 shadow-sm shadow-amber-50' : 'border-slate-100'}`}>
      {/* main row */}
      <button
        className="w-full text-left p-4 flex items-start gap-4"
        onClick={() => setExpanded(v => !v)}
      >
        {/* icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
          hasPending ? 'bg-amber-50' : 'bg-slate-50'
        }`}>
          <RefreshCw size={14} className={hasPending ? 'text-amber-500' : 'text-[#1434CB]'} />
        </div>

        {/* info */}
        <div className="flex-1 min-w-0">
          {/* title row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-slate-800 truncate">{rfp.title}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wide ${INTERVAL_COLOR[rec.interval]}`}>
              {INTERVAL_LABEL[rec.interval]}
            </span>
            {hasPending && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide flex items-center gap-0.5">
                <AlertCircle size={8} /> Action Needed
              </span>
            )}
          </div>

          {/* supplier + contract term */}
          <div className="flex items-center gap-1 mb-2.5">
            <Building2 size={10} className="text-slate-400" />
            <span className="text-xs text-slate-500">
              {rfp.bids.find(b => b.supplierId === rfp.selectedWinnerId)?.supplierName ?? '—'}
            </span>
            <span className="text-slate-300 mx-1">·</span>
            <span className="text-xs text-slate-400">{rec.contractYears}yr contract</span>
            <span className="text-slate-300 mx-1">·</span>
            <span className="text-xs text-slate-400">{rec.totalInstallments} installments</span>
          </div>

          {/* installment dots */}
          <InstallmentDots installments={rec.installments} />

          {/* progress bar */}
          <div className="mt-2 mb-2.5">
            <div className="flex justify-between text-[9px] text-slate-400 mb-1">
              <span>{paidCount} of {rec.totalInstallments} paid</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(to right, #1434CB, #6366f1)' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 mt-1">
              <span className="font-semibold">{fmt(paidAmount)} paid</span>
              <span className="text-slate-400">{fmt(totalAmount - paidAmount)} remaining</span>
            </div>
          </div>

          {/* next due chip */}
          {nextDue && <NextDueChip installment={nextDue} />}
        </div>

        {/* expand toggle */}
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* expanded schedule */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-100 pt-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Schedule</p>
              <div className="space-y-1.5">
                {rec.installments.map((inst, i) => {
                  const isPaid    = inst.status === 'paid';
                  const isPending = inst.status === 'pending';
                  const isOverdue = inst.status === 'overdue';
                  return (
                    <div
                      key={inst.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${
                        isPaid    ? 'bg-emerald-50/60'  :
                        isPending ? 'bg-amber-50'       :
                        isOverdue ? 'bg-red-50'         :
                                    'bg-slate-50'
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-slate-400 w-4 shrink-0">#{i + 1}</span>
                      {isPaid && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                      {isPending && <AlertCircle size={12} className="text-amber-500 shrink-0" />}
                      {isOverdue && <AlertCircle size={12} className="text-red-500 shrink-0" />}
                      {!isPaid && !isPending && !isOverdue && <Clock size={12} className="text-slate-300 shrink-0" />}
                      <span className={`font-medium ${isPaid ? 'text-slate-600' : isPending ? 'text-amber-800' : 'text-slate-500'}`}>
                        {fmtDate(inst.dueDate)}
                      </span>
                      <span className={`ml-auto font-semibold ${isPaid ? 'text-emerald-700' : isPending ? 'text-amber-700' : 'text-slate-500'}`}>
                        {fmt(inst.amount)}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                        isPaid    ? 'bg-emerald-100 text-emerald-700' :
                        isPending ? 'bg-amber-100 text-amber-700'     :
                        isOverdue ? 'bg-red-100 text-red-700'         :
                                    'bg-slate-100 text-slate-500'
                      }`}>
                        {inst.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface RecurringContractsProps {
  rfps: RFP[];
}

export function RecurringContracts({ rfps }: RecurringContractsProps) {
  const recurringRfps = rfps.filter(r => r.recurring && (r.status === 'Awarded' || r.status === 'Paid'));

  const summary = useMemo(() => {
    const totalCommitted = recurringRfps.reduce((s, r) => {
      const rec = r.recurring!;
      return s + rec.totalInstallments * rec.installmentAmount;
    }, 0);

    const totalPaid = recurringRfps.reduce((s, r) => {
      const rec = r.recurring!;
      return s + rec.installments.filter(i => i.status === 'paid').length * rec.installmentAmount;
    }, 0);

    const pendingCount = recurringRfps.reduce((s, r) => {
      return s + r.recurring!.installments.filter(i => i.status === 'pending' || i.status === 'overdue').length;
    }, 0);

    const pendingAmount = recurringRfps.reduce((s, r) => {
      return s + r.recurring!.installments
        .filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, i) => sum + i.amount, 0);
    }, 0);

    return { totalCommitted, totalPaid, pendingCount, pendingAmount };
  }, [recurringRfps]);

  if (recurringRfps.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden
      shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.06)]">

      {/* ── header ─── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}>
            <RefreshCw size={13} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Recurring Contracts</h2>
            <p className="text-xs text-slate-400">Long-term payment commitments</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EEF1FD] text-[#1434CB] border border-[#dde3fc]">
          {recurringRfps.length} active
        </span>
      </div>

      {/* ── KPI row ─── */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        <div className="px-4 py-3">
          <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider mb-0.5">Total Committed</p>
          <p className="text-base font-bold text-slate-900">{fmt(summary.totalCommitted)}</p>
          <p className="text-[9px] text-slate-400">across {recurringRfps.length} contracts</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider mb-0.5">Total Paid</p>
          <p className="text-base font-bold text-emerald-600">{fmt(summary.totalPaid)}</p>
          <p className="text-[9px] text-slate-400">
            {Math.round((summary.totalPaid / summary.totalCommitted) * 100)}% of committed
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider mb-0.5">Pending Payments</p>
          <p className={`text-base font-bold ${summary.pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {summary.pendingCount > 0 ? fmt(summary.pendingAmount) : '—'}
          </p>
          <p className="text-[9px] text-slate-400">
            {summary.pendingCount > 0 ? `${summary.pendingCount} installment${summary.pendingCount > 1 ? 's' : ''} due` : 'All up to date'}
          </p>
        </div>
      </div>

      {/* ── contract list ─── */}
      <div className="p-4 space-y-3">
        {recurringRfps.map(rfp => (
          <ContractRow key={rfp.id} rfp={rfp} />
        ))}
      </div>
    </div>
  );
}
