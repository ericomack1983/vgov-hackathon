'use client';

import { motion } from 'framer-motion';

interface PlaceholderPageProps {
  heading: string;
  subtitle: string;
}

export function PlaceholderPage({ heading, subtitle }: PlaceholderPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <h1 className="text-xl font-semibold text-slate-900">{heading}</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-8 bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center">
        <p className="text-base font-semibold text-slate-900">
          Nothing here yet
        </p>
        <p className="mt-2 text-sm text-slate-500">
          This section is under construction. Check back after the next phase.
        </p>
      </div>
    </motion.div>
  );
}
