'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { isSwitchingRole, clearSwitching } = useUI();
  const { user, loading } = useAuth();

  // Once navigation settles on the new route, reveal content
  useEffect(() => {
    if (isSwitchingRole) clearSwitching();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auth guard — redirect to login if no session
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [loading, user, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Login / demo landing — render without shell
  if (pathname === '/login' || pathname === '/') return <>{children}</>;

  // While auth is resolving, show nothing
  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Sidebar currentPath={pathname} />
      <main className="ml-64 mt-16 p-8 min-h-screen">
        {isSwitchingRole ? null : children}
      </main>
    </div>
  );
}
