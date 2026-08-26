'use client';

import { use, useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { usePayment } from '@/context/PaymentContext';
import { useSettlement, SettlementCompleteData } from '@/hooks/useSettlement';
import { SettlementAnimation } from '@/components/payment/SettlementAnimation';
import {
  ArrowLeft, ArrowRight, CheckCircle, CreditCard,
  DollarSign, Coins, Bell, CheckCircle2, XCircle, AlertCircle,
  Clock, Mail, FileText, Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { authenticateWithBiometrics } from '@/lib/biometricAuth';
import { payWithCard, type CardPaymentSuccess } from '@/lib/cybs/payWithCard';
import { enhancedFromCard, cardControlViolation } from '@/lib/cybs/enhancedFromCard';
import type { EnhancedDataInput } from '@/lib/cybs/enhancedData';
import { CyberSourceBadge } from '@/components/brand/CyberSourceBadge';
import type { PaymentMethod, PaymentCard } from '@/lib/mock-data/types';
import { b2bService, vpaService } from '@/lib/visa-sdk';
import { useT } from '@/context/LanguageContext';

// ─── types ────────────────────────────────────────────────────────────────────
type Step = 'card-select' | 'card-confirm' | 'fund-select' | 'processing' | 'done';
type FundMethod = 'USD' | 'USDC';

interface SelectableCard extends Pick<PaymentCard,
  | 'id' | 'brand' | 'last4' | 'type' | 'holderName' | 'status' | 'expiry' | 'usageType'
  // Issuance controls from /cards — these become the Level II/III data.
  | 'purpose' | 'mccCode' | 'mccLabel' | 'cardAcceptorId' | 'spendLimit' | 'validUntil'
  | 'missionId' | 'missionName'
  // Reconciliation data from /cards.
  | 'invoiceNumber' | 'invoiceDate' | 'taxRate' | 'buyerTaxId' | 'vatRegistration'
  | 'productSku' | 'commodityCode' | 'unitOfMeasure' | 'freightAmount' | 'dutyAmount'
  | 'shipToPostalCode' | 'shipToCountry'
> {
  supplierName: string;
}

// ─── constants ────────────────────────────────────────────────────────────────
const STEPS: Step[] = ['card-select', 'card-confirm', 'fund-select', 'processing', 'done'];

const BRAND_BG: Record<PaymentCard['brand'], string> = {
  Visa:       'from-[#1434CB] to-[#0a1f8f]',
  Mastercard: 'from-[#EB001B] to-[#a80013]',
  Amex:       'from-[#007BC1] to-[#005a8e]',
};
const BRAND_DOT: Record<PaymentCard['brand'], string> = {
  Visa: 'bg-[#1434CB]', Mastercard: 'bg-[#EB001B]', Amex: 'bg-[#007BC1]',
};
const BRAND_LABEL: Record<PaymentCard['brand'], string> = {
  Visa: 'VISA', Mastercard: 'MC', Amex: 'AMEX',
};

// ─── step indicator ───────────────────────────────────────────────────────────
function StepDots({ current }: { current: Step }) {
  const visible: Step[] = ['card-select', 'card-confirm', 'fund-select', 'processing'];
  const idx = visible.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {visible.map((s, i) => (
        <div key={s} className={`rounded-full transition-all duration-300 ${
          i < idx  ? 'w-2 h-2 bg-[#1434CB]' :
          i === idx ? 'w-6 h-2 bg-[#1434CB]' :
                     'w-2 h-2 bg-slate-200'
        }`} />
      ))}
    </div>
  );
}

// ─── card visual ──────────────────────────────────────────────────────────────
function CardVisual({ card }: { card: SelectableCard }) {
  return (
    <div className={`relative w-full rounded-2xl bg-gradient-to-br ${BRAND_BG[card.brand]} p-6 overflow-hidden shadow-xl`}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-4 w-40 h-40 rounded-full bg-white/5" />
      <div className="flex items-start justify-between relative z-10 mb-8">
        <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 grid grid-cols-2 gap-px p-1 shadow-inner">
          {[...Array(4)].map((_, i) => <div key={i} className="rounded-sm bg-yellow-600/40" />)}
        </div>
        <span className="text-white font-black tracking-widest text-sm">{BRAND_LABEL[card.brand]}</span>
      </div>
      <p className="font-mono text-white text-xl tracking-[0.22em] relative z-10 mb-6">
        •••• •••• •••• {card.last4}
      </p>
      <div className="flex justify-between relative z-10">
        <div>
          <p className="text-[9px] text-white/50 uppercase tracking-widest">Card Holder</p>
          <p className="text-white text-sm font-semibold">{card.holderName}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-white/50 uppercase tracking-widest">Type</p>
          <p className="text-white text-sm font-semibold capitalize">{card.type}</p>
        </div>
      </div>
    </div>
  );
}


// ─── Level II / III panel ─────────────────────────────────────────────────────
/**
 * What the commercial card carries beyond the amount. Every field tagged
 * "from /cards" was set when the VCN was issued — the point of the panel is that
 * nobody re-keys this data onto an invoice later.
 */
function EnhancedDataPanel({ data, transmitted }: {
  data: EnhancedDataInput;
  /** Before the payment it is a preview; after, it is a record of what was sent. */
  transmitted?: boolean;
}) {
  const item = data.lineItems[0];

  const money = (v?: string) => (v === undefined ? undefined : `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);

  const levelTwo: { label: string; value?: string; fromCard?: boolean }[] = [
    { label: 'Invoice',      value: data.invoiceNumber, fromCard: true },
    { label: 'Invoice Date', value: data.invoiceDate, fromCard: true },
    { label: 'PO Number',    value: data.purchaseOrderNumber },
    { label: 'PO Date',      value: data.purchaseOrderDate },
    { label: 'Tax Status',   value: data.taxable ? `Taxable @ ${item?.taxRate ?? '—'}%` : 'Exempt' },
    { label: 'Buyer Tax ID', value: data.taxId, fromCard: true },
    { label: 'VAT Reg.',     value: data.vatRegistrationNumber, fromCard: true },
    { label: 'Cost Center',  value: data.costCenter, fromCard: true },
    { label: 'MCC',          value: data.merchantCategoryCode, fromCard: true },
    { label: 'Acceptor ID',  value: data.cardAcceptorReferenceNumber, fromCard: true },
    { label: 'Statement',    value: data.transactionAdviceAddendum, fromCard: true },
    { label: 'Contact',      value: data.purchaseContactName, fromCard: true },
  ];

  const levelThree: { label: string; value?: string; fromCard?: boolean }[] = [
    { label: 'Line Items', value: String(data.lineItems.length) },
    { label: 'SKU',        value: item?.productSku, fromCard: true },
    { label: 'Commodity',  value: item?.commodityCode, fromCard: true },
    { label: 'Unit / Qty', value: item ? `${item.unitOfMeasure ?? 'EA'} × ${item.quantity}` : undefined, fromCard: true },
    { label: 'Ship To',    value: data.shipTo ? `${data.shipTo.locality}, ${data.shipTo.administrativeArea} ${data.shipTo.postalCode} ${data.shipTo.country}` : undefined },
    { label: 'Ship From',  value: data.shipFromPostalCode },
  ];

  // The parts must add up to the charge, or none of this reconciles.
  const breakdown: { label: string; value?: string }[] = [
    { label: 'Line net', value: money(item?.totalAmount) },
    { label: 'Tax',      value: money(data.taxAmount) },
    { label: 'Freight',  value: money(data.freightAmount) },
    { label: 'Duty',     value: money(data.dutyAmount) },
  ].filter((r) => r.value && Number(r.value.replace(/[$,]/g, '')) > 0 || r.label === 'Line net');

  const chargedTotal =
    Number(item?.totalAmount ?? 0) + Number(data.taxAmount ?? 0) +
    Number(data.freightAmount ?? 0) + Number(data.dutyAmount ?? 0);

  const Row = ({ label, value, fromCard }: { label: string; value?: string; fromCard?: boolean }) =>
    !value ? null : (
      <div className="flex justify-between gap-3 items-baseline">
        <span className="text-slate-400 shrink-0">
          {label}
          {fromCard && <span className="ml-1.5 text-[9px] font-semibold text-[#1434CB] uppercase tracking-wide">/cards</span>}
        </span>
        <span className="font-mono text-slate-700 text-right break-all">{value}</span>
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <FileText size={13} className="text-[#1434CB] shrink-0" />
        <span className="text-xs font-bold text-slate-700">Level II / III Data</span>
        <span className="ml-auto font-mono text-[10px] text-slate-400">purchaseLevel 3</span>
      </div>

      <div className="px-4 py-3 space-y-1.5 text-xs">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Level II · Purchase</p>
        {levelTwo.map((r) => <Row key={r.label} {...r} />)}

        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider pt-2">Level III · Line Detail</p>
        {levelThree.map((r) => <Row key={r.label} {...r} />)}

        {item && (
          <div className="pt-2 mt-1 border-t border-dashed border-slate-200 space-y-1">
            <p className="text-slate-500 truncate">{item.productName}</p>
            {breakdown.map((r) => (
              <div key={r.label} className="flex justify-between gap-3">
                <span className="text-slate-400">{r.label}</span>
                <span className="font-mono text-slate-600">{r.value}</span>
              </div>
            ))}
            <div className="flex justify-between gap-3 pt-1 border-t border-slate-100">
              <span className="font-semibold text-slate-600">Charged</span>
              <span className="font-mono font-bold text-slate-900">
                ${chargedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>

      <p className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 leading-snug">
        {transmitted
          ? 'Sent with both the authorization and the capture, so the settled record carries it.'
          : 'Transmitted with the authorization and the capture — issuers price interchange off this detail.'}
      </p>
    </div>
  );
}

// ─── done step ────────────────────────────────────────────────────────────────
function DoneStep({ bidAmount, fundMethod, selectedCard, winner, orderId, isCnp, visaPaymentId, cybs, enhanced }: {
  bidAmount: number;
  fundMethod: string | null;
  selectedCard: { last4: string } | null;
  winner: { name: string } | undefined;
  orderId: string;
  isCnp?: boolean;
  visaPaymentId?: string | null;
  /** CyberSource authorize + capture — BIP path only. */
  cybs?: CardPaymentSuccess | null;
  /** Level II/III actually transmitted with the payment. */
  enhanced?: EnhancedDataInput | null;
}) {
  const t = useT();
  const [notifVisible, setNotifVisible] = useState(false);
  useEffect(() => {
    if (isCnp) return;
    const t = setTimeout(() => setNotifVisible(true), 3000);
    return () => clearTimeout(t);
  }, [isCnp]);

  return (
    <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="flex flex-col items-center gap-6 py-8">

      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
          isCnp && !cybs?.review ? 'bg-emerald-500 shadow-emerald-200' : 'bg-amber-400 shadow-amber-200'
        }`}
      >
        {isCnp && !cybs?.review
          ? <CheckCircle2 size={40} className="text-white" strokeWidth={2} />
          : <Clock size={40} className="text-white" strokeWidth={2} />
        }
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-center">
        <p className="text-xl font-bold text-slate-900">
          {cybs?.review ? 'Payment Executed · Flagged' : isCnp ? 'Payment Executed' : 'Payment Pending'}
        </p>
        <p className="text-sm text-slate-500 mt-1">
          ${bidAmount.toLocaleString()}{' '}
          {cybs?.review
            ? 'captured — Decision Manager flagged this amount for review'
            : isCnp ? 'processed instantly via STP' : `dispatched via ${fundMethod} · Card •••• ${selectedCard?.last4}`}
        </p>
      </motion.div>

      {/* Decision Manager hold — the payment is captured but not finished */}
      {cybs?.review && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          className="w-full max-w-xs rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-900 leading-snug">{t('review.pending')}</p>
              <p className="text-[11px] text-amber-800/80 mt-1 leading-snug">{t('review.note')}</p>
              <p className="text-[10px] font-mono text-amber-700/70 mt-1.5">
                {cybs.reviewReason ?? 'DECISION_PROFILE_REVIEW'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Receipt summary */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 w-full max-w-xs space-y-2.5 text-sm"
      >
        {[
          { label: 'Recipient', value: winner?.name ?? '' },
          { label: 'Amount',    value: `$${bidAmount.toLocaleString()}` },
          { label: 'Method',    value: isCnp ? 'USD · STP' : (fundMethod ?? '') },
          ...(!isCnp ? [{ label: 'Card', value: `•••• ${selectedCard?.last4}` }] : []),
          { label: 'Order ID',  value: orderId },
          ...(visaPaymentId ? [{ label: isCnp ? 'BIP ID' : 'SIP ID', value: visaPaymentId }] : []),
          ...(cybs ? [
            { label: 'Auth ID',    value: cybs.authorizationId },
            ...(cybs.captureId ? [{ label: 'Capture ID', value: cybs.captureId }] : []),
            ...(cybs.approvalCode ? [{ label: 'Approval', value: cybs.approvalCode }] : []),
            ...(cybs.review ? [{ label: 'Review', value: cybs.reviewReason ?? 'Held' }] : []),
          ] : []),
          ...(isCnp ? [{ label: 'Status', value: cybs?.review ? `⏳ ${t('review.awaiting')}` : '✓ Executed' }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span className="text-slate-400 shrink-0">{label}</span>
            <span className={`font-semibold font-mono ml-3 text-right break-all ${
              label === 'Status' ? (cybs?.review ? 'text-amber-600' : 'text-emerald-600')
              : label === 'Review' ? 'text-amber-600'
              : label === 'Approval' ? 'text-emerald-600'
              : 'text-slate-800'
            }`}>{value}</span>
          </div>
        ))}
      </motion.div>

      {/* Enhanced data actually transmitted — BIP only */}
      {cybs && enhanced && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}
          className="w-full max-w-xs">
          <EnhancedDataPanel data={enhanced} transmitted />
        </motion.div>
      )}

      {/* Push notification — Card Present only */}
      <AnimatePresence>
        {notifVisible && !isCnp && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="w-full max-w-xs bg-slate-900 rounded-2xl p-4 flex items-start gap-3 shadow-2xl border border-slate-700"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1434CB] flex items-center justify-center shrink-0">
              <Bell size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white">VGov · Payments</p>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">Payment slip received. Check your <span className="text-[#1434CB] font-semibold">Inbox</span> for the supplier payment receipt.</p>
            </div>
            <motion.div className="w-2 h-2 rounded-full bg-[#1434CB] shrink-0 mt-1" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className={`w-full max-w-xs flex gap-2.5 items-start rounded-xl px-4 py-3 ${isCnp ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}
      >
        {isCnp
          ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
          : <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
        }
        <p className={`text-xs leading-snug ${isCnp ? 'text-emerald-800' : 'text-amber-800'}`}>
          {isCnp
            ? <><span className="font-semibold">Funds transferred.</span> This payment was processed automatically via Visa STP. No further action required.</>
            : <><span className="font-semibold">Next step:</span> The supplier must share the payment receipt. Upload it in <Link href="/reconciliation" className="underline font-semibold hover:text-amber-900">Reconciliation</Link> to close out this transaction.</>
          }
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} className="flex gap-3">
        <Link href="/dashboard" className="px-5 py-2.5 bg-[#1434CB] hover:bg-[#0F27B0] text-white text-sm font-semibold rounded-xl transition-colors">
          Dashboard
        </Link>
        {!isCnp && (
          <Link href="/notifications" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
            <Mail size={14} />
            Check Inbox
          </Link>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function PaymentCheckoutPage({ params }: { params: Promise<{ rfpId: string }> }) {
  const t = useT();
  const { rfpId } = use(params);
  const { rfps, suppliers, updateRFP } = useProcurement();
  const { transactions, addTransaction, addNotification, setVisaPaymentId } = usePayment();

  const rfp    = rfps.find((r) => r.id === rfpId);
  const winner = rfp ? suppliers.find((s) => s.id === rfp.selectedWinnerId) : undefined;

  const bidAmount = useMemo(() => {
    if (!rfp) return 0;
    if (rfp.evaluationResults?.length) {
      const w = rfp.evaluationResults.find((sb) => sb.supplier.id === rfp.selectedWinnerId);
      return w?.bid.amount ?? 0;
    }
    return rfp.bids.find((b) => b.supplierId === rfp.selectedWinnerId)?.amount ?? 0;
  }, [rfp]);

  const balances = useMemo(() => {
    const settled = transactions.filter((t) => t.status === 'Settled');
    return {
      usd:  10_000_000 - settled.filter((t) => t.method === 'USD').reduce((s, t) => s + t.amount, 0),
      usdc: 500_000    - settled.filter((t) => t.method === 'USDC').reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions]);

  /**
   * A VCN issued against a supplier is scoped to that supplier — the card exists
   * to pay *them*, and its spend controls were written for that relationship.
   * Offering it for an award to a different vendor is wrong, so only the winning
   * supplier's own cards are selectable here.
   *
   * Cards with no vendor linkage (mission cards) are never attached to a supplier
   * in the first place, so this filter does not touch them.
   */
  const allCards = useMemo<SelectableCard[]>(() => {
    const awarded = winner ? suppliers.find((s) => s.id === winner.id) : undefined;
    if (!awarded) return [];
    return (awarded.cards ?? [])
      .filter((c) => c.status === 'active' && c.brand === 'Visa')
      .map((c) => ({ ...c, supplierName: awarded.name }));
  }, [suppliers, winner]);

  const [step, setStep]               = useState<Step>('card-select');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [fundMethod, setFundMethod]   = useState<FundMethod | null>(null);
  const [usdSubMethod, setUsdSubMethod] = useState<'cnp' | 'card-present' | null>(null);
  // CyberSource refuses a clientReferenceInformation.code it has already seen in
  // the last 15 minutes, so a retry after a decline needs a fresh order id.
  const [orderId, setOrderId]         = useState(() => 'ORD-' + uuidv4().slice(0, 8).toUpperCase());
  const [visaPaymentId, setLocalVisaPaymentId] = useState<string | null>(null);
  // Real CyberSource result — BIP (card-not-present) path only.
  const [cybsPayment, setCybsPayment] = useState<CardPaymentSuccess | null>(null);

  const selectedCard = allCards.find((c) => c.id === selectedCardId) ?? null;
  const paymentMethod: PaymentMethod  = fundMethod ?? 'USD';

  // Level II/III for this award, derived from the controls set on /cards when
  // the VCN was issued. Built once so the preview, the payment and the receipt
  // are guaranteed to show the same thing.
  const enhancedData = useMemo(() => enhancedFromCard({
    card: selectedCard,
    rfp,
    supplierName: winner?.name,
    amount: bidAmount,
    orderId,
  }), [selectedCard, rfp, winner, bidAmount, orderId]);

  const handleComplete = useCallback((data: SettlementCompleteData) => {
    if (!rfp || !winner) return;
    // On the BIP path the ledger carries the CyberSource handles instead of a
    // synthetic id: capture id as the transaction, authorization id alongside.
    const txId = cybsPayment?.captureId ?? 'tx-' + uuidv4().slice(0, 8);
    addTransaction({
      id: txId, rfpId: rfp.id, supplierId: winner.id, supplierName: winner.name,
      amount: bidAmount, method: paymentMethod, status: 'Settled' as const,
      txHash: cybsPayment?.authorizationId ?? data.txHash, orderId,
      authorizationId: cybsPayment?.authorizationId,
      captureId: cybsPayment?.captureId,
      approvalCode: cybsPayment?.approvalCode,
      review: cybsPayment?.review,
      enhanced: cybsPayment?.enhanced,
      createdAt: data.startedAt || new Date().toISOString(),
      settledAt: new Date().toISOString(),
    });
    addNotification({
      id: 'notif-' + uuidv4().slice(0, 8), type: 'payment',
      title: usdSubMethod === 'cnp' ? 'Payment Executed' : `${paymentMethod} Payment Settled`,
      message: `$${bidAmount.toLocaleString()} to ${winner.name}`,
      timestamp: new Date().toISOString(), read: false,
      transactionId: txId, txHash: data.txHash,
      cardLast4: selectedCard?.last4,
      cardExpiry: selectedCard ? (() => { const now = new Date(); return `${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getFullYear()+3).slice(-2)}`; })() : undefined,
      cardHolder: selectedCard?.holderName,
      cardBrand: selectedCard?.brand,
      orderId,
      amount: bidAmount,
      supplierName: winner.name,
      fundMethod: paymentMethod,
      paymentStatus: 'settled',
      paymentMode: paymentMethod === 'USD' ? (usdSubMethod ?? undefined) : undefined,
    });
    updateRFP(rfp.id, { status: 'Paid' });
    setStep('done');
  }, [rfp, winner, paymentMethod, bidAmount, orderId, cybsPayment, addTransaction, addNotification, updateRFP]);

  const { state, start } = useSettlement(handleComplete);

  const handleStart = useCallback(async (method: 'USD' | 'USDC' | 'Card', oid: string) => {
    const isCnp = method === 'USD' && usdSubMethod === 'cnp';
    const clientId = 'B2BWS_1_1_9999';
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Call Visa B2B payment service — VPA onboarding first, then BIP or SIP
    try {
      if (winner) {
        // VPA: onboard buyer + register supplier before payment
        const buyer = await vpaService.Buyer.createBuyer({
          clientId,
          buyerName: 'Gov Procurement Agency',
          currencyCode: '840',
        });
        await vpaService.FundingAccount.addFundingAccount({
          clientId,
          buyerId: buyer.buyerId,
          accountNumber: '4111111111111111',
        });
        const pool = await vpaService.ProxyPool.createProxyPool({
          clientId,
          proxyPoolId: `POOL-PAY-${buyer.buyerId}`,
          size: 10,
        });
        const registeredSupplier = await vpaService.Supplier.createSupplier({
          clientId,
          supplierName: winner.name,
          accountNumber: winner.walletAddress ?? '4111111111110000',
        });
        void pool; // used implicitly via proxyPoolId below

        if (isCnp) {
          // BIP — buyer provisions virtual card and pushes it to supplier
          const payment = await b2bService.BIP.initiate({
            messageId: uuidv4(),
            clientId,
            buyerId: buyer.buyerId,
            supplierId: registeredSupplier.supplierId,
            paymentAmount: bidAmount,
            currencyCode: '840',
            memo: `Award payment: ${rfp?.title ?? oid}`,
          });
          setLocalVisaPaymentId(payment.paymentId);
          setVisaPaymentId(payment.paymentId);
        } else {
          // SIP — supplier submits invoice, buyer approves
          const req = await b2bService.SIP.submitRequest({
            messageId: uuidv4(),
            clientId,
            supplierId: registeredSupplier.supplierId,
            buyerId: buyer.buyerId,
            requestedAmount: bidAmount,
            currencyCode: '840',
            startDate: today,
            endDate: nextMonth,
          });
          const result = await b2bService.SIP.approve({
            messageId: uuidv4(),
            clientId,
            buyerId: buyer.buyerId,
            requisitionId: req.requisitionId,
            approvedAmount: bidAmount,
            currencyCode: '840',
          });
          setLocalVisaPaymentId(result.paymentId);
          setVisaPaymentId(result.paymentId);
        }
      }
    } catch {
      // Non-blocking — B2B SDK failure does not interrupt the UI settlement flow
    }

    // BIP moves money on the card rails, so this leg is a real CyberSource
    // authorize + capture. Unlike the B2B SDK calls above it is *blocking*: a
    // declined charge must not animate through to "Payment Executed".
    if (isCnp) {
      // The card's own controls answer first — no point authorizing a charge the
      // VCN was never scoped to carry.
      const violation = cardControlViolation(selectedCard, bidAmount);
      if (violation) {
        toast.error(violation, { icon: '⛔' });
        setStep('fund-select');
        return;
      }


      const result = await payWithCard({
        amount: bidAmount,
        brand: 'Visa',
        reference: oid,
        // Level II / Level III built from what was set when this VCN was issued.
        enhanced: enhancedData,
      });

      if (!result.ok) {
        toast.error(`Payment declined — ${result.reason}`, { icon: '⛔' });
        setOrderId('ORD-' + uuidv4().slice(0, 8).toUpperCase());
        setStep('fund-select');
        return;
      }

      setCybsPayment(result);
    }

    if (winner && !isCnp) {
      addNotification({
        id: 'notif-pending-' + uuidv4().slice(0, 8),
        type: 'payment',
        title: `Payment Authorization Sent`,
        message: `Card details sent to ${winner.name} — awaiting processing`,
        timestamp: new Date().toISOString(),
        read: false,
        cardLast4: selectedCard?.last4,
        cardExpiry: selectedCard?.expiry,
        cardHolder: selectedCard?.holderName,
        cardBrand: selectedCard?.brand,
        orderId: oid,
        amount: bidAmount,
        supplierName: winner.name,
        fundMethod: method,
        paymentStatus: 'pending',
        paymentMode: 'card-present',
      });
    }
    const mode = method === 'USD' ? (usdSubMethod ?? undefined) : undefined;
    start(method, oid, mode);
  }, [winner, selectedCard, bidAmount, usdSubMethod, rfp, enhancedData, addNotification, setVisaPaymentId, start]);

  const slideProps = {
    initial:    { opacity: 0, x: 24 },
    animate:    { opacity: 1, x: 0  },
    exit:       { opacity: 0, x: -24 },
    transition: { duration: 0.25, ease: 'easeOut' },
  };

  if (!rfp || (rfp.status !== 'Awarded' && rfp.status !== 'Paid')) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Link href="/rfp" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft size={16} /> Back to RFPs
        </Link>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm font-semibold text-slate-900">Payment not available</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Link href={`/rfp/${rfpId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
        <ArrowLeft size={16} /> Back to RFP
      </Link>
      <h1 className="text-xl font-semibold text-slate-900">{t('page.checkout.title')}</h1>
      <p className="text-sm text-slate-500 mb-6">{rfp.title} · <span className="font-semibold text-slate-700">${bidAmount.toLocaleString()}</span> → {winner?.name}</p>

      {step !== 'done' && <StepDots current={step} />}

      <AnimatePresence mode="wait">

        {/* ── Step 1: Card Selection ── */}
        {step === 'card-select' && (
          <motion.div key="card-select" {...slideProps} className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">Select a payment card</p>
            {allCards.length === 0 ? (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
                <CreditCard size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  No card issued to <span className="font-semibold text-slate-700">{winner?.name ?? 'this supplier'}</span>.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  A virtual card can only pay the supplier it was issued against.
                </p>
                <Link href="/cards" className="text-xs text-[#1434CB] font-medium mt-2 inline-block">
                  Issue a card for {winner?.name ?? 'this supplier'} →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {allCards.map((card) => {
                  const sel = card.id === selectedCardId;
                  return (
                    <motion.button
                      key={card.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all ${
                        sel ? 'border-[#1434CB] bg-[#EEF1FD] shadow-sm' : 'border-slate-200 bg-white hover:border-[#A5B8F3]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${BRAND_DOT[card.brand]}`}>
                        <span className="text-[9px] font-black text-white">{BRAND_LABEL[card.brand]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800">{card.brand} •••• {card.last4}</p>
                          {card.usageType && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${card.usageType === 'single-use' ? 'bg-[#EEF1FD] text-[#1434CB]' : 'bg-violet-50 text-violet-600'}`}>
                              {card.usageType === 'single-use' ? 'Single-Use VCN' : 'Multi-Use VCN'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{card.type.charAt(0).toUpperCase() + card.type.slice(1)} · {card.supplierName}</p>
                      </div>
                      <p className="text-xs text-slate-500 hidden sm:block">{card.supplierName}</p>
                      {sel && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                          <CheckCircle2 size={18} className="text-[#1434CB]" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep('card-confirm')}
                disabled={!selectedCardId}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1434CB] hover:bg-[#0F27B0] text-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Card Confirmation ── */}
        {step === 'card-confirm' && selectedCard && (
          <motion.div key="card-confirm" {...slideProps} className="space-y-6 max-w-sm mx-auto">
            <p className="text-sm font-semibold text-slate-700 text-center">Confirm card selection</p>
            <CardVisual card={selectedCard} />
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2.5">
              {[
                ...(selectedCard.usageType ? [{ label: 'VCN Type', value: selectedCard.usageType === 'single-use' ? 'Single-Use VCN' : 'Multi-Use VCN' }] : []),
                { label: 'Network',     value: selectedCard.brand },
                { label: 'Card Number', value: `•••• •••• •••• ${selectedCard.last4}` },
                { label: 'Card Holder', value: selectedCard.holderName },
                { label: 'Type',        value: selectedCard.type.charAt(0).toUpperCase() + selectedCard.type.slice(1) },
                { label: 'Assigned to', value: selectedCard.supplierName },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-semibold text-slate-800 font-mono">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('card-select')} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Change Card
              </button>
              <button onClick={() => setStep('fund-select')} className="flex-1 py-2.5 rounded-xl bg-[#1434CB] hover:bg-[#0F27B0] text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2">
                Use This Card <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Funding Mechanism ── */}
        {step === 'fund-select' && (
          <motion.div key="fund-select" {...slideProps} className="space-y-5 max-w-sm mx-auto">
            <p className="text-sm font-semibold text-slate-700 text-center">Choose funding source</p>

            <div className="space-y-3">
              {([
                { m: 'USD'  as FundMethod, label: 'Pay with USD',  sub: `Balance: $${balances.usd.toLocaleString()}`,  Icon: DollarSign, color: 'indigo' },
                { m: 'USDC' as FundMethod, label: 'Pay with USDC', sub: `Balance: $${balances.usdc.toLocaleString()}`, Icon: Coins,       color: 'purple' },
              ] as const).map(({ m, label, sub, Icon, color }) => {
                const sel = fundMethod === m;
                return (
                  <motion.button
                    key={m}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setFundMethod(m); if (m !== 'USD') setUsdSubMethod(null); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all ${
                      sel
                        ? `border-${color}-400 bg-${color}-50 shadow-sm`
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sel ? `bg-${color}-600` : 'bg-slate-100'}`}>
                      <Icon size={18} className={sel ? 'text-white' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${sel ? `text-${color}-900` : 'text-slate-800'}`}>{label}</p>
                      <p className={`text-xs ${sel ? `text-${color}-500` : 'text-slate-400'}`}>{sub}</p>
                    </div>
                    {sel && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                        <CheckCircle2 size={18} className={`text-${color}-500`} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* USD sub-method picker */}
            <AnimatePresence>
              {fundMethod === 'USD' && (
                <motion.div
                  key="usd-sub"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Processing mode</p>
                    {([
                      {
                        id: 'cnp' as const,
                        label: 'Buyer Initiated Transaction',
                        sub: 'Buyer provisions virtual card and pushes to supplier (BIP)',
                        // BIP settles on the card rails, so it carries the processor mark.
                        rail: 'cybs' as const,
                      },
                      {
                        id: 'card-present' as const,
                        label: 'Supplier Initiated Payments',
                        sub: 'Supplier submits invoice, buyer approves (SIP)',
                        rail: 'invoice' as const,
                      },
                    ]).map(({ id, label, sub, rail }) => {
                      const sel = usdSubMethod === id;
                      return (
                        <motion.button
                          key={id}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setUsdSubMethod(id)}
                          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all ${
                            sel
                              ? 'border-[#1434CB] bg-[#EEF1FD] shadow-sm'
                              : 'border-slate-200 bg-white hover:border-[#A5B8F3] hover:bg-slate-50'
                          }`}
                        >
                          {/* The rail that processes this mode, named on the left */}
                          {rail === 'cybs' ? (
                            <CyberSourceBadge className="shrink-0" />
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold tracking-wide whitespace-nowrap shrink-0 text-slate-500 bg-slate-100 border border-slate-200">
                              <Receipt size={10} />
                              Invoice
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${sel ? 'text-indigo-900' : 'text-slate-800'}`}>{label}</p>
                            <p className={`text-xs mt-0.5 ${sel ? 'text-[#1434CB]' : 'text-slate-400'}`}>{sub}</p>
                          </div>
                          {sel && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                              <CheckCircle2 size={18} className="text-[#1434CB] shrink-0" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Level II/III preview — BIP carries it, SIP does not */}
            <AnimatePresence>
              {fundMethod === 'USD' && usdSubMethod === 'cnp' && (
                <motion.div key="enhanced-preview"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden">
                  <EnhancedDataPanel data={enhancedData} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Order summary */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="font-bold text-slate-900">${bidAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Card</span><span className="font-mono text-slate-700">•••• {selectedCard?.last4}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Recipient</span><span className="text-slate-700">{winner?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Order</span><span className="font-mono text-slate-500 text-xs">{orderId}</span></div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('card-confirm')} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Back
              </button>
              <button
                onClick={async () => {
                  // Native biometric (Touch ID / Windows Hello). Payment only
                  // proceeds once the user actually authenticates.
                  const ok = await authenticateWithBiometrics(`Payment · $${bidAmount.toLocaleString()}`);
                  if (ok) { setStep('processing'); handleStart(paymentMethod, orderId); }
                }}
                disabled={!fundMethod || (fundMethod === 'USD' && !usdSubMethod)}
                className="flex-1 py-2.5 rounded-xl bg-[#1434CB] hover:bg-[#0F27B0] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
              >
                Authenticate <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 5: Processing ── */}
        {step === 'processing' && (
          <motion.div key="processing" {...slideProps} className="space-y-6">
            <SettlementAnimation state={state} method={paymentMethod} />
            {!state.currentStep.includes('settled') && (
              <div className="flex items-center justify-center gap-2">
                <motion.div className="w-2 h-2 rounded-full bg-[#1434CB]" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                <span className="text-sm text-slate-500">Processing payment…</span>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Done ── */}
        {step === 'done' && (
          <DoneStep
            bidAmount={bidAmount}
            fundMethod={fundMethod}
            selectedCard={selectedCard}
            winner={winner}
            orderId={orderId}
            isCnp={usdSubMethod === 'cnp'}
            visaPaymentId={visaPaymentId}
            cybs={cybsPayment}
            enhanced={enhancedData}
          />
        )}

      </AnimatePresence>
    </motion.div>
  );
}
