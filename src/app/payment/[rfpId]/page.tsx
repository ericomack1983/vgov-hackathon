'use client';

import { use, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { usePayment } from '@/context/PaymentContext';
import { useSettlement, SettlementCompleteData } from '@/hooks/useSettlement';
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector';
import { CheckoutSummary } from '@/components/payment/CheckoutSummary';
import { SettlementAnimation } from '@/components/payment/SettlementAnimation';
import { ComparisonPanel } from '@/components/payment/ComparisonPanel';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { PaymentMethod } from '@/lib/mock-data/types';

export default function PaymentCheckoutPage({ params }: { params: Promise<{ rfpId: string }> }) {
  const { rfpId } = use(params);
  const { rfps, suppliers, updateRFP } = useProcurement();
  const { addTransaction, addNotification } = usePayment();

  const rfp = rfps.find((r) => r.id === rfpId);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [orderId] = useState(() => 'ORD-' + uuidv4().slice(0, 8).toUpperCase());

  // Determine winning supplier and bid amount
  const winner = rfp
    ? suppliers.find((s) => s.id === rfp.selectedWinnerId)
    : undefined;

  const bidAmount = rfp
    ? (() => {
        if (rfp.evaluationResults && rfp.evaluationResults.length > 0) {
          const winnerResult = rfp.evaluationResults.find(
            (sb) => sb.supplier.id === rfp.selectedWinnerId
          );
          return winnerResult ? winnerResult.bid.amount : 0;
        }
        const winnerBid = rfp.bids.find((b) => b.supplierId === rfp.selectedWinnerId);
        return winnerBid ? winnerBid.amount : 0;
      })()
    : 0;

  const handleComplete = useCallback(
    (data: SettlementCompleteData) => {
      if (!rfp || !winner || !selectedMethod) return;

      const txId = 'tx-' + uuidv4().slice(0, 8);
      const tx = {
        id: txId,
        rfpId: rfp.id,
        supplierId: winner.id,
        supplierName: winner.name,
        amount: bidAmount,
        method: selectedMethod,
        status: 'Settled' as const,
        txHash: data.txHash,
        orderId,
        createdAt: data.startedAt || new Date().toISOString(),
        settledAt: new Date().toISOString(),
      };

      addTransaction(tx);

      addNotification({
        id: 'notif-' + uuidv4().slice(0, 8),
        type: 'payment',
        title: selectedMethod + ' Payment Settled',
        message: '$' + bidAmount.toLocaleString() + ' to ' + winner.name,
        timestamp: new Date().toISOString(),
        read: false,
        transactionId: tx.id,
        txHash: tx.txHash,
      });

      updateRFP(rfp.id, { status: 'Paid' });
    },
    [rfp, winner, selectedMethod, bidAmount, orderId, addTransaction, addNotification, updateRFP]
  );

  const { state, start, reset, isSettled, isActive } = useSettlement(handleComplete);

  if (!rfp || (rfp.status !== 'Awarded' && rfp.status !== 'Paid')) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Link
          href="/rfp"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to RFPs
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-slate-900">Payment not available</p>
          <p className="mt-2 text-sm text-slate-500">
            This RFP has not been awarded yet or does not exist.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div>
        <Link
          href={`/rfp/${rfpId}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to RFP
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Payment Checkout</h1>
        <p className="text-sm text-slate-500">{rfp.title}</p>
      </div>

      {/* Before settlement starts */}
      {state.currentStep === 'idle' && (
        <>
          <PaymentMethodSelector
            selected={selectedMethod}
            onSelect={setSelectedMethod}
            disabled={isActive}
          />
          <CheckoutSummary
            supplierName={winner?.name || 'Unknown'}
            amount={bidAmount}
            method={selectedMethod}
            orderId={orderId}
          />
          <button
            onClick={() => selectedMethod && start(selectedMethod, orderId)}
            disabled={!selectedMethod}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Payment
          </button>
        </>
      )}

      {/* During settlement */}
      {isActive && !isSettled && selectedMethod && (
        <div className="space-y-6">
          <SettlementAnimation state={state} method={selectedMethod} />
          <div className="flex items-center justify-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-indigo-600"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span className="text-sm text-slate-500">Processing...</span>
          </div>
        </div>
      )}

      {/* After settlement */}
      {isSettled && selectedMethod && (
        <div className="space-y-6">
          <SettlementAnimation state={state} method={selectedMethod} />

          <ComparisonPanel
            method={selectedMethod}
            settlementTime={selectedMethod === 'USD' ? '~6 seconds' : '~3 seconds'}
          />

          <div className="flex items-center justify-center gap-3 py-4">
            <CheckCircle size={28} className="text-emerald-500" />
            <span className="text-lg font-semibold text-emerald-600">Payment Complete</span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              View Dashboard
            </Link>
            <Link
              href="/rfp"
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Back to RFPs
            </Link>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                reset();
                setSelectedMethod(null);
              }}
              className="text-sm text-slate-500 hover:text-slate-700 underline transition-colors"
            >
              Start New Payment
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
