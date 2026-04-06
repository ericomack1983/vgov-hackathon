'use client';

import { createContext, useContext, useReducer, useMemo, ReactNode, useCallback } from 'react';
import { Transaction, Notification } from '@/lib/mock-data/types';
import { MOCK_TRANSACTIONS } from '@/lib/mock-data/transactions';

interface PaymentState {
  transactions: Transaction[];
  notifications: Notification[];
  visaPaymentId: string | null;
}

type PaymentAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_VISA_PAYMENT_ID'; payload: string };

function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    case 'SET_VISA_PAYMENT_ID':
      return { ...state, visaPaymentId: action.payload };
    default:
      return state;
  }
}

interface PaymentContextValue {
  transactions: Transaction[];
  notifications: Notification[];
  visaPaymentId: string | null;
  addTransaction: (tx: Transaction) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  setVisaPaymentId: (id: string) => void;
  unreadCount: number;
}

const PaymentContext = createContext<PaymentContextValue | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(paymentReducer, {
    transactions: [],
    notifications: [],
    visaPaymentId: null,
  });

  const addTransaction = useCallback((tx: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: tx });
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  }, []);

  const setVisaPaymentId = useCallback((id: string) => {
    dispatch({ type: 'SET_VISA_PAYMENT_ID', payload: id });
  }, []);

  const unreadCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications]
  );

  const value = useMemo(() => ({
    transactions: state.transactions,
    notifications: state.notifications,
    visaPaymentId: state.visaPaymentId,
    addTransaction,
    addNotification,
    markNotificationRead,
    setVisaPaymentId,
    unreadCount,
  }), [state.transactions, state.notifications, state.visaPaymentId, addTransaction, addNotification, markNotificationRead, setVisaPaymentId, unreadCount]);

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) throw new Error('usePayment must be used within PaymentProvider');
  return context;
}
