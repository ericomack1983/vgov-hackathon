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
  usageType?: 'single-use' | 'multi-use';
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
  vsmsScore?: number;  // Visa Supplier Matching Service Score (0-100)
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
  vsms: number;        // 0-100 — Visa Supplier Matching Service Score
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
  recurring?: RecurringSchedule;
}

export type RecurringInterval = 'monthly' | 'quarterly' | 'biannual' | 'annual';

export interface RecurringInstallment {
  id: string;
  dueDate: string;
  amount: number;
  status: 'scheduled' | 'pending' | 'paid' | 'overdue';
  transactionId?: string;
  paidAt?: string;
}

export interface RecurringSchedule {
  interval: RecurringInterval;
  contractYears: number;
  installmentAmount: number;
  totalInstallments: number;
  startDate: string;
  endDate: string;
  installments: RecurringInstallment[];
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
  emailType?: 'invoice-verified';
  invoiceNo?: string;
  rfpTitle?: string;
  missionId?: string;
}

/* ────────────────────────────────────────────────────────────────────────────
   TCI 2.0 — Misiones, Policy Controls & Entity Hierarchy
   ──────────────────────────────────────────────────────────────────────────── */

export type MissionStatus =
  | 'borrador'
  | 'pendiente_aprobacion'
  | 'aprobada'
  | 'activa'
  | 'en_conciliacion'
  | 'cerrada';

export interface MissionApproval {
  role: string;
  user: string;
  date: string;
  action: 'aprobado' | 'rechazado';
}

export interface Mission {
  id: string;                  // 'MIS-2026-0042'
  ministry: string;            // ref Entity.id
  traveler: { name: string; role: string; email: string };
  destination: { city: string; country: string; countryCode: string };
  dates: { start: string; end: string };
  purpose: string;
  budgetGTQ: number;
  spentGTQ: number;
  status: MissionStatus;
  policyProfileId: string;
  cardId?: string;
  approvals: MissionApproval[];
  /** set when the unused balance has been returned to Tesorería */
  releasedGTQ?: number;
  releasedAt?: string;
}

export interface MCCCategory {
  code: string;
  label: string;
}

export type ATMPolicy = 'bloqueado' | 'limitado' | 'permitido';

export interface PolicyProfile {
  id: string;
  name: string;                        // 'Viático Internacional — EE.UU.'
  txnLimitGTQ: number;
  dailyLimitGTQ: number;
  allowedCountries: string[];          // ['US']
  allowedMCCs: MCCCategory[];          // hotel 7011, restaurante 5812, transporte 4121
  blockedMCCs: MCCCategory[];          // electrónica 5732, joyería 5944, casino 7995
  atmWithdrawal: ATMPolicy;
  atmDailyCapGTQ?: number;
  validity: { start: string; end: string };
  autoReleaseUnused: boolean;
  supplierWhitelistIds?: string[];
  emergencyOverride: boolean;
}

export type EntityType = 'ministerio' | 'agencia' | 'programa';

export interface Entity {
  id: string;
  name: string;                // 'Ministerio de Relaciones Exteriores'
  acronym: string;             // 'MINEX'
  type: EntityType;
  parentId?: string;           // builds the tree
  budgetGTQ: number;
  spentGTQ: number;
  activeCards: number;
  activeMissions: number;
  approvalChain: string[];     // ['Gestor de Viajes', 'Tesorería Nacional']
}

export interface MissionCard {
  id: string;
  missionId: string;
  holderName: string;
  brand: 'Visa';
  type: 'credit' | 'debit';
  usageType: 'single-use' | 'multi-use';
  last4: string;
  expiry: string;              // MM/YY
  spendLimitGTQ: number;
  policyProfileId: string;
  blocked?: boolean;
  issuedAt: string;
}

export type MissionTxStatus = 'aprobada' | 'rechazada' | 'pendiente_recibo' | 'conciliada';

export type DeclineReason =
  | 'MCC no autorizado'
  | 'Retiro ATM deshabilitado'
  | 'País no habilitado'
  | 'Límite por transacción excedido'
  | 'Fuera de vigencia';

export interface MissionTransaction {
  id: string;
  missionId: string;
  merchant: string;
  mcc: MCCCategory;
  /** original currency amount — present on international transactions */
  amountUSD?: number;
  amountGTQ: number;
  countryCode: string;
  status: MissionTxStatus;
  declineReason?: DeclineReason;
  receiptAttached: boolean;
  createdAt: string;
}
