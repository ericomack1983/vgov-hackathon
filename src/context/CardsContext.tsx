'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

export interface IssuedCard {
  id: string;
  holderName: string;
  brand: 'Visa' | 'Mastercard' | 'Amex';
  type: 'credit' | 'debit';
  usageType: 'single-use' | 'multi-use';
  last4: string;
  expiry: string;
  spendLimit?: string;
  allowOnline: boolean;
  allowIntl: boolean;
  allowRecurring: boolean;
  blocked?: boolean;
  label?: string; // e.g. "Corporate Card"
}

const STORAGE_KEY = 'vgov:issued-cards';

const CORPORATE_CARD: IssuedCard = {
  id: 'corp-default-001',
  holderName: 'Agency Corporate',
  brand: 'Visa',
  type: 'credit',
  usageType: 'multi-use',
  last4: '4892',
  expiry: '12/27',
  spendLimit: '5000',
  allowOnline: true,
  allowIntl: false,
  allowRecurring: true,
  blocked: false,
  label: 'Corporate Card',
};

function loadCards(): IssuedCard[] {
  if (typeof window === 'undefined') return [CORPORATE_CARD];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const cards: IssuedCard[] = raw ? JSON.parse(raw) : [];
    // Always ensure corporate card exists
    if (!cards.find((c) => c.id === CORPORATE_CARD.id)) {
      cards.unshift(CORPORATE_CARD);
    }
    return cards;
  } catch {
    return [CORPORATE_CARD];
  }
}

interface CardsContextValue {
  cards: IssuedCard[];
  addCard: (card: IssuedCard) => void;
}

const CardsContext = createContext<CardsContextValue | undefined>(undefined);

export function CardsProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<IssuedCard[]>([]);

  useEffect(() => {
    setCards(loadCards());
  }, []);

  const addCard = useCallback((card: IssuedCard) => {
    setCards((prev) => {
      const next = [card, ...prev.filter((c) => c.id !== card.id)];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ cards, addCard }), [cards, addCard]);

  return <CardsContext.Provider value={value}>{children}</CardsContext.Provider>;
}

export function useCards() {
  const ctx = useContext(CardsContext);
  if (!ctx) throw new Error('useCards must be used within CardsProvider');
  return ctx;
}
