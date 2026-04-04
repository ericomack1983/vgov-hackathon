/**
 * visa-sdk.ts
 *
 * Integration layer for @visa-gov/sdk.
 * All services run in sandbox mode (no credentials required).
 *
 * Full flow:
 *   VPAService  → register buyer + funding account + proxy pool + supplier
 *   VCNService  → issue virtual card with spending rules
 *   VPCService  → enrol card in payment controls
 *   vpc.IPC     → translate plain-English prompt into rules
 *   B2BPaymentService.BIP  → buyer pushes card to supplier
 *   B2BPaymentService.SIP  → supplier submits invoice; buyer approves
 *
 * When the @visa-gov/sdk dist/ is built, replace the class bodies below with:
 *   import { VCNService, VPAService, B2BPaymentService, VPCService } from '@visa-gov/sdk';
 */

import { v4 as uuid } from 'uuid';
import { withLog } from './sdk-logger';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function pan(): string {
  // Luhn-valid sandbox PAN starting with 4 (Visa)
  const partial = '4' + Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = parseInt(partial[14 - i]);
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  const check = (10 - (sum % 10)) % 10;
  return partial + check;
}

function expiryDate(monthsAhead = 24): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function cvv(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

function sandboxId(prefix: string): string {
  return `${prefix}-${uuid().slice(0, 8).toUpperCase()}`;
}

function iso(): string {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Rule builders  (VCNService)
// ─────────────────────────────────────────────────────────────────────────────

export interface SPVRule {
  ruleCode: 'SPV';
  spendLimitAmount: number;
  maxAuth: number;
  currencyCode: string;
  rangeType: 'daily' | 'weekly' | 'monthly' | 'annual';
}

export interface BlockRule {
  ruleCode: 'BLK';
  blockCode: string; // 'ECOM' | 'ATM' | 'CHN' | 'XBR' etc.
}

export interface AmountRule {
  ruleCode: 'PUR';
  transactionType: string;
  maxAmount: number;
  currencyCode: string;
}

export type VCNRule = SPVRule | BlockRule | AmountRule;

export function buildSPVRule(params: {
  spendLimitAmount: number;
  maxAuth: number;
  currencyCode: string;
  rangeType: 'daily' | 'weekly' | 'monthly' | 'annual';
}): SPVRule {
  return { ruleCode: 'SPV', ...params };
}

export function buildBlockRule(blockCode: string): BlockRule {
  return { ruleCode: 'BLK', blockCode };
}

export function buildAmountRule(
  transactionType: string,
  maxAmount: number,
  currencyCode: string,
): AmountRule {
  return { ruleCode: 'PUR', transactionType, maxAmount, currencyCode };
}

// ─────────────────────────────────────────────────────────────────────────────
// VCNService — POST /vpa/v1/cards/provisioning
// ─────────────────────────────────────────────────────────────────────────────

export interface VCNRequestPayload {
  clientId: string;
  buyerId: string;
  messageId: string;
  action: 'A' | 'M' | 'C';
  numberOfCards: string;
  proxyPoolId: string;
  requisitionDetails: {
    startDate: string;
    endDate: string;
    timeZone?: string;
    rules: VCNRule[];
  };
}

export interface VCNAccount {
  accountNumber: string;
  expiryDate: string;
  cvv2: string;
  proxyNumber: string;
  status: 'active';
}

export interface VCNRequestResponse {
  responseCode: '00' | string;
  messageId: string;
  proxyPoolId: string;
  accounts: VCNAccount[];
  issuedAt: string;
}

export interface VisaAPIOptions {
  baseUrl?: string;
  credentials?: { userId: string; password: string };
  tls?: { cert: string; key: string; ca?: string };
}

export class VCNService {
  private readonly _options: VisaAPIOptions | null;

  constructor(options: VisaAPIOptions | null = null) {
    this._options = options;
  }

  static sandbox(): VCNService {
    return new VCNService(null);
  }

  async requestVirtualCard(
    payload: VCNRequestPayload,
    _options?: VisaAPIOptions,
  ): Promise<VCNRequestResponse> {
    return withLog(
      { service: 'VCN', method: 'requestVirtualCard', endpoint: 'POST /vpa/v1/cards/provisioning', payload: payload as unknown as Record<string, unknown> },
      async () => {
        const count = parseInt(payload.numberOfCards, 10) || 1;
        return {
          responseCode: '00',
          messageId: payload.messageId,
          proxyPoolId: payload.proxyPoolId,
          issuedAt: iso(),
          accounts: Array.from({ length: count }, () => ({
            accountNumber: pan(),
            expiryDate: expiryDate(),
            cvv2: cvv(),
            proxyNumber: sandboxId('PRX'),
            status: 'active' as const,
          })),
        };
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VPAService — /vpa/v1/*
// ─────────────────────────────────────────────────────────────────────────────

export interface VPABuyerResponse {
  clientId: string;
  buyerId: string;
  buyerName: string;
  currencyCode: string;
  createdAt: string;
}

export interface VPAFundingAccountResponse {
  accountId: string;
  clientId: string;
  buyerId: string;
  accountNumber: string;
  status: 'active';
  createdAt: string;
}

export interface VPAProxyPoolResponse {
  proxyPoolId: string;
  clientId: string;
  size: number;
  available: number;
  createdAt: string;
}

export interface VPASupplierResponse {
  supplierId: string;
  clientId: string;
  supplierName: string;
  accountNumber: string;
  status: 'active';
  createdAt: string;
}

export interface VPAVirtualAccountResponse {
  requisitionId: string;
  accountNumber: string;
  expiryDate: string;
  amount: number;
  currencyCode: string;
  createdAt: string;
}

export interface VPAPaymentResponse {
  paymentId: string;
  clientId: string;
  buyerId: string;
  supplierId: string;
  amount: number;
  currencyCode: string;
  paymentMethod: 'BIP' | 'SIP';
  status: 'pending' | 'processed';
  createdAt: string;
}

class VPABuyerService {
  async createBuyer(payload: {
    clientId: string;
    buyerName: string;
    currencyCode?: string;
  }): Promise<VPABuyerResponse> {
    return withLog(
      { service: 'VPA', method: 'Buyer.createBuyer', endpoint: 'POST /vpa/v1/buyerManagement/buyer/create', payload: payload as unknown as Record<string, unknown> },
      async () => ({
        clientId: payload.clientId,
        buyerId: sandboxId('BUY'),
        buyerName: payload.buyerName,
        currencyCode: payload.currencyCode ?? '840',
        createdAt: iso(),
      }),
    );
  }
}

class VPAFundingAccountService {
  async addFundingAccount(payload: {
    clientId: string;
    buyerId: string;
    accountNumber: string;
  }): Promise<VPAFundingAccountResponse> {
    return withLog(
      { service: 'VPA', method: 'FundingAccount.addFundingAccount', endpoint: 'POST /vpa/v1/accountManagement/fundingAccount/add', payload: payload as unknown as Record<string, unknown> },
      async () => ({
        accountId: sandboxId('FA'),
        clientId: payload.clientId,
        buyerId: payload.buyerId,
        accountNumber: payload.accountNumber,
        status: 'active' as const,
        createdAt: iso(),
      }),
    );
  }

  async requestVirtualAccount(payload: {
    clientId: string;
    buyerId: string;
    proxyPoolId: string;
    amount: number;
    currencyCode?: string;
  }): Promise<VPAVirtualAccountResponse> {
    return withLog(
      { service: 'VPA', method: 'FundingAccount.requestVirtualAccount', endpoint: 'POST /vpa/v1/accountManagement/VirtualCardRequisition', payload: payload as unknown as Record<string, unknown> },
      async () => ({
        requisitionId: sandboxId('REQ'),
        accountNumber: pan(),
        expiryDate: expiryDate(12),
        amount: payload.amount,
        currencyCode: payload.currencyCode ?? '840',
        createdAt: iso(),
      }),
    );
  }
}

class VPAProxyPoolService {
  async createProxyPool(payload: {
    clientId: string;
    proxyPoolId: string;
    size: number;
  }): Promise<VPAProxyPoolResponse> {
    return withLog(
      { service: 'VPA', method: 'ProxyPool.createProxyPool', endpoint: 'POST /vpa/v1/suaPoolMaintenance/proxyPool/create', payload: payload as unknown as Record<string, unknown> },
      async () => ({
        proxyPoolId: payload.proxyPoolId,
        clientId: payload.clientId,
        size: payload.size,
        available: payload.size,
        createdAt: iso(),
      }),
    );
  }
}

class VPASupplierMgmtService {
  async createSupplier(payload: {
    clientId: string;
    supplierName: string;
    accountNumber: string;
  }): Promise<VPASupplierResponse> {
    return withLog(
      { service: 'VPA', method: 'Supplier.createSupplier', endpoint: 'POST /vpa/v1/supplierManagement/supplier/create', payload: payload as unknown as Record<string, unknown> },
      async () => ({
        supplierId: sandboxId('SUPP'),
        clientId: payload.clientId,
        supplierName: payload.supplierName,
        accountNumber: payload.accountNumber,
        status: 'active' as const,
        createdAt: iso(),
      }),
    );
  }
}

class VPAPaymentMgmtService {
  async processPayment(payload: {
    clientId: string;
    buyerId: string;
    supplierId: string;
    amount: number;
    currencyCode?: string;
    paymentMethod: 'BIP' | 'SIP';
  }): Promise<VPAPaymentResponse> {
    return {
      paymentId: sandboxId('PAY'),
      clientId: payload.clientId,
      buyerId: payload.buyerId,
      supplierId: payload.supplierId,
      amount: payload.amount,
      currencyCode: payload.currencyCode ?? '840',
      paymentMethod: payload.paymentMethod,
      status: 'processed',
      createdAt: iso(),
    };
  }

  async getPaymentDetails(payload: {
    clientId: string;
    paymentId: string;
  }): Promise<VPAPaymentResponse & { settledAt: string }> {
    return {
      paymentId: payload.paymentId,
      clientId: payload.clientId,
      buyerId: sandboxId('BUY'),
      supplierId: sandboxId('SUPP'),
      amount: 0,
      currencyCode: '840',
      paymentMethod: 'BIP',
      status: 'processed',
      createdAt: iso(),
      settledAt: iso(),
    };
  }
}

export class VPAService {
  readonly Buyer = new VPABuyerService();
  readonly FundingAccount = new VPAFundingAccountService();
  readonly ProxyPool = new VPAProxyPoolService();
  readonly Supplier = new VPASupplierMgmtService();
  readonly Payment = new VPAPaymentMgmtService();

  constructor(_options: VisaAPIOptions | null = null) {}

  static sandbox(): VPAService {
    return new VPAService(null);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B2BPaymentService — BIP & SIP flows
// ─────────────────────────────────────────────────────────────────────────────

export interface BIPInitiatePayload {
  messageId: string;
  clientId: string;
  buyerId: string;
  supplierId: string;
  paymentAmount: number;
  currencyCode?: string;
  invoiceNumber?: string;
  memo?: string;
}

export interface BIPPayment {
  paymentId: string;
  status: 'pending' | 'settled' | 'cancelled';
  virtualCard: VCNAccount;
  paymentDetailUrl: string;
  invoiceNumber?: string;
  createdAt: string;
}

export interface SIPSubmitPayload {
  messageId: string;
  clientId: string;
  supplierId: string;
  buyerId: string;
  requestedAmount: number;
  currencyCode?: string;
  invoiceNumber?: string;
  startDate: string;
  endDate: string;
}

export interface SIPRequisition {
  requisitionId: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  virtualAccount: { accountNumber: string; expiryDate: string };
  invoiceNumber?: string;
  requestedAmount: number;
  createdAt: string;
}

export interface SIPApprovalResult {
  paymentId: string;
  requisitionId: string;
  status: 'approved';
  approvedAmount: number;
  approvedAt: string;
}

class BIPService {
  async initiate(payload: BIPInitiatePayload): Promise<BIPPayment> {
    return withLog(
      { service: 'B2B-BIP', method: 'BIP.initiate', endpoint: 'POST /vpa/v1/paymentService/processPayments (BIP)', payload: payload as unknown as Record<string, unknown> },
      async () => ({
        paymentId: sandboxId('BIP'),
        status: 'pending' as const,
        virtualCard: {
          accountNumber: pan(),
          expiryDate: expiryDate(3),
          cvv2: cvv(),
          proxyNumber: sandboxId('PRX'),
          status: 'active' as const,
        },
        paymentDetailUrl: `https://sandbox.visa.com/payment-detail/${sandboxId('PD')}`,
        invoiceNumber: payload.invoiceNumber,
        createdAt: iso(),
      }),
    );
  }

  async resend(payload: { messageId: string; clientId: string; paymentId: string }): Promise<{ success: true }> {
    return withLog(
      { service: 'B2B-BIP', method: 'BIP.resend', endpoint: 'POST /vpa/v1/paymentService/resendPayment', payload: payload as unknown as Record<string, unknown> },
      async () => ({ success: true as const }),
    );
  }

  async getStatus(payload: { messageId: string; clientId: string; paymentId: string }): Promise<{
    paymentId: string;
    status: 'pending' | 'settled' | 'cancelled';
  }> {
    return withLog(
      { service: 'B2B-BIP', method: 'BIP.getStatus', endpoint: 'POST /vpa/v1/paymentService/getPaymentDetailURL', payload: payload as unknown as Record<string, unknown> },
      async () => ({ paymentId: payload.paymentId, status: 'pending' as const }),
    );
  }

  async cancel(payload: { messageId: string; clientId: string; paymentId: string }): Promise<{ success: true }> {
    return withLog(
      { service: 'B2B-BIP', method: 'BIP.cancel', endpoint: 'POST /vpa/v1/paymentService/cancelPayment', payload: payload as unknown as Record<string, unknown> },
      async () => ({ success: true as const }),
    );
  }
}

class SIPService {
  async submitRequest(payload: SIPSubmitPayload): Promise<SIPRequisition> {
    return withLog(
      { service: 'B2B-SIP', method: 'SIP.submitRequest', endpoint: 'POST /vpa/v1/requisitionService (SIP)', payload: payload as unknown as Record<string, unknown> },
      async () => ({
        requisitionId: sandboxId('SIP-REQ'),
        status: 'pending_approval' as const,
        virtualAccount: { accountNumber: pan(), expiryDate: expiryDate(1) },
        invoiceNumber: payload.invoiceNumber,
        requestedAmount: payload.requestedAmount,
        createdAt: iso(),
      }),
    );
  }

  async approve(payload: {
    messageId: string; clientId: string; buyerId: string;
    requisitionId: string; approvedAmount: number; currencyCode?: string;
  }): Promise<SIPApprovalResult> {
    return withLog(
      { service: 'B2B-SIP', method: 'SIP.approve', endpoint: 'POST /vpa/v1/paymentService/processPayments (SIP)', payload: payload as unknown as Record<string, unknown> },
      async () => ({
        paymentId: sandboxId('SIP-PAY'),
        requisitionId: payload.requisitionId,
        status: 'approved' as const,
        approvedAmount: payload.approvedAmount,
        approvedAt: iso(),
      }),
    );
  }

  async reject(payload: { messageId: string; clientId: string; requisitionId: string }): Promise<{ success: true }> {
    return withLog(
      { service: 'B2B-SIP', method: 'SIP.reject', endpoint: 'POST /vpa/v1/requisitionService/reject', payload: payload as unknown as Record<string, unknown> },
      async () => ({ success: true as const }),
    );
  }
}

export class B2BPaymentService {
  readonly BIP = new BIPService();
  readonly SIP = new SIPService();

  constructor(_options: VisaAPIOptions | null = null) {}

  static sandbox(): B2BPaymentService {
    return new B2BPaymentService(null);
  }

  static live(options: VisaAPIOptions): B2BPaymentService {
    return new B2BPaymentService(options);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VPCService — /vpc/v1/*
// ─────────────────────────────────────────────────────────────────────────────

export interface VPCAccount {
  accountId: string;
  accountNumber: string;
  status: 'active' | 'blocked' | 'unrestricted';
  contacts: Array<{
    name: string;
    email: string;
    notifyOn: string[];
  }>;
  createdAt: string;
}

export interface VPCRule {
  ruleCode: 'SPV' | 'SPP' | 'VPAS' | 'MCC' | 'MCG' | 'CHN' | 'LOC' | 'BHR' | 'HOT';
  spendVelocity?: { limitAmount: number; currencyCode: string; periodType: 'daily' | 'weekly' | 'monthly' | 'annual'; maxAuthCount?: number };
  spendPolicy?: { maxTransactionAmount: number; currencyCode: string };
  mcc?: { allowedMCCs?: string[]; blockedMCCs?: string[] };
  channel?: { allowOnline: boolean; allowPOS: boolean; allowATM: boolean; allowContactless?: boolean };
  businessHours?: { allowedDays: number[]; startTime: string; endTime: string; timezone: string };
  location?: { allowedCountries?: string[]; blockedCountries?: string[] };
}

export interface VPCTransactionRecord {
  transactionId: string;
  accountId: string;
  amount: number;
  currencyCode: string;
  merchantName: string;
  merchantMcc: string;
  outcome: 'approved' | 'declined';
  declineReason?: string;
  declineMessage?: string;
  timestamp: string;
}

export interface VPCSupplierValidationResult {
  validationId: string;
  supplierName: string;
  caid: string;
  mcc: string;
  status: 'validated' | 'pending' | 'rejected';
  createdAt: string;
}

export interface IPCSuggestion {
  ruleSetId: string;
  rules: VPCRule[];
  rationale: string;
  confidence: number; // 0–100
}

export interface IPCRuleSetResponse {
  suggestions: IPCSuggestion[];
  promptReceived: string;
  generatedAt: string;
}

// IPC sandbox templates keyed by keyword
const IPC_TEMPLATES: Array<{
  keywords: string[];
  ruleSetId: string;
  confidence: number;
  rationale: string;
  rules: VPCRule[];
}> = [
  {
    keywords: ['medical', 'health', 'pharma'],
    ruleSetId: 'ipc-tpl-medical',
    confidence: 94,
    rationale: 'Medical procurement: healthcare MCCs allowed; $50,000/month; POS and online; ATM blocked.',
    rules: [
      { ruleCode: 'SPV', spendVelocity: { limitAmount: 50_000, currencyCode: '840', periodType: 'monthly', maxAuthCount: 50 } },
      { ruleCode: 'MCC', mcc: { allowedMCCs: ['5047', '5122', '8099', '8049', '8011'] } },
      { ruleCode: 'CHN', channel: { allowOnline: true, allowPOS: true, allowATM: false, allowContactless: false } },
    ],
  },
  {
    keywords: ['it', 'software', 'cloud', 'tech', 'technology'],
    ruleSetId: 'ipc-tpl-it',
    confidence: 89,
    rationale: 'IT services: software and tech MCCs allowed; $25,000/month; online and POS; ATM blocked.',
    rules: [
      { ruleCode: 'SPV', spendVelocity: { limitAmount: 25_000, currencyCode: '840', periodType: 'monthly', maxAuthCount: 30 } },
      { ruleCode: 'MCC', mcc: { allowedMCCs: ['5045', '5734', '7372', '7371', '7379'] } },
      { ruleCode: 'CHN', channel: { allowOnline: true, allowPOS: true, allowATM: false, allowContactless: false } },
    ],
  },
  {
    keywords: ['travel', 'airline', 'hotel', 'flight'],
    ruleSetId: 'ipc-tpl-travel',
    confidence: 88,
    rationale: 'Travel procurement: airline and hotel MCCs allowed; $10,000/month; POS and online.',
    rules: [
      { ruleCode: 'SPV', spendVelocity: { limitAmount: 10_000, currencyCode: '840', periodType: 'monthly', maxAuthCount: 15 } },
      { ruleCode: 'MCC', mcc: { allowedMCCs: ['4511', '7011', '7512', '4411'] } },
      { ruleCode: 'CHN', channel: { allowOnline: true, allowPOS: true, allowATM: false, allowContactless: true } },
    ],
  },
  {
    keywords: ['office', 'stationery', 'supplies', 'furniture'],
    ruleSetId: 'ipc-tpl-office',
    confidence: 91,
    rationale: 'Office supplies: stationery and business MCCs allowed; $2,000/month; POS only.',
    rules: [
      { ruleCode: 'SPV', spendVelocity: { limitAmount: 2_000, currencyCode: '840', periodType: 'monthly', maxAuthCount: 20 } },
      { ruleCode: 'MCC', mcc: { allowedMCCs: ['5111', '5112', '5021', '5065'] } },
      { ruleCode: 'CHN', channel: { allowOnline: false, allowPOS: true, allowATM: false, allowContactless: false } },
    ],
  },
];

const IPC_DEFAULT_TEMPLATE = {
  ruleSetId: 'ipc-tpl-general',
  confidence: 75,
  rationale: 'General procurement: broad MCC set; $5,000/month; POS and online; ATM blocked.',
  rules: [
    { ruleCode: 'SPV' as const, spendVelocity: { limitAmount: 5_000, currencyCode: '840', periodType: 'monthly' as const, maxAuthCount: 10 } },
    { ruleCode: 'CHN' as const, channel: { allowOnline: true, allowPOS: true, allowATM: false, allowContactless: false } },
  ],
};

function matchIPCTemplate(prompt: string): typeof IPC_TEMPLATES[0] | typeof IPC_DEFAULT_TEMPLATE {
  const lower = prompt.toLowerCase();
  return (
    IPC_TEMPLATES.find(t => t.keywords.some(k => lower.includes(k))) ?? IPC_DEFAULT_TEMPLATE
  );
}

class VPCAccountManagementService {
  async createAccount(payload: {
    accountNumber: string;
    contacts?: Array<{ name: string; email: string; notifyOn: string[] }>;
  }): Promise<VPCAccount> {
    return withLog(
      { service: 'VPC', method: 'AccountManagement.createAccount', endpoint: 'POST /vpc/v1/accounts/create', payload: payload as unknown as Record<string, unknown> },
      async () => ({
        accountId: sandboxId('VPC-ACCT'),
        accountNumber: payload.accountNumber,
        status: 'active' as const,
        contacts: payload.contacts ?? [],
        createdAt: iso(),
      }),
    );
  }
}

class VPCRulesService {
  async setRules(accountId: string, rules: VPCRule[]): Promise<{ accountId: string; rules: VPCRule[]; appliedAt: string }> {
    return withLog(
      { service: 'VPC', method: 'Rules.setRules', endpoint: 'POST /vpc/v1/rules/set', payload: { accountId, rules } as Record<string, unknown> },
      async () => ({ accountId, rules, appliedAt: iso() }),
    );
  }

  async blockAccount(accountId: string): Promise<{ accountId: string; status: 'blocked'; blockedAt: string }> {
    return { accountId, status: 'blocked', blockedAt: iso() };
  }

  async enableRules(accountId: string): Promise<{ accountId: string; status: 'active'; enabledAt: string }> {
    return { accountId, status: 'active', enabledAt: iso() };
  }

  async disableRules(accountId: string): Promise<{ accountId: string; status: 'unrestricted' }> {
    return { accountId, status: 'unrestricted' };
  }

  async deleteRules(accountId: string): Promise<{ success: true }> {
    return { success: true };
  }
}

// ── Reconciliation result ────────────────────────────────────────────────────

export interface VPCReconciliationResult {
  reconciliationId: string;
  accountId: string;
  invoiceAmount: number;
  matchedTransaction: VPCTransactionRecord | null;
  matchStatus: 'matched' | 'partial_match' | 'unmatched';
  /** 0–100 confidence score */
  confidence: number;
  reconciledAt: string;
}

class VPCReportingService {
  async getTransactionHistory(
    accountId: string,
    options?: { outcome?: 'approved' | 'declined'; fromDate?: string; toDate?: string; _hintAmount?: number },
  ): Promise<VPCTransactionRecord[]> {
    return withLog(
      { service: 'VPC', method: 'Reporting.getTransactionHistory', endpoint: `GET /vpc/v1/accounts/${accountId}/transactions`, payload: { accountId, ...options } as Record<string, unknown> },
      async () => {
        const amount = options?._hintAmount ?? 4_750;
        return [
          {
            transactionId: sandboxId('TXN'),
            accountId,
            amount,
            currencyCode: '840',
            merchantName: 'MedSupply Inc.',
            merchantMcc: '5047',
            outcome: 'approved' as const,
            timestamp: iso(),
          },
        ].filter(t => !options?.outcome || t.outcome === options.outcome);
      },
    );
  }

  /**
   * Programmatically match an invoice against Visa VPC transaction records.
   *
   * Calls getTransactionHistory and compares amounts/merchant against the
   * invoice. Used by the Reconciliation page to close out settled payments.
   *
   * Sandbox: always returns `matched` with ≥95 confidence when amount ≥ $1.
   */
  async reconcilePayment(params: {
    accountId: string;
    invoiceAmount: number;
    supplierName: string;
    invoiceNumber?: string;
  }): Promise<VPCReconciliationResult> {
    return withLog(
      {
        service: 'VPC',
        method: 'Reporting.reconcilePayment',
        endpoint: `POST /vpc/v1/accounts/${params.accountId}/reconcile`,
        payload: params as unknown as Record<string, unknown>,
      },
      async () => {
        const txns = await this.getTransactionHistory(params.accountId, {
          outcome: 'approved',
          _hintAmount: params.invoiceAmount,
        });

        const matched = txns.find(t => Math.abs(t.amount - params.invoiceAmount) < 0.01) ?? null;
        const partial = !matched ? (txns.find(t => Math.abs(t.amount - params.invoiceAmount) / params.invoiceAmount < 0.05) ?? null) : null;
        const best = matched ?? partial;

        return {
          reconciliationId: sandboxId('RECON'),
          accountId: params.accountId,
          invoiceAmount: params.invoiceAmount,
          matchedTransaction: best,
          matchStatus: matched ? 'matched' : partial ? 'partial_match' : 'unmatched',
          confidence: matched ? 98 : partial ? 72 : 0,
          reconciledAt: iso(),
        };
      },
    );
  }
}

class VPCSupplierValidationService {
  async registerSupplier(payload: {
    supplierName: string;
    acquirerBin: string;
    caid: string;
    countryCode: string;
    mcc: string;
  }): Promise<VPCSupplierValidationResult> {
    return {
      validationId: sandboxId('VAL'),
      supplierName: payload.supplierName,
      caid: payload.caid,
      mcc: payload.mcc,
      status: 'validated',
      createdAt: iso(),
    };
  }
}

class VPCIPCService {
  async getSuggestedRules(payload: {
    prompt: string;
    currencyCode?: string;
  }): Promise<IPCRuleSetResponse> {
    return withLog(
      { service: 'IPC', method: 'IPC.getSuggestedRules', endpoint: 'POST /vpc/v1/ipc/suggest', payload: payload as unknown as Record<string, unknown> },
      async () => {
        const tpl = matchIPCTemplate(payload.prompt);
        return { suggestions: [{ ...tpl }], promptReceived: payload.prompt, generatedAt: iso() };
      },
    );
  }

  async setSuggestedRules(ruleSetId: string, accountId: string): Promise<{ accountId: string; ruleSetId: string; appliedAt: string }> {
    return withLog(
      { service: 'IPC', method: 'IPC.setSuggestedRules', endpoint: 'POST /vpc/v1/ipc/apply', payload: { ruleSetId, accountId } as Record<string, unknown> },
      async () => ({ accountId, ruleSetId, appliedAt: iso() }),
    );
  }
}

export class VPCService {
  readonly AccountManagement = new VPCAccountManagementService();
  readonly Rules = new VPCRulesService();
  readonly Reporting = new VPCReportingService();
  readonly SupplierValidation = new VPCSupplierValidationService();
  readonly IPC = new VPCIPCService();

  constructor(_options: VisaAPIOptions | null = null) {}

  static sandbox(): VPCService {
    return new VPCService(null);
  }

  static live(options: VisaAPIOptions): VPCService {
    return new VPCService(options);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Full procurement flow helper
// ─────────────────────────────────────────────────────────────────────────────

export interface ProcurementFlowInput {
  /** Government agency name */
  agencyName: string;
  /** Awarded supplier name */
  supplierName: string;
  /** Supplier bank account (sandbox: any 16-digit string) */
  supplierAccountNumber: string;
  /** Payment amount in dollars */
  amount: number;
  /** Plain-English description of how the card should be used */
  ipcPrompt: string;
  /** RFP category used to set VCN rule dates */
  startDate: string;
  endDate: string;
  /** 'BIP' = agency pushes card to supplier, 'SIP' = supplier submits invoice */
  paymentFlow: 'BIP' | 'SIP';
  /** Only required for SIP */
  invoiceNumber?: string;
}

export interface ProcurementFlowResult {
  buyerId: string;
  supplierId: string;
  proxyPoolId: string;
  virtualCard: VCNAccount;
  vpcAccountId: string;
  ipcSuggestion: IPCSuggestion;
  payment: BIPPayment | SIPApprovalResult;
  paymentFlow: 'BIP' | 'SIP';
}

/**
 * runProcurementFlow
 *
 * Executes the full SDK flow in a single call:
 *   1. VPAService  — register buyer, funding account, proxy pool, supplier
 *   2. VCNService  — issue virtual card with SPV + block rules
 *   3. VPCService  — enrol card
 *   4. vpc.IPC     — get + apply rules from plain-English prompt
 *   5. B2BPaymentService — BIP or SIP payment
 */
export async function runProcurementFlow(
  input: ProcurementFlowInput,
): Promise<ProcurementFlowResult> {
  const vcn  = VCNService.sandbox();
  const vpa  = VPAService.sandbox();
  const vpc  = VPCService.sandbox();
  const b2b  = B2BPaymentService.sandbox();

  const clientId = 'B2BWS_1_1_9999';
  const messageId = uuid();

  // 1 — VPA: onboard buyer + funding account + proxy pool
  const buyer   = await vpa.Buyer.createBuyer({ clientId, buyerName: input.agencyName, currencyCode: '840' });
  await vpa.FundingAccount.addFundingAccount({ clientId, buyerId: buyer.buyerId, accountNumber: '4111111111111111' });
  const pool    = await vpa.ProxyPool.createProxyPool({ clientId, proxyPoolId: sandboxId('POOL'), size: 50 });
  const supplier = await vpa.Supplier.createSupplier({ clientId, supplierName: input.supplierName, accountNumber: input.supplierAccountNumber });

  // 2 — VCN: issue virtual card with spending rules
  const vcnResponse = await vcn.requestVirtualCard({
    clientId,
    buyerId: buyer.buyerId,
    messageId,
    action: 'A',
    numberOfCards: '1',
    proxyPoolId: pool.proxyPoolId,
    requisitionDetails: {
      startDate: input.startDate,
      endDate:   input.endDate,
      timeZone:  'UTC-5',
      rules: [
        buildSPVRule({ spendLimitAmount: input.amount, maxAuth: 5, currencyCode: '840', rangeType: 'monthly' }),
        buildAmountRule('PUR', input.amount, '840'),
        buildBlockRule('ATM'),
        buildBlockRule('ECOM'),
      ],
    },
  });

  const card = vcnResponse.accounts[0];

  // 3 — VPC: enrol the card
  const vpcAccount = await vpc.AccountManagement.createAccount({
    accountNumber: card.accountNumber,
    contacts: [{ name: 'Procurement Officer', email: 'proc@agency.gov', notifyOn: ['transaction_declined', 'account_blocked'] }],
  });

  // 4 — IPC: translate prompt into rules and apply
  const { suggestions } = await vpc.IPC.getSuggestedRules({ prompt: input.ipcPrompt, currencyCode: '840' });
  const bestSuggestion = suggestions[0];
  await vpc.IPC.setSuggestedRules(bestSuggestion.ruleSetId, vpcAccount.accountId);

  // 5 — Payment: BIP or SIP
  let payment: BIPPayment | SIPApprovalResult;

  if (input.paymentFlow === 'BIP') {
    payment = await b2b.BIP.initiate({
      messageId: uuid(),
      clientId,
      buyerId:       buyer.buyerId,
      supplierId:    supplier.supplierId,
      paymentAmount: input.amount,
      currencyCode:  '840',
      invoiceNumber: input.invoiceNumber,
      memo: `Award payment for ${input.agencyName}`,
    });
  } else {
    const req = await b2b.SIP.submitRequest({
      messageId: uuid(),
      clientId,
      supplierId:      supplier.supplierId,
      buyerId:         buyer.buyerId,
      requestedAmount: input.amount,
      currencyCode:    '840',
      invoiceNumber:   input.invoiceNumber,
      startDate:       input.startDate,
      endDate:         input.endDate,
    });

    payment = await b2b.SIP.approve({
      messageId:      uuid(),
      clientId,
      buyerId:        buyer.buyerId,
      requisitionId:  req.requisitionId,
      approvedAmount: input.amount,
      currencyCode:   '840',
    });
  }

  return {
    buyerId:       buyer.buyerId,
    supplierId:    supplier.supplierId,
    proxyPoolId:   pool.proxyPoolId,
    virtualCard:   card,
    vpcAccountId:  vpcAccount.accountId,
    ipcSuggestion: bestSuggestion,
    payment,
    paymentFlow:   input.paymentFlow,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton sandbox instances (use these across the app)
// ─────────────────────────────────────────────────────────────────────────────

export const vcnService  = VCNService.sandbox();
export const vpaService  = VPAService.sandbox();
export const b2bService  = B2BPaymentService.sandbox();
export const vpcService  = VPCService.sandbox();
