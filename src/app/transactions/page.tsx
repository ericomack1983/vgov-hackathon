'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Coins, Brain, CheckCircle2, AlertTriangle,
  ArrowUpDown, Filter, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react';
import { usePayment } from '@/context/PaymentContext';
import { useAILedger, type LedgerEntry } from '@/context/AILedgerContext';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function scoreColor(v: number) {
  if (v >= 85) return '#10b981';
  if (v >= 65) return '#f59e0b';
  return '#ef4444';
}

function scoreBg(v: number) {
  if (v >= 85) return 'rgba(16,185,129,0.1)';
  if (v >= 65) return 'rgba(245,158,11,0.1)';
  return 'rgba(239,68,68,0.1)';
}

type SortKey = 'date' | 'amount' | 'confidence' | 'risk';
type FilterKey = 'all' | 'auto_approved' | 'manual_review' | 'rejected';

// ── Score mini bar ─────────────────────────────────────────────────────────

function MiniBar({ value, width = 56 }: { value: number; width?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 rounded-full bg-slate-100 overflow-hidden" style={{ width }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: scoreColor(value) }}
        />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color: scoreColor(value) }}>
        {value}
      </span>
    </div>
  );
}

// ── Expanded detail row ────────────────────────────────────────────────────

function LedgerDetail({ entry }: { entry: LedgerEntry }) {
  const dims = [
    { label: 'Legitimacy',   value: entry.scores.legitimacy },
    { label: 'Risk',         value: entry.scores.risk },
    { label: 'Historical',   value: entry.scores.historicalConsistency },
    { label: 'Compliance',   value: entry.scores.policyCompliance },
  ];

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <td colSpan={8} className="px-4 pb-3 pt-0">
        <div className="rounded-xl p-4"
          style={{ background: 'rgba(241,245,249,0.7)', border: '1px solid rgba(226,232,240,0.8)' }}>
          <div className="grid grid-cols-4 gap-4 mb-3">
            {dims.map((d) => (
              <div key={d.label}>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{d.label}</p>
                <MiniBar value={d.value} width={80} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span>Invoice ID: <span className="font-mono text-slate-700">{entry.invoiceId}</span></span>
            {entry.transactionId && (
              <span>Tx: <span className="font-mono text-slate-700">{entry.transactionId}</span></span>
            )}
            {entry.orderId && (
              <span>Order: <span className="font-mono text-slate-700">{entry.orderId}</span></span>
            )}
            <span className="ml-auto">
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

// ── AI Ledger row ─────────────────────────────────────────────────────────

function AILedgerRow({ entry, expanded, onToggle, index }: {
  entry: LedgerEntry;
  expanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const isApproved = entry.decision === 'auto_approved';
  const isRejected = entry.decision === 'rejected';

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        className="border-b border-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        {/* Invoice / Supplier */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#1434CB15,#6366f115)' }}>
              <Brain size={12} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{entry.invoiceNo}</p>
              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{entry.supplierName}</p>
            </div>
          </div>
        </td>

        {/* Amount */}
        <td className="px-4 py-3">
          <span className="text-sm font-bold text-slate-900">{fmt(entry.amount)}</span>
        </td>

        {/* Confidence */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black"
              style={{
                background: scoreBg(entry.scores.confidence),
                color: scoreColor(entry.scores.confidence),
                border: `1.5px solid ${scoreColor(entry.scores.confidence)}40`,
              }}
            >
              {entry.scores.confidence}
            </div>
            <div className="h-1 w-12 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${entry.scores.confidence}%`,
                  background: scoreColor(entry.scores.confidence),
                }}
              />
            </div>
          </div>
        </td>

        {/* Risk */}
        <td className="px-4 py-3">
          <MiniBar value={entry.scores.risk} />
        </td>

        {/* Decision */}
        <td className="px-4 py-3">
          <span
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold w-fit"
            style={{
              background: isApproved ? 'rgba(16,185,129,0.1)' : isRejected ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              color: isApproved ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b',
              border: `1px solid ${isApproved ? 'rgba(16,185,129,0.2)' : isRejected ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
            }}
          >
            {isApproved ? <CheckCircle2 size={8} /> : <AlertTriangle size={8} />}
            {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Review'}
          </span>
        </td>

        {/* Approval type */}
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
            entry.approvalType === 'auto'   ? 'bg-indigo-100 text-indigo-700' :
            entry.approvalType === 'manual' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-500'
          }`}>
            {entry.approvalType === 'auto' ? '⚡ Auto' : entry.approvalType === 'manual' ? 'Manual' : 'None'}
          </span>
        </td>

        {/* Payment */}
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
            entry.paymentTriggered ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {entry.paymentTriggered ? 'Triggered' : 'Pending'}
          </span>
        </td>

        {/* Expand toggle */}
        <td className="px-4 py-3 text-slate-300">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </motion.tr>

      <AnimatePresence>
        {expanded && <LedgerDetail entry={entry} key="detail" />}
      </AnimatePresence>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const { transactions } = usePayment();
  const { entries } = useAILedger();

  const [sortKey, setSortKey]     = useState<SortKey>('date');
  const [sortAsc, setSortAsc]     = useState(false);
  const [filterKey, setFilterKey] = useState<FilterKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<'ai' | 'classic'>('ai');

  // ── Filter + sort AI ledger entries ─────────────────────────────
  const filteredEntries = useMemo(() => {
    let list = filterKey === 'all' ? entries : entries.filter((e) => e.decision === filterKey);
    list = [...list].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'date')       diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortKey === 'amount')     diff = b.amount - a.amount;
      if (sortKey === 'confidence') diff = b.scores.confidence - a.scores.confidence;
      if (sortKey === 'risk')       diff = a.scores.risk - b.scores.risk;
      return sortAsc ? -diff : diff;
    });
    return list;
  }, [entries, filterKey, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sortedTx = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const latestId = sortedTx[0]?.id;

  // ── Summary stats ────────────────────────────────────────────────
  const autoApproved  = entries.filter((e) => e.decision === 'auto_approved').length;
  const manualReview  = entries.filter((e) => e.decision === 'manual_review').length;
  const avgConfidence = entries.length
    ? Math.round(entries.reduce((s, e) => s + e.scores.confidence, 0) / entries.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}>
            <Brain size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Transaction Ledger</h1>
            <p className="text-sm text-slate-500">AI-scored invoices &amp; payment records</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
          {(['ai', 'classic'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'ai' ? '⚡ AI Ledger' : 'Classic'}
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Tab ── */}
      {activeTab === 'ai' && (
        <>
          {/* Stats bar */}
          {entries.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: 'AI Invoices', value: entries.length, color: '#6366f1', bg: 'bg-indigo-50' },
                { label: 'Auto-Approved', value: autoApproved, color: '#10b981', bg: 'bg-emerald-50' },
                { label: 'Under Review', value: manualReview, color: '#f59e0b', bg: 'bg-amber-50' },
                { label: 'Avg Confidence', value: `${avgConfidence}%`, color: '#1434CB', bg: 'bg-blue-50' },
              ].map((stat) => (
                <div key={stat.label}
                  className={`${stat.bg} rounded-xl px-4 py-3 flex items-center gap-3`}>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {entries.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg,#1434CB15,#6366f115)' }}>
                <Sparkles size={22} className="text-indigo-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">No AI-scored invoices yet</p>
              <p className="text-xs text-slate-400">
                Submit an invoice through the Invoice step — the AI pipeline will score and record it here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Toolbar */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Filter size={13} className="text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium">Filter:</span>
                </div>
                {(['all', 'auto_approved', 'manual_review', 'rejected'] as FilterKey[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterKey(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                      filterKey === f
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {f === 'all' ? 'All' :
                     f === 'auto_approved' ? '✓ Approved' :
                     f === 'manual_review' ? '⚠ Review' :
                     '✗ Rejected'}
                  </button>
                ))}
                <span className="ml-auto text-[10px] text-slate-400">
                  {filteredEntries.length} record{filteredEntries.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600"
                        onClick={() => toggleSort('amount')}>
                        <span className="flex items-center gap-1">
                          Amount <ArrowUpDown size={10} />
                        </span>
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600"
                        onClick={() => toggleSort('confidence')}>
                        <span className="flex items-center gap-1">
                          Confidence <ArrowUpDown size={10} />
                        </span>
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600"
                        onClick={() => toggleSort('risk')}>
                        <span className="flex items-center gap-1">
                          Risk Score <ArrowUpDown size={10} />
                        </span>
                      </th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Decision</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approval</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry, i) => (
                      <AILedgerRow
                        key={entry.id}
                        entry={entry}
                        index={i}
                        expanded={expandedId === entry.id}
                        onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Classic Tab ── */}
      {activeTab === 'classic' && (
        <>
          <p className="text-sm text-slate-500 mb-4">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </p>
          {sortedTx.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <p className="text-sm text-slate-500">No transactions yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 text-xs font-medium text-slate-500">Method</th>
                      <th className="px-4 py-3 text-xs font-medium text-slate-500">Amount</th>
                      <th className="px-4 py-3 text-xs font-medium text-slate-500">Supplier</th>
                      <th className="px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                      <th className="px-4 py-3 text-xs font-medium text-slate-500">Order ID</th>
                      <th className="px-4 py-3 text-xs font-medium text-slate-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTx.map((tx) => {
                      const isLatest = tx.id === latestId;
                      return (
                        <motion.tr
                          key={tx.id}
                          initial={isLatest ? { backgroundColor: '#eef2ff' } : false}
                          animate={isLatest ? { backgroundColor: '#ffffff' } : {}}
                          transition={{ duration: 2.5, ease: 'easeOut' }}
                          className="border-b border-slate-50 hover:bg-slate-50/50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {tx.method === 'USD' ? (
                                <>
                                  <div className="w-6 h-6 rounded-md bg-[#1434CB]/10 flex items-center justify-center">
                                    <CreditCard size={12} className="text-[#1434CB]" />
                                  </div>
                                  <span className="bg-[#D6DFFA] text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">USD</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center">
                                    <Coins size={12} className="text-purple-500" />
                                  </div>
                                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">USDC</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">${tx.amount.toLocaleString()}</span>
                              {isLatest && (
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Latest</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{tx.supplierName}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              tx.status === 'Settled' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 font-mono">{tx.orderId}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
