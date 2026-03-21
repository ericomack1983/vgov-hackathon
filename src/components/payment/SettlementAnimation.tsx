'use client';

import { motion } from 'framer-motion';
import { SettlementNode } from '@/components/payment/SettlementNode';
import {
  SettlementState,
  USD_NODES,
  USDC_NODES,
  getStepLabel,
} from '@/lib/settlement-engine';

interface SettlementAnimationProps {
  state: SettlementState;
  method: 'USD' | 'USDC';
}

export function SettlementAnimation({ state, method }: SettlementAnimationProps) {
  const nodes = method === 'USD' ? USD_NODES : USDC_NODES;
  const nodePositions = [80, 300, 520];

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-semibold text-indigo-600 mb-4">
        {getStepLabel(state.currentStep)}
      </p>

      <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
        {/* Background connecting line */}
        <line x1={80} y1={100} x2={520} y2={100} stroke="#e2e8f0" strokeWidth={2} />

        {/* Animated progress line */}
        <motion.line
          x1={80}
          y1={100}
          x2={80}
          y2={100}
          stroke="#4f46e5"
          strokeWidth={3}
          animate={{ x2: 80 + (state.progress / 100) * 440 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />

        {/* Settlement nodes */}
        {nodes.map((node, i) => (
          <SettlementNode
            key={node.label}
            label={node.label}
            icon={node.icon}
            x={nodePositions[i]}
            isActive={
              (i === 0 && state.progress >= 33) ||
              (i === 1 && state.progress >= 66) ||
              (i === 2 && state.progress >= 100)
            }
            isCompleted={
              (i === 0 && state.progress >= 66) ||
              (i === 1 && state.progress >= 100) ||
              false
            }
          />
        ))}

        {/* Animated fund circle */}
        {state.currentStep !== 'idle' && (
          <motion.circle
            cx={80}
            cy={100}
            r={8}
            fill="#4f46e5"
            animate={{ cx: 80 + (state.progress / 100) * 440 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        )}
      </svg>

      {/* Transaction hash for USDC */}
      {method === 'USDC' && state.txHash && (
        <p className="text-xs font-mono text-slate-500 text-center mt-2 truncate max-w-md">
          Tx Hash: {state.txHash}
        </p>
      )}
    </div>
  );
}
