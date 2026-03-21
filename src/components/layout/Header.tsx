'use client';

import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-700 z-30">
      <div className="flex items-center justify-between px-6 h-full">
        <span className="text-lg font-semibold text-slate-50">
          GovProcure AI
        </span>
        <div className="flex items-center gap-4">
          <RoleSwitcher />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
