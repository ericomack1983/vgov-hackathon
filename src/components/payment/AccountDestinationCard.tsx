'use client';

import { Building2, Wallet, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PaymentMethod } from '@/lib/mock-data/types';
import type { SelectableCard } from './PaymentMethodSelector';

interface AccountDestinationCardProps {
  method: PaymentMethod | null;
  supplierName: string;
  walletAddress?: string;
  selectedCard?: SelectableCard | null;
}

export function AccountDestinationCard({ method, supplierName, walletAddress, selectedCard }: AccountDestinationCardProps) {
  if (!method) return null;

  const iconEl = method === 'USD' ? <Building2 size={24} /> : method === 'USDC' ? <Wallet size={24} /> : <CreditCard size={24} />;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={method + (selectedCard?.id ?? '')}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full bg-slate-900 rounded-xl p-5 text-white shadow-lg border border-slate-800 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-50" />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1 block">
              Sending to
            </span>
            <span className="text-lg font-bold text-white tracking-tight">{supplierName}</span>
          </div>
          <div className="p-2 bg-slate-800 rounded-lg text-indigo-400">{iconEl}</div>
        </div>

        <div className="mt-6 space-y-3 relative z-10">
          {method === 'USD' && (
            <>
              <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                <span className="text-sm text-slate-400">Bank Name</span>
                <span className="text-sm font-medium text-slate-200">First Republic</span>
              </div>
              <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                <span className="text-sm text-slate-400">Account Number</span>
                <span className="text-sm font-mono text-slate-300">**** **** 5678</span>
              </div>
              <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                <span className="text-sm text-slate-400">Routing</span>
                <span className="text-sm font-mono text-slate-300">121000358</span>
              </div>
            </>
          )}
          {method === 'USDC' && (
            <>
              <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                <span className="text-sm text-slate-400">Network</span>
                <span className="text-sm font-medium text-purple-300">Visa Network</span>
              </div>
              <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                <span className="text-sm text-slate-400">Wallet Address</span>
                <span className="text-sm font-mono text-slate-300 truncate max-w-[200px]" title={walletAddress}>
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '0x...'}
                </span>
              </div>
            </>
          )}
          {method === 'Card' && selectedCard && (
            <>
              <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                <span className="text-sm text-slate-400">Network</span>
                <span className="text-sm font-medium text-slate-200">{selectedCard.brand}</span>
              </div>
              <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                <span className="text-sm text-slate-400">Card Number</span>
                <span className="text-sm font-mono text-slate-300">•••• •••• •••• {selectedCard.last4}</span>
              </div>
              <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                <span className="text-sm text-slate-400">Card Holder</span>
                <span className="text-sm font-medium text-slate-200">{selectedCard.holderName}</span>
              </div>
              <div className="flex justify-between items-end border-t border-slate-800 pt-3">
                <span className="text-sm text-slate-400">Type</span>
                <span className="text-sm font-medium text-slate-200 capitalize">{selectedCard.type}</span>
              </div>
            </>
          )}
          {method === 'Card' && !selectedCard && (
            <div className="border-t border-slate-800 pt-3">
              <p className="text-sm text-slate-500 text-center">Select a card above to continue</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
