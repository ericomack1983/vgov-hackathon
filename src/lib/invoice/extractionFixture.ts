/**
 * The invoice the extractor "reads".
 *
 * Demo fixture: whatever PDF is dropped on /cards, these are the fields that
 * come back. They mirror Invoice_cloud.pdf exactly — the INV-RFP-001-2026 award
 * to Apex Federal Solutions generated from the /notifications email — so the
 * populated form matches the document a viewer has in front of them.
 *
 * Keep this in sync with src/lib/invoice/invoiceFromNotification.ts; the two
 * describe the same purchase from opposite ends.
 */

export interface ExtractedInvoiceFields {
  invoiceNumber: string | null;
  invoiceDate: string | null;
  supplierName: string | null;
  purpose: string | null;
  totalAmount: string | null;
  taxRate: string | null;
  buyerTaxId: string | null;
  vatRegistration: string | null;
  productSku: string | null;
  commodityCode: string | null;
  unitOfMeasure: string | null;
  freightAmount: string | null;
  dutyAmount: string | null;
  shipToPostalCode: string | null;
  shipToCountry: string | null;
  cardAcceptorId: string | null;
  mccCode: string | null;
  confidence: number;
  notes: string | null;
}

export const CLOUD_INVOICE_EXTRACTION: ExtractedInvoiceFields = {
  invoiceNumber: 'INV-RFP-001-2026',
  invoiceDate: '2026-08-20',
  supplierName: 'Apex Federal Solutions',
  purpose: 'Cloud Infrastructure Migration — INV-RFP-001-2026',
  totalAmount: '420000',
  taxRate: '0',
  buyerTaxId: '53-0196966',
  vatRegistration: null, // the invoice carries no VAT registration
  productSku: 'RFP-001',
  commodityCode: '81110000',
  unitOfMeasure: 'LO',
  freightAmount: '0',
  dutyAmount: '0',
  shipToPostalCode: '20405',
  shipToCountry: 'US',
  cardAcceptorId: 'POS-00482-TX',
  mccCode: '7372',
  confidence: 0.97,
  notes: 'Tax-exempt public procurement — no VAT registration stated on the document.',
};

/**
 * How long the read appears to take. Long enough for the four progress steps in
 * InvoiceUploadPanel to play through, short enough not to stall a demo.
 */
export const SIMULATED_READ_MS = 3600;
