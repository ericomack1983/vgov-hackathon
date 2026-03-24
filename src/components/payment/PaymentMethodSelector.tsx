'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, DollarSign, Coins, CheckCircle2 } from 'lucide-react';
import type { PaymentMethod, PaymentCard } from '@/lib/mock-data/types';

export interface SelectableCard extends Pick<PaymentCard, 'id' | 'brand' | 'last4' | 'type' | 'holderName' | 'status'> {
  supplierName: string;
}

const BRAND_DOT: Record<PaymentCard['brand'], string> = {
  Visa:       'bg-[#1434CB]',
  Mastercard: 'bg-[#EB001B]',
  Amex:       'bg-[#007BC1]',
};

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  usdBalance?: number;
  usdcBalance?: number;
  disabled?: boolean;
  cards?: SelectableCard[];
  selectedCardId?: string | null;
  onCardSelect?: (cardId: string) => void;
}

const TABS: { method: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { method: 'USD',  label: 'USD',  icon: <DollarSign size={15} strokeWidth={2.5} /> },
  { method: 'USDC', label: 'USDC', icon: <Coins size={15} strokeWidth={2.5} />      },
  { method: 'Card', label: 'Card', icon: <CreditCard size={15} strokeWidth={2.5} /> },
];

export function PaymentMethodSelector({
  selected,
  onSelect,
  usdBalance,
  usdcBalance,
  disabled,
  cards = [],
  selectedCardId,
  onCardSelect,
}: PaymentMethodSelectorProps) {
  const activeCards = cards.filter((c) => c.status === 'active');

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      {/* 3-tab toggle */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex relative">
        {selected && (
          <motion.div
            layoutId="method-pill"
            className="absolute top-1.5 bottom-1.5 bg-white rounded-xl shadow-sm border border-slate-200 z-0"
            style={{ width: `calc(${100 / TABS.length}% - 0.375rem)` }}
            initial={false}
            animate={{ x: `calc(${TABS.findIndex((t) => t.method === selected) * 100}% + ${TABS.findIndex((t) => t.method === selected) * 6}px)` }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}

        {TABS.map(({ method, label, icon }) => (
          <button
            key={method}
            type="button"
            onClick={() => onSelect(method)}
            className={`relative z-10 flex-1 py-3.5 flex flex-col items-center gap-1 rounded-xl transition-colors ${
              selected === method ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {icon}
            <span className={`font-semibold text-sm ${selected === method ? 'text-indigo-900' : ''}`}>
              {label}
            </span>
            {method === 'USD' && usdBalance !== undefined && (
              <span className={`text-xs ${selected === 'USD' ? 'text-indigo-400' : 'text-slate-400'}`}>
                ${usdBalance.toLocaleString()}
              </span>
            )}
            {method === 'USDC' && usdcBalance !== undefined && (
              <span className={`text-xs ${selected === 'USDC' ? 'text-indigo-400' : 'text-slate-400'}`}>
                ${usdcBalance.toLocaleString()}
              </span>
            )}
            {method === 'Card' && (
              <span className={`text-xs ${selected === 'Card' ? 'text-indigo-400' : 'text-slate-400'}`}>
                {activeCards.length} available
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Card picker — expands when Card is selected */}
      <AnimatePresence>
        {selected === 'Card' && (
          <motion.div
            key="card-picker"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {activeCards.length === 0 ? (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-center">
                <p className="text-sm text-slate-500">No registered cards available.</p>
                <p className="text-xs text-slate-400 mt-1">Issue cards from the Cards section first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Select a card</p>
                {activeCards.map((card) => {
                  const isSelected = card.id === selectedCardId;
                  return (
                    <motion.button
                      key={card.id}
                      type="button"
                      onClick={() => onCardSelect?.(card.id)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      {/* Brand dot */}
                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${BRAND_DOT[card.brand]}`}>
                        <span className="text-[9px] font-black text-white tracking-wider">
                          {card.brand === 'Mastercard' ? 'MC' : card.brand.toUpperCase().slice(0, 4)}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {card.brand} •••• {card.last4}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {card.type.charAt(0).toUpperCase() + card.type.slice(1)} · {card.supplierName}
                        </p>
                      </div>

                      {/* Holder */}
                      <p className="text-xs text-slate-500 shrink-0 hidden sm:block">{card.holderName}</p>

                      {/* Check */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                          <CheckCircle2 size={18} className="text-indigo-500 shrink-0" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
