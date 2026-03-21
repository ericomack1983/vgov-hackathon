'use client';

import { motion } from 'framer-motion';
import { useProcurement } from '@/context/ProcurementContext';
import { SupplierCard } from '@/components/procurement/SupplierCard';

export default function SuppliersPage() {
  const { suppliers } = useProcurement();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <h1 className="text-xl font-semibold text-slate-900">Supplier Registry</h1>
      <p className="mt-1 text-sm text-slate-500">Browse and manage registered suppliers.</p>

      {suppliers.length === 0 ? (
        <div className="mt-8 bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-slate-900">No suppliers found</p>
          <p className="mt-2 text-sm text-slate-500">
            Supplier data could not be loaded. Try refreshing the page.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
