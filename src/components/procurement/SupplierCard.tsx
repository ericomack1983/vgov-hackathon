'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Supplier } from '@/lib/mock-data/types';

const complianceVariant: Record<Supplier['complianceStatus'], 'success' | 'warning' | 'error'> = {
  Compliant: 'success',
  'Pending Review': 'warning',
  'Non-Compliant': 'error',
};

export function SupplierCard({ supplier }: { supplier: Supplier }) {
  return (
    <Link href={`/suppliers/${supplier.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <h3 className="text-lg font-semibold text-slate-900">{supplier.name}</h3>

        <div className="mt-2 flex items-center gap-1">
          <Star size={16} className="text-amber-500 fill-amber-500" />
          <span className="text-sm font-medium text-slate-700">
            {supplier.rating}<span className="text-slate-400">/100</span>
          </span>
        </div>

        <div className="mt-3">
          <StatusBadge
            status={supplier.complianceStatus}
            variant={complianceVariant[supplier.complianceStatus]}
          />
        </div>

        {supplier.certifications.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {supplier.certifications.map((cert) => (
              <span
                key={cert}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600"
              >
                {cert}
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-slate-500">
          Avg delivery: {supplier.deliveryAvgDays} days
        </p>
      </div>
    </Link>
  );
}
