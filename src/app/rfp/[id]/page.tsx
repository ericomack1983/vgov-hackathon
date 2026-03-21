'use client';

import { use, useState } from 'react';
import { motion } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { useUI } from '@/context/UIContext';
import { RFPStatusTimeline } from '@/components/procurement/RFPStatusTimeline';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { RankedSupplierRow } from '@/components/ai/RankedSupplierRow';
import { ScoreRadarChart } from '@/components/ai/ScoreRadarChart';
import { ExplainabilityPanel } from '@/components/ai/ExplainabilityPanel';
import { OverrideForm } from '@/components/ai/OverrideForm';
import { scoreBids, generateNarrative } from '@/lib/ai-engine';
import Link from 'next/link';
import { ArrowLeft, FileText, Bot, Loader2 } from 'lucide-react';
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
  const [isEvaluating, setIsEvaluating] = useState(false);

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
    setTimeout(() => {
      const results = scoreBids(rfp!.bids, suppliers, rfp!);
      setEvaluation(rfp!.id, results);
      updateRFP(rfp!.id, { status: 'Evaluating' });
      setIsEvaluating(false);
      toast.success('AI evaluation complete');
    }, 1500);
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

      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-xl font-semibold text-slate-900">{rfp.title}</h1>
        <StatusBadge status={rfp.status} variant={statusVariant[rfp.status]} />
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

      {role === 'gov' && rfp.status === 'Draft' && (
        <div className="mt-4">
          <button
            onClick={handlePublish}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
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
          {/* Run AI Evaluation button - shown when no evaluation results yet */}
          {!evaluationResults && (
            <>
              {rfp.bids.length < 2 ? (
                <div className="bg-slate-50 rounded-xl p-6 text-center">
                  <p className="text-base font-semibold text-slate-900">Awaiting evaluation</p>
                  <p className="mt-2 text-sm text-slate-500">
                    At least 2 bids are required before running AI evaluation.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleEvaluate}
                  disabled={rfp.bids.length < 2 || isEvaluating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isEvaluating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Bot size={16} />
                  )}
                  {isEvaluating ? 'Analyzing bids...' : 'Run AI Evaluation'}
                </button>
              )}
            </>
          )}

          {/* AI Results Section */}
          {evaluationResults && evaluationResults.length > 0 && winnerScoredBid && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-indigo-600" />
                <h2 className="text-xl font-semibold text-slate-900">AI Evaluation Results</h2>
              </div>

              {/* Ranked supplier list */}
              <div className="space-y-4">
                {evaluationResults.map((scoredBid) => {
                  // Handle override display: swap winner visual treatment
                  const displayBid = rfp.overrideWinnerId
                    ? {
                        ...scoredBid,
                        isWinner: scoredBid.supplier.id === rfp.overrideWinnerId,
                      }
                    : scoredBid;

                  return (
                    <div key={scoredBid.bid.id} className="relative">
                      <RankedSupplierRow scoredBid={displayBid} />
                      {rfp.overrideWinnerId &&
                        scoredBid.supplier.id === rfp.overrideWinnerId && (
                          <span className="absolute top-4 right-24 inline-flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Manually Selected
                          </span>
                        )}
                    </div>
                  );
                })}
              </div>

              {/* Radar chart for winner */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 inline-block">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  {winnerScoredBid.supplier.name} - Score Profile
                </h3>
                <ScoreRadarChart dimensions={winnerScoredBid.dimensions} />
              </div>

              {/* Explainability Panel */}
              <ExplainabilityPanel narrative={generateNarrative(evaluationResults)} />

              {/* Award Supplier button */}
              {(rfp.status === 'Evaluating') && (
                <button
                  onClick={() => {
                    updateRFP(rfp.id, {
                      status: 'Awarded',
                      selectedWinnerId: effectiveWinnerId,
                    });
                    toast.success('Supplier awarded');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Award Supplier
                </button>
              )}

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
