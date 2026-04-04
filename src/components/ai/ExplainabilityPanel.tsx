'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

interface ExplainabilityPanelProps {
  narrative: string;
  isOverride?: boolean;
}

const TYPING_SPEED = 18; // ms per character

export function ExplainabilityPanel({ narrative, isOverride }: ExplainabilityPanelProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);
  const [started, setStarted]     = useState(false);
  const idxRef  = useRef(0);
  const rafRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!narrative) return;
    // Reset state when narrative changes
    setDisplayed('');
    setDone(false);
    setStarted(false);
    idxRef.current = 0;
    if (rafRef.current) clearTimeout(rafRef.current);

    // Small delay before typing begins — feels like AI "thinking"
    const startTimer = setTimeout(() => {
      setStarted(true);
      function tick() {
        if (idxRef.current >= narrative.length) { setDone(true); return; }
        idxRef.current += 1;
        setDisplayed(narrative.slice(0, idxRef.current));
        rafRef.current = setTimeout(tick, TYPING_SPEED);
      }
      tick();
    }, 420);

    return () => {
      clearTimeout(startTimer);
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [narrative]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={isOverride ? {
        background: 'linear-gradient(160deg, #1c0a00 0%, #2d1600 70%, #1a0e00 100%)',
        boxShadow: '0 0 0 1px rgba(251,146,60,0.3), 0 8px 32px rgba(0,0,0,0.35)',
      } : {
        background: 'linear-gradient(160deg, #07102e 0%, #0d1b3e 70%, #0a1628 100%)',
        boxShadow: '0 0 0 1px rgba(99,130,255,0.18), 0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      {/* Header bar */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/6">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isOverride ? 'bg-amber-600' : 'bg-[#1434CB]'}`}>
          <Bot size={13} className="text-white" />
        </div>
        <div className="flex-1">
          <span className="text-white text-xs font-semibold tracking-tight">
            {isOverride ? 'Visa AI Override Warning' : 'Visa AI Analysis'}
          </span>
          <span className="ml-2 text-[9px] font-mono text-white/30">
            {isOverride ? '· manual override detected' : '· VSMS-powered evaluation'}
          </span>
        </div>
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.span
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-1.5 text-[9px] font-bold font-mono uppercase tracking-widest ${isOverride ? 'text-amber-400' : 'text-[#60a5fa]'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOverride ? 'bg-amber-400' : 'bg-[#60a5fa]'}`} />
              Analyzing
            </motion.span>
          ) : (
            <motion.span
              key="done"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 font-mono uppercase tracking-widest"
            >
              <Sparkles size={10} className="text-emerald-400" />
              Complete
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Typing area */}
      <div className="px-5 py-4 min-h-[72px]">
        {!started ? (
          /* "Thinking" dots before typing starts */
          <div className="flex items-center gap-1.5 mt-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#4a7bff]/60"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed font-mono" style={{ color: 'rgba(200,215,255,0.88)' }}>
            {displayed}
            {/* Blinking cursor while typing */}
            {!done && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-[2px] h-[14px] bg-[#60a5fa] ml-0.5 align-middle"
              />
            )}
          </p>
        )}
      </div>

      {/* Best result highlight — slides in after typing finishes */}
      <AnimatePresence>
        {done && (() => {
          // Extract the winner name from the narrative (first proper-noun phrase before "leads")
          const match = narrative.match(/^([^,]+?)\s+leads/);
          const winner = match ? match[1].trim() : null;
          if (!winner) return null;
          return (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div
                className="mx-4 mb-4 rounded-xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(20,52,203,0.18), rgba(99,102,241,0.1))',
                  border: '1px solid rgba(74,123,255,0.3)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(20,52,203,0.25)', border: '1px solid rgba(74,123,255,0.4)' }}
                >
                  <Sparkles size={13} className="text-[#7fb3ff]" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold leading-tight">Best Value: {winner}</p>
                  <p className="text-[#7fb3ff]/60 text-[9px] font-mono mt-0.5">
                    AI-recommended · Visa VSMS verified
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}
