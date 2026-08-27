'use client';

/**
 * Visa / CyberSource payment animation.
 *
 * Replaces the globe-and-arcs scene, which read as money flying between cities —
 * the wrong story for a card authorization. What actually happens is a virtual
 * card presented to CyberSource, authorized across VisaNet, and captured; this
 * animates that rail.
 *
 * The motion follows Visa Sensory Branding: one confident sweep in Visa blue
 * resolving into the gold checkmark, with a pulse at the moment of approval
 * rather than continuous ambient movement.
 * Reference: https://developer.visa.com/pages/visa-sensory-branding
 */

import { motion, AnimatePresence } from 'framer-motion';

const BLUE = '#1434CB';
const BLUE_LIGHT = '#60a5fa';
const GOLD = '#F7B600';

const W = 320;
const H = 190;

/** The rail the authorization travels: card → CyberSource → VisaNet → supplier. */
const RAIL = 'M 40 128 C 96 128, 104 66, 160 66 S 224 128, 280 128';

const NODES = [
  { x: 40,  y: 128, label: 'VCN',      at: 0 },
  { x: 160, y: 66,  label: 'CyberSource', at: 40 },
  { x: 280, y: 128, label: 'VisaNet',  at: 80 },
] as const;

export function VisaPaymentRail({ progress, settled }: { progress: number; settled: boolean }) {
  // The rail draws with progress; the pulse rides the drawn portion.
  const drawn = Math.min(1, Math.max(0, progress / 100));

  return (
    <div className="relative" style={{ width: W, height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="rail-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={BLUE} />
            <stop offset="55%" stopColor={BLUE_LIGHT} />
            <stop offset="100%" stopColor={GOLD} />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor={BLUE_LIGHT} stopOpacity="0.5" />
            <stop offset="100%" stopColor={BLUE_LIGHT} stopOpacity="0" />
          </radialGradient>
          <filter id="soft-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient field */}
        <ellipse cx={W / 2} cy={H / 2} rx={150} ry={82} fill="url(#glow)" opacity={0.5} />

        {/* Rail — unlit track, then the lit portion drawing with progress */}
        <path d={RAIL} fill="none" stroke="rgba(147,187,255,0.16)" strokeWidth={2.5} strokeLinecap="round" />
        <motion.path
          d={RAIL}
          fill="none"
          stroke="url(#rail-grad)"
          strokeWidth={3}
          strokeLinecap="round"
          filter="url(#soft-glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: drawn }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* The authorization itself, riding the rail */}
        {!settled && progress > 0 && (
          <motion.circle
            r={5}
            fill={GOLD}
            filter="url(#soft-glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <animateMotion dur="1.9s" repeatCount="indefinite" path={RAIL} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 0.2 1" />
          </motion.circle>
        )}

        {/* Nodes */}
        {NODES.map((n) => {
          const reached = progress >= n.at;
          return (
            <g key={n.label}>
              {reached && (
                <motion.circle
                  cx={n.x} cy={n.y} r={11}
                  fill="none" stroke={settled ? GOLD : BLUE_LIGHT} strokeWidth={1.2}
                  initial={{ scale: 0.6, opacity: 0.9 }}
                  animate={{ scale: [0.6, 1.5], opacity: [0.9, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                  style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                />
              )}
              <motion.circle
                cx={n.x} cy={n.y} r={5.5}
                fill={reached ? (settled ? GOLD : BLUE_LIGHT) : 'rgba(147,187,255,0.28)'}
                animate={{ scale: reached ? 1 : 0.8 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: `${n.x}px ${n.y}px` }}
              />
              <text
                x={n.x}
                y={n.y === 66 ? n.y - 20 : n.y + 26}
                textAnchor="middle"
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  fill: reached ? 'rgba(220,232,255,0.92)' : 'rgba(147,187,255,0.4)',
                }}
              >
                {n.label}
              </text>
            </g>
          );
        })}

        {/* Approval — the Visa sensory resolve: sweep, checkmark, gold pulse */}
        <AnimatePresence>
          {settled && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.circle
                cx={W / 2} cy={H / 2 - 8} r={30}
                fill="none" stroke={GOLD} strokeWidth={2}
                initial={{ pathLength: 0, rotate: -90 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: `${W / 2}px ${H / 2 - 8}px` }}
              />
              <motion.circle
                cx={W / 2} cy={H / 2 - 8} r={30}
                fill="none" stroke={GOLD} strokeWidth={1.5}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: [1, 2.1], opacity: [0.8, 0] }}
                transition={{ duration: 1.4, ease: 'easeOut', repeat: Infinity }}
                style={{ transformOrigin: `${W / 2}px ${H / 2 - 8}px` }}
              />
              <motion.path
                d={`M ${W / 2 - 13} ${H / 2 - 8} l 9 10 l 18 -20`}
                fill="none" stroke={GOLD} strokeWidth={3.5}
                strokeLinecap="round" strokeLinejoin="round"
                filter="url(#soft-glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* Rail caption */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 font-mono"
        style={{ fontSize: 9, letterSpacing: '0.1em', color: 'rgba(148,180,255,0.45)' }}
      >
        <span style={{ color: progress > 0 ? BLUE_LIGHT : undefined }}>AUTHORIZE</span>
        <span>→</span>
        <span style={{ color: progress >= 66 ? BLUE_LIGHT : undefined }}>CAPTURE</span>
        <span>→</span>
        <span style={{ color: settled ? '#34d399' : undefined }}>SETTLEMENT</span>
      </div>
    </div>
  );
}
