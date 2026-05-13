'use client';

import { motion } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { ArrowRight, CreditCard, Building2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function VisaWordmark() {
  return (
    <svg viewBox="0 0 71 23" fill="none" aria-label="Visa" style={{ height: 9, width: 'auto' }}>
      <path
        fill="#1434CB"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"
      />
    </svg>
  );
}

export default function PaymentPage() {
  const { rfps, suppliers } = useProcurement();
  const awardedRfps = rfps.filter((r) => r.status === 'Awarded');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#000000' }}>Payments</h1>
          <p className="mt-0.5 text-sm" style={{ color: '#4a4a4a' }}>
            Awarded contracts pending disbursement.
          </p>
        </div>
        {awardedRfps.length > 0 && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: '#F5F5F5', color: '#4a4a4a' }}
          >
            {awardedRfps.length} pending
          </span>
        )}
      </div>

      {/* ── Empty state ── */}
      {awardedRfps.length === 0 ? (
        <div
          className="bg-white rounded-2xl p-12 text-center"
          style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: '#EEF2FF' }}
          >
            <CreditCard size={20} style={{ color: '#1434CB' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: '#000000' }}>No pending payments</p>
          <p className="mt-1 text-xs" style={{ color: '#4a4a4a' }}>
            Award a supplier on an RFP to proceed with payment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {awardedRfps.map((rfp, i) => {
            const winner    = suppliers.find((s) => s.id === rfp.selectedWinnerId);
            const bidAmount = (() => {
              if (rfp.evaluationResults?.length) {
                return rfp.evaluationResults.find(
                  (sb) => sb.supplier.id === rfp.selectedWinnerId
                )?.bid.amount ?? 0;
              }
              return rfp.bids.find((b) => b.supplierId === rfp.selectedWinnerId)?.amount ?? 0;
            })();

            return (
              <motion.div
                key={rfp.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05, ease: 'easeOut' }}
                className="relative bg-white rounded-2xl overflow-hidden group"
                style={{
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 15px -1px rgba(0,0,0,0.09), 0 4px 2px -2px rgba(0,0,0,0.05)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(20,52,203,0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.05)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.08)';
                }}
              >
                {/* Visa blue top accent bar (appears on hover) */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ background: '#1434CB' }}
                />

                <div className="px-6 py-5 flex items-center gap-6">

                  {/* ── Icon ── */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: '#EEF2FF' }}
                  >
                    <Building2 size={16} style={{ color: '#1434CB' }} />
                  </div>

                  {/* ── Left: RFP title + supplier ── */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate" style={{ color: '#000000' }}>
                      {rfp.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[12px]" style={{ color: '#4a4a4a' }}>
                        Awarded to{' '}
                        <span className="font-medium" style={{ color: '#000000' }}>
                          {winner?.name ?? 'Unknown'}
                        </span>
                      </span>
                      <span style={{ color: 'rgba(0,0,0,0.2)', fontSize: 12 }}>·</span>
                      {/* Awarded status pill */}
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold"
                        style={{ color: '#2C6849' }}
                      >
                        <CheckCircle2 size={11} />
                        Awarded
                      </span>
                    </div>
                  </div>

                  {/* ── Center: Amount + Visa badge ── */}
                  <div className="shrink-0 text-right hidden sm:block">
                    <p className="text-xl font-bold tabular-nums" style={{ color: '#000000' }}>
                      ${bidAmount.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                        style={{ background: '#EEF2FF', color: '#1434CB', border: '1px solid rgba(20,52,203,0.15)' }}
                      >
                        <VisaWordmark />
                        Network
                      </span>
                    </div>
                  </div>

                  {/* ── Divider ── */}
                  <div className="h-10 w-px shrink-0 hidden sm:block" style={{ background: 'rgba(0,0,0,0.07)' }} />

                  {/* ── CTA ── */}
                  <Link
                    href={`/payment/${rfp.id}`}
                    className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150"
                    style={{ background: '#1434CB', color: '#ffffff' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#173be8'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#1434CB'; }}
                  >
                    Proceed to Payment
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
