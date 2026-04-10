'use client';

import { use, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { useUI } from '@/context/UIContext';
import { useSidebarActions } from '@/context/SidebarActionsContext';
import { RFPStatusTimeline } from '@/components/procurement/RFPStatusTimeline';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { RankedSupplierRow } from '@/components/ai/RankedSupplierRow';
import { ExplainabilityPanel } from '@/components/ai/ExplainabilityPanel';
import { OverrideForm } from '@/components/ai/OverrideForm';
import { scoreBids, generateNarrative, generateOverrideNarrative } from '@/lib/ai-engine';
import Link from 'next/link';
import { ArrowLeft, FileText, Bot, CreditCard, RefreshCw, CalendarRange, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { EvaluationOverlay } from '@/components/ai/EvaluationOverlay';
import { InvoiceOverlay } from '@/components/procurement/InvoiceOverlay';
import { ConfettiCanvas, useConfetti } from '@/components/ui/ConfettiCanvas';
import { AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { RFPStatus, ScoredBid } from '@/lib/mock-data/types';
import toast from 'react-hot-toast';

const statusVariant: Record<RFPStatus, 'default' | 'success' | 'warning' | 'error'> = {
  Draft: 'default',
  Open: 'warning',
  Evaluating: 'warning',
  Awarded: 'success',
  Paid: 'success',
};

export default function RfpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { rfps, suppliers, updateRFP, setEvaluation, setOverride } = useProcurement();
  const { role } = useUI();
  const { setActions, clearActions } = useSidebarActions();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showInvoiceOverlay, setShowInvoiceOverlay] = useState(false);
  const { handleRef: confettiRef, fire: fireConfetti } = useConfetti();

  const rfp = rfps.find((r) => r.id === id);

  if (!rfp) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Link
          href="/rfp"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to RFPs
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-slate-900">RFP not found</p>
          <p className="mt-2 text-sm text-slate-500">
            The procurement request you are looking for does not exist.
          </p>
        </div>
      </motion.div>
    );
  }

  function handlePublish() {
    updateRFP(rfp!.id, { status: 'Open' });
  }

  function handleEvaluate() {
    setIsEvaluating(true);
  }

  function handleOverlayDone() {
    const results = scoreBids(rfp!.bids, suppliers, rfp!);
    setEvaluation(rfp!.id, results);
    updateRFP(rfp!.id, { status: 'Evaluating' });
    setIsEvaluating(false);
    toast.success('AI evaluation complete');
  }

  // Determine effective winner for display
  const evaluationResults = rfp.evaluationResults;
  let effectiveWinnerId: string | undefined;
  let winnerScoredBid: ScoredBid | undefined;

  if (evaluationResults && evaluationResults.length > 0) {
    if (rfp.overrideWinnerId) {
      effectiveWinnerId = rfp.overrideWinnerId;
      winnerScoredBid = evaluationResults.find(
        (sb) => sb.supplier.id === rfp.overrideWinnerId
      ) || evaluationResults[0];
    } else {
      effectiveWinnerId = evaluationResults[0].supplier.id;
      winnerScoredBid = evaluationResults[0];
    }
  }

  // Register / update sidebar action buttons whenever RFP state changes
  useEffect(() => {
    if (role !== 'gov' || !rfp) return;
    const actions = [];

    if (!rfp.evaluationResults && rfp.bids.length >= 2) {
      actions.push({
        id: 'evaluate',
        label: 'Run AI Evaluation',
        variant: 'ai' as const,
        onClick: handleEvaluate,
        disabled: isEvaluating,
      });
    }
    if (rfp.status === 'Evaluating') {
      actions.push({
        id: 'award',
        label: 'Award Supplier',
        variant: 'award' as const,
        onClick: () => {
          updateRFP(rfp.id, { status: 'Awarded', selectedWinnerId: effectiveWinnerId });
          toast.success('Supplier awarded');
          fireConfetti();
        },
      });
    }
    if (rfp.status === 'Awarded') {
      actions.push({
        id: 'payment',
        label: 'Proceed to Payment',
        variant: 'payment' as const,
        onClick: () => setShowInvoiceOverlay(true),
      });
    }

    setActions(actions);
    return () => clearActions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, rfp?.status, rfp?.evaluationResults, rfp?.bids.length, isEvaluating, effectiveWinnerId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <ConfettiCanvas handleRef={confettiRef} />

      <AnimatePresence>
        {isEvaluating && <EvaluationOverlay onDone={handleOverlayDone} />}
      </AnimatePresence>

      <AnimatePresence>
        {showInvoiceOverlay && winnerScoredBid && (
          <InvoiceOverlay
            rfpId={rfp.id}
            amount={winnerScoredBid.bid.amount}
            supplierName={winnerScoredBid.supplier.name}
            rfpTitle={rfp.title}
            onClose={() => setShowInvoiceOverlay(false)}
          />
        )}
      </AnimatePresence>

      <Link
        href="/rfp"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to RFPs
      </Link>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-xl font-semibold text-slate-900">{rfp.title}</h1>
        <StatusBadge status={rfp.status} variant={statusVariant[rfp.status]} />
        {rfp.recurring && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
            style={{ background: 'linear-gradient(135deg,#EEF1FD,#f0f4ff)', borderColor: '#dde3fc', color: '#1434CB' }}>
            <RefreshCw size={10} />
            Recurring Contract
          </span>
        )}
      </div>

      <div className="mb-6">
        <RFPStatusTimeline currentStatus={rfp.status} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Description</h2>
        <p className="text-sm text-slate-700">{rfp.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-xs text-slate-500">Category</p>
            <p className="text-sm font-medium text-slate-900">{rfp.category}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Budget</p>
            <p className="text-sm font-medium text-slate-900">${rfp.budgetCeiling.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Deadline</p>
            <p className="text-sm font-medium text-slate-900">
              {format(new Date(rfp.deadline), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Created</p>
            <p className="text-sm font-medium text-slate-900">
              {format(new Date(rfp.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Recurring Contract Terms ─────────────────────────────────── */}
      {rfp.recurring && (() => {
        const rec = rfp.recurring!;
        const INTERVAL_LABEL: Record<string, string> = {
          monthly: 'Monthly', quarterly: 'Quarterly', biannual: 'Bi-Annual', annual: 'Annual',
        };
        const INTERVAL_COLOR: Record<string, string> = {
          monthly: 'bg-violet-50 text-violet-700 border-violet-200',
          quarterly: 'bg-sky-50 text-sky-700 border-sky-200',
          biannual: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          annual: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        const paidCount = rec.installments.filter(i => i.status === 'paid').length;
        const pendingCount = rec.installments.filter(i => i.status === 'pending' || i.status === 'overdue').length;
        const pct = Math.round((paidCount / rec.totalInstallments) * 100);
        const totalValue = rec.totalInstallments * rec.installmentAmount;
        const paidAmount = paidCount * rec.installmentAmount;
        const nextDue = rec.installments.find(i => i.status !== 'paid');

        return (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="mt-4 rounded-xl border overflow-hidden"
            style={{ borderColor: '#dde3fc' }}
          >
            {/* card header */}
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ background: 'linear-gradient(to right,#EEF1FD,#f3f5ff)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}>
                  <RefreshCw size={11} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-[#1434CB]">Recurring Contract Terms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${INTERVAL_COLOR[rec.interval]}`}>
                  {INTERVAL_LABEL[rec.interval]}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                  {rec.contractYears}yr
                </span>
                {pendingCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide flex items-center gap-1">
                    <AlertCircle size={8} /> {pendingCount} Pending
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white px-5 py-4 space-y-4">
              {/* key metrics grid */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { label: 'Total Contract Value', value: `$${totalValue.toLocaleString()}` },
                  { label: 'Per Installment', value: `$${rec.installmentAmount.toLocaleString()}` },
                  { label: 'Installments', value: `${rec.totalInstallments} payments` },
                  { label: 'Start Date', value: format(new Date(rec.startDate), 'MMM d, yyyy') },
                  { label: 'End Date', value: format(new Date(rec.endDate), 'MMM d, yyyy') },
                  { label: 'Total Paid', value: `$${paidAmount.toLocaleString()}`, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wide mb-0.5">{label}</p>
                    <p className={`text-sm font-bold ${highlight ? 'text-emerald-700' : 'text-slate-800'}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">{paidCount} of {rec.totalInstallments} installments paid</span>
                  <span className="text-xs font-bold text-[#1434CB]">{pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(to right,#1434CB,#6366f1)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
              </div>

              {/* installment dot timeline */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Timeline</p>
                <div className="flex items-end gap-2 flex-wrap">
                  {rec.installments.map((inst, idx) => {
                    const isPaid    = inst.status === 'paid';
                    const isPending = inst.status === 'pending';
                    const isOverdue = inst.status === 'overdue';
                    const dueStr = format(new Date(inst.dueDate), 'MMM d, yyyy');
                    const title = isPaid ? `Paid · ${dueStr}` : isPending ? `Pending · due ${dueStr}` : isOverdue ? `Overdue · ${dueStr}` : `Scheduled · ${dueStr}`;
                    return (
                      <div key={inst.id} className="flex flex-col items-center gap-1" title={title}>
                        <div className={`w-3 h-3 rounded-full transition-all ${
                          isPaid    ? 'bg-emerald-500' :
                          isPending ? 'bg-amber-400 ring-2 ring-amber-300 ring-offset-1 animate-pulse' :
                          isOverdue ? 'bg-red-500 ring-2 ring-red-300 ring-offset-1' :
                                      'bg-slate-200'
                        }`} />
                        {(isPaid || isPending || isOverdue) && (
                          <span className="text-[8px] text-slate-400 leading-none">
                            {format(new Date(inst.dueDate), 'MMM yy')}
                          </span>
                        )}
                        {!isPaid && !isPending && !isOverdue && idx === rec.installments.indexOf(nextDue!) && (
                          <span className="text-[8px] text-[#1434CB] font-semibold leading-none">next</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* next installment highlight */}
              {nextDue && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  nextDue.status === 'pending' || nextDue.status === 'overdue'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  {nextDue.status === 'pending' || nextDue.status === 'overdue'
                    ? <AlertCircle size={14} className="text-amber-500 shrink-0" />
                    : <CalendarRange size={14} className="text-[#1434CB] shrink-0" />
                  }
                  <div>
                    <p className={`text-xs font-semibold ${nextDue.status === 'pending' ? 'text-amber-800' : 'text-slate-700'}`}>
                      {nextDue.status === 'pending'
                        ? 'Payment action required'
                        : nextDue.status === 'overdue'
                          ? 'Overdue payment'
                          : 'Next scheduled installment'
                      }
                    </p>
                    <p className={`text-xs ${nextDue.status === 'pending' ? 'text-amber-700' : 'text-slate-500'}`}>
                      <span className="font-bold">${nextDue.amount.toLocaleString()}</span>
                      {' '}due on {format(new Date(nextDue.dueDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border
                    bg-white text-slate-500 border-slate-200">
                    #{rec.installments.indexOf(nextDue) + 1} of {rec.totalInstallments}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })()}

      {role === 'gov' && rfp.status === 'Draft' && (
        <div className="mt-4">
          <button
            onClick={handlePublish}
            className="bg-[#1434CB] hover:bg-[#0F27B0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Publish RFP
          </button>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Submitted Bids</h2>
          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
            {rfp.bids.length}
          </span>
        </div>

        {rfp.bids.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-500">No bids submitted yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Delivery</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rfp.bids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {bid.supplierName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      ${bid.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{bid.deliveryDays} days</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                      {bid.notes}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {format(new Date(bid.submittedAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Evaluation Section - Gov only */}
      {role === 'gov' && (
        <div className="mt-8">
          {/* Awaiting bids notice (button moved to sidebar) */}
          {!evaluationResults && rfp.bids.length < 2 && (
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <p className="text-base font-semibold text-slate-900">Awaiting evaluation</p>
              <p className="mt-2 text-sm text-slate-500">
                At least 2 bids are required before running AI evaluation.
              </p>
            </div>
          )}

          {/* AI Results Section */}
          {evaluationResults && evaluationResults.length > 0 && winnerScoredBid && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-[#1434CB]" />
                <h2 className="text-xl font-semibold text-slate-900">AI Evaluation Results</h2>
              </div>

              {/* Ranked supplier list */}
              {rfp.status === 'Evaluating' && (
                <p className="text-xs text-slate-400">
                  Click a supplier to select them as the award recipient. The AI best value is pre-selected.
                </p>
              )}
              <div className="space-y-4">
                {evaluationResults.map((scoredBid) => {
                  const aiBestId = evaluationResults[0].supplier.id;
                  const isAiBest = scoredBid.supplier.id === aiBestId;
                  const isSelected = scoredBid.supplier.id === effectiveWinnerId;
                  const canSelect = rfp.status === 'Evaluating';

                  return (
                    <div key={scoredBid.bid.id} className="relative">
                      <RankedSupplierRow
                        scoredBid={scoredBid}
                        isSelected={isSelected}
                        isAiBest={isAiBest}
                        onSelect={canSelect ? () => {
                          if (isAiBest) {
                            // Clicking AI best clears any manual override
                            updateRFP(rfp.id, { overrideWinnerId: undefined, overrideJustification: undefined });
                          } else {
                            updateRFP(rfp.id, { overrideWinnerId: scoredBid.supplier.id });
                          }
                        } : undefined}
                      />
                      {rfp.overrideWinnerId && scoredBid.supplier.id === rfp.overrideWinnerId && (
                        <span className="absolute top-4 right-24 inline-flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Manually Selected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Override warning panel — shown in real-time when a non-best supplier is manually selected */}
              {rfp.overrideWinnerId && (() => {
                const overrideSelected = evaluationResults.find(sb => sb.supplier.id === rfp.overrideWinnerId);
                const aiBest = evaluationResults[0];
                if (!overrideSelected || overrideSelected.supplier.id === aiBest.supplier.id) return null;
                return (
                  <ExplainabilityPanel
                    key={rfp.overrideWinnerId}
                    narrative={generateOverrideNarrative(overrideSelected, aiBest)}
                    isOverride
                  />
                );
              })()}

              {/* Explainability Panel */}
              <ExplainabilityPanel narrative={generateNarrative(evaluationResults)} />

              {/* Override Form - shown when Evaluating and no override yet */}
              {rfp.status === 'Evaluating' && !rfp.overrideWinnerId && (
                <OverrideForm
                  scoredBids={evaluationResults}
                  currentWinnerId={evaluationResults[0].supplier.id}
                  onOverride={(winnerId, justification) => {
                    setOverride(rfp.id, winnerId, justification);
                    toast.success('Override applied');
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
