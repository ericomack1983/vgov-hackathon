'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Bell,
  Shield,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS: Record<
  string,
  Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>
> = {
  gov: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Suppliers', href: '/suppliers', icon: Users },
    { label: 'Procurement', href: '/rfp', icon: FileText },
    { label: 'Payments', href: '/payment', icon: CreditCard },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ],
  supplier: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Bids', href: '/bids', icon: FileText },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ],
  auditor: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Audit Trail', href: '/audit', icon: Shield },
    { label: 'Transactions', href: '/transactions', icon: Receipt },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ],
};

interface SidebarProps {
  role: 'gov' | 'supplier' | 'auditor';
  currentPath: string;
}

export function Sidebar({ role, currentPath }: SidebarProps) {
  const items = NAV_ITEMS[role] || NAV_ITEMS.gov;

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-slate-900 border-r border-slate-800 z-20">
      <nav className="p-4 space-y-1">
        {items.map((item) => {
          const isActive = item.href === currentPath;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors duration-150',
                isActive
                  ? 'text-white bg-indigo-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
