import { Transaction } from '@/lib/mock-data/types';

// ── Core event envelope ────────────────────────────────────────────────────

export type EventMessage<T = unknown> = {
  event: string;
  data: T;
  meta: {
    timestamp: string;
    agent?: string;
    correlationId: string;
  };
};

// ── Invoice domain types ───────────────────────────────────────────────────

export interface InvoicePayload {
  supplierId: string;
  rfpId: string;
  amount: number;
  description: string;
  lineItems?: LineItem[];
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IngestedInvoice {
  id: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  rfpId: string;
  amount: number;
  description: string;
  lineItems: LineItem[];
  status: InvoiceStatus;
  issuedAt: string;
  ingestedAt: string;
}

export type InvoiceStatus =
  | 'ingested'
  | 'validated'
  | 'validation_failed'
  | 'approved'
  | 'rejected'
  | 'payment_triggered'
  | 'payment_failed';

// ── RAG context ────────────────────────────────────────────────────────────

export interface SupplierContext {
  supplierId: string;
  supplierName: string;
  complianceStatus: string;
  riskScore: number;
  pastInvoiceCount: number;
  avgInvoiceAmount: number;
  maxInvoiceAmount: number;
  contractLimit: number;
  recentAmounts: number[];
}

// ── Agent results ──────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  score: number;           // 0-100
  flags: ValidationFlag[];
  summary: string;
}

export interface ValidationFlag {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface ApprovalResult {
  approved: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  rationale: string;
  requiresManualReview: boolean;
}

export interface PaymentResult {
  success: boolean;
  transaction: Transaction | null;
  error?: string;
}

export interface AuditEntry {
  id: string;
  correlationId: string;
  event: string;
  agent: string;
  invoiceId: string;
  supplierId: string;
  timestamp: string;
  details: Record<string, unknown>;
}

// ── Orchestration pipeline result ─────────────────────────────────────────

export interface PipelineResult {
  correlationId: string;
  invoice: IngestedInvoice;
  validation: ValidationResult;
  approval: ApprovalResult;
  payment: PaymentResult | null;
  auditTrail: AuditEntry[];
  completedAt: string;
}
