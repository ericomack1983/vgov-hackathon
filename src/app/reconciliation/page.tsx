'use client';

import { Fragment, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayment } from '@/context/PaymentContext';
import {
  FileCheck, Search, Filter, DollarSign, Wallet, FileText,
  CheckCircle2, AlertCircle, Loader2, ShieldCheck, Activity, Clock, RefreshCw,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { vpcService, type VPCReconciliationResult } from '@/lib/visa-sdk';
import type { Transaction } from '@/lib/mock-data/types';
import { useT } from '@/context/LanguageContext';
import { useSidebarActions } from '@/context/SidebarActionsContext';
import { InvoiceAnalysisPanel } from '@/components/ai/InvoiceAnalysisPanel';

// ── Reconciliation state per transaction ──────────────────────────────────────

type ReconcileStatus = 'idle' | 'loading' | 'matched' | 'partial_match' | 'unmatched';

interface ReconcileState {
  status: ReconcileStatus;
  result?: VPCReconciliationResult;
  /** What CyberSource holds for this authorization, fetched at reconcile time. */
  cybs?: CybsRecord;
  cybsError?: string;
}

/** The processor's own record, read back from the Transaction Details API. */
interface CybsRecord {
  transactionId: string;
  reference?: string;
  amount?: string;
  currency?: string;
  taxAmount?: string;
  approvalCode?: string;
  applications?: string[];
  shipTo?: { postalCode?: string; country?: string; locality?: string; administrativeArea?: string };
  lineItems?: {
    productName?: string;
    productSku?: string;
    quantity?: number;
    unitPrice?: string;
    taxAmount?: string;
    commodityCode?: string;
    unitOfMeasure?: string;
  }[];
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

// ── Level II / III detail ─────────────────────────────────────────────────────

/**
 * What the card carried and what the processor holds, side by side.
 *
 * Reconciliation without this is amount-matching: two numbers agreeing tells you
 * very little. The Level II/III set is what lets a row be checked against the
 * invoice it belongs to — PO, cost centre, tax treatment, and the line item.
 */
/**
 * Ask CyberSource where the transaction actually stands right now.
 *
 * The row's data was captured at payment time; a Decision Manager review is
 * resolved later by a human, and the capture settles in a batch after that. Both
 * outcomes only exist at the processor, so this re-queries rather than trusting
 * what the ledger recorded.
 *
 * reasonCode 480 is the review flag; 100 means the transaction is accepted.
 */
interface StatusCheck {
  loading: boolean;
  at?: string;
  settled?: boolean;
  settlementNote?: string;
  reviewOpen?: boolean;
  error?: string;
}

function EnhancedDetail({ tx, cybs, cybsError }: {
  tx: Transaction;
  cybs?: CybsRecord;
  cybsError?: string;
}) {
  const t = useT();
  const [check, setCheck] = useState<StatusCheck>({ loading: false });

  const runCheck = useCallback(async () => {
    if (!tx.authorizationId) return;
    setCheck({ loading: true });
    try {
      const [auth, capture] = await Promise.all([
        fetch(`/api/payments/card/${tx.authorizationId}`).then((r) => r.json()),
        tx.captureId
          ? fetch(`/api/payments/card/${tx.captureId}`).then((r) => r.json())
          : Promise.resolve({ ok: false }),
      ]);

      if (!auth.ok) {
        setCheck({ loading: false, error: auth.reason ?? 'Lookup failed' });
        return;
      }

      // ics_bill on the capture record is the settlement leg.
      const captured = !!capture.ok && (capture.applications ?? []).includes('ics_bill');
      // A resolved review no longer reports 480 on the authorization.
      const reviewOpen = String(auth.reasonCode) === '480';

      setCheck({
        loading: false,
        at: new Date().toLocaleTimeString(),
        settled: captured,
        settlementNote: captured ? t('review.captured') : t('review.notCaptured'),
        reviewOpen,
      });
    } catch {
      setCheck({ loading: false, error: 'Could not reach CyberSource' });
    }
  }, [tx.authorizationId, tx.captureId, t]);

  const e = tx.enhanced;
  if (!e && !cybs) return null;

  const ledgerAmount = tx.amount.toFixed(2);
  const cybsAmount = cybs?.amount ? Number(cybs.amount).toFixed(2) : undefined;
  const amountAgrees = cybsAmount !== undefined && cybsAmount === ledgerAmount;
  const line = cybs?.lineItems?.[0];

  const levelTwo = [
    { label: 'Invoice',      value: e?.invoiceNumber },
    { label: 'PO Number',    value: e?.purchaseOrderNumber },
    { label: 'Tax',          value: e ? (e.taxable ? `Taxable · $${e.taxAmount ?? '0.00'}` : 'Exempt') : undefined },
    { label: 'Cost Center',  value: e?.costCenter },
    { label: 'MCC',          value: e?.merchantCategoryCode },
    { label: 'Acceptor ID',  value: e?.cardAcceptorReferenceNumber },
    { label: 'Statement',    value: e?.statementNote },
  ].filter((r) => r.value);

  const levelThree = [
    { label: 'Line Items', value: e?.lineItemCount ? String(e.lineItemCount) : undefined },
    { label: 'Commodity',  value: e?.commodityCodes?.join(', ') || line?.commodityCode },
    { label: 'SKU',        value: line?.productSku },
    { label: 'Ship To',    value: e?.shipToPostalCode ?? cybs?.shipTo?.postalCode },
    { label: 'Ship From',  value: e?.shipFromPostalCode },
  ].filter((r) => r.value);

  return (
    <div className="bg-slate-50/70 border-t border-slate-100 px-5 py-4">
      <div className="grid gap-5 md:grid-cols-3">

        {/* Level II */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Level II · Purchase</p>
          <div className="space-y-1">
            {levelTwo.length === 0 && <p className="text-[11px] text-slate-400">No Level II data on this payment.</p>}
            {levelTwo.map((r) => (
              <div key={r.label} className="flex justify-between gap-3 text-[11px]">
                <span className="text-slate-400 shrink-0">{r.label}</span>
                <span className="font-mono text-slate-600 text-right break-all">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Level III */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Level III · Line Detail</p>
          <div className="space-y-1">
            {levelThree.length === 0 && <p className="text-[11px] text-slate-400">No Level III data on this payment.</p>}
            {levelThree.map((r) => (
              <div key={r.label} className="flex justify-between gap-3 text-[11px]">
                <span className="text-slate-400 shrink-0">{r.label}</span>
                <span className="font-mono text-slate-600 text-right break-all">{r.value}</span>
              </div>
            ))}
            {line?.productName && (
              <div className="pt-1.5 mt-1 border-t border-dashed border-slate-200 flex justify-between gap-3 text-[11px]">
                <span className="text-slate-500 truncate">{line.productName}</span>
                <span className="font-mono font-semibold text-slate-700 shrink-0">
                  ${Number(line.unitPrice ?? 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Processor verification */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Verified at CyberSource</p>
          {cybsError && <p className="text-[11px] text-amber-600">{cybsError}</p>}
          {cybs && (
            <div className="space-y-1">
              <div className="flex justify-between gap-3 text-[11px]">
                <span className="text-slate-400 shrink-0">Ledger amount</span>
                <span className="font-mono text-slate-600">${tx.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-3 text-[11px]">
                <span className="text-slate-400 shrink-0">Processor amount</span>
                <span className={`font-mono font-semibold ${amountAgrees ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${Number(cybs.amount ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-[11px]">
                <span className="text-slate-400 shrink-0">Approval</span>
                <span className="font-mono text-slate-600">{cybs.approvalCode ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-3 text-[11px]">
                <span className="text-slate-400 shrink-0">Applications</span>
                <span className="font-mono text-slate-600 text-right break-all">{cybs.applications?.join(' · ') ?? '—'}</span>
              </div>
              {tx.review && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
                  <Clock size={10} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-snug">{t('review.note')}</p>
                </div>
              )}

              {/* Live status — settlement and the risk decision both resolve later */}
              {tx.authorizationId && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={runCheck}
                    disabled={check.loading}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-[#1434CB] bg-white border border-[#1434CB]/25 hover:bg-[#EEF1FD] hover:border-[#1434CB]/50 transition-colors disabled:opacity-60 shadow-sm"
                  >
                    {check.loading
                      ? <Loader2 size={11} className="animate-spin" />
                      : <RefreshCw size={11} />}
                    {check.loading ? t('review.checking') : t('review.check')}
                  </button>

                  <AnimatePresence>
                    {!check.loading && (check.settlementNote || check.error) && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mt-2 space-y-1"
                      >
                        {check.error ? (
                          <p className="text-[10px] text-red-600">{check.error}</p>
                        ) : (
                          <>
                            <div className="flex justify-between gap-3 text-[11px]">
                              <span className="text-slate-400 shrink-0">{t('review.settlement')}</span>
                              <span className={`font-semibold text-right ${check.settled ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {check.settlementNote}
                              </span>
                            </div>
                            <div className="flex justify-between gap-3 text-[11px]">
                              <span className="text-slate-400 shrink-0">{t('review.decision')}</span>
                              <span className={`font-semibold text-right ${check.reviewOpen ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {check.reviewOpen
                                  ? `⏳ ${t('review.stillOpen')}`
                                  : `✓ ${t('review.approved')}`}
                              </span>
                            </div>
                            <p className="text-[9px] font-mono text-slate-300 text-right">
                              {t('review.checkedAt')} {check.at}
                            </p>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${
                amountAgrees ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}>
                {amountAgrees ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                {amountAgrees ? 'Three-way match: invoice · ledger · processor' : 'Amount disagrees with processor'}
              </div>
            </div>
          )}
          {!cybs && !cybsError && (
            <p className="text-[11px] text-slate-400">No card authorization on this transaction.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Pull the settled record from CyberSource. Never throws: a lookup failure
 * downgrades the row to ledger-only reconciliation rather than failing the match.
 */
async function fetchCybsRecord(authorizationId?: string): Promise<{ cybs?: CybsRecord; cybsError?: string }> {
  if (!authorizationId) return {};
  try {
    const res = await fetch(`/api/payments/card/${authorizationId}`);
    const json = await res.json();
    if (!json.ok) return { cybsError: json.reason ?? 'Lookup failed' };
    return { cybs: json as CybsRecord };
  } catch {
    return { cybsError: 'Could not reach CyberSource' };
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReconciliationPage() {
  const t = useT();
  const { transactions } = usePayment();
  const { setActions, clearActions } = useSidebarActions();
  const [reconcileStates, setReconcileStates] = useState<Record<string, ReconcileState>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisInvoice, setAnalysisInvoice] = useState<{
    supplierId: string; rfpId: string; amount: number;
    description: string; invoiceNo: string; supplierName: string;
    autoMatched: boolean;
  } | null>(null);
  // Always-current ref so the once-registered sidebar action invokes the latest
  // closure: open the AI analysis lightbox AND reconcile all pending via VPC.
  const autoReconcileRef = useRef<() => void>(() => {});

  // Register sidebar action — plays the AI analysis lightbox and runs VPC
  // reconciliation across every pending transaction (PanamaCompra, Amazon, MELI).
  useEffect(() => {
    setActions([{
      id: 'auto-reconcile',
      label: 'action.automaticReconciliation',
      variant: 'ai',
      onClick: () => { autoReconcileRef.current(); },
    }]);
    return () => clearActions();
  }, [setActions, clearActions]);

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

      // VPC match and the CyberSource lookup are independent — run them together
      // rather than making the row wait for one before starting the other.
      const [result, cybsLookup] = await Promise.all([
        vpcService.Reporting.reconcilePayment({
          accountId: vpcAccountId,
          invoiceAmount: tx.amount,
          supplierName: tx.supplierName,
          invoiceNumber: tx.orderId,
        }),
        fetchCybsRecord(tx.authorizationId),
      ]);

      setReconcileStates(prev => ({
        ...prev,
        [txId]: { status: result.matchStatus, result, ...cybsLookup },
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

  // Sidebar "Automatic Reconciliation": open the AI analysis lightbox for a
  // representative pending purchase, then reconcile every pending tx via VPC.
  autoReconcileRef.current = () => {
    const pending = transactions.filter((tx) => {
      const s = getState(tx.id).status;
      return s === 'idle' || s === 'unmatched';
    });
    const rep = pending[0] ?? transactions[0];
    if (rep) {
      setAnalysisInvoice({
        supplierId: rep.supplierId,
        rfpId: rep.rfpId,
        amount: rep.amount,
        description: `Invoice from ${rep.supplierName}`,
        invoiceNo: rep.orderId,
        supplierName: rep.supplierName,
        autoMatched: true,
      });
    }
    void handleReconcileAll();
  };

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
    <>
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{t('page.reconciliation.title')}</h1>
          <p className="text-sm text-slate-500">
            {t('page.reconciliation.subtitle')}
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
            <svg viewBox="0 0 71 23" fill="none" style={{ height: 9, width: 'auto' }}>
              <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"/>
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
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 w-[170px]">Auth ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 w-[220px]">VPC Match</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 text-right w-[120px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((tx) => {
                  const rs = getState(tx.id);
                  const isReconciled = rs.status === 'matched' || rs.status === 'partial_match';
                  return (
                    <Fragment key={tx.id}>
                    <motion.tr
                      layout
                      className={`hover:bg-slate-50/50 transition-colors ${isReconciled ? '' : 'border-b border-slate-50'}`}
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
                        {tx.authorizationId ? (
                          <div className="leading-tight">
                            <span
                              title={tx.authorizationId}
                              className="block text-[11px] font-mono text-slate-600 truncate max-w-[150px]"
                            >
                              {tx.authorizationId}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              CyberSource{tx.approvalCode ? ` · ${tx.approvalCode}` : ''}
                            </span>
                            {tx.review && (
                              <span
                                title={t('review.pending')}
                                className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200"
                              >
                                <Clock size={9} />
                                {t('review.badge')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 font-mono">—</span>
                        )}
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
                            {isReconciled ? t('recon.reconciled') : rs.status === 'unmatched' ? t('recon.noMatch') : t('recon.pending')}
                          </motion.span>
                          {tx.review && (
                            <span className="block mt-1 text-[9px] font-semibold text-amber-600 whitespace-nowrap">
                              {t('review.awaiting')}
                            </span>
                          )}
                        </AnimatePresence>
                      </td>
                    </motion.tr>

                    {/* Level II / III — what the card carried, checked against the processor */}
                    {isReconciled && (
                      <tr className="border-b border-slate-100">
                        <td colSpan={7} className="p-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                            <EnhancedDetail tx={tx} cybs={rs.cybs} cybsError={rs.cybsError} />
                          </motion.div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
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

      {/* ── AI analysis lightbox (Automatic Reconciliation) ── */}
      <AnimatePresence>
        {analysisInvoice && (
          <InvoiceAnalysisPanel
            rfpId={analysisInvoice.rfpId}
            supplierId={analysisInvoice.supplierId}
            supplierName={analysisInvoice.supplierName}
            amount={analysisInvoice.amount}
            description={analysisInvoice.description}
            invoiceNo={analysisInvoice.invoiceNo}
            autoMatched={analysisInvoice.autoMatched}
            onClose={() => setAnalysisInvoice(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
