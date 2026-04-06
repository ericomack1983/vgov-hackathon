'use client';

import { createContext, useContext, useReducer, useMemo, useCallback, ReactNode } from 'react';
import { ConfidenceScore } from '@/ai/scoring';

// ── Ledger entry type ──────────────────────────────────────────────────────

export type LedgerDecision = 'auto_approved' | 'manual_review' | 'rejected';
export type LedgerApproval = 'auto' | 'manual' | 'none';

export interface LedgerEntry {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  rfpId: string;
  amount: number;
  scores: ConfidenceScore;
  decision: LedgerDecision;
  approvalType: LedgerApproval;
  paymentTriggered: boolean;
  transactionId?: string;
  orderId?: string;
  timestamp: string;
}

// ── State & actions ────────────────────────────────────────────────────────

interface LedgerState {
  entries: LedgerEntry[];
}

type LedgerAction =
  | { type: 'ADD_ENTRY'; payload: LedgerEntry };

function ledgerReducer(state: LedgerState, action: LedgerAction): LedgerState {
  switch (action.type) {
    case 'ADD_ENTRY':
      // Deduplicate by invoiceId
      return {
        ...state,
        entries: [
          action.payload,
          ...state.entries.filter((e) => e.invoiceId !== action.payload.invoiceId),
        ],
      };
    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────

interface AILedgerContextValue {
  entries: LedgerEntry[];
  addEntry: (entry: LedgerEntry) => void;
}

const AILedgerContext = createContext<AILedgerContextValue | undefined>(undefined);

export function AILedgerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(ledgerReducer, { entries: [] });

  const addEntry = useCallback((entry: LedgerEntry) => {
    dispatch({ type: 'ADD_ENTRY', payload: entry });
  }, []);

  const value = useMemo(
    () => ({ entries: state.entries, addEntry }),
    [state.entries, addEntry],
  );

  return (
    <AILedgerContext.Provider value={value}>
      {children}
    </AILedgerContext.Provider>
  );
}

export function useAILedger() {
  const ctx = useContext(AILedgerContext);
  if (!ctx) throw new Error('useAILedger must be used within AILedgerProvider');
  return ctx;
}
