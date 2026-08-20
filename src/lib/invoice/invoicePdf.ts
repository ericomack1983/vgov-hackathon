/**
 * Supplier invoice PDF carrying the full Level I and Level II field set.
 *
 * This is the document the card payment is reconciled against, so it is built
 * from the same `splitAmount` used to compose the Level II/III payment payload
 * (src/lib/cybs/enhancedData.ts). Line net + tax + freight + duty equals the
 * invoice total equals the amount authorized — by construction, not by luck.
 *
 * Drawn as vector text rather than a rasterised screenshot: the result is
 * selectable, searchable, and a fraction of the size.
 */

import { splitAmount } from '@/lib/cybs/enhancedData';

export interface InvoiceLineInput {
  description: string;
  sku: string;
  commodityCode: string;
  unitOfMeasure: string;
  quantity: number;
}

export interface InvoicePdfInput {
  invoiceNo: string;
  invoiceDate: Date;
  /** Total payable — tax, freight and duty are contained within it. */
  amount: number;
  currency?: string;

  supplierName: string;
  supplierEmail: string;
  supplierAddress?: string[];
  supplierTaxId?: string;

  buyerName?: string;
  buyerAddress?: string[];
  buyerTaxId?: string;

  /** Level II — order references. */
  purchaseOrderNumber: string;
  purchaseOrderDate?: Date;
  costCenter?: string;
  customerCode?: string;
  /** Level II — merchant classification and acceptance. */
  merchantCategoryCode?: string;
  cardAcceptorId?: string;
  /** Level II — destination and origin. */
  shipToPostalCode?: string;
  shipToCountry?: string;
  shipFromPostalCode?: string;
  /** Level II — tax treatment. */
  taxRatePct?: number;
  freight?: number;
  duty?: number;
  discount?: number;
  /** Level I — how it was paid. */
  paymentMethod?: string;
  cardLast4?: string;
  terms?: string;

  lines: InvoiceLineInput[];
}

const INDIGO: [number, number, number] = [20, 52, 203];
const SLATE: [number, number, number] = [71, 85, 105];
const MUTED: [number, number, number] = [148, 163, 184];
const INK: [number, number, number] = [15, 23, 42];
const RULE: [number, number, number] = [226, 232, 240];

const MARGIN = 14;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;

function fmtMoney(value: number, currency = 'USD'): string {
  return `${currency === 'USD' ? '$' : ''}${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Build the invoice. Returns the jsPDF document so callers can save or stream it. */
export async function buildInvoicePdf(input: InvoicePdfInput) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');
  const currency = input.currency ?? 'USD';

  const split = splitAmount(input.amount, {
    taxRatePct: input.taxRatePct ?? 0,
    freight: input.freight ?? 0,
    duty: input.duty ?? 0,
  });
  const net = Number(split.net);
  const tax = Number(split.tax);
  const freight = Number(split.freight);
  const duty = Number(split.duty);

  // ── Header band ───────────────────────────────────────────────────────────
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, PAGE_W, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('INVOICE', MARGIN, 17);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(input.supplierName, MARGIN, 25);
  doc.setTextColor(200, 214, 255);
  doc.setFontSize(8);
  doc.text(input.supplierEmail, MARGIN, 30.5);

  // Invoice number + verified badge, right aligned.
  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(input.invoiceNo, PAGE_W - MARGIN, 17, { align: 'right' });

  doc.setFillColor(16, 185, 129);
  doc.roundedRect(PAGE_W - MARGIN - 40, 21, 40, 6.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('VERIFIED VIA VISA B2B', PAGE_W - MARGIN - 20, 25.4, { align: 'center' });

  let y = 48;

  // ── Parties ───────────────────────────────────────────────────────────────
  const colW = CONTENT_W / 2 - 4;
  const party = (title: string, name: string, lines: string[], taxId: string | undefined, x: number) => {
    let py = y;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(title.toUpperCase(), x, py);
    py += 5;
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(name, x, py);
    py += 4.6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    for (const line of lines) {
      doc.text(line, x, py);
      py += 4;
    }
    if (taxId) {
      doc.setTextColor(...MUTED);
      doc.text(`Tax ID ${taxId}`, x, py);
      py += 4;
    }
    return py;
  };

  const leftEnd = party('From (Supplier)', input.supplierName, input.supplierAddress ?? [], input.supplierTaxId, MARGIN);
  const rightEnd = party('Bill To (Buyer)', input.buyerName ?? 'VGov Procurement', input.buyerAddress ?? [], input.buyerTaxId, MARGIN + colW + 8);
  y = Math.max(leftEnd, rightEnd) + 5;

  // ── Section helper ────────────────────────────────────────────────────────
  const sectionHeader = (label: string, note: string) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...INDIGO);
    doc.text(label, MARGIN + 3, y + 4.8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(note, PAGE_W - MARGIN - 3, y + 4.8, { align: 'right' });
    y += 11;
  };

  /** Two-column label/value grid. */
  const fieldGrid = (fields: { label: string; value: string }[]) => {
    const half = CONTENT_W / 2;
    fields.forEach((f, i) => {
      const col = i % 2;
      const x = MARGIN + col * half;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(f.label, x, y);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...INK);
      doc.text(f.value, x + half - 6, y, { align: 'right' });
      if (col === 1 || i === fields.length - 1) y += 5.6;
    });
    y += 2;
  };

  // ── Level I ───────────────────────────────────────────────────────────────
  sectionHeader('LEVEL I DATA', 'Basic transaction set');
  fieldGrid([
    { label: 'Merchant / Supplier', value: input.supplierName },
    { label: 'Transaction Amount', value: fmtMoney(input.amount, currency) },
    { label: 'Transaction Date', value: isoDate(input.invoiceDate) },
    { label: 'Currency', value: currency },
    { label: 'Payment Method', value: input.paymentMethod ?? 'Visa Commercial Card' },
    { label: 'Card', value: input.cardLast4 ? `•••• ${input.cardLast4}` : 'Virtual Card (VCN)' },
  ]);

  // ── Level II ──────────────────────────────────────────────────────────────
  sectionHeader('LEVEL II DATA', 'Purchasing card / AP reconciliation set');
  fieldGrid([
    { label: 'Invoice Number', value: input.invoiceNo },
    { label: 'Invoice Date', value: isoDate(input.invoiceDate) },
    { label: 'Purchase Order Number', value: input.purchaseOrderNumber },
    { label: 'Purchase Order Date', value: isoDate(input.purchaseOrderDate ?? input.invoiceDate) },
    { label: 'Customer Code', value: input.customerCode ?? 'VGOV-PROC' },
    { label: 'Cost Center', value: input.costCenter ?? '—' },
    { label: 'Tax Treatment', value: tax > 0 ? `Taxable @ ${split.taxRate}%` : 'Exempt' },
    { label: 'Tax Amount', value: fmtMoney(tax, currency) },
    { label: 'Buyer Tax ID', value: input.buyerTaxId ?? '—' },
    { label: 'Supplier Tax ID', value: input.supplierTaxId ?? '—' },
    { label: 'Merchant Category (MCC)', value: input.merchantCategoryCode ?? '—' },
    { label: 'Card Acceptor ID', value: input.cardAcceptorId ?? '—' },
    { label: 'Ship-To Postal', value: input.shipToPostalCode ?? '—' },
    { label: 'Ship-To Country', value: input.shipToCountry ?? '—' },
    { label: 'Ship-From Postal', value: input.shipFromPostalCode ?? '—' },
    { label: 'Freight / Duty', value: `${fmtMoney(freight, currency)} / ${fmtMoney(duty, currency)}` },
    { label: 'Discount Amount', value: fmtMoney(input.discount ?? 0, currency) },
    { label: 'Order Reference', value: input.purchaseOrderNumber },
  ]);

  // ── Line items ────────────────────────────────────────────────────────────
  sectionHeader('LINE ITEM DETAIL', 'Carried to the payment as Level III');

  // Money columns are sized for seven figures — an award total truncated to
  // "$420,000." on the invoice is worse than useless to an AP clerk.
  const cols = [
    { label: 'Description', x: MARGIN, w: 54, align: 'left' as const },
    { label: 'SKU', x: MARGIN + 54, w: 26, align: 'left' as const },
    { label: 'Commodity', x: MARGIN + 80, w: 22, align: 'left' as const },
    { label: 'UoM', x: MARGIN + 102, w: 10, align: 'left' as const },
    { label: 'Qty', x: MARGIN + 112, w: 9, align: 'right' as const },
    { label: 'Unit Price', x: MARGIN + 121, w: 30, align: 'right' as const },
    { label: 'Amount', x: MARGIN + 151, w: 31, align: 'right' as const },
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  for (const c of cols) {
    doc.text(c.label, c.align === 'right' ? c.x + c.w : c.x, y, { align: c.align });
  }
  y += 2;
  doc.setDrawColor(...RULE);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 4.5;

  // The award is a single contracted lot, so the net divides evenly across the
  // declared lines rather than inventing per-line prices.
  const perLineNet = net / input.lines.length;
  for (const line of input.lines) {
    const unit = perLineNet / (line.quantity || 1);
    const values = [
      line.description,
      line.sku,
      line.commodityCode,
      line.unitOfMeasure,
      String(line.quantity),
      fmtMoney(unit, currency),
      fmtMoney(perLineNet, currency),
    ];
    cols.forEach((c, i) => {
      doc.setFont(i === 0 ? 'helvetica' : 'courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...INK);
      const text = doc.splitTextToSize(values[i], c.w - 2)[0];
      doc.text(text, c.align === 'right' ? c.x + c.w : c.x, y, { align: c.align });
    });
    y += 6;
  }

  doc.setDrawColor(...RULE);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;

  // ── Totals — these must sum to the amount charged ─────────────────────────
  const totalsX = PAGE_W - MARGIN - 70;
  const totalRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 8.5);
    doc.setTextColor(...(bold ? INK : SLATE));
    doc.text(label, totalsX, y);
    doc.setFont('courier', 'bold');
    doc.text(value, PAGE_W - MARGIN, y, { align: 'right' });
    y += bold ? 7 : 5.4;
  };

  totalRow('Subtotal (net)', fmtMoney(net, currency));
  totalRow(tax > 0 ? `Tax (${split.taxRate}%)` : 'Tax (exempt)', fmtMoney(tax, currency));
  totalRow('Freight', fmtMoney(freight, currency));
  totalRow('Duty', fmtMoney(duty, currency));
  doc.setDrawColor(...INDIGO);
  doc.line(totalsX, y - 2, PAGE_W - MARGIN, y - 2);
  y += 2;
  totalRow('Total Due', fmtMoney(net + tax + freight + duty, currency), true);

  // ── Footer ────────────────────────────────────────────────────────────────
  const footY = 268;
  doc.setDrawColor(...RULE);
  doc.line(MARGIN, footY - 6, PAGE_W - MARGIN, footY - 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE);
  doc.text(input.terms ?? 'Payment terms: due on receipt · settled by Visa Commercial Card', MARGIN, footY);
  doc.setTextColor(...MUTED);
  doc.setFontSize(7);
  doc.text(
    'Level I and Level II fields above are transmitted with the card authorization and capture, so this invoice',
    MARGIN, footY + 4.5,
  );
  doc.text(
    'reconciles line-for-line against the cardholder statement without re-keying.',
    MARGIN, footY + 8.5,
  );
  doc.setFont('courier', 'normal');
  doc.text(`${input.invoiceNo} · generated ${fmtDate(input.invoiceDate)}`, PAGE_W - MARGIN, footY + 8.5, { align: 'right' });

  return doc;
}

/** Build and hand the file to the browser. */
export async function downloadInvoicePdf(input: InvoicePdfInput, filename: string) {
  const doc = await buildInvoicePdf(input);
  doc.save(filename);
}
