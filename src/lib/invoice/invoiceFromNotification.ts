/**
 * Turn an invoice-verified notification into a complete invoice document.
 *
 * The notification only carries what the email needs (number, amount, supplier,
 * RFP title). The Level I / Level II field set an AP department expects is
 * derived here from the award, using the same constants the payment path uses so
 * the invoice and the card transaction describe the same purchase.
 */

import type { Notification } from '@/lib/mock-data/types';
import { UNSPSC_FOR_MCC } from '@/lib/cybs/enhancedFromCard';
import type { InvoicePdfInput } from '@/lib/invoice/invoicePdf';

/** Commodity classification per award category, mirroring the payment mapping. */
const CATEGORY_PROFILE: Record<string, { mcc: string; commodity: string; uom: string }> = {
  'Cloud Infrastructure Migration': { mcc: '7372', commodity: '81110000', uom: 'LO' },
  'Cybersecurity Audit Program':    { mcc: '7372', commodity: '81110000', uom: 'LO' },
  'Office Supplies Restock':        { mcc: '5085', commodity: '44120000', uom: 'BX' },
};

const DEFAULT_PROFILE = { mcc: '7389', commodity: '80100000', uom: 'LO' };

/** The buying agency. Fixed for the demo; a real system reads the requisition. */
const BUYER = {
  name: 'VGov Procurement Office',
  address: ['1800 F Street NW', 'Washington, DC 20405', 'United States'],
  taxId: '53-0196966',
  postalCode: '20405',
  country: 'US',
  costCenter: 'CC-PROC-2026',
  customerCode: 'VGOV-PROC',
};

function supplierProfile(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, '');
  return {
    email: `invoices@${slug}.com`,
    address: ['1200 Corporate Parkway', 'San Francisco, CA 94105', 'United States'],
    taxId: '94-3172119',
    postalCode: '94105',
  };
}

export function invoiceFromNotification(n: Notification): InvoicePdfInput {
  const supplierName = n.supplierName ?? 'Supplier';
  const supplier = supplierProfile(supplierName);
  const title = n.rfpTitle ?? 'Contract award';
  const profile = CATEGORY_PROFILE[title] ?? DEFAULT_PROFILE;
  const invoiceDate = new Date(n.timestamp);
  const invoiceNo = n.invoiceNo ?? 'INV-UNKNOWN';

  return {
    invoiceNo,
    invoiceDate,
    amount: n.amount ?? 0,
    currency: 'USD',

    supplierName,
    supplierEmail: supplier.email,
    supplierAddress: supplier.address,
    supplierTaxId: supplier.taxId,

    buyerName: BUYER.name,
    buyerAddress: BUYER.address,
    buyerTaxId: BUYER.taxId,

    // Level II — the references AP matches on.
    purchaseOrderNumber: `PO-${(n.orderId ?? 'rfp').toUpperCase().replace('RFP-', '')}-2026`,
    purchaseOrderDate: invoiceDate,
    costCenter: BUYER.costCenter,
    customerCode: BUYER.customerCode,
    merchantCategoryCode: profile.mcc,
    cardAcceptorId: 'POS-00482-TX',
    shipToPostalCode: BUYER.postalCode,
    shipToCountry: BUYER.country,
    shipFromPostalCode: supplier.postalCode,

    // Public procurement is tax-exempt; freight and duty are quoted inclusive.
    taxRatePct: 0,
    freight: 0,
    duty: 0,
    discount: 0,

    paymentMethod: 'Visa Commercial Card · B2B',
    cardLast4: n.cardLast4,
    terms: 'Payment terms: Net 30 · settled via Visa B2B commercial card rails',

    lines: [
      {
        description: title,
        sku: (n.orderId ?? 'rfp-001').toUpperCase(),
        commodityCode: UNSPSC_FOR_MCC[profile.mcc] ?? profile.commodity,
        unitOfMeasure: profile.uom,
        quantity: 1,
      },
    ],
  };
}

/** Filename the attachment downloads as. */
export function invoiceFilename(n: Notification): string {
  const title = n.rfpTitle ?? '';
  if (title.toLowerCase().includes('cloud')) return 'Invoice_cloud.pdf';
  return `${n.invoiceNo ?? 'invoice'}.pdf`;
}
