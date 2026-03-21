'use client';

import { Bell } from 'lucide-react';
import { usePayment } from '@/context/PaymentContext';
import Link from 'next/link';

export function NotificationBell() {
  const { unreadCount } = usePayment();

  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="relative text-slate-400 hover:text-slate-50 transition-colors"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-semibold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
