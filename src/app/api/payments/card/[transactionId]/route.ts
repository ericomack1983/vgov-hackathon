/**
 * Read a settled card transaction back from CyberSource.
 *
 * Reconciliation is only worth anything if it checks the authoritative record
 * rather than the ledger's own copy of it. This fetches what CyberSource holds
 * for an authorization — amounts, line items, destination — so the ledger row
 * can be compared field by field against the processor.
 *
 * Note: the Transaction Details API returns a subset. `invoiceDetails` comes
 * back empty even for transactions that carried a PO and invoice number, so
 * those fields are verified against what the ledger recorded at payment time.
 */

import { NextResponse } from 'next/server';
import cybs from '@/lib/cybs/cybs-client';

export const runtime = 'nodejs';

interface CybsTransaction {
  id?: string;
  clientReferenceInformation?: { code?: string };
  applicationInformation?: {
    reasonCode?: string | number;
    applications?: { name?: string; rCode?: string | number }[];
  };
  orderInformation?: {
    amountDetails?: { totalAmount?: string; currency?: string; taxAmount?: string; authorizedAmount?: string };
    shipTo?: { postalCode?: string; country?: string; locality?: string; administrativeArea?: string };
    lineItems?: {
      productName?: string;
      productSku?: string;
      productCode?: string;
      quantity?: number;
      unitPrice?: string;
      taxAmount?: string;
      commodityCode?: string;
      unitOfMeasure?: string;
    }[];
  };
  processorInformation?: { approvalCode?: string };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ transactionId: string }> },
): Promise<NextResponse> {
  const { transactionId } = await params;

  if (!/^\d{10,30}$/.test(transactionId)) {
    return NextResponse.json({ ok: false, reason: 'Not a CyberSource transaction id' }, { status: 400 });
  }

  try {
    const tx = (await cybs.getTransaction(transactionId)) as CybsTransaction;
    const oi = tx.orderInformation ?? {};
    const apps = (tx.applicationInformation?.applications ?? [])
      .filter((a) => a.rCode !== undefined)
      .map((a) => a.name)
      .filter(Boolean);

    return NextResponse.json({
      ok: true,
      transactionId,
      reference: tx.clientReferenceInformation?.code,
      reasonCode: String(tx.applicationInformation?.reasonCode ?? ''),
      applications: apps,
      amount: oi.amountDetails?.totalAmount,
      currency: oi.amountDetails?.currency,
      taxAmount: oi.amountDetails?.taxAmount,
      shipTo: oi.shipTo,
      lineItems: oi.lineItems ?? [],
      approvalCode: tx.processorInformation?.approvalCode,
    });
  } catch (e) {
    const err = e as Error & { httpStatus?: number };
    // 404 is normal for a few seconds after a payment — TSS indexes on a delay.
    const notFound = err.httpStatus === 404;
    return NextResponse.json(
      {
        ok: false,
        reason: notFound
          ? 'Not indexed by CyberSource yet — transactions take a moment to appear'
          : err.message || 'Lookup failed',
      },
      { status: notFound ? 404 : 502 },
    );
  }
}
