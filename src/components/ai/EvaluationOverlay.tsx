'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { ShieldCheck, Building2, Shield, CreditCard, FileCheck, Bot, BarChart2 } from 'lucide-react';

const STEPS = [
  { icon: Building2, tag: 'VERIFY', tagColor: '#34d399', label: 'Verifying company registration',       sub: 'Cross-referencing federal contractor database',      duration: 700,  activates: ['s1','s2']  },
  { icon: Shield,    tag: 'API',    tagColor: '#60a5fa', label: 'Fetching VAA Score from Visa API',     sub: 'Visa Advanced Authorization · merchant risk check',  duration: 1100, activates: ['s3','s4'], visa: true },
  { icon: CreditCard,tag: 'CREDIT', tagColor: '#fbbf24', label: 'Checking credit history',              sub: 'Reviewing payment reliability & past transactions',  duration: 700,  activates: ['s5']       },
  { icon: FileCheck, tag: 'COMPLY', tagColor: '#a78bfa', label: 'Analyzing compliance certifications',  sub: 'Validating ISO, FedRAMP, SOC 2 & CMMC levels',      duration: 650,  activates: ['s6']       },
  { icon: Bot,       tag: 'MODEL',  tagColor: '#f472b6', label: 'Computing AI composite score',         sub: 'Applying weighted model across 6 dimensions',        duration: 750,  activates: ['s7']       },
  { icon: BarChart2, tag: 'RANK',   tagColor: '#38bdf8', label: 'Ranking suppliers',                    sub: 'Sorting by composite score · selecting best value',  duration: 400,  activates: ['s8']       },
];

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCount({ target, suffix = '' }: { target: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const unsub = rounded.on('change', setDisplay);
    const ctrl = animate(count, target, { duration: 1.1, ease: 'easeOut' });
    return () => { unsub(); ctrl.stop(); };
  }, [target]);
  return <span>{display}{suffix}</span>;
}

// ── Chip / PCB animation ──────────────────────────────────────────────────────
const LEFT_MODULES = [
  { stepIdx: 0, y: 14,  tag: 'REG',  color: '#34d399' },
  { stepIdx: 1, y: 74,  tag: 'VAA',  color: '#60a5fa' },
  { stepIdx: 2, y: 134, tag: 'FIN',  color: '#fbbf24' },
];

const RIGHT_MODULES = [
  { stepIdx: 3, y: 14,  tag: 'ISO',  color: '#a78bfa' },
  { stepIdx: 4, y: 74,  tag: 'NET',  color: '#f472b6' },
  { stepIdx: 5, y: 134, tag: 'RANK', color: '#38bdf8' },
];

const CORE_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6', '#38bdf8'];

// Trace paths: index matches step index
const TRACES = [
  { path: 'M 78,32 H 138 V 68 H 188',  color: '#34d399' }, // step 0 left
  { path: 'M 78,92 H 188',              color: '#60a5fa' }, // step 1 left
  { path: 'M 78,152 H 138 V 116 H 188', color: '#fbbf24' }, // step 2 left
  { path: 'M 382,32 H 322 V 68 H 272',  color: '#a78bfa' }, // step 3 right
  { path: 'M 382,92 H 272',             color: '#f472b6' }, // step 4 right
  { path: 'M 382,152 H 322 V 116 H 272',color: '#38bdf8' }, // step 5 right
];

// Core grid: col x coords, row y coords
const CORE_COLS = [198, 222, 246];
const CORE_ROWS = [52, 76, 100];
// flat index 0..5 → [col, row]
const CORE_POSITIONS = [
  [CORE_COLS[0], CORE_ROWS[0]],
  [CORE_COLS[1], CORE_ROWS[0]],
  [CORE_COLS[2], CORE_ROWS[0]],
  [CORE_COLS[0], CORE_ROWS[1]],
  [CORE_COLS[1], CORE_ROWS[1]],
  [CORE_COLS[2], CORE_ROWS[1]],
];

function ChipAnimation({
  completedSteps,
  currentStep,
  finished,
}: {
  completedSteps: Set<number>;
  currentStep: number;
  finished: boolean;
}) {
  const activeCount = completedSteps.size;
  const chipBorderColor =
    currentStep >= 0
      ? STEPS[currentStep]?.tagColor ?? 'rgba(99,130,255,0.4)'
      : 'rgba(99,130,255,0.25)';

  return (
    <div style={{ width: '100%', padding: '8px 0' }}>
      <style>{`
        @keyframes chip-scan {
          0%   { transform: translateY(0); }
          100% { transform: translateY(93px); }
        }
      `}</style>
      <svg
        viewBox="0 0 460 185"
        className="w-full"
        height={185}
        style={{ display: 'block' }}
      >
        <defs>
          {LEFT_MODULES.map((m) => (
            <filter key={`drop-l-${m.stepIdx}`} id={`drop-l-${m.stepIdx}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={m.color} floodOpacity="0.6" />
            </filter>
          ))}
          {RIGHT_MODULES.map((m) => (
            <filter key={`drop-r-${m.stepIdx}`} id={`drop-r-${m.stepIdx}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={m.color} floodOpacity="0.6" />
            </filter>
          ))}
        </defs>

        {/* ── Left modules ── */}
        {LEFT_MODULES.map((m) => {
          const isDone    = completedSteps.has(m.stepIdx);
          const isActive  = currentStep === m.stepIdx && !isDone;
          return (
            <g key={`lm-${m.stepIdx}`}>
              <rect
                x={8} y={m.y} width={70} height={36} rx={5}
                fill={isActive ? `${m.color}15` : isDone ? 'rgba(10,22,50,0.6)' : 'rgba(10,22,50,0.8)'}
                stroke={isActive ? m.color : isDone ? `${m.color}40` : 'rgba(99,130,255,0.15)'}
                strokeWidth={isActive ? 1.5 : 1}
                filter={isActive ? `url(#drop-l-${m.stepIdx})` : undefined}
              />
              <text
                x={43} y={m.y + 21}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isActive ? m.color : isDone ? `${m.color}70` : 'rgba(160,185,255,0.4)'}
                fontSize={9}
                fontWeight="bold"
                fontFamily="monospace"
              >
                {m.tag}
              </text>
              {m.stepIdx === 1 && (
                <text
                  x={43} y={m.y + 29}
                  textAnchor="middle"
                  fill={isActive ? `${m.color}90` : 'rgba(99,130,255,0.2)'}
                  fontSize={6}
                  fontFamily="monospace"
                >
                  VISA
                </text>
              )}
              {isDone && (
                <text
                  x={43} y={m.y + 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={`${m.color}60`}
                  fontSize={7}
                  fontFamily="monospace"
                >
                  ✓
                </text>
              )}
            </g>
          );
        })}

        {/* ── Right modules ── */}
        {RIGHT_MODULES.map((m) => {
          const isDone    = completedSteps.has(m.stepIdx);
          const isActive  = currentStep === m.stepIdx && !isDone;
          return (
            <g key={`rm-${m.stepIdx}`}>
              <rect
                x={382} y={m.y} width={70} height={36} rx={5}
                fill={isActive ? `${m.color}15` : isDone ? 'rgba(10,22,50,0.6)' : 'rgba(10,22,50,0.8)'}
                stroke={isActive ? m.color : isDone ? `${m.color}40` : 'rgba(99,130,255,0.15)'}
                strokeWidth={isActive ? 1.5 : 1}
                filter={isActive ? `url(#drop-r-${m.stepIdx})` : undefined}
              />
              <text
                x={417} y={m.y + 21}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isActive ? m.color : isDone ? `${m.color}70` : 'rgba(160,185,255,0.4)'}
                fontSize={9}
                fontWeight="bold"
                fontFamily="monospace"
              >
                {m.tag}
              </text>
              {isDone && (
                <text
                  x={417} y={m.y + 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={`${m.color}60`}
                  fontSize={7}
                  fontFamily="monospace"
                >
                  ✓
                </text>
              )}
            </g>
          );
        })}

        {/* ── Traces ── */}
        {TRACES.map((tr, i) => {
          const isDone   = completedSteps.has(i);
          const isActive = currentStep === i && !isDone;
          return (
            <g key={`tr-${i}`}>
              <path
                d={tr.path}
                fill="none"
                stroke={isDone || isActive ? tr.color : 'rgba(99,130,255,0.12)'}
                strokeWidth={isDone || isActive ? 1.2 : 0.8}
                strokeDasharray={300}
                strokeDashoffset={isDone || isActive ? 0 : 300}
                style={{
                  transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s',
                }}
                opacity={isDone ? 0.45 : isActive ? 1 : 0.4}
              />
              {/* Animated data packet */}
              {(isActive || isDone) && (
                <circle r={2.5} fill={tr.color} opacity={isDone ? 0.5 : 1}>
                  <animateMotion dur="1.2s" repeatCount="indefinite" path={tr.path} />
                </circle>
              )}
            </g>
          );
        })}

        {/* ── Central chip ── */}
        <rect
          x={188} y={42} width={84} height={101} rx={8}
          fill="#0a1628"
          stroke={activeCount > 0 ? chipBorderColor : 'rgba(99,130,255,0.2)'}
          strokeWidth={activeCount > 0 ? 1.5 : 1}
          style={{ transition: 'stroke 0.4s ease' }}
        />

        {/* Scan line */}
        <rect
          x={190} y={44} width={80} height={3}
          fill="rgba(74,123,255,0.18)"
          style={{ animation: 'chip-scan 1.6s linear infinite' }}
        />

        {/* Cores */}
        {CORE_POSITIONS.map(([cx, cy], idx) => {
          const coreActive = completedSteps.has(idx);
          return (
            <rect
              key={`core-${idx}`}
              x={cx} y={cy} width={18} height={18} rx={3}
              fill={coreActive ? `${CORE_COLORS[idx]}25` : 'rgba(99,130,255,0.06)'}
              stroke={coreActive ? CORE_COLORS[idx] : 'rgba(99,130,255,0.15)'}
              strokeWidth={coreActive ? 1.2 : 0.8}
              style={{ transition: 'all 0.4s ease' }}
            />
          );
        })}

        {/* "AI" label when all 6 cores active */}
        {activeCount >= 6 && (
          <text
            x={230} y={130}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(160,185,255,0.8)"
            fontSize={10}
            fontWeight="bold"
            fontFamily="monospace"
          >
            AI
          </text>
        )}
      </svg>
    </div>
  );
}

// ── Main overlay ──────────────────────────────────────────────────────────────
export function EvaluationOverlay({ onDone }: { onDone: () => void }) {
  const [current,   setCurrent]   = useState(-1);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [finished,  setFinished]  = useState(false);

  useEffect(() => {
    let idx = 0;
    function runStep() {
      if (idx >= STEPS.length) { setFinished(true); setTimeout(onDone, 1100); return; }
      setCurrent(idx);
      const step = STEPS[idx];
      setTimeout(() => {
        setCompleted((prev) => new Set([...prev, idx]));
        idx++;
        runStep();
      }, step.duration);
    }
    runStep();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = finished ? 100 : Math.round((completed.size / STEPS.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.96, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: -12, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[560px] mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #07102e 0%, #0d1b3e 60%, #0a1628 100%)',
          boxShadow: '0 0 0 1px rgba(99,130,255,0.15), 0 32px 80px rgba(0,0,0,0.7), 0 0 80px rgba(20,52,203,0.12)',
        }}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 flex items-center gap-3 border-b border-white/6">
          <div className="w-8 h-8 rounded-lg bg-[#1434CB] flex items-center justify-center shrink-0">
            <Bot size={15} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold tracking-tight leading-tight">AI Evaluation Engine</p>
            <p className="text-white/35 text-[10px] font-mono mt-0.5">Powered by Visa Advanced Authorization</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[10px] font-mono text-white/25">
              {completed.size}/{STEPS.length} verified
            </span>
            {!finished ? (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#60a5fa] font-mono uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />
                Running
              </span>
            ) : (
              <motion.span
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-widest"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Complete
              </motion.span>
            )}
          </div>
        </div>

        {/* ── Chip animation ── */}
        <div className="px-4 pt-3 pb-1">
          <ChipAnimation
            completedSteps={completed}
            currentStep={current}
            finished={finished}
          />
        </div>

        {/* ── Progress bar ── */}
        <div className="mx-4 mb-3 h-px bg-white/6 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(to right, #1434CB, #6366f1, #60a5fa)' }}
          />
        </div>

        {/* ── Step log ── */}
        <div className="px-4 pb-4 space-y-1.5">
          {STEPS.map((step, i) => {
            const isDone    = completed.has(i);
            const isActive  = current === i && !isDone;
            const isVisible = i <= current || isDone;
            if (!isVisible) return null;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex items-center gap-2.5 font-mono"
              >
                <span className="text-white/20 text-[10px] select-none">›</span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{ color: step.tagColor, background: `${step.tagColor}18`, border: `1px solid ${step.tagColor}30` }}
                >
                  {step.tag}
                </span>
                <span className={`text-[11px] flex-1 ${isActive ? 'text-white/90' : 'text-white/35'}`}>
                  {step.label}
                  {step.visa && isActive && (
                    <span className="ml-2 text-[9px] font-bold bg-[#1434CB] text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Visa API
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.55, repeat: Infinity }}
                      className="ml-0.5 inline-block w-1.5 h-3 bg-white/60 align-middle"
                    />
                  )}
                </span>
                <step.icon
                  size={11}
                  className="shrink-0"
                  style={{ color: isActive ? step.tagColor : isDone ? `${step.tagColor}50` : 'rgba(99,130,255,0.2)' }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* ── Result ── */}
        <AnimatePresence>
          {finished && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mx-4 mb-5 rounded-xl px-4 py-3.5 flex items-center gap-4"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(20,52,203,0.1))',
                border: '1px solid rgba(52,211,153,0.25)',
                boxShadow: '0 0 24px rgba(16,185,129,0.08)',
              }}
            >
              <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold leading-tight">
                  {STEPS.length} suppliers verified globally — loading results…
                </p>
                <p className="text-emerald-400/70 text-[10px] font-mono mt-0.5">
                  6 dimensions scored · VAA confirmed · ranked by composite
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-emerald-400 text-xs font-bold font-mono">
                  <AnimatedCount target={100} suffix="%" />
                </p>
                <p className="text-white/25 text-[9px] font-mono">accuracy</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
