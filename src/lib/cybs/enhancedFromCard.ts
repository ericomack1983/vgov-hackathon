/**
 * Build Level II / Level III data from the card that pays and the award it pays for.
 *
 * Everything transmitted here was chosen by a human on /cards at issuance time.
 * That is the point: the controls that scope a virtual card are the same facts
 * an accounts-payable system needs on the settled transaction, so they should
 * not be re-typed into an invoice later.
 *
 *   /cards field          Level  CyberSource field
 *   ─────────────────────────────────────────────────────────────────────────
 *   Purpose               II     orderInformation.invoiceDetails.transactionAdviceAddendum
 *   MCC Category          II     merchantInformation.categoryCode
 *   Acceptor ID (POS)     II     merchantInformation.cardAcceptorReferenceNumber
 *   Vincular a misión     II     orderInformation.invoiceDetails.costCenter
 *   Card Holder Name      II     orderInformation.invoiceDetails.purchaseContactName
 *   MCC Category          III    lineItems[].commodityCode (via UNSPSC family)
 *   Assign to Supplier    III    lineItems[].productName context + merchantName
 *   Invoice Number        II     invoiceDetails.invoiceNumber + lineItems[].invoiceNumber
 *   Invoice Date          II     invoiceDetails.invoiceDate
 *   Tax Rate              II/III amountDetails.taxAmount + lineItems[].taxRate, taxable flag
 *   Buyer Tax ID          II     merchantInformation.taxId
 *   VAT Registration      II     merchantInformation.vatRegistrationNumber
 *   Product SKU           III    lineItems[].productSku (falls back to the RFP id)
 *   Commodity Code        III    lineItems[].commodityCode (overrides the MCC map)
 *   Unit of Measure       III    lineItems[].unitOfMeasure
 *   Freight / Duty        III    amountDetails.freightAmount / dutyAmount
 *   Ship-To Postal/Country II/III shipTo.postalCode / shipTo.country
 *   Spend Limit / Valid Until    controls only — they bound the charge, they are not transmitted
 */

import type { PaymentCard, RFP } from '@/lib/mock-data/types';
import { splitAmount, type EnhancedDataInput, type EnhancedLineItem } from '@/lib/cybs/enhancedData';

/**
 * MCC (what the card is allowed to buy) → UNSPSC family (what the line item is).
 * Indicative family-level codes; a production integration would carry the
 * buyer's own commodity catalogue.
 */
export const UNSPSC_FOR_MCC: Record<string, string> = {
  '5065': '39120000', // Electrical Parts & Equipment → electrical equipment
  '5045': '43210000', // Computers & Peripherals      → computer equipment
  '5047': '42000000', // Medical & Dental Equipment   → medical equipment
  '5084': '23000000', // Industrial Machinery         → industrial machinery
  '7389': '80100000', // Business Services            → management advisory
  '7372': '81110000', // Software & IT Services       → computer services
  '5199': '11000000', // Raw Materials & Supplies     → mineral/textile materials
  '5085': '44100000', // Industrial & Commercial Supplies → office/industrial supplies
};

/** Fallback commodity family by RFP category, when the card carries no MCC. */
const UNSPSC_FOR_CATEGORY: Record<string, string> = {
  'IT Infrastructure':     '43000000',
  'Cybersecurity':         '81110000',
  'Office Supplies':       '44120000',
  'Data & Analytics':      '81110000',
  'Facilities':            '72100000',
  'Professional Services': '80100000',
};

/**
 * Delivery destination for the award. The demo agency is federal, so a single
 * constant stands in for what would come from the requisition.
 */
const AGENCY_SHIP_TO = {
  company: 'Gov Procurement Agency',
  address1: '1800 F Street NW',
  locality: 'Washington',
  administrativeArea: 'DC',
  postalCode: '20405',
  country: 'US',
} as const;

/** Federal buyers are tax-exempt; the exemption itself is the Level II fact. */
const AGENCY_TAX_ID = '53-0196966';

export interface EnhancedFromCardInput {
  card: PaymentCard | null;
  rfp: Pick<RFP, 'id' | 'title' | 'category'> | undefined;
  supplierName: string | undefined;
  amount: number;
  /** Order id — also the clientReferenceInformation code on the payment. */
  orderId: string;
}

/**
 * Compose the Level II/III payload. Degrades cleanly: a card issued without
 * optional controls still produces a valid Level III request, just with fewer
 * fields — which is exactly how the data arrives in real life.
 */
export function enhancedFromCard({
  card, rfp, supplierName, amount, orderId,
}: EnhancedFromCardInput): EnhancedDataInput {
  const commodityCode =
    card?.commodityCode ??
    (card?.mccCode ? UNSPSC_FOR_MCC[card.mccCode] : undefined) ??
    (rfp?.category ? UNSPSC_FOR_CATEGORY[rfp.category] : undefined);

  // Tax, freight and duty come out of the charged amount rather than being added
  // on top, so line net + tax + freight + duty is exactly what the buyer pays.
  // An AP system that cannot make the parts sum to the statement line cannot
  // reconcile it at all.
  const taxRatePct = Number(card?.taxRate ?? 0);
  const split = splitAmount(amount, {
    taxRatePct: Number.isFinite(taxRatePct) ? taxRatePct : 0,
    freight: Number(card?.freightAmount ?? 0) || 0,
    duty: Number(card?.dutyAmount ?? 0) || 0,
  });
  const taxable = Number(split.tax) > 0;

  // The award is one contracted lot, not a basket of goods — a single line item
  // priced at the winning bid is the honest representation of it.
  const lineItem: EnhancedLineItem = {
    productCode: 'default',
    productName: rfp?.title ?? 'Contract award',
    productSku: card?.productSku ?? rfp?.id ?? orderId,
    quantity: 1,
    unitPrice: split.net,
    unitOfMeasure: card?.unitOfMeasure ?? 'LO',
    totalAmount: split.net,
    taxAmount: split.tax,
    amountIncludesTax: false,
    ...(taxable ? { taxRate: split.taxRate } : {}),
    ...(commodityCode ? { commodityCode } : {}),
    ...(card?.invoiceNumber ? { invoiceNumber: card.invoiceNumber } : {}),
  };

  const shipTo = card?.shipToPostalCode
    ? { ...AGENCY_SHIP_TO, postalCode: card.shipToPostalCode, country: card.shipToCountry || AGENCY_SHIP_TO.country }
    : { ...AGENCY_SHIP_TO };

  return {
    // The invoice is what an AP clerk matches against; the PO is the award.
    invoiceNumber: card?.invoiceNumber,
    invoiceDate: card?.invoiceDate,
    purchaseOrderNumber: orderId,
    purchaseOrderDate: new Date().toISOString().slice(0, 10),
    purchaseContactName: card?.holderName,
    // Public procurement is usually tax-exempt; stating either way is the Level II value.
    taxable,
    taxAmount: split.tax,
    freightAmount: split.freight,
    dutyAmount: split.duty,
    shipTo,
    shipFromPostalCode: '94105',
    taxId: card?.buyerTaxId ?? AGENCY_TAX_ID,
    vatRegistrationNumber: card?.vatRegistration,
    // Purpose typed at issuance rides to the cardholder's statement; the mission
    // it was linked to becomes the cost center the spend is booked against.
    transactionAdviceAddendum: card?.purpose,
    costCenter: card?.missionId,
    merchantCategoryCode: card?.mccCode,
    cardAcceptorReferenceNumber: card?.cardAcceptorId,
    merchantName: supplierName,
    lineItems: [lineItem],
  };
}

/**
 * Does this card's own controls permit the charge? The VCN already enforces
 * this at the network, but saying so before authorizing makes the control
 * visible instead of implicit.
 */
export function cardControlViolation(card: PaymentCard | null, amount: number): string | null {
  if (!card) return null;
  if (card.spendLimit) {
    const limit = Number(card.spendLimit);
    if (Number.isFinite(limit) && limit > 0 && amount > limit) {
      return `Amount $${amount.toLocaleString()} exceeds this card's $${limit.toLocaleString()} spend limit`;
    }
  }
  if (card.validUntil) {
    const validUntil = new Date(card.validUntil);
    if (!Number.isNaN(validUntil.getTime()) && validUntil < new Date()) {
      return `This card expired on ${card.validUntil}`;
    }
  }
  return null;
}
