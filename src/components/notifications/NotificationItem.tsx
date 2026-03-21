'use client';

import { CreditCard, FileText, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/mock-data/types';

const typeIcons = {
  payment: CreditCard,
  procurement: FileText,
  system: Info,
} as const;

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const Icon = typeIcons[notification.type];

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 transition-colors',
        notification.read ? 'border-slate-200' : 'border-indigo-200 bg-indigo-50/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-900">{notification.title}</span>
        </div>
        <span className="text-xs text-slate-400 shrink-0 ml-2">
          {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
        </span>
      </div>
      <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
      {notification.txHash && (
        <p className="text-xs font-mono text-slate-400 mt-1">
          {notification.txHash.slice(0, 10)}...{notification.txHash.slice(-6)}
        </p>
      )}
      {!notification.read && (
        <button
          onClick={() => onMarkRead(notification.id)}
          className="text-xs text-indigo-600 hover:text-indigo-700 mt-2"
        >
          Mark as read
        </button>
      )}
    </div>
  );
}
