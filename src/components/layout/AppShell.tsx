'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const role = 'gov' as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Sidebar role={role} currentPath={pathname} />
      <main className="ml-64 mt-16 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
