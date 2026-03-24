'use client';

import { ReactNode } from 'react';
import { UIProvider } from './UIContext';
import { ProcurementProvider } from './ProcurementContext';
import { PaymentProvider } from './PaymentContext';
import { AuthProvider } from './AuthContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        <ProcurementProvider>
          <PaymentProvider>
            {children}
          </PaymentProvider>
        </ProcurementProvider>
      </UIProvider>
    </AuthProvider>
  );
}
