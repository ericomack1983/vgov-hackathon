/**
 * Invoice Ingestion
 *
 * Entry point for supplier-initiated invoice submission.
 * Replaces the UI animation mock — this is the real backend-driven flow.
 */

import { tools } from '@/ai/mcp/tools';
import { runPipeline } from '@/ai/orchestrator';
import { InvoicePayload, IngestedInvoice, PipelineResult } from '@/ai/types';

function generateInvoiceId(): string {
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateInvoiceNo(rfpId: string): string {
  const year = new Date().getFullYear();
  const rfpPart = rfpId.toUpperCase().replace('rfp-', '').replace('RFP-', '');
  return `INV-${rfpPart}-${year}`;
}

/**
 * receiveInvoiceFromSupplier
 *
 * Simulates a supplier submitting an invoice to the procurement system.
 * Creates the invoice record, then fires the full AI pipeline.
 */
export async function receiveInvoiceFromSupplier(
  payload: InvoicePayload,
): Promise<PipelineResult> {
  const supplier = tools.getSupplier(payload.supplierId);
  if (!supplier) {
    throw new Error(`Supplier not found: ${payload.supplierId}`);
  }

  const id = generateInvoiceId();

  // Build the ingested invoice record
  const invoice: IngestedInvoice = {
    id,
    invoiceNo: generateInvoiceNo(payload.rfpId),
    supplierId: payload.supplierId,
    supplierName: supplier.name,
    rfpId: payload.rfpId,
    amount: payload.amount,
    description: payload.description,
    lineItems: payload.lineItems ?? [],
    status: 'ingested',
    issuedAt: new Date().toISOString(),
    ingestedAt: new Date().toISOString(),
  };

  // Persist invoice
  tools.createInvoice(invoice);

  // Kick off the AI orchestration pipeline
  const result = await runPipeline(invoice);

  return result;
}
