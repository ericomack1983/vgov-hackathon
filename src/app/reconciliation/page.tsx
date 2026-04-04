'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayment } from '@/context/PaymentContext';
import {
  FileCheck, Search, Filter, DollarSign, Wallet, FileText,
  CheckCircle2, AlertCircle, Loader2, ShieldCheck, Activity,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { vpcService, type VPCReconciliationResult } from '@/lib/visa-sdk';

// ── Reconciliation state per transaction ──────────────────────────────────────

type ReconcileStatus = 'idle' | 'loading' | 'matched' | 'partial_match' | 'unmatched';

interface ReconcileState {
  status: ReconcileStatus;
  result?: VPCReconciliationResult;
}

// ── VPC Match Cell ─────────────────────────────────────────────────────────────

function VPCMatchCell({
  txId,
  amount,
  supplierName,
  state,
  onReconcile,
}: {
  txId: string;
  amount: number;
  supplierName: string;
  state: ReconcileState;
  onReconcile: (txId: string) => void;
}) {
  if (state.status === 'idle') {
    return (
      <button
        onClick={() => onReconcile(txId)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EEF1FD] text-indigo-700 hover:bg-[#D6DFFA] transition-colors border border-[#D6DFFA]"
      >
        <Activity size={11} />
        Reconcile via VPC
      </button>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono">
        <Loader2 size={11} className="animate-spin" />
        <span>Calling VPC API…</span>
      </div>
    );
  }

  if (state.status === 'matched' && state.result?.matchedTransaction) {
    const t = state.result.matchedTransaction;
    return (
      <motion.div
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-1"
      >
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
          <CheckCircle2 size={10} />
          {state.result.confidence}% match
        </div>
        <div className="text-[10px] font-mono text-slate-400 leading-snug">
          <span className="text-slate-600 font-semibold">{t.transactionId}</span>
          <br />
          {t.merchantName} · ${t.amount.toLocaleString()}
        </div>
      </motion.div>
    );
  }

  if (state.status === 'partial_match' && state.result?.matchedTransaction) {
    const t = state.result.matchedTransaction;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700">
          <AlertCircle size={10} />
          Partial · {state.result.confidence}%
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          <span className="text-slate-600">{t.transactionId}</span> · ${t.amount.toLocaleString()}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600">
      <AlertCircle size={10} />
      No match
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReconciliationPage() {
  const { transactions } = usePayment();
  const [reconcileStates, setReconcileStates] = useState<Record<string, ReconcileState>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const getState = (txId: string): ReconcileState =>
    reconcileStates[txId] ?? { status: 'idle' };

  const handleReconcile = useCallback(async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    setReconcileStates(prev => ({ ...prev, [txId]: { status: 'loading' } }));

    try {
      // Derive a deterministic sandbox VPC account ID per transaction.
      // In production this would come from the VCN issuance step.
      const vpcAccountId = `VPC-ACCT-${txId.slice(-8).toUpperCase()}`;

      const result = await vpcService.Reporting.reconcilePayment({
        accountId: vpcAccountId,
        invoiceAmount: tx.amount,
        supplierName: tx.supplierName,
        invoiceNumber: tx.orderId,
      });

      setReconcileStates(prev => ({
        ...prev,
        [txId]: { status: result.matchStatus, result },
      }));
    } catch {
      setReconcileStates(prev => ({
        ...prev,
        [txId]: { status: 'unmatched' },
      }));
    }
  }, [transactions]);

  const handleReconcileAll = useCallback(async () => {
    const pending = transactions.filter(tx => {
      const s = getState(tx.id).status;
      return s === 'idle' || s === 'unmatched';
    });
    for (const tx of pending) {
      await handleReconcile(tx.id);
    }
  }, [transactions, reconcileStates, handleReconcile]); // eslint-disable-line react-hooks/exhaustive-deps

  const metrics = useMemo(() => {
    let usdTotal = 0;
    let usdcTotal = 0;
    let matchedCount = 0;

    transactions.forEach(tx => {
      if (tx.status === 'Settled') {
        if (tx.method === 'USD') usdTotal += tx.amount;
        else usdcTotal += tx.amount;
      }
      const s = getState(tx.id).status;
      if (s === 'matched' || s === 'partial_match') matchedCount++;
    });

    return { usdTotal, usdcTotal, totalCount: transactions.length, matchedCount };
  }, [transactions, reconcileStates]); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingCount = transactions.length - metrics.matchedCount;

  const filtered = useMemo(() => {
    if (!searchQuery) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(tx =>
      tx.supplierName.toLowerCase().includes(q) ||
      tx.orderId.toLowerCase().includes(q) ||
      tx.method.toLowerCase().includes(q),
    );
  }, [transactions, searchQuery]);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reconciliation</h1>
          <p className="text-sm text-slate-500">
            Match VCN charges against Visa Payment Controls transaction records via VPC Reporting API.
          </p>
        </div>
        {transactions.length > 0 && pendingCount > 0 && (
          <button
            onClick={handleReconcileAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1434CB] hover:bg-[#0F27B0] text-white text-sm font-semibold transition-colors"
          >
            <ShieldCheck size={14} />
            Reconcile All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Transactions"
          value={`${metrics.totalCount}`}
          icon={<FileText size={18} />}
        />
        <StatCard
          label="VPC Matched"
          value={`${metrics.matchedCount}`}
          icon={<CheckCircle2 size={18} />}
        />
        <StatCard
          label="Settled (USD)"
          value={`$${metrics.usdTotal.toLocaleString()}`}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Settled (USDC)"
          value={`$${metrics.usdcTotal.toLocaleString()}`}
          icon={<Wallet size={18} />}
        />
      </div>

      {/* Status banner */}
      {transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
            pendingCount === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          {pendingCount === 0
            ? <CheckCircle2 size={16} className="shrink-0" />
            : <AlertCircle size={16} className="shrink-0" />
          }
          <span>
            {pendingCount === 0
              ? 'All transactions reconciled via Visa VPC Reporting API.'
              : `${pendingCount} transaction${pendingCount !== 1 ? 's' : ''} pending VPC reconciliation — click Reconcile to match against VCN charges.`
            }
          </span>
        </motion.div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900 shrink-0">Transaction Ledger</h2>
          <div className="flex gap-2 items-center flex-1 max-w-xs">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search supplier or order…"
                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1434CB] focus:border-[#1434CB]"
              />
            </div>
            <button className="p-1.5 hover:bg-slate-50 hover:text-slate-600 rounded transition-colors text-slate-400" title="Filter">
              <Filter size={14} />
            </button>
          </div>
          {/* VPC API badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold shrink-0"
            style={{ color: '#60a5fa', background: 'rgba(20,52,203,0.08)', border: '1px solid rgba(74,123,255,0.2)' }}>
            <svg viewBox="0 0 72 24" style={{ height: 9, width: 'auto' }}>
              <path fill="currentColor" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
            </svg>
            VPC Reporting API
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="text-sm text-slate-500 p-8 text-center bg-slate-50">
            No transactions to reconcile. Complete a payment to populate this ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 w-[150px]">Order ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 w-[90px]">Method</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 w-[130px]">Amount</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500">Supplier</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 w-[220px]">VPC Match</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 text-right w-[120px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((tx) => {
                  const rs = getState(tx.id);
                  const isReconciled = rs.status === 'matched' || rs.status === 'partial_match';
                  return (
                    <motion.tr
                      key={tx.id}
                      layout
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-4 text-[12px] font-mono text-slate-500">
                        {tx.orderId}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-slate-600">{tx.method}</span>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-900">
                        ${tx.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-600">
                        {tx.supplierName}
                      </td>
                      <td className="px-5 py-4">
                        <AnimatePresence mode="wait">
                          <VPCMatchCell
                            key={rs.status}
                            txId={tx.id}
                            amount={tx.amount}
                            supplierName={tx.supplierName}
                            state={rs}
                            onReconcile={handleReconcile}
                          />
                        </AnimatePresence>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={isReconciled ? 'reconciled' : rs.status}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              isReconciled
                                ? 'bg-teal-50 text-teal-700'
                                : rs.status === 'unmatched'
                                ? 'bg-red-50 text-red-500'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isReconciled ? 'Reconciled' : rs.status === 'unmatched' ? 'No Match' : 'Pending'}
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

      {/* API note */}
      {transactions.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-slate-400">
          <FileCheck size={13} className="mt-0.5 shrink-0" />
          <span>
            Reconciliation calls <span className="font-mono text-slate-500">POST /vpc/v1/accounts/&#123;id&#125;/reconcile</span> — matches VCN charges by amount against the Visa VPC Reporting API. All calls are logged in{' '}
            <a href="/sdk-logs" className="text-[#1434CB] hover:underline font-medium">SDK Logs</a>.
          </span>
        </div>
      )}
    </motion.div>
  );
}
