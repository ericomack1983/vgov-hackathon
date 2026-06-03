'use client';

import Link from 'next/link';
import { ContentCard, ContentCardBody, Typography } from '@visa/nova-react';
import {
  VisaMapLocationTiny,
  VisaCardGenericTiny,
  VisaFavoriteStarFillTiny,
  VisaFavoriteStarOutlineTiny,
} from '@visa/nova-icons-react';
import type { Supplier } from '@/lib/mock-data/types';

// All icons use unified Visa blue — no per-supplier colour variance
const SUPPLIER_ICONS: Record<string, React.ReactNode> = {
  'sup-001': (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
      <path d="M14 3L4 7v7c0 6 4.5 10.5 10 12 5.5-1.5 10-6 10-12V7L14 3Z" fill="#1434CB" fillOpacity="0.15" stroke="#1434CB" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 9l1.2 2.5 2.8.4-2 1.9.5 2.7-2.5-1.3-2.5 1.3.5-2.7-2-1.9 2.8-.4L14 9Z" fill="#1434CB"/>
    </svg>
  ),
  'sup-002': (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
      <line x1="14" y1="5" x2="14" y2="23" stroke="#1434CB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7" y1="8" x2="21" y2="8" stroke="#1434CB" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 8 L4 14 Q5.5 17 7 14 Q8.5 17 10 14 L7 8Z" fill="#1434CB" fillOpacity="0.2" stroke="#1434CB" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M21 8 L18 14 Q19.5 17 21 14 Q22.5 17 24 14 L21 8Z" fill="#1434CB" fillOpacity="0.2" stroke="#1434CB" strokeWidth="1.2" strokeLinejoin="round"/>
      <line x1="10" y1="23" x2="18" y2="23" stroke="#1434CB" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  'sup-003': (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="9" stroke="#1434CB" strokeWidth="1.5"/>
      <circle cx="14" cy="14" r="1.5" fill="#1434CB"/>
      <polygon points="14,6 15.5,13 14,11.5 12.5,13" fill="#1434CB"/>
      <polygon points="14,22 12.5,15 14,16.5 15.5,15" fill="#1434CB" fillOpacity="0.45"/>
    </svg>
  ),
  'sup-004': (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
      <path d="M4 17 Q9 10 14 17 Q19 10 24 17" stroke="#1434CB" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <line x1="8" y1="11" x2="8" y2="19" stroke="#1434CB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="17" x2="14" y2="22" stroke="#1434CB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="11" x2="20" y2="19" stroke="#1434CB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="4" y1="19" x2="24" y2="19" stroke="#1434CB" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  'sup-005': (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
      <path d="M5 20 L6 11 L11 16 L14 7 L17 16 L22 11 L23 20 Z" fill="#1434CB" fillOpacity="0.15" stroke="#1434CB" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="5" y1="22" x2="23" y2="22" stroke="#1434CB" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="14" cy="7" r="1.5" fill="#1434CB"/>
    </svg>
  ),
  'sup-006': (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
      <rect x="5" y="16" width="4" height="7" rx="1" fill="#1434CB" fillOpacity="0.25"/>
      <rect x="12" y="11" width="4" height="12" rx="1" fill="#1434CB" fillOpacity="0.55"/>
      <rect x="19" y="6" width="4" height="17" rx="1" fill="#1434CB"/>
      <line x1="4" y1="23" x2="24" y2="23" stroke="#1434CB" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  'sup-007': (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
      <rect x="6" y="6" width="16" height="16" rx="3" stroke="#1434CB" strokeWidth="1.5"/>
      <path d="M15 9 L12 14.5 H14.5 L13 19 L17 12.5 H14.5 L16 9 Z" fill="#1434CB"/>
    </svg>
  ),
  'sup-008': (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="8" r="2.5" stroke="#1434CB" strokeWidth="1.5"/>
      <line x1="14" y1="10.5" x2="14" y2="23" stroke="#1434CB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9" y1="14" x2="19" y2="14" stroke="#1434CB" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 23 Q9 19 14 19 Q19 19 19 23" stroke="#1434CB" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  // Fallback for dynamically registered suppliers
  default: (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="7" width="20" height="14" rx="3" stroke="#1434CB" strokeWidth="1.5"/>
      <path d="M4 11h20" stroke="#1434CB" strokeWidth="1.5"/>
      <rect x="7" y="14" width="5" height="3" rx="1" fill="#1434CB" fillOpacity="0.5"/>
    </svg>
  ),
};

const COMPLIANCE_META: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  'Compliant':      { label: 'Compliant',      dot: '#16a34a', text: '#15803d', bg: 'rgba(22,163,74,0.08)' },
  'Pending Review': { label: 'Pending Review', dot: '#d97706', text: '#92400e', bg: 'rgba(217,119,6,0.08)'  },
  'Non-Compliant':  { label: 'Non-Compliant',  dot: '#dc2626', text: '#b91c1c', bg: 'rgba(220,38,38,0.08)' },
};

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.3;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= full ? (
          <VisaFavoriteStarFillTiny key={i} style={{ color: '#1434CB' }} />
        ) : half && i === full + 1 ? (
          <VisaFavoriteStarFillTiny key={i} style={{ color: '#1434CB', opacity: 0.35 }} />
        ) : (
          <VisaFavoriteStarOutlineTiny key={i} style={{ color: '#D1D5DB' }} />
        )
      )}
    </span>
  );
}

const ROW_DIVIDER = <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '14px 0' }} />;

export function SupplierCard({ supplier }: { supplier: Supplier }) {
  const starRating  = parseFloat((supplier.rating / 20).toFixed(1));
  const icon        = SUPPLIER_ICONS[supplier.id] ?? SUPPLIER_ICONS['default'];
  const compliance  = COMPLIANCE_META[supplier.complianceStatus] ?? COMPLIANCE_META['Compliant'];
  const walletShort = `${supplier.walletAddress.substring(0, 6)}…${supplier.walletAddress.slice(-4)}`;

  return (
    <Link href={`/suppliers/${supplier.id}`} className="block h-full group">
      <ContentCard
        className="h-full transition-all duration-200 group-hover:-translate-y-0.5"
        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Visa blue top accent — visible on hover */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ height: 3, background: 'linear-gradient(to right, #1434CB, #6366f1)', flexShrink: 0 }}
        />

        <ContentCardBody style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: '#EEF2FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <Typography
                    tag="h3"
                    className="v-typography-body-2-bold"
                    style={{ color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {supplier.name}
                  </Typography>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
                    <VisaMapLocationTiny style={{ color: '#9CA3AF', flexShrink: 0 }} />
                    <Typography tag="span" className="v-typography-label" style={{ color: '#9CA3AF' }}>
                      Global HQ
                    </Typography>
                  </div>
                </div>

                {/* Score chip — Visa blue */}
                <div style={{
                  flexShrink: 0, padding: '3px 10px', borderRadius: 8,
                  background: '#EEF2FF', display: 'flex', alignItems: 'baseline', gap: 1,
                }}>
                  <Typography tag="span" className="v-typography-body-2-bold" style={{ color: '#1434CB', fontSize: 14 }}>
                    {supplier.rating}
                  </Typography>
                  <Typography tag="span" className="v-typography-label" style={{ color: '#1434CB', opacity: 0.55, fontSize: 10 }}>
                    /100
                  </Typography>
                </div>
              </div>
            </div>
          </div>

          {ROW_DIVIDER}

          {/* ── Data rows ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
            {([
              { label: 'Category', value: 'Federal Supplies', mono: false },
              { label: 'MCC Code', value: '5047',             mono: true  },
              { label: 'Delivery', value: `${supplier.deliveryAvgDays} days`, mono: false },
              { label: 'Wallet',   value: walletShort,        mono: true  },
            ] as { label: string; value: string; mono: boolean }[]).map(({ label, value, mono }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <Typography tag="span" className="v-typography-label" style={{ color: '#6B7280' }}>
                  {label}
                </Typography>
                <Typography
                  tag="span"
                  className="v-typography-label"
                  style={{ color: '#111827', fontWeight: 500, fontFamily: mono ? '"JetBrains Mono", monospace' : undefined }}
                >
                  {value}
                </Typography>
              </div>
            ))}

            {/* Rating row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <Typography tag="span" className="v-typography-label" style={{ color: '#6B7280' }}>Rating</Typography>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StarRating value={starRating} />
                <Typography tag="span" className="v-typography-label" style={{ color: '#111827', fontWeight: 600 }}>
                  {starRating}
                </Typography>
              </div>
            </div>
          </div>

          {ROW_DIVIDER}

          {/* ── Payment accepted ── */}
          <div style={{ marginBottom: 12 }}>
            <Typography
              tag="p"
              className="v-typography-overline"
              style={{ color: '#9CA3AF', marginBottom: 7, fontSize: 10, letterSpacing: '0.09em' }}
            >
              Payment Accepted
            </Typography>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 8,
              background: '#EEF2FF', color: '#1434CB',
              border: '1px solid rgba(20,52,203,0.12)',
              fontSize: 12, fontWeight: 600,
            }}>
              <VisaCardGenericTiny />
              Visa Network
            </span>
          </div>

          {/* ── Certifications ── */}
          {(supplier.certifications || []).length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <Typography
                tag="p"
                className="v-typography-overline"
                style={{ color: '#9CA3AF', marginBottom: 7, fontSize: 10, letterSpacing: '0.09em' }}
              >
                Certifications
              </Typography>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {supplier.certifications.map((cert) => (
                  <span
                    key={cert}
                    style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '3px 8px', borderRadius: 6,
                      background: '#F9FAFB', color: '#374151',
                      border: '1px solid rgba(0,0,0,0.09)',
                      fontSize: 11, fontWeight: 500,
                    }}
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Compliance footer ── */}
          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 99,
                background: compliance.bg, color: compliance.text,
                fontSize: 11, fontWeight: 600,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: compliance.dot, flexShrink: 0 }} />
                {compliance.label}
              </span>

              {/* Score progress track */}
              <div style={{ flex: 1, marginLeft: 12, height: 3, background: 'rgba(0,0,0,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  width: `${supplier.rating}%`, height: '100%',
                  background: 'linear-gradient(to right, #1434CB, #6366f1)',
                  borderRadius: 99,
                }} />
              </div>
            </div>
          </div>
        </ContentCardBody>
      </ContentCard>
    </Link>
  );
}
