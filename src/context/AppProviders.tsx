'use client';

import { ReactNode } from 'react';
import { UIProvider } from './UIContext';
import { ProcurementProvider } from './ProcurementContext';
import { PaymentProvider } from './PaymentContext';
import { AuthProvider } from './AuthContext';
import { SidebarActionsProvider } from './SidebarActionsContext';
import { AILedgerProvider } from './AILedgerContext';
import { CardsProvider } from './CardsContext';
import { MissionsProvider } from './MissionsContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        <SidebarActionsProvider>
          <ProcurementProvider>
            <PaymentProvider>
              <CardsProvider>
                <MissionsProvider>
                  <AILedgerProvider>
                    {children}
                  </AILedgerProvider>
                </MissionsProvider>
              </CardsProvider>
            </PaymentProvider>
          </ProcurementProvider>
        </SidebarActionsProvider>
      </UIProvider>
    </AuthProvider>
  );
}
