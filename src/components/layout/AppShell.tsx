'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Sidebar currentPath={pathname} />
      <main className="ml-64 mt-16 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
