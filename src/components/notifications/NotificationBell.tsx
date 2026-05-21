'use client';

import { useEffect, useRef, useState } from 'react';
import { VisaNotificationsLow } from '@visa/nova-icons-react';
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
      style={{ position: 'relative', display: 'inline-flex', color: 'white' }}
    >
      <motion.div
        animate={bump ? { rotate: [0, -18, 18, -12, 12, -6, 6, 0] } : { rotate: 0 }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
        style={{ display: 'flex' }}
      >
        <VisaNotificationsLow style={{ width: 20, height: 20 }} />
      </motion.div>

      <AnimatePresence mode="popLayout">
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            style={{
              position: 'absolute', top: -6, right: -6,
              background: '#de3730', color: 'white',
              fontSize: 9, fontWeight: 700,
              minWidth: 16, height: 16, padding: '0 3px',
              borderRadius: 9999, display: 'flex',
              alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              border: '2px solid #1434CB',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
