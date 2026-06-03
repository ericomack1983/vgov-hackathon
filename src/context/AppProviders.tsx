'use client';

import { ReactNode } from 'react';
import { UIProvider } from './UIContext';
import { ProcurementProvider } from './ProcurementContext';
import { PaymentProvider } from './PaymentContext';
import { AuthProvider } from './AuthContext';
import { SidebarActionsProvider } from './SidebarActionsContext';
import { AILedgerProvider } from './AILedgerContext';
import { CardsProvider } from './CardsContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        <SidebarActionsProvider>
          <ProcurementProvider>
            <PaymentProvider>
              <CardsProvider>
                <AILedgerProvider>
                  {children}
                </AILedgerProvider>
              </CardsProvider>
            </PaymentProvider>
          </ProcurementProvider>
        </SidebarActionsProvider>
      </UIProvider>
    </AuthProvider>
  );
}
