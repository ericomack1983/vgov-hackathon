'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayment } from '@/context/PaymentContext';
import Link from 'next/link';

export function NotificationBell() {
  const { unreadCount } = usePayment();
  const prevCountRef = useRef(unreadCount);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 600);
      prevCountRef.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="relative text-slate-400 hover:text-slate-50 transition-colors"
    >
      <motion.div
        animate={bump ? { rotate: [0, -18, 18, -12, 12, -6, 6, 0] } : { rotate: 0 }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
      >
        <Bell className="w-5 h-5" />
      </motion.div>

      <AnimatePresence mode="popLayout">
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center leading-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
