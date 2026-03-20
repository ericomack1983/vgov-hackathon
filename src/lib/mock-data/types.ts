export type Role = 'gov' | 'supplier' | 'auditor';

export type RFPStatus = 'Draft' | 'Open' | 'Evaluating' | 'Awarded' | 'Paid';

export type PaymentMethod = 'USD' | 'USDC';

export type TransactionStatus = 'Pending' | 'Authorized' | 'Processing' | 'Settled';

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
}
