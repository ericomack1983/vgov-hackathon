'use client';

import { useReducer, useCallback, useEffect, useRef } from 'react';
import {
  settlementReducer,
  INITIAL_SETTLEMENT_STATE,
  USD_STEP_DELAY,
  USDC_STEP_DELAY,
  getStepLabel,
} from '@/lib/settlement-engine';
import toast from 'react-hot-toast';

export interface SettlementCompleteData {
  txHash?: string;
  startedAt?: string;
  method: 'USD' | 'USDC' | 'Card';
}

export function useSettlement(onComplete: (data: SettlementCompleteData) => void) {
  const [state, dispatch] = useReducer(settlementReducer, INITIAL_SETTLEMENT_STATE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedRef = useRef(false);

  const start = useCallback((method: 'USD' | 'USDC' | 'Card', orderId: string, paymentMode?: 'cnp' | 'card-present') => {
    hasCompletedRef.current = false;
    dispatch({ type: 'START', payload: { method, orderId, paymentMode } });
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    hasCompletedRef.current = false;
    dispatch({ type: 'RESET' });
  }, []);

  useEffect(() => {
    if (state.currentStep === 'idle') return;

    if (state.currentStep !== 'settled') {
      const delay = state.method === 'USDC' ? USDC_STEP_DELAY : USD_STEP_DELAY;
      const icon = state.method === 'USDC' ? '\u26D3' : '\uD83C\uDFE6';

      toast.success(`${state.method} Payment: ${getStepLabel(state.currentStep, state.paymentMode)}`, {
        icon,
      });

      timerRef.current = setTimeout(() => {
        dispatch({ type: 'ADVANCE' });
      }, delay);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }

    if (state.currentStep === 'settled' && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      const icon = state.method === 'USDC' ? '\u26D3' : '\uD83C\uDFE6';
      toast.success(state.paymentMode === 'cnp' ? 'Payment Executed' : `${state.method} Payment: Settled`, { icon });

      onComplete({
        txHash: state.txHash,
        startedAt: state.startedAt,
        method: state.method,
      });
    }
  }, [state.currentStep, state.method, state.txHash, state.startedAt, onComplete]);

  return {
    state,
    start,
    reset,
    isSettled: state.currentStep === 'settled',
    isActive: state.currentStep !== 'idle',
  };
}
