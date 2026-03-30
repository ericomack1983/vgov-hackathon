'use client';

import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ArrowLeft, Shield, Wallet, TrendingUp, Clock, CreditCard } from 'lucide-react';
import type { Supplier, PaymentCard } from '@/lib/mock-data/types';

const BRAND_COLORS: Record<PaymentCard['brand'], { bg: string; text: string; label: string }> = {
  Visa:       { bg: 'bg-[#1434CB]',  text: 'text-white', label: 'VISA' },
  Mastercard: { bg: 'bg-[#EB001B]',  text: 'text-white', label: 'MC'   },
  Amex:       { bg: 'bg-[#007BC1]',  text: 'text-white', label: 'AMEX' },
};

const complianceVariant: Record<Supplier['complianceStatus'], 'success' | 'warning' | 'error'> = {
  Compliant: 'success',
  'Pending Review': 'warning',
  'Non-Compliant': 'error',
};

export default function SupplierProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { suppliers } = useProcurement();
  const supplier = suppliers.find((s) => s.id === id);

  if (!supplier) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="mt-8 bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-slate-900">Supplier not found</p>
          <p className="mt-2 text-sm text-slate-500">
            The supplier you are looking for does not exist.
          </p>
          <Link
            href="/suppliers"
            className="mt-4 inline-flex items-center gap-1 text-sm text-[#1434CB] hover:text-indigo-700"
          >
            <ArrowLeft size={16} />
            Back to Suppliers
          </Link>
        </div>
      </motion.div>
    );
  }

  const pricingMin = Math.min(...supplier.pricingHistory);
  const pricingMax = Math.max(...supplier.pricingHistory);
  const pricingRange = pricingMax - pricingMin || 1;

  const sparklinePoints = supplier.pricingHistory
    .map((val, i) => {
      const x = i * (200 / (supplier.pricingHistory.length - 1));
      const y = 50 - ((val - pricingMin) / pricingRange) * 40 - 5;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Link
        href="/suppliers"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft size={16} />
        Back to Suppliers
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{supplier.name}</h1>
            <div className="mt-2">
              <StatusBadge
                status={supplier.complianceStatus}
                variant={complianceVariant[supplier.complianceStatus]}
              />
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-slate-900">{supplier.rating}</span>
            <span className="text-lg text-slate-400">/100</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <TrendingUp size={20} className="text-emerald-500" />
          <p className="mt-2 text-xs text-slate-500">Past Performance</p>
          <p className="text-xl font-semibold text-slate-900">{supplier.pastPerformance}/100</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Clock size={20} className="text-[#1434CB]" />
          <p className="mt-2 text-xs text-slate-500">Avg Delivery</p>
          <p className="text-xl font-semibold text-slate-900">{supplier.deliveryAvgDays} days</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Shield size={20} className="text-amber-500" />
          <p className="mt-2 text-xs text-slate-500">Risk Score</p>
          <p className="text-xl font-semibold text-slate-900">{supplier.riskScore}/100</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Wallet size={20} className="text-slate-500" />
          <p className="mt-2 text-xs text-slate-500">Wallet Address</p>
          <p className="text-xl font-semibold text-slate-900">
            {supplier.walletAddress.substring(0, 6)}...
            {supplier.walletAddress.substring(supplier.walletAddress.length - 4)}
          </p>
        </div>
      </div>

      {/* Certifications */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Certifications</h2>
        {supplier.certifications.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No certifications</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {supplier.certifications.map((cert) => (
              <span
                key={cert}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EEF1FD] text-indigo-700"
              >
                {cert}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Pricing History */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Pricing History</h2>
        <div className="mt-3">
          <svg viewBox="0 0 200 50" width={200} height={50}>
            <polyline
              points={sparklinePoints}
              stroke="rgb(79 70 229)"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <p className="mt-1 text-xs text-slate-500">
            ${pricingMin.toLocaleString()} - ${pricingMax.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Registered Payment Cards */}
      {supplier.cards && supplier.cards.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Registered Cards</h2>
            <span className="ml-auto text-xs text-slate-400">{supplier.cards.length} card{supplier.cards.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplier.cards.map((card) => {
              const brand = BRAND_COLORS[card.brand];
              return (
                <div
                  key={card.id}
                  className={`relative rounded-2xl p-5 flex flex-col gap-4 overflow-hidden ${brand.bg} ${
                    card.status === 'inactive' ? 'opacity-50' : ''
                  }`}
                >
                  {/* Decorative circles */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-8 -right-2 w-32 h-32 rounded-full bg-white/5" />

                  {/* Top row: brand + status */}
                  <div className="flex items-center justify-between relative z-10">
                    <span className={`text-xs font-black tracking-widest ${brand.text}`}>
                      {brand.label}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      card.status === 'active'
                        ? 'bg-white/20 text-white'
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {card.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Card number */}
                  <p className={`font-mono text-base tracking-[0.2em] relative z-10 ${brand.text}`}>
                    •••• •••• •••• {card.last4}
                  </p>

                  {/* Bottom row: holder + expiry + type */}
                  <div className="flex items-end justify-between relative z-10">
                    <div>
                      <p className="text-[10px] text-white/60 uppercase tracking-wider">Card Holder</p>
                      <p className={`text-xs font-semibold truncate max-w-[120px] ${brand.text}`}>
                        {card.holderName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/60 uppercase tracking-wider">Expires</p>
                      <p className={`text-xs font-semibold ${brand.text}`}>{card.expiry}</p>
                    </div>
                  </div>

                  {/* Type badge */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                      {card.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
