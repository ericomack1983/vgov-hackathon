/**
 * POST /api/invoices/ingest
 *
 * Simulates a supplier submitting an invoice to the procurement system.
 * Triggers the full AI validation → approval → payment pipeline.
 *
 * Body: InvoicePayload
 * {
 *   supplierId: string
 *   rfpId: string
 *   amount: number
 *   description: string
 *   lineItems?: { description, quantity, unitPrice, total }[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { receiveInvoiceFromSupplier } from '@/ai/ingestion/invoiceIngestion';
import { InvoicePayload } from '@/ai/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Basic validation
  const payload = body as Partial<InvoicePayload>;
  if (!payload.supplierId || !payload.rfpId || typeof payload.amount !== 'number' || !payload.description) {
    return NextResponse.json(
      { error: 'Missing required fields: supplierId, rfpId, amount, description' },
      { status: 422 },
    );
  }

  if (payload.amount <= 0) {
    return NextResponse.json({ error: 'amount must be positive' }, { status: 422 });
  }

  try {
    const result = await receiveInvoiceFromSupplier(payload as InvoicePayload);

    return NextResponse.json(
      {
        ok: true,
        correlationId: result.correlationId,
        invoice: {
          id: result.invoice.id,
          invoiceNo: result.invoice.invoiceNo,
          status: result.invoice.status,
          amount: result.invoice.amount,
          supplierName: result.invoice.supplierName,
        },
        validation: {
          valid: result.validation.valid,
          score: result.validation.score,
          summary: result.validation.summary,
          flags: result.validation.flags,
        },
        approval: {
          approved: result.approval.approved,
          riskLevel: result.approval.riskLevel,
          rationale: result.approval.rationale,
          requiresManualReview: result.approval.requiresManualReview,
        },
        payment: result.payment
          ? {
              success: result.payment.success,
              transactionId: result.payment.transaction?.id,
              orderId: result.payment.transaction?.orderId,
              method: result.payment.transaction?.method,
              status: result.payment.transaction?.status,
              error: result.payment.error,
            }
          : null,
        auditTrail: result.auditTrail,
        completedAt: result.completedAt,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
