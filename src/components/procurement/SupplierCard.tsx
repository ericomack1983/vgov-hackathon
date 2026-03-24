'use client';

import Link from 'next/link';
import { Star, CreditCard } from 'lucide-react';
import type { Supplier } from '@/lib/mock-data/types';

const SUPPLIER_ICONS: Record<string, { bg: string; icon: React.ReactNode }> = {
  'sup-001': {
    bg: 'bg-blue-50',
    icon: (
      // Apex Federal Solutions — federal shield with star
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 3L4 7v7c0 6 4.5 10.5 10 12 5.5-1.5 10-6 10-12V7L14 3Z" fill="#1e40af" fillOpacity="0.15" stroke="#1e40af" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M14 9l1.2 2.5 2.8.4-2 1.9.5 2.7-2.5-1.3-2.5 1.3.5-2.7-2-1.9 2.8-.4L14 9Z" fill="#1e40af"/>
      </svg>
    ),
  },
  'sup-002': {
    bg: 'bg-green-50',
    icon: (
      // BudgetGov Supplies — scales of balance
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <line x1="14" y1="5" x2="14" y2="23" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="7" y1="8" x2="21" y2="8" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 8 L4 14 Q5.5 17 7 14 Q8.5 17 10 14 L7 8Z" fill="#15803d" fillOpacity="0.2" stroke="#15803d" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M21 8 L18 14 Q19.5 17 21 14 Q22.5 17 24 14 L21 8Z" fill="#15803d" fillOpacity="0.2" stroke="#15803d" strokeWidth="1.2" strokeLinejoin="round"/>
        <line x1="10" y1="23" x2="18" y2="23" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  'sup-003': {
    bg: 'bg-purple-50',
    icon: (
      // ClearPath Consulting — compass
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="9" stroke="#7e22ce" strokeWidth="1.5"/>
        <circle cx="14" cy="14" r="1.5" fill="#7e22ce"/>
        <polygon points="14,6 15.5,13 14,11.5 12.5,13" fill="#7e22ce"/>
        <polygon points="14,22 12.5,15 14,16.5 15.5,15" fill="#7e22ce" fillOpacity="0.4"/>
        <line x1="14" y1="5" x2="14" y2="7" stroke="#7e22ce" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="14" y1="21" x2="14" y2="23" stroke="#7e22ce" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5" y1="14" x2="7" y2="14" stroke="#7e22ce" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="21" y1="14" x2="23" y2="14" stroke="#7e22ce" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  'sup-004': {
    bg: 'bg-teal-50',
    icon: (
      // DataBridge Systems — bridge over data stream
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 17 Q9 10 14 17 Q19 10 24 17" stroke="#0f766e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <line x1="8" y1="11" x2="8" y2="19" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="14" y1="17" x2="14" y2="22" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="20" y1="11" x2="20" y2="19" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="19" x2="24" y2="19" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="6" y="22" width="4" height="2" rx="1" fill="#0f766e" fillOpacity="0.3"/>
        <rect x="12" y="22" width="4" height="2" rx="1" fill="#0f766e" fillOpacity="0.5"/>
        <rect x="18" y="22" width="4" height="2" rx="1" fill="#0f766e" fillOpacity="0.3"/>
      </svg>
    ),
  },
  'sup-005': {
    bg: 'bg-amber-50',
    icon: (
      // EliteGov Partners — crown
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M5 20 L6 11 L11 16 L14 7 L17 16 L22 11 L23 20 Z" fill="#b45309" fillOpacity="0.15" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="5" y1="22" x2="23" y2="22" stroke="#b45309" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="14" cy="7" r="1.5" fill="#b45309"/>
        <circle cx="6" cy="11" r="1.5" fill="#b45309"/>
        <circle cx="22" cy="11" r="1.5" fill="#b45309"/>
      </svg>
    ),
  },
  'sup-006': {
    bg: 'bg-orange-50',
    icon: (
      // FiscalPoint Inc — bar chart with upward trend
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="5" y="16" width="4" height="7" rx="1" fill="#c2410c" fillOpacity="0.3"/>
        <rect x="12" y="11" width="4" height="12" rx="1" fill="#c2410c" fillOpacity="0.6"/>
        <rect x="19" y="6" width="4" height="17" rx="1" fill="#c2410c"/>
        <line x1="4" y1="23" x2="24" y2="23" stroke="#c2410c" strokeWidth="1.5" strokeLinecap="round"/>
        <polyline points="6,18 13,13 20,8" stroke="#c2410c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="20" cy="8" r="2" fill="#c2410c"/>
      </svg>
    ),
  },
  'sup-007': {
    bg: 'bg-cyan-50',
    icon: (
      // GovTech Rapid — lightning bolt inside chip
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="6" y="6" width="16" height="16" rx="3" stroke="#0e7490" strokeWidth="1.5"/>
        <line x1="10" y1="4" x2="10" y2="6" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="14" y1="4" x2="14" y2="6" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18" y1="4" x2="18" y2="6" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="10" y1="22" x2="10" y2="24" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="14" y1="22" x2="14" y2="24" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18" y1="22" x2="18" y2="24" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="10" x2="6" y2="10" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="14" x2="6" y2="14" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="18" x2="6" y2="18" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="22" y1="10" x2="24" y2="10" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="22" y1="14" x2="24" y2="14" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="22" y1="18" x2="24" y2="18" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M15 9 L12 14.5 H14.5 L13 19 L17 12.5 H14.5 L16 9 Z" fill="#0e7490"/>
      </svg>
    ),
  },
  'sup-008': {
    bg: 'bg-red-50',
    icon: (
      // Harbor Defense Co — anchor
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="8" r="2.5" stroke="#b91c1c" strokeWidth="1.5"/>
        <line x1="14" y1="10.5" x2="14" y2="23" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="9" y1="14" x2="19" y2="14" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 23 Q9 19 14 19 Q19 19 19 23" stroke="#b91c1c" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="9" cy="23" r="1.5" fill="#b91c1c"/>
        <circle cx="19" cy="23" r="1.5" fill="#b91c1c"/>
      </svg>
    ),
  },
};

export function SupplierCard({ supplier }: { supplier: Supplier }) {
  const starRating = (supplier.rating / 20).toFixed(1);
  const supplierIcon = SUPPLIER_ICONS[supplier.id];

  return (
    <Link href={`/suppliers/${supplier.id}`} className="block h-full">
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
        {/* Top Section */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`${supplierIcon?.bg ?? 'bg-slate-50'} w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0`}>
            {supplierIcon?.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-[15px] font-semibold text-slate-900 leading-tight tracking-tight">
                  {supplier.name}
                </h3>
                <p className="text-slate-500 text-xs mt-1 leading-tight">
                  Global<br />Headquarters
                </p>
              </div>
              <div className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full text-sm shrink-0">
                {supplier.rating}/100
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 mb-6 flex-1">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Category</span>
            <span className="font-medium text-slate-700">Federal Supplies</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">MCC Code</span>
            <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md font-mono text-xs">5047</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Delivery</span>
            <span className="font-medium text-slate-700">{supplier.deliveryAvgDays} days</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Wallet</span>
            <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md font-mono text-xs">
              {supplier.walletAddress.substring(0, 6)}...{supplier.walletAddress.substring(supplier.walletAddress.length - 4)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Rating</span>
            <div className="flex items-center gap-1">
              <div className="flex text-amber-400">
                <Star size={14} className="fill-current" />
                <Star size={14} className="fill-current" />
                <Star size={14} className="fill-current" />
                <Star size={14} className="fill-current" />
                <Star size={14} className="fill-current opacity-50" />
              </div>
              <span className="font-semibold text-slate-800 ml-1">{starRating}</span>
            </div>
          </div>
        </div>

        {/* Certifications and Payment */}
        <div className="mb-6 flex flex-col gap-5">
          {/* Payment Methods */}
          <div>
            <h4 className="text-slate-400 text-sm mb-2.5">Payment Accepted</h4>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#1434CB]/10 text-[#1434CB] border border-[#1434CB]/20 px-3 py-1 rounded-lg text-xs font-bold leading-tight">
                <CreditCard size={14} className="stroke-[2.5]" />
                Visa Network
              </span>
            </div>
          </div>

          {/* Certifications - Only render if there are any */}
          {(supplier.certifications || []).length > 0 && (
            <div>
              <h4 className="text-slate-400 text-sm mb-2.5">Certifications</h4>
              <div className="flex flex-wrap gap-2">
                {supplier.certifications.map(cert => (
                  <span key={cert} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-semibold leading-tight">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-auto">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
            style={{ width: `${supplier.rating}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
