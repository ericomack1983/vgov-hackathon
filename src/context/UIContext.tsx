'use client';

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { Role } from '@/lib/mock-data/types';

interface UIState {
  role: Role;
  setRole: (role: Role) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const UIContext = createContext<UIState | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('gov');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const value = useMemo(() => ({
    role, setRole, sidebarOpen, setSidebarOpen
  }), [role, sidebarOpen]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
}
