'use client';

import { Component, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle2, XCircle, AlertTriangle, RefreshCw, ArrowUpRight, Loader2, Wifi, WifiOff, ChevronRight } from 'lucide-react';
import { useInvoiceAI } from '@/hooks/useInvoiceAI';
import type { InvoiceDecision } from '@/lib/invoiceAI/connection';

// ── Error boundary ─────────────────────────────────────────────────────────

interface BoundaryState { crashed: boolean }

class InvoiceAIPanelBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { crashed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { crashed: true };
  }

  render() {
    if (this.state.crashed) return null;
    return this.props.children;
  }
}

// ── Status dot ─────────────────────────────────────────────────────────────

function StatusDot({ ready, degraded }: { ready: boolean; degraded?: boolean }) {
  const color = ready ? 'bg-emerald-400' : degraded ? 'bg-amber-400' : 'bg-red-400';
  const label = ready ? 'AI online' : degraded ? 'AI degraded' : 'AI offline';
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color} ${ready ? 'animate-pulse' : ''}`} />
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ── Offline banner ─────────────────────────────────────────────────────────

function OfflineBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Invoice AI is offline</p>
          <p className="text-xs text-amber-700 leading-relaxed">{message}</p>
          <p className="text-[11px] text-amber-600 font-mono mt-1">cd scripts &amp;&amp; python3 rag_service.py</p>
        </div>
        <button
          onClick={onRetry}
          className="shrink-0 flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors"
        >
          <RefreshCw size={11} />
          Retry
        </button>
      </div>
    </div>
  );
}

// ── Progress indicator ─────────────────────────────────────────────────────

const ORDERED_STEPS = ['checking', 'retrieving', 'analyzing', 'validating', 'done'];

function ProgressIndicator({ stepName, label }: { stepName: string; label: string }) {
  const idx = ORDERED_STEPS.indexOf(stepName);
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
      <div className="flex items-center gap-3">
        <Loader2 size={15} className="text-indigo-500 animate-spin shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-indigo-700">{label}</p>
          <div className="mt-2 flex gap-1">
            {ORDERED_STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i < idx ? 'bg-indigo-500' : i === idx ? 'bg-indigo-400 animate-pulse' : 'bg-indigo-200'
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-indigo-400 mt-1">
            {idx >= 0 ? `Step ${idx + 1} of ${ORDERED_STEPS.length}` : 'Processing…'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Confidence bar ─────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confidence</span>
        <span className="text-sm font-black text-slate-900">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

// ── Decision badge ─────────────────────────────────────────────────────────

function DecisionBadge({ decision }: { decision: InvoiceDecision['decision'] }) {
  const map = {
    approved:        { icon: CheckCircle2, label: 'Approved',        bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon_color: 'text-emerald-500' },
    rejected:        { icon: XCircle,      label: 'Rejected',        bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     icon_color: 'text-red-500'     },
    review_required: { icon: AlertTriangle, label: 'Review Required', bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   icon_color: 'text-amber-500'   },
  };
  const cfg = map[decision];
  const Icon = cfg.icon;
  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${cfg.bg} ${cfg.border}`}>
      <Icon size={13} className={cfg.icon_color} />
      <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

// ── Result card ────────────────────────────────────────────────────────────

function ResultCard({
  result,
  onOverride,
  onCommit,
}: {
  result: InvoiceDecision;
  onOverride: () => void;
  onCommit: () => void;
}) {
  const fields: { label: string; value: string | undefined }[] = [
    { label: 'Vendor',        value: result.vendor || '—' },
    { label: 'Amount',        value: result.amount ? `$${result.amount.toLocaleString()}` : '—' },
    { label: 'Category',      value: result.category },
    { label: 'PO Reference',  value: result.poReference },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={13} className="text-indigo-500" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">AI Analysis Result</span>
        </div>
        <DecisionBadge decision={result.decision} />
      </div>

      <div className="p-5 space-y-4">
        {/* Extracted fields */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {fields.filter((f) => f.value).map(({ label, value }) => (
            <div key={label}>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Matched policies */}
        {result.matchedPolicies.length > 0 && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Matched Policies</p>
            <div className="flex flex-wrap gap-1.5">
              {result.matchedPolicies.map((p) => (
                <span key={p.id || p.title} className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-2 py-0.5">
                  {p.title || p.id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        {result.reasoning && (
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Reasoning</p>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
              {result.reasoning}
            </p>
          </div>
        )}

        {/* Flags */}
        {(result.riskFlags ?? []).length > 0 && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
            <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {(result.riskFlags ?? []).map((f) => (
                <span key={f} className="text-[10px] text-amber-700 font-medium">{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Confidence */}
        <ConfidenceBar value={result.confidence} />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onCommit}
            className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg px-4 py-2 transition-colors"
          >
            <CheckCircle2 size={12} />
            Commit Decision
          </button>
          <button
            onClick={onOverride}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            <ArrowUpRight size={12} />
            Override
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Error card ─────────────────────────────────────────────────────────────

function ErrorCard({
  message,
  recoverable,
  onRetry,
  onEscalate,
}: {
  message: string;
  recoverable: boolean;
  onRetry: () => void;
  onEscalate: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <XCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-red-700 mb-1">Analysis Failed</p>
          <p className="text-xs text-red-600 leading-relaxed">{message}</p>
          <div className="flex items-center gap-2 mt-3">
            {recoverable ? (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 border border-red-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors"
              >
                <RefreshCw size={11} />
                Retry
              </button>
            ) : (
              <button
                onClick={onEscalate}
                className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 border border-red-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors"
              >
                <ArrowUpRight size={11} />
                Escalate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────

interface InvoiceAIPanelProps {
  emailId: string;
  emailBody: string;
  from: string;
}

function InvoiceAIPanelInner({ emailId, emailBody, from }: InvoiceAIPanelProps) {
  const { analyze, reset, result, stepName, stepLabel, status, errorMessage, isLoading, health } = useInvoiceAI();

  const isReady = health?.ready ?? false;
  const isOffline = health !== null && !isReady;
  const isEnabled = process.env.NEXT_PUBLIC_INVOICE_AI_ENABLED !== 'false';

  if (!isEnabled) return null;

  const handleAnalyze = () => {
    void analyze({ emailBody, emailId, vendorEmail: from });
  };

  const handleRetry = () => {
    reset();
    // re-trigger health check by reloading — user can also just click Analyze again
  };

  const handleEscalate = () => {
    // placeholder — integrate with existing escalation flow if available
    window.alert('Invoice routed to manual review queue.');
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Brain size={13} className="text-indigo-600" />
          </div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Invoice AI</span>
        </div>
        {health && (
          <StatusDot ready={isReady} />
        )}
      </div>


      {/* Error from analysis */}
      <AnimatePresence>
        {(status === 'error' || status === 'blocked') && errorMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ErrorCard
              message={errorMessage}
              recoverable={status === 'error'}
              onRetry={handleRetry}
              onEscalate={handleEscalate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProgressIndicator stepName={stepName} label={stepLabel} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {status === 'done' && result && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ResultCard
              result={result}
              onOverride={handleEscalate}
              onCommit={() => window.alert(`Decision committed: ${result.decision}`)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyze button — shown when idle, online, and no result yet */}
      {status === 'idle' && !isOffline && (
        <button
          onClick={handleAnalyze}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-4 py-2.5 transition-colors"
        >
          <Brain size={13} />
          Analyze with AI
          <ChevronRight size={12} className="opacity-60" />
        </button>
      )}

      {/* Re-analyze button — shown after done/error */}
      {(status === 'done' || status === 'error') && (
        <button
          onClick={() => { reset(); setTimeout(handleAnalyze, 50); }}
          className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl px-4 py-2 transition-colors"
        >
          <RefreshCw size={11} />
          Re-analyze
        </button>
      )}
    </div>
  );
}

export function InvoiceAIPanel(props: InvoiceAIPanelProps) {
  return (
    <InvoiceAIPanelBoundary>
      <InvoiceAIPanelInner {...props} />
    </InvoiceAIPanelBoundary>
  );
}
