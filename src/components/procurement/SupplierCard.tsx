'use client';

import Link from 'next/link';
import { Star, CreditCard, MapPin } from 'lucide-react';
import type { Supplier } from '@/lib/mock-data/types';

const SUPPLIER_ICONS: Record<string, { bg: string; stroke: string; icon: React.ReactNode }> = {
  'sup-001': {
    bg: '#EEF2FF', stroke: '#1434CB',
    icon: (
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <path d="M14 3L4 7v7c0 6 4.5 10.5 10 12 5.5-1.5 10-6 10-12V7L14 3Z" fill="#1434CB" fillOpacity="0.15" stroke="#1434CB" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M14 9l1.2 2.5 2.8.4-2 1.9.5 2.7-2.5-1.3-2.5 1.3.5-2.7-2-1.9 2.8-.4L14 9Z" fill="#1434CB"/>
      </svg>
    ),
  },
  'sup-002': {
    bg: '#F0FDF4', stroke: '#2C6849',
    icon: (
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <line x1="14" y1="5" x2="14" y2="23" stroke="#2C6849" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="7" y1="8" x2="21" y2="8" stroke="#2C6849" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 8 L4 14 Q5.5 17 7 14 Q8.5 17 10 14 L7 8Z" fill="#2C6849" fillOpacity="0.2" stroke="#2C6849" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M21 8 L18 14 Q19.5 17 21 14 Q22.5 17 24 14 L21 8Z" fill="#2C6849" fillOpacity="0.2" stroke="#2C6849" strokeWidth="1.2" strokeLinejoin="round"/>
        <line x1="10" y1="23" x2="18" y2="23" stroke="#2C6849" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  'sup-003': {
    bg: '#F5F3FF', stroke: '#7e22ce',
    icon: (
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="9" stroke="#7e22ce" strokeWidth="1.5"/>
        <circle cx="14" cy="14" r="1.5" fill="#7e22ce"/>
        <polygon points="14,6 15.5,13 14,11.5 12.5,13" fill="#7e22ce"/>
        <polygon points="14,22 12.5,15 14,16.5 15.5,15" fill="#7e22ce" fillOpacity="0.4"/>
      </svg>
    ),
  },
  'sup-004': {
    bg: '#F0FDFA', stroke: '#0f766e',
    icon: (
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <path d="M4 17 Q9 10 14 17 Q19 10 24 17" stroke="#0f766e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <line x1="8" y1="11" x2="8" y2="19" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="14" y1="17" x2="14" y2="22" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="20" y1="11" x2="20" y2="19" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="19" x2="24" y2="19" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  'sup-005': {
    bg: '#FFFBEB', stroke: '#b45309',
    icon: (
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <path d="M5 20 L6 11 L11 16 L14 7 L17 16 L22 11 L23 20 Z" fill="#b45309" fillOpacity="0.15" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="5" y1="22" x2="23" y2="22" stroke="#b45309" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="14" cy="7" r="1.5" fill="#b45309"/>
      </svg>
    ),
  },
  'sup-006': {
    bg: '#FFF7ED', stroke: '#c2410c',
    icon: (
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <rect x="5" y="16" width="4" height="7" rx="1" fill="#c2410c" fillOpacity="0.3"/>
        <rect x="12" y="11" width="4" height="12" rx="1" fill="#c2410c" fillOpacity="0.6"/>
        <rect x="19" y="6" width="4" height="17" rx="1" fill="#c2410c"/>
        <line x1="4" y1="23" x2="24" y2="23" stroke="#c2410c" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  'sup-007': {
    bg: '#ECFEFF', stroke: '#0e7490',
    icon: (
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <rect x="6" y="6" width="16" height="16" rx="3" stroke="#0e7490" strokeWidth="1.5"/>
        <path d="M15 9 L12 14.5 H14.5 L13 19 L17 12.5 H14.5 L16 9 Z" fill="#0e7490"/>
      </svg>
    ),
  },
  'sup-008': {
    bg: '#FFF1F2', stroke: '#b91c1c',
    icon: (
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="8" r="2.5" stroke="#b91c1c" strokeWidth="1.5"/>
        <line x1="14" y1="10.5" x2="14" y2="23" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="9" y1="14" x2="19" y2="14" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 23 Q9 19 14 19 Q19 19 19 23" stroke="#b91c1c" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
};

const COMPLIANCE_BADGE: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  'Compliant':       { label: 'Compliant',       bg: '#d6f2c4', text: '#2C6849', dot: '#40996b' },
  'Pending Review':  { label: 'Pending Review',  bg: '#ffef99', text: '#875903', dot: '#c38004' },
  'Non-Compliant':   { label: 'Non-Compliant',   bg: '#ffd6e9', text: '#AD2929', dot: '#d65151' },
};

function StarRating({ value }: { value: number }) {
  const full  = Math.floor(value);
  const half  = value - full >= 0.3;
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= full ? 'text-[#fcc015] fill-[#fcc015]' : half && i === full + 1 ? 'text-[#fcc015] fill-[#fcc015] opacity-50' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

export function SupplierCard({ supplier }: { supplier: Supplier }) {
  const starRating  = parseFloat((supplier.rating / 20).toFixed(1));
  const icon        = SUPPLIER_ICONS[supplier.id];
  const compliance  = COMPLIANCE_BADGE[supplier.complianceStatus] ?? COMPLIANCE_BADGE['Compliant'];
  const walletShort = `${supplier.walletAddress.substring(0, 6)}…${supplier.walletAddress.slice(-4)}`;

  return (
    <Link href={`/suppliers/${supplier.id}`} className="block h-full group">
      <div
        className="relative bg-white h-full flex flex-col rounded-2xl border transition-all duration-200 group-hover:-translate-y-0.5"
        style={{
          borderColor: 'rgba(0,0,0,0.08)',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.06)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 15px -1px rgba(0,0,0,0.10), 0 4px 2px -2px rgba(0,0,0,0.06)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.06)'; }}
      >
        {/* Top accent bar — Visa blue */}
        <div className="h-[3px] rounded-t-2xl bg-[#1434CB] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <div className="p-5 flex flex-col flex-1">
          {/* ── Header ── */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: icon?.bg ?? '#F5F5F5' }}
            >
              {icon?.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold leading-tight truncate" style={{ color: '#000000' }}>
                    {supplier.name}
                  </h3>
                  <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: '#4a4a4a' }}>
                    <MapPin size={10} className="shrink-0" />
                    Global HQ
                  </p>
                </div>
                {/* Score badge */}
                <div
                  className="shrink-0 flex items-baseline gap-0.5 px-2.5 py-1 rounded-lg"
                  style={{ background: '#d6f2c4' }}
                >
                  <span className="text-sm font-bold" style={{ color: '#2C6849' }}>{supplier.rating}</span>
                  <span className="text-[10px] font-medium" style={{ color: '#40996b' }}>/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="mb-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} />

          {/* ── Data rows ── */}
          <div className="space-y-2.5 flex-1 mb-4">
            {[
              { label: 'Category', value: 'Federal Supplies', mono: false },
              { label: 'MCC Code', value: '5047', mono: true },
              { label: 'Delivery', value: `${supplier.deliveryAvgDays} days`, mono: false },
              { label: 'Wallet',   value: walletShort, mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-[12px]" style={{ color: '#4a4a4a' }}>{label}</span>
                <span
                  className={`text-[12px] font-medium ${mono ? 'font-mono' : ''}`}
                  style={{ color: mono ? '#4a4a4a' : '#000000' }}
                >
                  {value}
                </span>
              </div>
            ))}

            {/* Rating row */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-[12px]" style={{ color: '#4a4a4a' }}>Rating</span>
              <div className="flex items-center gap-1.5">
                <StarRating value={starRating} />
                <span className="text-[12px] font-semibold" style={{ color: '#000000' }}>{starRating}</span>
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="mb-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} />

          {/* ── Payment ── */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a4a4a' }}>
              Payment Accepted
            </p>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
              style={{ background: '#EEF2FF', color: '#1434CB', border: '1px solid rgba(20,52,203,0.15)' }}
            >
              <CreditCard size={11} className="stroke-[2.5]" />
              Visa Network
            </span>
          </div>

          {/* ── Certifications ── */}
          {(supplier.certifications || []).length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a4a4a' }}>
                Certifications
              </p>
              <div className="flex flex-wrap gap-1.5">
                {supplier.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                    style={{ background: '#F5F5F5', color: '#4a4a4a', border: '1px solid rgba(0,0,0,0.08)' }}
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Compliance status ── */}
          <div className="mt-auto pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: compliance.bg, color: compliance.text }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: compliance.dot }}
                />
                {compliance.label}
              </div>
              {/* Thin progress track */}
              <div className="flex-1 ml-3 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${supplier.rating}%`, background: '#1434CB' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
