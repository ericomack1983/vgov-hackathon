export type Role = 'gov' | 'supplier' | 'auditor';

export type RFPStatus = 'Draft' | 'Open' | 'Evaluating' | 'Awarded' | 'Paid';

export type PaymentMethod = 'USD' | 'USDC' | 'Card';

export type TransactionStatus = 'Pending' | 'Authorized' | 'Processing' | 'Settled';

export interface PaymentCard {
  id: string;
  type: 'credit' | 'debit';
  brand: 'Visa' | 'Mastercard' | 'Amex';
  last4: string;
  expiry: string;   // MM/YY
  holderName: string;
  status: 'active' | 'inactive';
}

export interface Supplier {
  id: string;
  name: string;
  rating: number;
  complianceStatus: 'Compliant' | 'Pending Review' | 'Non-Compliant';
  certifications: string[];
  pastPerformance: number;
  pricingHistory: number[];
  walletAddress: string;
  deliveryAvgDays: number;
  riskScore: number;
  vaaScore?: number;   // Visa Advanced Authorization Score (0-100)
  cards?: PaymentCard[];
}

export interface Bid {
  id: string;
  rfpId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  deliveryDays: number;
  notes: string;
  submittedAt: string;
}

export interface DimensionScores {
  price: number;       // 0-100
  delivery: number;    // 0-100
  reliability: number; // 0-100
  compliance: number;  // 0-100
  risk: number;        // 0-100
  vaa: number;         // 0-100 — Visa Advanced Authorization Score
}

export interface ScoredBid {
  bid: Bid;
  supplier: Supplier;
  dimensions: DimensionScores;
  composite: number;
  rank: number;
  isWinner: boolean;
}

export interface RFP {
  id: string;
  title: string;
  description: string;
  budgetCeiling: number;
  deadline: string;
  category: string;
  status: RFPStatus;
  createdAt: string;
  bids: Bid[];
  selectedWinnerId?: string;
  evaluationResults?: ScoredBid[];
  overrideWinnerId?: string;
  overrideJustification?: string;
}

export interface Transaction {
  id: string;
  rfpId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  method: PaymentMethod;
  status: TransactionStatus;
  txHash?: string;
  orderId: string;
  createdAt: string;
  settledAt?: string;
}

export interface Notification {
  id: string;
  type: 'payment' | 'procurement' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  transactionId?: string;
  txHash?: string;
  // payment-specific card details for email template
  cardLast4?: string;
  cardExpiry?: string;
  cardHolder?: string;
  cardBrand?: string;
  orderId?: string;
  amount?: number;
  supplierName?: string;
  fundMethod?: string;
  paymentStatus?: 'pending' | 'settled';
  paymentMode?: 'cnp' | 'card-present';
}
