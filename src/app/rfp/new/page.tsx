'use client';

import { motion } from 'framer-motion';
import { CreateRFPForm } from '@/components/procurement/CreateRFPForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useUI } from '@/context/UIContext';

export default function NewRfpPage() {
  const { role } = useUI();

  if (role !== 'gov') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-slate-900">Access Denied</p>
          <p className="mt-2 text-sm text-slate-500">
            Only government officers can create procurement requests.
          </p>
          <Link
            href="/rfp"
            className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Back to RFPs
          </Link>
        </div>
      </motion.div>
    );
  }

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
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Create New RFP</h1>
      <CreateRFPForm />
    </motion.div>
  );
}
