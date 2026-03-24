export type USDSettlementStep = 'idle' | 'authorized' | 'processing' | 'settled';
export type USDCSettlementStep = 'idle' | 'submitted' | 'confirmed' | 'settled';

export interface SettlementState {
  method: 'USD' | 'USDC' | 'Card';
  currentStep: USDSettlementStep | USDCSettlementStep;
  progress: number; // 0, 33, 66, 100
  txHash?: string;
  orderId: string;
  startedAt?: string;
  paymentMode?: 'cnp' | 'card-present';
}

export type SettlementAction =
  | { type: 'START'; payload: { method: 'USD' | 'USDC' | 'Card'; orderId: string; paymentMode?: 'cnp' | 'card-present' } }
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
      const { method, orderId, paymentMode } = action.payload;
      const isUSDLike = method === 'USD' || method === 'Card';
      return {
        method,
        orderId,
        paymentMode,
        currentStep: isUSDLike ? 'authorized' : 'submitted',
        progress: 33,
        txHash: method === 'USDC' ? generateTxHash() : undefined,
        startedAt: new Date().toISOString(),
      };
    }
    case 'ADVANCE': {
      if (state.currentStep === 'settled') return state;

      if (state.method === 'USD' || state.method === 'Card') {
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

export const CARD_NODES = [
  { label: 'Gov Office', icon: 'Building' },
  { label: 'Secure Channel', icon: 'Shield' },
  { label: 'Supplier POS', icon: 'POS' },
] as const;

export const USDC_NODES = [
  { label: 'Government Wallet', icon: 'Wallet' },
  { label: 'Visa Network', icon: 'CreditCard' },
  { label: 'Supplier Wallet', icon: 'Wallet' },
] as const;

export const USD_STEP_DELAY = 2000; // 2s per step, ~6s total
export const USDC_STEP_DELAY = 1500; // 1.5s per step, ~3s total

export function getStepLabel(step: string, paymentMode?: 'cnp' | 'card-present'): string {
  if (paymentMode === 'cnp') {
    switch (step) {
      case 'authorized': return 'Initiating Straight-Through Processing…';
      case 'processing': return 'Executing payment via Visa STP…';
      case 'settled':    return 'Payment Executed — funds transferred instantly';
      default: break;
    }
  }
  switch (step) {
    case 'authorized': return 'Sending card number to supplier…';
    case 'processing': return 'Supplier receiving via secure channel…';
    case 'settled':    return 'Supplier entered card at POS — funds credited';
    case 'submitted':  return 'Submitted to Visa Network';
    case 'confirmed':  return 'Confirmed on Chain';
    case 'idle':       return 'Ready';
    default:           return step;
  }
}
