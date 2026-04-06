/**
 * PaymentAgent
 *
 * Subscribes to: invoice.approved
 * Publishes:     payment.executed | payment.failed
 *
 * Calls paymentService.create() via MCP tools.
 */

import { IngestedInvoice, ApprovalResult, PaymentResult } from '@/ai/types';
import { tools } from '@/ai/mcp/tools';
import { Transaction, PaymentMethod } from '@/lib/mock-data/types';

function selectPaymentMethod(amount: number): PaymentMethod {
  // Prefer USDC for large amounts (faster settlement), card for small
  if (amount > 50_000) return 'USD';
  return 'Card';
}

export async function paymentAgent(
  invoice: IngestedInvoice,
  approval: ApprovalResult,
): Promise<PaymentResult> {
  if (!approval.approved) {
    return { success: false, transaction: null, error: 'Invoice was not approved.' };
  }

  const supplier = tools.getSupplier(invoice.supplierId);
  if (!supplier) {
    tools.updateInvoiceStatus(invoice.id, 'payment_failed');
    return { success: false, transaction: null, error: `Supplier ${invoice.supplierId} not found.` };
  }

  const method = selectPaymentMethod(invoice.amount);
  const orderId = `ORD-AI-${Date.now()}`;

  const tx: Transaction = {
    id: `tx-ai-${Date.now()}`,
    rfpId: invoice.rfpId,
    supplierId: invoice.supplierId,
    supplierName: supplier.name,
    amount: invoice.amount,
    method,
    status: 'Authorized',
    orderId,
    createdAt: new Date().toISOString(),
  };

  // Simulate async payment processing (Visa B2B rails)
  await simulatePaymentRails(tx);

  const settled: Transaction = {
    ...tx,
    status: 'Settled',
    settledAt: new Date().toISOString(),
    txHash: method === 'USDC' ? `0x${crypto.randomUUID().replace(/-/g, '')}` : undefined,
  };

  tools.createTransaction(settled);
  tools.updateInvoiceStatus(invoice.id, 'payment_triggered');

  return { success: true, transaction: settled };
}

// Simulated async payment processing
async function simulatePaymentRails(tx: Transaction): Promise<void> {
  // In production: call Visa B2B API / USDC settlement / card processor
  await new Promise<void>((resolve) => setTimeout(resolve, 50));
}
