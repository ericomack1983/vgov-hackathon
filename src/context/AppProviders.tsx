'use client';

import { ReactNode } from 'react';
import { UIProvider } from './UIContext';
import { ProcurementProvider } from './ProcurementContext';
import { PaymentProvider } from './PaymentContext';
import { AuthProvider } from './AuthContext';
import { SidebarActionsProvider } from './SidebarActionsContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        <SidebarActionsProvider>
          <ProcurementProvider>
            <PaymentProvider>
              {children}
            </PaymentProvider>
          </ProcurementProvider>
        </SidebarActionsProvider>
      </UIProvider>
    </AuthProvider>
  );
}
