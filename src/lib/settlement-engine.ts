export type USDSettlementStep = 'idle' | 'authorized' | 'processing' | 'settled';
export type USDCSettlementStep = 'idle' | 'submitted' | 'confirmed' | 'settled';

export interface SettlementState {
  method: 'USD' | 'USDC';
  currentStep: USDSettlementStep | USDCSettlementStep;
  progress: number; // 0, 33, 66, 100
  txHash?: string;
  orderId: string;
  startedAt?: string;
}

export type SettlementAction =
  | { type: 'START'; payload: { method: 'USD' | 'USDC'; orderId: string } }
  | { type: 'ADVANCE' }
  | { type: 'RESET' };

export const INITIAL_SETTLEMENT_STATE: SettlementState = {
  method: 'USD',
  currentStep: 'idle',
  progress: 0,
  orderId: '',
};

function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function settlementReducer(
  state: SettlementState,
  action: SettlementAction
): SettlementState {
  switch (action.type) {
    case 'START': {
      const { method, orderId } = action.payload;
      return {
        method,
        orderId,
        currentStep: method === 'USD' ? 'authorized' : 'submitted',
        progress: 33,
        txHash: method === 'USDC' ? generateTxHash() : undefined,
        startedAt: new Date().toISOString(),
      };
    }
    case 'ADVANCE': {
      if (state.currentStep === 'settled') return state;

      if (state.method === 'USD') {
        if (state.currentStep === 'authorized') {
          return { ...state, currentStep: 'processing', progress: 66 };
        }
        if (state.currentStep === 'processing') {
          return { ...state, currentStep: 'settled', progress: 100 };
        }
      } else {
        if (state.currentStep === 'submitted') {
          return { ...state, currentStep: 'confirmed', progress: 66 };
        }
        if (state.currentStep === 'confirmed') {
          return { ...state, currentStep: 'settled', progress: 100 };
        }
      }
      return state;
    }
    case 'RESET':
      return INITIAL_SETTLEMENT_STATE;
    default:
      return state;
  }
}

export const USD_NODES = [
  { label: 'Government Bank', icon: 'Building' },
  { label: 'Visa Network', icon: 'CreditCard' },
  { label: 'Supplier Bank', icon: 'Building' },
] as const;

export const USDC_NODES = [
  { label: 'Government Wallet', icon: 'Wallet' },
  { label: 'Polygon Network', icon: 'Globe' },
  { label: 'Supplier Wallet', icon: 'Wallet' },
] as const;

export const USD_STEP_DELAY = 2000; // 2s per step, ~6s total
export const USDC_STEP_DELAY = 1500; // 1.5s per step, ~3s total

export function getStepLabel(step: string): string {
  switch (step) {
    case 'authorized':
      return 'Authorized';
    case 'processing':
      return 'Processing (T+2)';
    case 'settled':
      return 'Settled';
    case 'submitted':
      return 'Submitted to Polygon';
    case 'confirmed':
      return 'Confirmed on Chain';
    case 'idle':
      return 'Ready';
    default:
      return step;
  }
}
