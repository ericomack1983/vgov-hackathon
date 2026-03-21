'use client';

import { createContext, useContext, useReducer, useMemo, ReactNode, useCallback } from 'react';
import { Supplier, RFP, Bid, ScoredBid } from '@/lib/mock-data/types';
import { MOCK_SUPPLIERS } from '@/lib/mock-data/suppliers';
import { MOCK_RFPS } from '@/lib/mock-data/rfps';

interface ProcurementState {
  suppliers: Supplier[];
  rfps: RFP[];
}

type ProcurementAction =
  | { type: 'ADD_RFP'; payload: RFP }
  | { type: 'UPDATE_RFP'; payload: { id: string; updates: Partial<RFP> } }
  | { type: 'ADD_BID'; payload: { rfpId: string; bid: Bid } }
  | { type: 'SET_EVALUATION'; payload: { rfpId: string; results: ScoredBid[] } }
  | { type: 'SET_OVERRIDE'; payload: { rfpId: string; winnerId: string; justification: string } };

function procurementReducer(state: ProcurementState, action: ProcurementAction): ProcurementState {
  switch (action.type) {
    case 'ADD_RFP':
      return { ...state, rfps: [...state.rfps, action.payload] };
    case 'UPDATE_RFP':
      return {
        ...state,
        rfps: state.rfps.map((rfp) =>
          rfp.id === action.payload.id ? { ...rfp, ...action.payload.updates } : rfp
        ),
      };
    case 'ADD_BID':
      return {
        ...state,
        rfps: state.rfps.map((rfp) =>
          rfp.id === action.payload.rfpId
            ? { ...rfp, bids: [...rfp.bids, action.payload.bid] }
            : rfp
        ),
      };
    case 'SET_EVALUATION':
      return {
        ...state,
        rfps: state.rfps.map((rfp) =>
          rfp.id === action.payload.rfpId
            ? { ...rfp, evaluationResults: action.payload.results, status: 'Evaluating' as const }
            : rfp
        ),
      };
    case 'SET_OVERRIDE':
      return {
        ...state,
        rfps: state.rfps.map((rfp) =>
          rfp.id === action.payload.rfpId
            ? {
                ...rfp,
                overrideWinnerId: action.payload.winnerId,
                overrideJustification: action.payload.justification,
                selectedWinnerId: action.payload.winnerId,
              }
            : rfp
        ),
      };
    default:
      return state;
  }
}

interface ProcurementContextValue {
  suppliers: Supplier[];
  rfps: RFP[];
  addRFP: (rfp: RFP) => void;
  updateRFP: (id: string, updates: Partial<RFP>) => void;
  addBid: (rfpId: string, bid: Bid) => void;
  setEvaluation: (rfpId: string, results: ScoredBid[]) => void;
  setOverride: (rfpId: string, winnerId: string, justification: string) => void;
}

const ProcurementContext = createContext<ProcurementContextValue | undefined>(undefined);

export function ProcurementProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(procurementReducer, {
    suppliers: MOCK_SUPPLIERS,
    rfps: MOCK_RFPS,
  });

  const addRFP = useCallback((rfp: RFP) => {
    dispatch({ type: 'ADD_RFP', payload: rfp });
  }, []);

  const updateRFP = useCallback((id: string, updates: Partial<RFP>) => {
    dispatch({ type: 'UPDATE_RFP', payload: { id, updates } });
  }, []);

  const addBid = useCallback((rfpId: string, bid: Bid) => {
    dispatch({ type: 'ADD_BID', payload: { rfpId, bid } });
  }, []);

  const setEvaluation = useCallback((rfpId: string, results: ScoredBid[]) => {
    dispatch({ type: 'SET_EVALUATION', payload: { rfpId, results } });
  }, []);

  const setOverride = useCallback((rfpId: string, winnerId: string, justification: string) => {
    dispatch({ type: 'SET_OVERRIDE', payload: { rfpId, winnerId, justification } });
  }, []);

  const value = useMemo(() => ({
    suppliers: state.suppliers,
    rfps: state.rfps,
    addRFP,
    updateRFP,
    addBid,
    setEvaluation,
    setOverride,
  }), [state.suppliers, state.rfps, addRFP, updateRFP, addBid, setEvaluation, setOverride]);

  return (
    <ProcurementContext.Provider value={value}>
      {children}
    </ProcurementContext.Provider>
  );
}

export function useProcurement() {
  const context = useContext(ProcurementContext);
  if (!context) throw new Error('useProcurement must be used within ProcurementProvider');
  return context;
}
