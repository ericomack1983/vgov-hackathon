/**
 * Level II / Level III enhanced data for commercial card transactions.
 *
 * Purchasing cards carry more than an amount: Level II adds the purchase order
 * and tax context an accounts-payable system needs, and Level III adds the
 * line-item detail a government buyer is required to account for. Issuers price
 * interchange off it, and the buyer's card statement reconciles against it
 * without anyone re-keying an invoice.
 *
 * Field names verified against cybersource-rest-client@0.0.81 request models
 * (Ptsv2paymentsOrderInformation*, Ptsv2paymentsidcapturesOrderInformation*).
 * Both the authorization and the capture carry the data — the capture is the
 * record that settles, so omitting it there loses the Level III rate.
 */

/** One Level III line item. Amounts are strings, like every other CyberSource amount. */
export interface EnhancedLineItem {
  /** CyberSource product code — 'default' for goods and services. */
  productCode?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: string;
  /** UN/CEFACT unit of measure — 'EA' each, 'HUR' hour, 'LO' lot. */
  unitOfMeasure?: string;
  totalAmount: string;
  taxAmount?: string;
  /** Percentage as a string, e.g. '7.00'. */
  taxRate?: string;
  /** True when unitPrice already contains the tax. */
  amountIncludesTax?: boolean;
  discountAmount?: string;
  /** UNSPSC commodity code. Rejected on invoiceDetails — line items only. */
  commodityCode?: string;
  /** Ties the line back to the supplier's invoice. */
  invoiceNumber?: string;
}

export interface EnhancedDataInput {
  /**
   * Level II — the supplier's invoice number. This is the field an AP clerk
   * matches the card statement against, so reconciliation starts here.
   */
  invoiceNumber?: string;
  /** Level II — YYYY-MM-DD. */
  invoiceDate?: string;
  /** Level II — the buyer's PO. The single most requested field on a P-card. */
  purchaseOrderNumber: string;
  /** Level II — YYYY-MM-DD. */
  purchaseOrderDate?: string;
  purchaseContactName?: string;
  /** Level II — false for tax-exempt public buyers. */
  taxable?: boolean;
  /** Level II — order-level tax. '0.00' when tax-exempt. */
  taxAmount?: string;
  /** Level III — order-level summary amounts. */
  freightAmount?: string;
  dutyAmount?: string;
  discountAmount?: string;
  /**
   * Level II/III — delivery destination. CyberSource rejects a partial address
   * (`MISSING_FIELD orderInformation.shipTo.administrativeArea`), so all five
   * fields are required together.
   */
  shipTo?: ShipToAddress;
  /** Level III — origin postal code, used for freight and tax validation. */
  shipFromPostalCode?: string;
  /** Level II — buyer registration identifiers. */
  vatRegistrationNumber?: string;
  taxId?: string;
  /**
   * Level II — free text that rides to the cardholder's statement. CyberSource
   * takes it as up to 4 lines of 40 characters, so longer text is wrapped.
   */
  transactionAdviceAddendum?: string;
  /** Level II — the budget line this spend is booked against. */
  costCenter?: string;
  /** Level II — merchant category code (MCC). */
  merchantCategoryCode?: string;
  /** Level II — the acceptor/POS identifier the buyer registered. */
  cardAcceptorReferenceNumber?: string;
  /** Level II — merchant name as it should appear on the statement. */
  merchantName?: string;
  /** Level III — at least one required, 998 maximum. */
  lineItems: EnhancedLineItem[];
}

/** Delivery destination for Level II/III. Every field is mandatory at CyberSource. */
export interface ShipToAddress {
  address1: string;
  locality: string;
  /** State or province code, e.g. 'DC'. */
  administrativeArea: string;
  postalCode: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  company?: string;
  firstName?: string;
  lastName?: string;
}

/** The request blocks CyberSource expects, ready to merge into a payment. */
export interface EnhancedDataBlocks {
  processingInformation: { purchaseLevel: '3' };
  orderInformation: Record<string, unknown>;
  merchantInformation?: Record<string, unknown>;
}

/** UN/CEFACT units of measure a procurement line realistically uses. */
export const UNIT_OF_MEASURE = [
  { code: 'EA',  label: 'Each' },
  { code: 'LO',  label: 'Lot' },
  { code: 'HUR', label: 'Hour' },
  { code: 'DAY', label: 'Day' },
  { code: 'MON', label: 'Month' },
  { code: 'ANN', label: 'Year' },
  { code: 'BX',  label: 'Box' },
  { code: 'PK',  label: 'Pack' },
] as const;

/** CyberSource caps a Level III request at 998 line items. */
const MAX_LINE_ITEMS = 998;

export class EnhancedDataError extends Error {}

function requireAmount(value: string | undefined, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new EnhancedDataError(`${field} must be a decimal amount string, got "${value}"`);
  }
  return value;
}

/** CyberSource takes the statement addendum as up to 4 lines of 40 *bytes*. */
const ADDENDUM_LINE_BYTES = 40;
const ADDENDUM_MAX_LINES = 4;

/**
 * The addendum field accepts plain ASCII only, and its limit is counted in bytes.
 * Operator-typed text routinely contains typographic punctuation — an em dash is
 * three UTF-8 bytes, so a 40-character line can be 42 bytes and CyberSource
 * rejects it with INVALID_DATA on `transactionAdviceAddendum[0].data`. The
 * authorization tolerates it; the capture does not, which surfaces as a payment
 * that authorizes and then fails to settle.
 */
function toAsciiText(text: string): string {
  return text
    .replace(/[\u2010-\u2015]/g, '-')   // hyphens, en/em dashes
    .replace(/[\u2018\u2019\u201B]/g, "'") // curly single quotes
    .replace(/[\u201C\u201D]/g, '"')     // curly double quotes
    .replace(/\u2026/g, '...')           // ellipsis
    .normalize('NFKD')                   // accents → base letter + mark
    .replace(/[\u0300-\u036f]/g, '')     // drop the marks
    .replace(/[^\x20-\x7E]/g, '')        // anything still non-ASCII
    .replace(/\s+/g, ' ')
    .trim();
}

function toAddendum(text: string): { data: string }[] {
  const ascii = toAsciiText(text);
  const lines: { data: string }[] = [];
  for (let i = 0; i < ascii.length && lines.length < ADDENDUM_MAX_LINES; i += ADDENDUM_LINE_BYTES) {
    lines.push({ data: ascii.slice(i, i + ADDENDUM_LINE_BYTES) });
  }
  return lines;
}

/**
 * Turn the caller's description of a purchase into the Level II/III blocks.
 * Throws EnhancedDataError on anything CyberSource would reject with a 400.
 */
export function buildEnhancedData(input: EnhancedDataInput): EnhancedDataBlocks {
  if (!input.purchaseOrderNumber?.trim()) {
    throw new EnhancedDataError('purchaseOrderNumber is required for Level II data');
  }
  if (!Array.isArray(input.lineItems) || input.lineItems.length === 0) {
    throw new EnhancedDataError('Level III data requires at least one line item');
  }
  if (input.lineItems.length > MAX_LINE_ITEMS) {
    throw new EnhancedDataError(`Level III data allows at most ${MAX_LINE_ITEMS} line items`);
  }
  if (input.shipTo) {
    for (const field of ['address1', 'locality', 'administrativeArea', 'postalCode', 'country'] as const) {
      if (!input.shipTo[field]?.trim()) {
        throw new EnhancedDataError(`shipTo.${field} is required whenever a destination is supplied`);
      }
    }
  }

  const lineItems = input.lineItems.map((item, i) => {
    if (!item.productName?.trim()) {
      throw new EnhancedDataError(`lineItems[${i}].productName is required`);
    }
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new EnhancedDataError(`lineItems[${i}].quantity must be a positive number`);
    }
    return {
      productCode: item.productCode ?? 'default',
      productName: toAsciiText(item.productName),
      ...(item.productSku ? { productSku: item.productSku } : {}),
      quantity: item.quantity,
      unitPrice: requireAmount(item.unitPrice, `lineItems[${i}].unitPrice`),
      unitOfMeasure: item.unitOfMeasure ?? 'EA',
      totalAmount: requireAmount(item.totalAmount, `lineItems[${i}].totalAmount`),
      ...(item.taxAmount ? { taxAmount: requireAmount(item.taxAmount, `lineItems[${i}].taxAmount`) } : {}),
      ...(item.taxRate ? { taxRate: item.taxRate } : {}),
      ...(item.amountIncludesTax !== undefined ? { amountIncludesTax: item.amountIncludesTax } : {}),
      ...(item.discountAmount ? { discountAmount: requireAmount(item.discountAmount, `lineItems[${i}].discountAmount`) } : {}),
      ...(item.commodityCode ? { commodityCode: item.commodityCode } : {}),
      ...(item.invoiceNumber ? { invoiceNumber: item.invoiceNumber } : {}),
    };
  });

  const amountDetails: Record<string, string> = {};
  const tax = requireAmount(input.taxAmount, 'taxAmount');
  const freight = requireAmount(input.freightAmount, 'freightAmount');
  const duty = requireAmount(input.dutyAmount, 'dutyAmount');
  const discount = requireAmount(input.discountAmount, 'discountAmount');
  if (tax !== undefined) amountDetails.taxAmount = tax;
  if (freight !== undefined) amountDetails.freightAmount = freight;
  if (duty !== undefined) amountDetails.dutyAmount = duty;
  if (discount !== undefined) amountDetails.discountAmount = discount;

  const merchantInformation: Record<string, string> = {};
  if (input.vatRegistrationNumber) merchantInformation.vatRegistrationNumber = input.vatRegistrationNumber;
  if (input.taxId) merchantInformation.taxId = input.taxId;
  if (input.merchantCategoryCode) merchantInformation.categoryCode = input.merchantCategoryCode;
  if (input.cardAcceptorReferenceNumber) merchantInformation.cardAcceptorReferenceNumber = input.cardAcceptorReferenceNumber;
  if (input.merchantName) merchantInformation.merchantName = input.merchantName;

  return {
    // purchaseLevel '3' is the flag that makes CyberSource read the blocks below.
    processingInformation: { purchaseLevel: '3' },
    orderInformation: {
      invoiceDetails: {
        ...(input.invoiceNumber ? { invoiceNumber: input.invoiceNumber } : {}),
        ...(input.invoiceDate ? { invoiceDate: input.invoiceDate } : {}),
        purchaseOrderNumber: input.purchaseOrderNumber,
        ...(input.purchaseOrderDate ? { purchaseOrderDate: input.purchaseOrderDate } : {}),
        ...(input.purchaseContactName ? { purchaseContactName: input.purchaseContactName } : {}),
        ...(input.costCenter ? { costCenter: input.costCenter } : {}),
        ...(input.transactionAdviceAddendum?.trim()
          ? { transactionAdviceAddendum: toAddendum(input.transactionAdviceAddendum.trim()) }
          : {}),
        taxable: input.taxable ?? false,
      },
      ...(Object.keys(amountDetails).length ? { amountDetails } : {}),
      ...(input.shipTo ? { shipTo: input.shipTo } : {}),
      ...(input.shipFromPostalCode
        ? { shippingDetails: { shipFromPostalCode: input.shipFromPostalCode } }
        : {}),
      lineItems,
    },
    ...(Object.keys(merchantInformation).length ? { merchantInformation } : {}),
  };
}

/**
 * Split a charge into the parts Level III has to account for, such that
 *
 *   line net + tax + freight + duty === the amount actually charged
 *
 * Reconciliation is the whole point of this data; if the parts do not sum to the
 * total, an AP system cannot match the statement line and the effort is wasted.
 * Tax is derived from the taxable base rather than added on top, so the charge
 * stays exactly what the buyer approved.
 */
export interface AmountSplit {
  /** Line item total, net of tax. */
  net: string;
  tax: string;
  freight: string;
  duty: string;
  /** Echo of the charged total — net + tax + freight + duty. */
  total: string;
  /** Percentage applied, '0.00' when exempt. */
  taxRate: string;
}

export function splitAmount(
  amount: number,
  { taxRatePct = 0, freight = 0, duty = 0 }: { taxRatePct?: number; freight?: number; duty?: number } = {},
): AmountSplit {
  const cents = (n: number) => Math.round(n * 100);
  const money = (c: number) => (c / 100).toFixed(2);

  const totalCents = cents(amount);
  const freightCents = Math.min(cents(freight), totalCents);
  const dutyCents = Math.min(cents(duty), totalCents - freightCents);
  const baseCents = totalCents - freightCents - dutyCents;

  // Derive net from the base so rounding lands on tax, never on the total.
  const netCents = taxRatePct > 0 ? Math.round(baseCents / (1 + taxRatePct / 100)) : baseCents;
  const taxCents = baseCents - netCents;

  return {
    net: money(netCents),
    tax: money(taxCents),
    freight: money(freightCents),
    duty: money(dutyCents),
    total: money(netCents + taxCents + freightCents + dutyCents),
    taxRate: taxRatePct.toFixed(2),
  };
}

/** Compact description of what was transmitted, for receipts and logs. */
export interface EnhancedDataSummary {
  purchaseLevel: '3';
  purchaseOrderNumber: string;
  taxable: boolean;
  taxAmount?: string;
  lineItemCount: number;
  commodityCodes: string[];
  shipToPostalCode?: string;
  shipFromPostalCode?: string;
  invoiceNumber?: string;
  /** Level II fields sourced from the card's issuance controls. */
  costCenter?: string;
  merchantCategoryCode?: string;
  cardAcceptorReferenceNumber?: string;
  statementNote?: string;
}

export function summarizeEnhancedData(input: EnhancedDataInput): EnhancedDataSummary {
  return {
    purchaseLevel: '3',
    purchaseOrderNumber: input.purchaseOrderNumber,
    taxable: input.taxable ?? false,
    taxAmount: input.taxAmount,
    invoiceNumber: input.invoiceNumber,
    lineItemCount: input.lineItems.length,
    commodityCodes: [...new Set(input.lineItems.map((l) => l.commodityCode).filter((c): c is string => !!c))],
    shipToPostalCode: input.shipTo?.postalCode,
    shipFromPostalCode: input.shipFromPostalCode,
    costCenter: input.costCenter,
    merchantCategoryCode: input.merchantCategoryCode,
    cardAcceptorReferenceNumber: input.cardAcceptorReferenceNumber,
    statementNote: input.transactionAdviceAddendum,
  };
}
