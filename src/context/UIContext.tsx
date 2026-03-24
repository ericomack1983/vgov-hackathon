'use client';

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { Role } from '@/lib/mock-data/types';

interface UIState {
  role: Role;
  setRole: (role: Role) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSwitchingRole: boolean;
  clearSwitching: () => void;
}

const UIContext = createContext<UIState | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [role, setRoleRaw] = useState<Role>('gov');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const setRole = useCallback((newRole: Role) => {
    setIsSwitchingRole(true);
    setRoleRaw(newRole);
  }, []);

  const clearSwitching = useCallback(() => setIsSwitchingRole(false), []);

  const value = useMemo(() => ({
    role, setRole, sidebarOpen, setSidebarOpen, isSwitchingRole, clearSwitching,
  }), [role, setRole, sidebarOpen, isSwitchingRole, clearSwitching]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
}
