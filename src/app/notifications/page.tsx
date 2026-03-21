'use client';

import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { usePayment } from '@/context/PaymentContext';
import { NotificationItem } from '@/components/notifications/NotificationItem';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, unreadCount } = usePayment();

  const handleMarkAllRead = () => {
    notifications
      .filter((n) => !n.read)
      .forEach((n) => markNotificationRead(n.id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-slate-900">No notifications yet</h2>
          <p className="text-sm text-slate-500 mt-1">
            Notifications will appear here as events occur in the system.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={markNotificationRead}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
