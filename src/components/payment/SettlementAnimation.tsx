'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SettlementState, USD_NODES, USDC_NODES, getStepLabel } from '@/lib/settlement-engine';
import { Building2, ShieldCheck, MonitorSmartphone, CheckCircle, Lock, CreditCard } from 'lucide-react';

interface SettlementAnimationProps {
  state: SettlementState;
  method: 'USD' | 'USDC' | 'Card';
}

// ── Secure transmission animation ────────────────────────────────────────────
function SecureChannelScene({ done }: { done: boolean }) {
  return (
    <div className="relative h-28 flex items-center justify-between px-6 bg-slate-950 rounded-2xl overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(#4f46e5 1px,transparent 1px),linear-gradient(90deg,#4f46e5 1px,transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Gov node */}
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900">
          <Building2 size={18} className="text-white" />
        </div>
        <span className="text-[9px] text-slate-400 font-medium">Gov Office</span>
      </div>

      {/* Animated packet */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute flex items-center gap-1 bg-indigo-600 rounded-full px-2 py-1 shadow-lg shadow-indigo-900/50"
            initial={{ left: '18%', opacity: 0 }}
            animate={done
              ? { left: '75%', opacity: [0, 1, 1, 0] }
              : { left: ['18%', '75%'], opacity: [0, 1, 1, 0] }
            }
            transition={{ duration: 1.8, delay: i * 0.6, repeat: done ? 0 : Infinity, ease: 'easeInOut' }}
          >
            <Lock size={8} className="text-white" />
            <span className="text-[8px] font-mono text-white">•••• {['4821','3390','7714'][i]}</span>
          </motion.div>
        ))}
      </div>

      {/* Channel label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
        <div className="flex gap-1">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-indigo-400"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
        </div>
        <span className="text-[9px] text-indigo-400 font-semibold tracking-widest uppercase">Encrypted</span>
      </div>

      {/* Supplier node */}
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-500 ${done ? 'bg-emerald-500 shadow-emerald-900' : 'bg-slate-700'}`}>
          {done
            ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}><CreditCard size={18} className="text-white" /></motion.div>
            : <CreditCard size={18} className="text-slate-400" />
          }
        </div>
        <span className="text-[9px] text-slate-400 font-medium">Supplier</span>
      </div>
    </div>
  );
}

// ── Card-specific step cards ──────────────────────────────────────────────────
const CARD_STEPS = [
  { key: 'authorized', icon: <Building2 size={24} className="text-indigo-600" />, activeBg: 'bg-indigo-50 border-indigo-200', title: 'Card Number Dispatched', sub: 'Encrypted card details sent to the winning supplier.' },
  { key: 'processing', icon: <ShieldCheck size={24} className="text-emerald-600" />, activeBg: 'bg-emerald-50 border-emerald-200', title: 'Secure Channel Delivery', sub: null /* replaced by scene */ },
  { key: 'settled', icon: <MonitorSmartphone size={24} className="text-violet-600" />, activeBg: 'bg-violet-50 border-violet-200', title: 'Card Entered at POS', sub: 'Supplier entered card into POS terminal — funds credited to account.' },
];

function CardSettlementAnimation({ state }: { state: SettlementState }) {
  const idx = state.currentStep === 'authorized' ? 0 : state.currentStep === 'processing' ? 1 : state.currentStep === 'settled' ? 2 : -1;
  const done = (i: number) => (state.currentStep === 'processing' && i === 0) || (state.currentStep === 'settled' && i <= 1);

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-indigo-600 text-center">{getStepLabel(state.currentStep)}</p>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <motion.div className="h-full bg-indigo-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${state.progress}%` }} transition={{ duration: 0.8, ease: 'easeInOut' }} />
      </div>
      <div className="space-y-3 mt-2">
        {CARD_STEPS.map((step, i) => {
          const isActive = idx === i;
          const isDone = done(i);
          const isPending = idx < i;
          return (
            <motion.div key={step.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: isPending ? 0.35 : 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.3 }}
              className={`rounded-2xl border transition-all overflow-hidden ${isDone ? 'bg-slate-50 border-slate-100' : isActive ? `${step.activeBg} shadow-sm` : 'bg-white border-slate-100'}`}
            >
              <div className="flex items-start gap-4 p-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-50' : isActive ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
                  <AnimatePresence mode="wait">
                    {isDone
                      ? <motion.div key="chk" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}><CheckCircle size={24} className="text-emerald-500" /></motion.div>
                      : <motion.div key="ic" animate={{ scale: isActive ? [1, 1.08, 1] : 1 }} transition={{ duration: 1.4, repeat: isActive ? Infinity : 0 }}>{step.icon}</motion.div>
                    }
                  </AnimatePresence>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`text-sm font-semibold ${isDone ? 'text-slate-400' : isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</p>
                  {step.sub && <p className={`text-xs mt-0.5 ${isDone ? 'text-slate-300' : isActive ? 'text-slate-500' : 'text-slate-300'}`}>{step.sub}</p>}
                </div>
                {isActive && <motion.div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
              </div>
              {/* Secure channel scene only for step 2 */}
              {i === 1 && (isActive || isDone) && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.3 }} className="px-4 pb-4">
                  <SecureChannelScene done={isDone} />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Paper-plane node ──────────────────────────────────────────────────────────
function NetworkNode({ label, icon, active, done, x }: {
  label: string; icon: React.ReactNode; active: boolean; done: boolean; x: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2" style={{ width: 80, marginLeft: `calc(${x} - 40px)`, position: 'absolute', left: 0, top: 0 }}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all duration-500 ${
        done   ? 'bg-emerald-500 shadow-emerald-200' :
        active ? 'bg-indigo-600 shadow-indigo-200' :
                 'bg-slate-100'
      }`}>
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="chk" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
              <CheckCircle size={26} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="ic" animate={{ scale: active ? [1, 1.1, 1] : 1 }} transition={{ duration: 1.4, repeat: active ? Infinity : 0 }}>
              <div className={done || active ? 'text-white' : 'text-slate-400'}>{icon}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className="text-[11px] font-semibold text-slate-500 text-center leading-tight whitespace-nowrap">{label}</span>
    </div>
  );
}

// ── USD / USDC paper-plane animation ──────────────────────────────────────────
export function SettlementAnimation({ state, method }: SettlementAnimationProps) {
  if (method === 'Card') return <CardSettlementAnimation state={state} />;

  const nodes = method === 'USDC' ? USDC_NODES : USD_NODES;

  // progress: 33 = between node0→1, 66 = between node1→2, 100 = arrived
  const planeProgress = state.progress; // 0, 33, 66, 100

  // plane x as percentage across the track (nodes sit at ~10%, 50%, 90%)
  const planeX =
    planeProgress === 0   ? '10%'  :
    planeProgress === 33  ? '50%'  :
    planeProgress === 66  ? '90%'  : '90%';

  const nodeActive  = (i: number) => (i===0 && planeProgress>=33) || (i===1 && planeProgress>=66) || (i===2 && planeProgress>=100);
  const nodeDone    = (i: number) => (i===0 && planeProgress>=66) || (i===1 && planeProgress>=100);
  const nodeXs      = ['10%', '50%', '90%'];

  const nodeIcons = [
    <Building2 size={22} />,
    <CreditCard size={22} />,
    <Building2 size={22} />,
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-semibold text-indigo-600">{getStepLabel(state.currentStep)}</p>

      {/* Track + nodes + plane */}
      <div className="relative w-full max-w-lg h-24 mx-auto">

        {/* Track line */}
        <div className="absolute top-7 left-[10%] right-[10%] h-0.5 bg-slate-200 rounded-full" />
        {/* Progress fill */}
        <motion.div
          className="absolute top-7 left-[10%] h-0.5 bg-indigo-400 rounded-full origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: planeProgress / 100 }}
          style={{ width: '80%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />

        {/* Nodes */}
        {nodes.map((node, i) => (
          <div key={node.label} style={{ position: 'absolute', left: nodeXs[i], top: 0, transform: 'translateX(-50%)' }}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all duration-500 ${
                nodeDone(i)    ? 'bg-emerald-500 shadow-emerald-200' :
                nodeActive(i)  ? 'bg-indigo-600 shadow-indigo-200'  :
                                  'bg-slate-100 border border-slate-200'
              }`}>
                <AnimatePresence mode="wait">
                  {nodeDone(i) ? (
                    <motion.div key="chk" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                      <CheckCircle size={24} className="text-white" />
                    </motion.div>
                  ) : (
                    <motion.div key="ic"
                      animate={{ scale: nodeActive(i) ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 1.4, repeat: nodeActive(i) ? Infinity : 0 }}
                      className={nodeDone(i) || nodeActive(i) ? 'text-white' : 'text-slate-400'}
                    >
                      {nodeIcons[i]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 text-center leading-tight whitespace-nowrap max-w-[80px]">{node.label}</span>
            </div>
          </div>
        ))}

        {/* Paper plane with lock */}
        {state.currentStep !== 'idle' && (
          <motion.div
            className="absolute top-0 flex flex-col items-center"
            style={{ transform: 'translateX(-50%)' }}
            animate={{ left: planeX }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            {/* Plane container */}
            <motion.div
              className="relative w-10 h-10 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-300 flex items-center justify-center"
              animate={planeProgress < 100 ? { y: [0, -4, 0], rotate: [0, 3, -2, 0] } : { scale: [1, 1.15, 1] }}
              transition={planeProgress < 100
                ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.4, ease: 'easeOut' }
              }
            >
              {/* Paper plane SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {/* Lock badge */}
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                <Lock size={10} className="text-amber-900" />
              </div>
            </motion.div>

            {/* Trail dots */}
            {planeProgress < 100 && (
              <div className="flex gap-0.5 mt-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full bg-indigo-300"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {method === 'USDC' && state.txHash && (
        <p className="text-xs font-mono text-slate-400 text-center truncate max-w-md">Tx Hash: {state.txHash}</p>
      )}
    </div>
  );
}
