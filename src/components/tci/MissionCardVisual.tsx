'use client';

import { motion } from 'framer-motion';
import { CreditCard, Wifi } from 'lucide-react';
import type { MissionCard } from '@/lib/mock-data/types';
import { formatGTQCompact } from '@/lib/tci-format';

/**
 * Tarjeta virtual de misión — mismo lenguaje visual que la CardPreview de
 * /cards (gradiente de marca, chip, contactless, número enmascarado).
 */
export function MissionCardVisual({ card, compact = false }: { card: MissionCard; compact?: boolean }) {
  return (
    <div className="w-full" style={{ perspective: '900px' }}>
      <motion.div
        animate={
          card.blocked
            ? { rotateY: 0, rotateX: 0, y: 0 }
            : { rotateY: [-4, 4, -4], rotateX: [2, -2, 2], y: [0, -8, 0] }
        }
        transition={card.blocked ? {} : { duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className={`relative w-full ${compact ? 'h-40' : 'h-48'} rounded-2xl bg-gradient-to-br from-[#1434CB] to-[#0a1f8f] overflow-hidden select-none`}
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: card.blocked
            ? '0 8px 24px rgba(0,0,0,0.25)'
            : '0 28px 64px rgba(0,0,0,0.45), 0 8px 24px rgba(20,52,203,0.35)',
          filter: card.blocked ? 'saturate(0.18) brightness(0.72)' : undefined,
        }}
      >
        {/* Brillo superior izquierdo */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 45%)' }}
        />
        {/* Textura diagonal (motivo cinta Visa) */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'repeating-linear-gradient(135deg, transparent, transparent 22px, rgba(255,255,255,0.022) 22px, rgba(255,255,255,0.022) 23px)' }}
        />

        <div className="absolute top-3 left-6">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/15 backdrop-blur-sm text-[9px] font-bold text-white/80 uppercase tracking-wider">
            <CreditCard size={8} />
            VCN de Misión
          </span>
        </div>

        <div className="absolute top-10 left-6 w-9 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner grid grid-cols-2 gap-px p-1">
          {[...Array(4)].map((_, i) => <div key={i} className="rounded-sm bg-yellow-600/40" />)}
        </div>

        <div className="absolute top-10 left-16">
          <Wifi size={14} className="text-white/60 rotate-90" />
        </div>

        <div className="absolute top-5 right-5">
          <span className="text-white font-black tracking-widest text-sm">VISA</span>
        </div>

        <div className="absolute top-1/2 left-6 -translate-y-1/2">
          <p className="font-mono text-white text-lg tracking-[0.22em]">
            •••• •••• •••• {card.last4}
          </p>
        </div>

        <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
          <div>
            <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Titular</p>
            <p className="text-white text-xs font-semibold tracking-wide uppercase truncate max-w-[150px]">
              {card.holderName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Vence</p>
            <p className="text-white text-xs font-semibold">{card.expiry}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Límite</p>
            <p className="text-white text-xs font-semibold">{formatGTQCompact(card.spendLimitGTQ)}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
