'use client';

import { ReactNode } from 'react';
import { UIProvider } from './UIContext';
import { ProcurementProvider } from './ProcurementContext';
import { PaymentProvider } from './PaymentContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <ProcurementProvider>
        <PaymentProvider>
          {children}
        </PaymentProvider>
      </ProcurementProvider>
    </UIProvider>
  );
}
