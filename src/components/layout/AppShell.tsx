'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import { ProcurementAssistant } from '@/components/ProcurementAssistant';
import { VisaFooter } from './VisaFooter';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { isSwitchingRole, clearSwitching } = useUI();
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Once navigation settles on the new route, reveal content
  useEffect(() => {
    if (isSwitchingRole) clearSwitching();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSupplierRoute = pathname === '/marketplace' || pathname.startsWith('/marketplace/');

  // Auth guard — redirect to login if no session (supplier portal is standalone)
  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && !isSupplierRoute) {
      router.replace('/login');
    }
  }, [loading, user, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Login / demo landing / supplier portal — render without shell
  if (pathname === '/login' || pathname === '/' || isSupplierRoute) return <>{children}</>;

  // While auth is resolving, show nothing
  if (loading || !user) return null;

  return (
    <div className="v-flex v-flex-col v-min-h-screen" style={{ background: 'var(--v-color-background, #f9fafb)' }}>
      <Header />
      <Sidebar
        currentPath={pathname}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <motion.main
        animate={{ marginLeft: sidebarCollapsed ? 64 : 256 }}
        transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
        style={{ marginTop: '4rem', padding: '2rem', minHeight: 'calc(100vh - 4rem)' }}
      >
        {isSwitchingRole ? null : children}
      </motion.main>
      <VisaFooter sidebarCollapsed={sidebarCollapsed} />
      <ProcurementAssistant />
    </div>
  );
}
