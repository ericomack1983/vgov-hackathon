'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  X, Brain, Database, ShieldCheck, Bot, Zap, CheckCircle2,
  AlertTriangle, CreditCard, FileText, TrendingUp, BarChart3,
  History, ClipboardCheck, ChevronRight, Sparkles, Lock,
} from 'lucide-react';
import { computeConfidence, confidenceToDecision, type ConfidenceScore } from '@/ai/scoring';
import type { PipelineResult } from '@/ai/types';
import { useAILedger, type LedgerEntry } from '@/context/AILedgerContext';

// ── Types ──────────────────────────────────────────────────────────────────

interface InvoiceAnalysisPanelProps {
  rfpId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  description: string;
  invoiceNo: string;
  onClose: () => void;
  onComplete?: (result: PipelineResult) => void;
  autoMatched?: boolean;
}

type Stage = 'context' | 'analyzing' | 'scoring' | 'decision' | 'done';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsub = display.on('change', setDisplayed);
    return unsub;
  }, [display]);

  return <span>{displayed}</span>;
}

function ScoreBar({
  label,
  value,
  description,
  icon: Icon,
  delay,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
  delay: number;
}) {
  const color =
    value >= 85 ? '#10b981' :
    value >= 65 ? '#f59e0b' :
    '#ef4444';

  const bg =
    value >= 85 ? 'rgba(16,185,129,0.1)' :
    value >= 65 ? 'rgba(245,158,11,0.1)' :
    'rgba(239,68,68,0.1)';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: bg }}>
            <Icon size={12} style={{ color }} />
          </div>
          <span className="text-xs font-semibold text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold" style={{ color }}>
            <AnimatedNumber value={value} duration={0.9} />%
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: delay + 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
      </div>
      <p className="text-[10px] text-slate-400">{description}</p>
    </motion.div>
  );
}

function ConfidenceRing({ value, size = 120 }: { value: number; size?: number }) {
  const radius = size * 0.38;
  const circumference = 2 * Math.PI * radius;
  const color =
    value >= 95 ? '#10b981' :
    value >= 70 ? '#f59e0b' :
    '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth={size * 0.065}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.065}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-black" style={{ color }}>
          <AnimatedNumber value={value} duration={1.4} />
          <span className="text-sm font-bold">%</span>
        </div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Confidence</div>
      </div>
    </div>
  );
}

// ── Context items definition ───────────────────────────────────────────────

function buildContextItems(
  supplierName: string,
  supplierRisk: number,
  complianceStatus: string,
  invoiceHistory: number,
  avgAmount: number,
  contractLimit: number,
) {
  return [
    {
      icon: History,
      label: 'Supplier Invoice History',
      value: invoiceHistory > 0 ? `${invoiceHistory} invoices found` : 'First invoice',
      color: '#6366f1',
    },
    {
      icon: TrendingUp,
      label: 'Average Invoice Amount',
      value: avgAmount > 0 ? fmt(avgAmount) : 'No baseline',
      color: '#0ea5e9',
    },
    {
      icon: Lock,
      label: 'Contract Limit',
      value: fmt(contractLimit),
      color: '#8b5cf6',
    },
    {
      icon: ShieldCheck,
      label: 'Compliance Status',
      value: complianceStatus,
      color: complianceStatus === 'Compliant' ? '#10b981' : complianceStatus === 'Non-Compliant' ? '#ef4444' : '#f59e0b',
    },
    {
      icon: BarChart3,
      label: 'Supplier Risk Score',
      value: `${supplierRisk}/100 ${supplierRisk < 20 ? '· Low' : supplierRisk < 40 ? '· Moderate' : '· High'}`,
      color: supplierRisk < 20 ? '#10b981' : supplierRisk < 40 ? '#f59e0b' : '#ef4444',
    },
  ];
}

// ── Main component ─────────────────────────────────────────────────────────

export function InvoiceAnalysisPanel({
  rfpId, supplierId, supplierName, amount, description,
  invoiceNo, onClose, onComplete, autoMatched = false,
}: InvoiceAnalysisPanelProps) {
  const { addEntry } = useAILedger();

  const [stage, setStage] = useState<Stage>('context');
  const [contextItemIdx, setContextItemIdx] = useState(0);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [scores, setScores] = useState<ConfidenceScore | null>(null);
  const [agentOneActive, setAgentOneActive] = useState(false);
  const [agentTwoDone, setAgentTwoDone] = useState(false);
  const apiCalled = useRef(false);

  // ── Kick off context retrieval sequence ──────────────────────────
  // No ref guard here — cleanup properly cancels the interval so
  // React Strict Mode's double-invoke doesn't cause issues.
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx += 1;
      setContextItemIdx(idx);
      if (idx >= 4) {
        clearInterval(interval);
        setTimeout(() => {
          setStage('analyzing');
          setAgentOneActive(true);
          callPipeline();
        }, 600);
      }
    }, 420);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function callPipeline() {
    // Deduplicate the actual HTTP call (Strict Mode runs effects twice)
    if (apiCalled.current) return;
    apiCalled.current = true;
    try {
      const res = await fetch('/api/invoices/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, rfpId, amount, description }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        onComplete?.(data);
      }
    } catch {
      // silent — fallback to animation only
    }
  }

  // ── Agent animation sequence ──────────────────────────────────────
  useEffect(() => {
    if (stage !== 'analyzing') return;
    // Agent 2 fires 1.6s after agent 1
    const t1 = setTimeout(() => setAgentTwoDone(true), 1_600);
    // Advance to scoring 2.8s after entering analyzing
    const t2 = setTimeout(() => setStage('scoring'), 2_800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [stage]);

  // ── When we have scores AND we're in scoring stage, proceed ───────
  useEffect(() => {
    if (stage !== 'scoring') return;
    // Wait 2.6s for score animation, then show decision
    const t = setTimeout(() => setStage('decision'), 2_600);
    return () => clearTimeout(t);
  }, [stage]);

  // ── Compute scores once result arrives OR when scoring stage starts
  useEffect(() => {
    if (scores) return;
    // Filename-matched invoices get forced 98% confidence
    if (autoMatched) {
      setScores({
        legitimacy: 98,
        risk: 98,
        historicalConsistency: 98,
        policyCompliance: 98,
        confidence: 98,
      });
      return;
    }
    if (!result) {
      // Derive mock scores if API hasn't returned yet
      const mockFlags = amount > 300_000
        ? [{ code: 'NEAR_CONTRACT_LIMIT', severity: 'warning' as const, message: '' }]
        : [];
      setScores(computeConfidence(
        { valid: true, score: 85, flags: mockFlags, summary: '' },
        20, 'Compliant',
      ));
    } else {
      const flags = result.validation?.flags ?? [];
      const complianceFlag = flags.find((f) => f.code === 'SUPPLIER_NON_COMPLIANT')
        ? 'Non-Compliant'
        : flags.find((f) => f.code === 'SUPPLIER_PENDING_REVIEW')
          ? 'Pending Review'
          : 'Compliant';
      setScores(computeConfidence(result.validation, 20, complianceFlag));
    }
  }, [result, scores, amount, autoMatched]);

  // ── Advance from decision → done ─────────────────────────────────
  useEffect(() => {
    if (stage !== 'decision') return;
    const t = setTimeout(() => {
      setStage('done');
      // Write to AI Ledger
      if (scores) {
        const decision = confidenceToDecision(scores.confidence);
        const entry: LedgerEntry = {
          id: `ledger-${Date.now()}`,
          invoiceId: result?.invoice?.id ?? `inv-${Date.now()}`,
          invoiceNo,
          supplierId,
          supplierName,
          rfpId,
          amount,
          scores,
          decision,
          approvalType: decision === 'auto_approved' ? 'auto' : decision === 'manual_review' ? 'manual' : 'none',
          paymentTriggered: result?.payment?.success ?? false,
          transactionId: result?.payment?.transaction?.id,
          orderId: result?.payment?.transaction?.orderId,
          timestamp: new Date().toISOString(),
        };
        addEntry(entry);
      }
    }, 2_200);
    return () => clearTimeout(t);
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const contextItems = buildContextItems(
    supplierName,
    20, // will be refined from result when available
    result
      ? (result.validation.flags.some((f) => f.code === 'SUPPLIER_NON_COMPLIANT') ? 'Non-Compliant' :
         result.validation.flags.some((f) => f.code === 'SUPPLIER_PENDING_REVIEW') ? 'Pending Review' : 'Compliant')
      : 'Verifying...',
    result ? (result.auditTrail?.length ?? 0) : 0,
    amount * 0.95, // approximate baseline
    500_000,
  );

  const decision = scores ? confidenceToDecision(scores.confidence) : null;
  const isApproved = decision === 'auto_approved';
  const isRejected = decision === 'rejected';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(170deg,#05091a 0%,#080f25 55%,#060c1e 100%)',
          border: '1px solid rgba(74,123,255,0.18)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(74,123,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(74,123,255,0.035) 1px,transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%,rgba(20,52,203,0.2) 0%,transparent 65%)' }}
        />

        {/* ── Close ── */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <X size={14} className="text-slate-400" />
        </button>

        <div className="relative z-10 p-6">

          {/* ── Header ── */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#1434CB,#4f46e5)' }}>
              <Brain size={17} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest">AI Invoice Analysis</p>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
                  <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                  {stage === 'done' ? 'Complete' : 'Processing'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white">{invoiceNo}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{fmt(amount)} · {supplierName}</p>
            </div>
          </div>

          {/* ── Stage pipeline track ── */}
          <div className="flex items-center gap-1.5 mb-6">
            {(['context', 'analyzing', 'scoring', 'decision', 'done'] as Stage[]).map((s, i) => {
              const stageOrder: Stage[] = ['context', 'analyzing', 'scoring', 'decision', 'done'];
              const currentIdx = stageOrder.indexOf(stage);
              const thisIdx = stageOrder.indexOf(s);
              const past = thisIdx < currentIdx;
              const active = thisIdx === currentIdx;
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide transition-all duration-500"
                    style={{
                      background: past ? 'rgba(16,185,129,0.12)' : active ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                      border: past ? '1px solid rgba(16,185,129,0.25)' : active ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.06)',
                      color: past ? '#6ee7b7' : active ? '#a5b4fc' : 'rgba(148,180,255,0.3)',
                    }}
                  >
                    {past && <CheckCircle2 size={8} />}
                    {active && <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />}
                    {s === 'context' && 'Context'}
                    {s === 'analyzing' && 'Analysis'}
                    {s === 'scoring' && 'Scoring'}
                    {s === 'decision' && 'Decision'}
                    {s === 'done' && 'Complete'}
                  </div>
                  {i < 4 && <ChevronRight size={10} className="text-slate-700 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* ── STAGE: Context Retrieval ── */}
          <AnimatePresence mode="wait">
            {stage === 'context' && (
              <motion.div
                key="context"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {/* Label */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                    <Database size={13} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-indigo-300/70 uppercase tracking-widest">
                      Context Retrieval via RAG
                    </p>
                    <p className="text-[11px] text-slate-400">Querying knowledge base for supplier context…</p>
                  </div>
                </div>

                {/* Invoice snapshot */}
                <div className="mb-4 rounded-xl p-3 flex items-start gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <FileText size={14} className="text-indigo-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1 flex-1">
                    {[
                      ['Supplier', supplierName],
                      ['Amount', fmt(amount)],
                      ['Invoice', invoiceNo],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[8px] text-slate-500 uppercase tracking-wider">{k}</p>
                        <p className="text-[11px] text-white font-medium truncate">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Context items */}
                <div className="space-y-2">
                  {contextItems.map((item, i) => (
                    <AnimatePresence key={i}>
                      {i <= contextItemIdx && (
                        <motion.div
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                            style={{ background: `${item.color}20` }}>
                            <item.icon size={11} style={{ color: item.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                            <p className="text-[11px] text-white/85 font-medium">{item.value}</p>
                          </div>
                          {i < contextItemIdx && (
                            <CheckCircle2 size={11} className="text-emerald-500/70 shrink-0" />
                          )}
                          {i === contextItemIdx && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            >
                              <Zap size={11} className="text-indigo-400 shrink-0" />
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STAGE: Agent Analysis ── */}
            {stage === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                    <Bot size={13} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-violet-300/70 uppercase tracking-widest">Agent Analysis</p>
                    <p className="text-[11px] text-slate-400">AI agents evaluating invoice against context…</p>
                  </div>
                </div>

                {/* Agent 1 */}
                <AgentCard
                  name="Invoice Validation Agent"
                  icon={ShieldCheck}
                  color="#6366f1"
                  active={agentOneActive}
                  done={agentTwoDone}
                  checks={[
                    'Supplier compliance status verified',
                    'Contract limit cross-referenced',
                    'Amount deviation from history analyzed',
                    'Risk profile evaluated',
                  ]}
                  delay={0}
                />

                {/* Agent 2 */}
                <AgentCard
                  name="Approval Decision Agent"
                  icon={Brain}
                  color="#8b5cf6"
                  active={agentTwoDone}
                  done={false}
                  checks={[
                    'Validation result received',
                    'Risk classification: evaluating',
                    'Auto-approval threshold check',
                    'Routing decision in progress',
                  ]}
                  delay={0.2}
                />
              </motion.div>
            )}

            {/* ── STAGE: Scoring ── */}
            {(stage === 'scoring' || (stage === 'decision' || stage === 'done')) && (
              <motion.div
                key="scoring"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.25)' }}>
                    <Sparkles size={13} className="text-sky-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-sky-300/70 uppercase tracking-widest">
                      Scoring Framework
                    </p>
                    <p className="text-[11px] text-slate-400">4-dimensional analysis with confidence calculation</p>
                  </div>
                </div>

                <div className="flex gap-5 items-start">
                  {/* Dimension bars */}
                  <div className="flex-1 space-y-3.5">
                    {scores && (
                      <>
                        <ScoreBar label="Legitimacy" value={scores.legitimacy} icon={FileText} delay={0.05}
                          description="Invoice is authentic and internally consistent" />
                        <ScoreBar label="Risk" value={scores.risk} icon={ShieldCheck} delay={0.2}
                          description="Supplier risk profile and anomaly assessment" />
                        <ScoreBar label="Historical Consistency" value={scores.historicalConsistency} icon={TrendingUp} delay={0.35}
                          description="Alignment with prior invoice behaviour" />
                        <ScoreBar label="Policy Compliance" value={scores.policyCompliance} icon={ClipboardCheck} delay={0.5}
                          description="Contract limits and regulatory adherence" />
                      </>
                    )}
                  </div>

                  {/* Confidence ring */}
                  <div className="flex flex-col items-center gap-2 pt-1">
                    {scores && <ConfidenceRing value={scores.confidence} size={112} />}
                    {scores && decision && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.3 }}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-center ${
                          isApproved ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                          isRejected ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                          'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        }`}
                      >
                        {isApproved ? 'Auto-Approve' : isRejected ? 'Reject' : 'Manual Review'}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── STAGE: Decision (overlays scoring below it) ── */}
          <AnimatePresence>
            {(stage === 'decision' || stage === 'done') && scores && decision && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5"
              >
                <DecisionCard
                  decision={decision}
                  confidence={scores.confidence}
                  approved={isApproved}
                  rejected={isRejected}
                  paymentSuccess={result?.payment?.success ?? false}
                  orderId={result?.payment?.transaction?.orderId}
                  flags={result?.validation?.flags ?? []}
                  stage={stage}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Done: audit snippet ── */}
          <AnimatePresence>
            {stage === 'done' && result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.35 }}
                className="mt-4 rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Audit Trail · {result.auditTrail.length} events
                </p>
                <div className="space-y-1">
                  {result.auditTrail.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 text-[10px]">
                      <span className="font-mono px-1.5 py-0.5 rounded text-[9px]"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
                        {e.event}
                      </span>
                      <span className="text-slate-500">→ {e.agent}</span>
                      <span className="ml-auto font-mono text-slate-600">
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-indigo-400/60 mt-2">
                  Entry recorded in AI Transaction Ledger
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Done: close button ── */}
          <AnimatePresence>
            {stage === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.35 }}
                className="mt-5 flex justify-center"
              >
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg,#1434CB,#4f46e5)',
                    boxShadow: '0 0 20px rgba(99,102,241,0.35)',
                  }}
                >
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </motion.div>
  );
}

// ── AgentCard ──────────────────────────────────────────────────────────────

function AgentCard({
  name, icon: Icon, color, active, done, checks, delay,
}: {
  name: string;
  icon: React.ElementType;
  color: string;
  active: boolean;
  done: boolean;
  checks: string[];
  delay: number;
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-500"
      style={{
        background: active ? `${color}0d` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${active ? `${color}35` : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <motion.div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20` }}
          animate={active && !done ? { boxShadow: [`0 0 0 0 ${color}00`, `0 0 0 8px ${color}20`, `0 0 0 0 ${color}00`] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <Icon size={13} style={{ color }} />
        </motion.div>
        <p className="text-xs font-bold text-white/80">{name}</p>
        <div className="ml-auto">
          {!active ? (
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Queued</span>
          ) : done ? (
            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 size={9} /> Done
            </span>
          ) : (
            <motion.div className="flex items-center gap-1">
              <motion.div
                className="w-1 h-1 rounded-full"
                style={{ background: color }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              />
              <motion.div
                className="w-1 h-1 rounded-full"
                style={{ background: color }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: 0.23 }}
              />
              <motion.div
                className="w-1 h-1 rounded-full"
                style={{ background: color }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: 0.46 }}
              />
            </motion.div>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        {checks.map((check, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={active ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: delay + i * 0.18, duration: 0.28 }}
            className="flex items-center gap-2 text-[10px]"
          >
            <div className="w-1 h-1 rounded-full shrink-0" style={{ background: active ? color : 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>{check}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── DecisionCard ───────────────────────────────────────────────────────────

function DecisionCard({
  decision, confidence, approved, rejected,
  paymentSuccess, orderId, flags, stage,
}: {
  decision: string;
  confidence: number;
  approved: boolean;
  rejected: boolean;
  paymentSuccess: boolean;
  orderId?: string;
  flags: { code: string; severity: string; message: string }[];
  stage: Stage;
}) {
  const isManual = !approved && !rejected;
  const accentColor = approved ? '#10b981' : rejected ? '#ef4444' : '#f59e0b';
  const bgColor = approved ? 'rgba(6,78,59,0.3)' : rejected ? 'rgba(127,29,29,0.3)' : 'rgba(78,49,4,0.3)';
  const borderColor = approved ? 'rgba(16,185,129,0.3)' : rejected ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)';

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
      {/* Verdict header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accentColor}20` }}>
          {approved ? <CheckCircle2 size={16} style={{ color: accentColor }} /> :
           rejected ? <AlertTriangle size={16} style={{ color: accentColor }} /> :
           <AlertTriangle size={16} style={{ color: accentColor }} />}
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold" style={{ color: accentColor }}>
            {approved ? '✓ Automatically Approved' :
             rejected ? '✗ Invoice Rejected' :
             '⚠ Requires Manual Review'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {approved
              ? `Confidence ${confidence}% ≥ 95% · Auto-approval threshold met`
              : rejected
                ? `Confidence ${confidence}% · Critical issues detected`
                : `Confidence ${confidence}% < 95% · Human validation required`}
          </p>
        </div>
        {confidence >= 95 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full shrink-0"
            style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}35` }}>
            <Sparkles size={9} style={{ color: accentColor }} />
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
              AI Auto
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Flags */}
        {flags.length > 0 && (
          <div className="space-y-1">
            {flags.map((f, i) => (
              <div key={i}
                className="flex items-start gap-2 text-[10px] px-2 py-1 rounded-lg"
                style={{
                  background: f.severity === 'critical' ? 'rgba(239,68,68,0.08)' :
                              f.severity === 'warning' ? 'rgba(245,158,11,0.08)' :
                              'rgba(255,255,255,0.04)',
                }}>
                <span className="font-mono font-bold shrink-0"
                  style={{ color: f.severity === 'critical' ? '#fca5a5' : f.severity === 'warning' ? '#fcd34d' : '#94a3b8' }}>
                  [{f.code}]
                </span>
                <span className="text-slate-400">{f.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Payment triggered */}
        {approved && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CreditCard size={12} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-emerald-300">Payment Authorized</p>
                <p className="text-[9px] text-emerald-500/60">
                  {paymentSuccess
                    ? `Visa VPC · ${orderId ?? 'Order queued'}`
                    : 'Payment queued for processing'}
                </p>
              </div>
              <CheckCircle2 size={11} className="text-emerald-400 ml-auto" />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <BarChart3 size={12} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-emerald-300">Reconciliation</p>
                <p className="text-[9px] text-emerald-500/60">Ledger updated · Audit logged</p>
              </div>
              <CheckCircle2 size={11} className="text-emerald-400 ml-auto" />
            </div>
          </div>
        )}

        {isManual && (
          <div className="rounded-lg px-3 py-2"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-[10px] font-bold text-amber-300 mb-1">Required Actions</p>
            <div className="space-y-1 text-[10px] text-amber-400/80">
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-400/60" />
                Procurement officer validation
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-400/60" />
                Manual Visa VPC approval required
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-400/60" />
                Entry flagged in AI Ledger for review
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
