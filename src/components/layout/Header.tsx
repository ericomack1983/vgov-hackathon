'use client';

import { useRouter } from 'next/navigation';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Landmark, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-700 z-30">
      <div className="flex items-center justify-between px-6 h-full">
        <div className="flex items-center gap-2.5 text-slate-50">
          <Landmark className="w-5 h-5 text-blue-400" />
          <span className="text-lg font-semibold">
            VGov - Procurement
          </span>
        </div>
        <div className="flex items-center gap-4">
          <RoleSwitcher />
          <NotificationBell />
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-200 leading-none">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
