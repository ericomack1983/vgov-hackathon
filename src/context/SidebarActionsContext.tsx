'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type SidebarActionVariant = 'ai' | 'award' | 'payment' | 'upload';

export interface SidebarAction {
  id: string;
  label: string;
  variant: SidebarActionVariant;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

interface SidebarActionsState {
  actions: SidebarAction[];
  setActions: (actions: SidebarAction[]) => void;
  clearActions: () => void;
}

const SidebarActionsContext = createContext<SidebarActionsState | undefined>(undefined);

export function SidebarActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsRaw] = useState<SidebarAction[]>([]);
  const setActions = useCallback((a: SidebarAction[]) => setActionsRaw(a), []);
  const clearActions = useCallback(() => setActionsRaw([]), []);

  return (
    <SidebarActionsContext.Provider value={{ actions, setActions, clearActions }}>
      {children}
    </SidebarActionsContext.Provider>
  );
}

export function useSidebarActions() {
  const ctx = useContext(SidebarActionsContext);
  if (!ctx) throw new Error('useSidebarActions must be used within SidebarActionsProvider');
  return ctx;
}
