'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettlementState, getStepLabel } from '@/lib/settlement-engine';
import { Building2, ShieldCheck, MonitorSmartphone, CheckCircle, Lock, CreditCard } from 'lucide-react';
import createGlobe from 'cobe';

// ── Coordinates ────────────────────────────────────────────────────────────────
const SAO_PAULO  = { lat: -23.55, lng: -46.63 };
const VIRGINIA   = { lat: 38.90,  lng: -77.04 }; // Visa USA HQ area

// ── Globe payment arc ──────────────────────────────────────────────────────────
const SIZE = 260;
// Approximate screen positions of SP and VA on the globe at phi≈1.1
// SP  (lat -23.55, lng -46.63) → roughly bottom-left of Americas view
const SP_X = 78,  SP_Y = 178;
// VA  (lat  38.90, lng -77.04) → roughly upper-right
const VA_X = 182, VA_Y = 72;
// SVG cubic bezier arc path (control pts arching "over" the globe)
const ARC_PATH = `M ${SP_X} ${SP_Y} C ${SP_X - 10} 20, ${VA_X + 10} 20, ${VA_X} ${VA_Y}`;
const ARC_LENGTH = 310; // approximate path length in px

function GlobePaymentArc({ progress }: { progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef  = useRef<ReturnType<typeof createGlobe> | null>(null);
  const phiRef    = useRef(1.1);
  const rafRef    = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set physical pixel dimensions before createGlobe
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width  = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;

    globeRef.current = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width:  SIZE * dpr,
      height: SIZE * dpr,
      phi:    phiRef.current,
      theta:  0.2,
      dark:   1,
      diffuse: 2.4,
      mapSamples: 24000,
      mapBrightness: 14,
      baseColor:   [0.08, 0.14, 0.42],
      markerColor: [0.3,  0.6,  1.0],
      glowColor:   [0.05, 0.10, 0.55],
      markers: [
        { location: [SAO_PAULO.lat, SAO_PAULO.lng], size: 0.07 },
        { location: [VIRGINIA.lat,  VIRGINIA.lng],  size: 0.07 },
      ],
      opacity: 0.92,
    });

    const tick = () => {
      phiRef.current += 0.0015;
      globeRef.current?.update({ phi: phiRef.current, theta: 0.2 });
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    canvas.style.opacity = '0';
    requestAnimationFrame(() => {
      canvas.style.transition = 'opacity 1s ease';
      canvas.style.opacity = '1';
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      globeRef.current?.destroy();
      globeRef.current = null;
    };
  }, []);

  const showArc1   = progress >= 33;
  const showArc2   = progress >= 66;
  const settled    = progress === 100;
  const spActive   = progress >= 33;
  const vaActive   = progress >= 66;

  return (
    <div className="relative flex flex-col items-center">
      <style>{`
        @keyframes draw-arc {
          from { stroke-dashoffset: ${ARC_LENGTH}; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes travel-dot {
          0%   { offset-distance: 0%;   opacity: 1; }
          90%  { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
      `}</style>

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* Globe canvas */}
        <canvas ref={canvasRef} style={{ borderRadius: '50%', touchAction: 'none', display: 'block' }} />

        {/* SVG arc overlay */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={SIZE} height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          overflow="visible"
        >
          {/* Arc 1: SP → VA */}
          {showArc1 && (
            <path
              d={ARC_PATH}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={ARC_LENGTH}
              strokeDashoffset={0}
              style={{ animation: `draw-arc 1.2s ease-out forwards` }}
            />
          )}
          {/* Arc 2: VA → SP (reverse path) */}
          {showArc2 && (
            <path
              d={`M ${VA_X} ${VA_Y} C ${VA_X + 10} ${SIZE - 20}, ${SP_X - 10} ${SIZE - 20}, ${SP_X} ${SP_Y}`}
              fill="none"
              stroke={settled ? '#34d399' : '#F7B600'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={ARC_LENGTH}
              strokeDashoffset={0}
              style={{ animation: `draw-arc 1.2s ease-out forwards` }}
            />
          )}

          {/* Travelling dot — SP → VA */}
          {showArc1 && !showArc2 && (
            <circle r="4" fill="#60a5fa" style={{ filter: 'drop-shadow(0 0 4px #60a5fa)' }}>
              <animateMotion dur="1.4s" repeatCount="indefinite" path={ARC_PATH} />
            </circle>
          )}
          {/* Travelling dot — VA → SP */}
          {showArc2 && !settled && (
            <circle r="4" fill="#F7B600" style={{ filter: 'drop-shadow(0 0 4px #F7B600)' }}>
              <animateMotion dur="1.4s" repeatCount="indefinite"
                path={`M ${VA_X} ${VA_Y} C ${VA_X + 10} ${SIZE - 20}, ${SP_X - 10} ${SIZE - 20}, ${SP_X} ${SP_Y}`} />
            </circle>
          )}

          {/* Node dots */}
          <circle cx={SP_X} cy={SP_Y} r="5" fill={settled ? '#34d399' : spActive ? '#60a5fa' : '#334155'}
            style={spActive ? { filter: 'drop-shadow(0 0 6px #60a5fa)' } : {}} />
          <circle cx={VA_X} cy={VA_Y} r="5" fill={vaActive ? '#F7B600' : '#334155'}
            style={vaActive ? { filter: 'drop-shadow(0 0 6px #F7B600)' } : {}} />
        </svg>

        {/* São Paulo label */}
        <div className="absolute pointer-events-none"
          style={{ left: SP_X - 38, top: SP_Y + 10 }}
        >
          <div className="px-1.5 py-0.5 rounded text-[7px] font-bold font-mono tracking-wide whitespace-nowrap transition-all duration-500"
            style={{
              background: 'rgba(6,12,36,0.9)',
              border: `1px solid ${spActive ? 'rgba(96,165,250,0.5)' : 'rgba(74,123,255,0.2)'}`,
              color: spActive ? '#93bbff' : 'rgba(148,180,255,0.35)',
            }}>
            São Paulo
          </div>
        </div>

        {/* Virginia label */}
        <div className="absolute pointer-events-none"
          style={{ left: VA_X + 8, top: VA_Y - 10 }}
        >
          <div className="px-1.5 py-0.5 rounded text-[7px] font-bold font-mono tracking-wide whitespace-nowrap transition-all duration-500"
            style={{
              background: 'rgba(6,12,36,0.9)',
              border: `1px solid ${vaActive ? 'rgba(247,182,0,0.5)' : 'rgba(74,123,255,0.2)'}`,
              color: vaActive ? '#F7B600' : 'rgba(148,180,255,0.35)',
            }}>
            Visa · Virginia
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono tracking-wider"
        style={{ color: 'rgba(148,180,255,0.45)' }}>
        <span style={{ color: spActive ? '#60a5fa' : undefined }}>BR</span>
        <span>→</span>
        <span style={{ color: showArc1 ? '#F7B600' : undefined }}>Visa Network</span>
        <span>→</span>
        <span style={{ color: settled ? '#34d399' : showArc2 ? '#60a5fa' : undefined }}>BR</span>
      </div>
    </div>
  );
}

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
        style={{ backgroundImage: 'linear-gradient(#1434CB 1px,transparent 1px),linear-gradient(90deg,#1434CB 1px,transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Gov node */}
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 rounded-xl bg-[#1434CB] flex items-center justify-center shadow-lg shadow-indigo-900">
          <Building2 size={18} className="text-white" />
        </div>
        <span className="text-[9px] text-slate-400 font-medium">Gov Office</span>
      </div>

      {/* Animated packet */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute flex items-center gap-1 bg-[#1434CB] rounded-full px-2 py-1 shadow-lg shadow-indigo-900/50"
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
              className="w-1 h-1 rounded-full bg-[#1434CB]"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
        </div>
        <span className="text-[9px] text-[#1434CB] font-semibold tracking-widest uppercase">Encrypted</span>
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
  { key: 'authorized', icon: <Building2 size={24} className="text-[#1434CB]" />, activeBg: 'bg-[#EEF1FD] border-[#A5B8F3]', title: 'Card Number Dispatched', sub: 'Encrypted card details sent to the winning supplier.' },
  { key: 'processing', icon: <ShieldCheck size={24} className="text-emerald-600" />, activeBg: 'bg-emerald-50 border-emerald-200', title: 'Secure Channel Delivery', sub: null /* replaced by scene */ },
  { key: 'settled', icon: <MonitorSmartphone size={24} className="text-violet-600" />, activeBg: 'bg-violet-50 border-violet-200', title: 'Card Entered at POS', sub: 'Supplier entered card into POS terminal — funds credited to account.' },
];

function CardSettlementAnimation({ state }: { state: SettlementState }) {
  const idx = state.currentStep === 'authorized' ? 0 : state.currentStep === 'processing' ? 1 : state.currentStep === 'settled' ? 2 : -1;
  const done = (i: number) => (state.currentStep === 'processing' && i === 0) || (state.currentStep === 'settled' && i <= 1);

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-[#1434CB] text-center">{getStepLabel(state.currentStep)}</p>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <motion.div className="h-full bg-[#1434CB] rounded-full" initial={{ width: 0 }} animate={{ width: `${state.progress}%` }} transition={{ duration: 0.8, ease: 'easeInOut' }} />
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
                {isActive && <motion.div className="w-2 h-2 rounded-full bg-[#1434CB] shrink-0 mt-2" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
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
        active ? 'bg-[#1434CB] shadow-#A5B8F3' :
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

  const planeProgress = state.progress;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Status label */}
      <p className="text-sm font-semibold text-[#1434CB] text-center">{getStepLabel(state.currentStep)}</p>

      {/* Progress bar */}
      <div className="w-full max-w-xs bg-slate-100 h-1 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#1434CB,#60a5fa)' }}
          initial={{ width: 0 }}
          animate={{ width: `${planeProgress}%` }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </div>

      {/* Globe */}
      <div className="rounded-2xl overflow-hidden p-3"
        style={{
          background: 'linear-gradient(160deg, #07102e 0%, #0d1b3e 60%, #0a1628 100%)',
          boxShadow: '0 0 0 1px rgba(74,123,255,0.15), 0 12px 40px rgba(0,0,0,0.35)',
        }}
      >
        <GlobePaymentArc progress={planeProgress} />
      </div>

      {method === 'USDC' && state.txHash && (
        <p className="text-xs font-mono text-slate-400 text-center truncate max-w-xs">Tx: {state.txHash.slice(0, 20)}…</p>
      )}
    </div>
  );
}
