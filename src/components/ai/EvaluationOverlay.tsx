'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Building2, Shield, CreditCard, FileCheck, Bot, BarChart2 } from 'lucide-react';

const STEPS = [
  { icon: Building2,  label: 'Verifying company registration…',      sub: 'Cross-referencing federal contractor database',       duration: 700  },
  { icon: Shield,     label: 'Fetching VAA Score from Visa API…',     sub: 'Visa Advanced Authorization · merchant risk check',   duration: 1100, visa: true },
  { icon: CreditCard, label: 'Checking credit history…',              sub: 'Reviewing payment reliability & past transactions',   duration: 700  },
  { icon: FileCheck,  label: 'Analyzing compliance certifications…',  sub: 'Validating ISO, FedRAMP, SOC 2 & CMMC levels',       duration: 650  },
  { icon: Bot,        label: 'Computing AI composite score…',         sub: 'Applying weighted model across 6 dimensions',        duration: 750  },
  { icon: BarChart2,  label: 'Ranking suppliers…',                    sub: 'Sorting by composite score · selecting best value',  duration: 400  },
];

export function EvaluationOverlay({ onDone }: { onDone: () => void }) {
  const [current, setCurrent]   = useState(0);
  const [done,    setDone]      = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let idx = 0;
    function runStep() {
      if (idx >= STEPS.length) { setFinished(true); setTimeout(onDone, 900); return; }
      setCurrent(idx);
      setTimeout(() => {
        setDone(d => [...d, idx]);
        idx++;
        runStep();
      }, STEPS[idx].duration);
    }
    runStep();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.93, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">AI Evaluation Running</p>
            <p className="text-xs text-slate-400">Powered by Visa Advanced Authorization</p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isDone   = done.includes(i);
            const isActive = current === i && !isDone;
            const Icon     = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: i <= current ? 1 : 0.25, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                  isActive ? (step.visa ? 'bg-[#1434CB]/6 border border-[#1434CB]/20' : 'bg-indigo-50 border border-indigo-100') : 'border border-transparent'
                }`}
              >
                {/* Status icon */}
                <div className="w-6 h-6 shrink-0 flex items-center justify-center mt-0.5">
                  <AnimatePresence mode="wait">
                    {isDone ? (
                      <motion.div key="chk" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                        <CheckCircle size={18} className="text-emerald-500" />
                      </motion.div>
                    ) : isActive ? (
                      <Loader2 size={16} className={`animate-spin ${step.visa ? 'text-[#1434CB]' : 'text-indigo-500'}`} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                    )}
                  </AnimatePresence>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold flex items-center gap-2 flex-wrap ${isDone ? 'text-slate-400' : isActive ? (step.visa ? 'text-[#1434CB]' : 'text-slate-900') : 'text-slate-400'}`}>
                    <span>{step.label}</span>
                    {step.visa && <span className="text-[10px] font-bold bg-[#1434CB] text-white px-1.5 py-0.5 rounded uppercase tracking-wide whitespace-nowrap">Visa API</span>}
                  </p>
                  {isActive && <p className="text-xs text-slate-400 mt-0.5">{step.sub}</p>}
                </div>

                {/* Icon on right */}
                <Icon size={14} className={`shrink-0 mt-1 ${isDone ? 'text-slate-300' : isActive ? (step.visa ? 'text-[#1434CB]' : 'text-indigo-400') : 'text-slate-200'}`} />
              </motion.div>
            );
          })}
        </div>

        {/* Done state */}
        <AnimatePresence>
          {finished && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
            >
              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              <p className="text-sm font-semibold text-emerald-700">Evaluation complete — loading results…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
