'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal, CheckCircle2, Loader2, Wifi } from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import { SupplierCard } from '@/components/procurement/SupplierCard';
import type { Supplier } from '@/lib/mock-data/types';

// ── Visa API loader overlay ───────────────────────────────────────────────────
const API_STEPS = [
  { label: 'Connecting to Visa API endpoint…',                          delay: 0    },
  { label: 'Calling Visa Supplier Matching Service…',                   delay: 600  },
  { label: 'Identifying Visa Commercial Payment Product acceptance…',   delay: 1300 },
  { label: 'Fetching Merchant Category Codes (MCC)…',                  delay: 1900 },
  { label: 'Verifying Visa Network eligibility for each supplier…',     delay: 2500 },
];
const DONE_DELAY  = 3200;
const CLOSE_DELAY = 3900;

function VisaApiLoader({ supplierCount }: { supplierCount: number }) {
  const [activeStep, setActiveStep] = useState(-1);
  const [done, setDone]             = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    API_STEPS.forEach((s, i) => {
      timers.push(setTimeout(() => setActiveStep(i), s.delay));
    });
    timers.push(setTimeout(() => setDone(true), DONE_DELAY));
    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = done
    ? 100
    : activeStep < 0
      ? 0
      : Math.round(((activeStep + 1) / API_STEPS.length) * 90);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#1434CB] px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
            <Wifi size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Visa Supplier Matching Service</p>
            <p className="text-white/60 text-[11px] mt-0.5">Visa API · Commercial Payment Products</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {!done && <Loader2 size={14} className="text-white/70 animate-spin" />}
            <span className={`text-xs font-bold ${done ? 'text-emerald-300' : 'text-white/60'}`}>
              {done ? 'COMPLETE' : 'LIVE'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <motion.div
            className="h-full bg-[#1434CB]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Steps */}
        <div className="px-6 py-5 space-y-3">
          {API_STEPS.map((step, i) => {
            const isActive   = i === activeStep && !done;
            const isComplete = i < activeStep || done;
            const isPending  = i > activeStep && !done;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  {isComplete ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : isActive ? (
                    <Loader2 size={14} className="text-[#1434CB] animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200" />
                  )}
                </div>
                <span className={`text-xs leading-snug ${
                  isComplete ? 'text-slate-500 line-through decoration-slate-300' :
                  isActive   ? 'text-slate-900 font-semibold' :
                               'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Result banner */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mx-6 mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    {supplierCount} suppliers matched
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    All suppliers verified on the Visa Network
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

type ComplianceFilter = 'All' | Supplier['complianceStatus'];
type SortKey = 'rating-desc' | 'rating-asc' | 'delivery-asc' | 'risk-asc';

const COMPLIANCE_OPTIONS: ComplianceFilter[] = ['All', 'Compliant', 'Pending Review', 'Non-Compliant'];

const COMPLIANCE_STYLES: Record<ComplianceFilter, string> = {
  All:             'bg-slate-100 text-slate-600 hover:bg-slate-200',
  Compliant:       'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  'Pending Review':'bg-amber-50 text-amber-700 hover:bg-amber-100',
  'Non-Compliant': 'bg-red-50 text-red-700 hover:bg-red-100',
};

const COMPLIANCE_ACTIVE: Record<ComplianceFilter, string> = {
  All:             'bg-slate-800 text-white',
  Compliant:       'bg-emerald-600 text-white',
  'Pending Review':'bg-amber-500 text-white',
  'Non-Compliant': 'bg-red-600 text-white',
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'rating-desc',  label: 'Rating: High → Low' },
  { value: 'rating-asc',   label: 'Rating: Low → High' },
  { value: 'delivery-asc', label: 'Fastest Delivery' },
  { value: 'risk-asc',     label: 'Lowest Risk' },
];

function sortSuppliers(list: Supplier[], sort: SortKey): Supplier[] {
  return [...list].sort((a, b) => {
    switch (sort) {
      case 'rating-desc':  return b.rating - a.rating;
      case 'rating-asc':   return a.rating - b.rating;
      case 'delivery-asc': return a.deliveryAvgDays - b.deliveryAvgDays;
      case 'risk-asc':     return a.riskScore - b.riskScore;
    }
  });
}

export default function SuppliersPage() {
  const { suppliers } = useProcurement();

  const [query, setQuery]       = useState('');
  const [compliance, setCompliance] = useState<ComplianceFilter>('All');
  const [sort, setSort]         = useState<SortKey>('rating-desc');
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowLoader(false), CLOSE_DELAY);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let list = suppliers;

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }

    if (compliance !== 'All') {
      list = list.filter((s) => s.complianceStatus === compliance);
    }

    return sortSuppliers(list, sort);
  }, [suppliers, query, compliance, sort]);

  const hasActiveFilter = query.trim() !== '' || compliance !== 'All' || sort !== 'rating-desc';

  function clearFilters() {
    setQuery('');
    setCompliance('All');
    setSort('rating-desc');
  }

  return (
    <>
    <AnimatePresence>
      {showLoader && <VisaApiLoader supplierCount={suppliers.length} />}
    </AnimatePresence>
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Supplier Registry</h1>
          <p className="mt-1 text-sm text-slate-500">Browse and manage registered suppliers.</p>
        </div>
        <span className="text-xs text-slate-400 mt-1 font-medium">
          {filtered.length} of {suppliers.length}
        </span>
      </div>

      {/* Search + Sort bar */}
      <div className="mt-5 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suppliers…"
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 placeholder:text-slate-400 transition"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="pl-8 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none cursor-pointer text-slate-700 font-medium transition"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Compliance filter pills */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {COMPLIANCE_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setCompliance(opt)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              compliance === opt ? COMPLIANCE_ACTIVE[opt] : COMPLIANCE_STYLES[opt]
            }`}
          >
            {opt}
          </button>
        ))}

        <AnimatePresence>
          {hasActiveFilter && (
            <motion.button
              key="clear"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition"
            >
              <X size={11} />
              Clear
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-10 bg-white rounded-xl border border-slate-200 p-10 text-center"
        >
          <p className="text-sm font-semibold text-slate-800">No suppliers match your filters</p>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your search or clearing the filters.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
          >
            Clear all filters
          </button>
        </motion.div>
      ) : (
        <motion.div layout className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((supplier) => (
              <motion.div
                key={supplier.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <SupplierCard supplier={supplier} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
    </>
  );
}
