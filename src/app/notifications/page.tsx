'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CreditCard, Brain, ShieldCheck, Zap, ArrowUpRight, Clock } from 'lucide-react';
import { usePayment } from '@/context/PaymentContext';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { MailInboxItem } from '@/components/notifications/MailInboxItem';

/* ── Decorative activity stream (static mock) ─────────────────────────── */
const STREAM = [
  { icon: CreditCard,  label: 'Virtual card issued',         sub: 'MCC 8099 · Healthcare',      color: '#60a5fa', t: '2s' },
  { icon: Brain,       label: 'AI evaluation complete',      sub: 'MedEquip Co. ranked #1',     color: '#a78bfa', t: '5s' },
  { icon: ShieldCheck, label: 'Compliance check passed',     sub: 'Supplier 4 · ISO 9001',      color: '#34d399', t: '9s' },
  { icon: Zap,         label: 'Instant settlement',          sub: '$48,500 · 0.3s',             color: '#fbbf24', t: '13s' },
  { icon: ArrowUpRight,label: 'RFP awarded',                 sub: 'PR-2024-0847 → MedEquip',   color: '#f87171', t: '17s' },
  { icon: Clock,       label: 'Payment authorised',          sub: 'Visa VSMS · risk score 94',  color: '#22d3ee', t: '22s' },
];

export default function NotificationsPage() {
  const { notifications, markNotificationRead, unreadCount } = usePayment();

  const handleMarkAllRead = () => {
    notifications.filter((n) => !n.read).forEach((n) => markNotificationRead(n.id));
  };

  if (notifications.length > 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-500">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-sm text-[#1434CB] hover:text-indigo-700 font-medium">
              Mark All Read
            </button>
          )}
        </div>
        <div className="space-y-3">
          {notifications.map((notification) =>
            notification.type === 'payment' && notification.amount && notification.paymentMode !== 'cnp'
              ? <MailInboxItem key={notification.id} notification={notification} onMarkRead={markNotificationRead} />
              : <NotificationItem key={notification.id} notification={notification} onMarkRead={markNotificationRead} />
          )}
        </div>
      </motion.div>
    );
  }

  /* ── Empty state — full-page dark canvas ──────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        minHeight: 'calc(100vh - 10rem)',
        background: 'linear-gradient(160deg, #060e24 0%, #0b1735 45%, #07102e 100%)',
        boxShadow: '0 0 0 1px rgba(74,123,255,0.14)',
      }}
    >
      {/* ── Grid ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(74,123,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(74,123,255,0.06) 1px,transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* ── Radial glow ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(20,52,203,0.14) 0%, transparent 72%)' }}
      />

      {/* ── Floating payment card – top left ── */}
      <motion.div
        initial={{ opacity: 0, x: -20, rotate: -12 }}
        animate={{ opacity: 1, x: 0, rotate: -12 }}
        transition={{ delay: 0.3, duration: 0.7, ease: [0.22,1,0.36,1] }}
        className="absolute top-8 left-8 w-56 h-32 rounded-2xl pointer-events-none select-none"
        style={{
          background: 'linear-gradient(135deg, #1434CB 0%, #3b5bdb 50%, #4f46e5 100%)',
          boxShadow: '0 16px 48px rgba(20,52,203,0.45), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        <div className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-7 rounded bg-amber-400/80" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }} />
            <svg viewBox="0 0 72 24" className="h-4 w-auto opacity-80"><path fill="white" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/></svg>
          </div>
          <div>
            <p className="text-white/40 text-[9px] font-mono tracking-[0.15em] mb-0.5">•••• •••• •••• 4829</p>
            <p className="text-white text-xs font-bold tracking-wide">GOV PROCUREMENT</p>
          </div>
        </div>
      </motion.div>

      {/* ── AI score chip – top right ── */}
      <motion.div
        initial={{ opacity: 0, x: 20, rotate: 8 }}
        animate={{ opacity: 1, x: 0, rotate: 8 }}
        transition={{ delay: 0.45, duration: 0.7, ease: [0.22,1,0.36,1] }}
        className="absolute top-10 right-10 w-44 pointer-events-none select-none rounded-xl p-3"
        style={{
          background: 'rgba(13,27,62,0.9)',
          border: '1px solid rgba(99,102,241,0.35)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-violet-500/30 flex items-center justify-center">
            <Brain size={10} className="text-violet-400" />
          </div>
          <span className="text-white/60 text-[9px] font-bold font-mono uppercase tracking-widest">AI Score</span>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-2xl font-black text-white leading-none">94</span>
          <span className="text-white/30 text-xs mb-0.5">/100</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '94%', background: 'linear-gradient(90deg,#6366f1,#a78bfa)' }} />
        </div>
        <p className="text-violet-400/70 text-[8px] font-mono mt-1.5">Visa VSMS verified · MedEquip Co.</p>
      </motion.div>

      {/* ── Settlement node – bottom right ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotate: -6 }}
        transition={{ delay: 0.6, duration: 0.7, ease: [0.22,1,0.36,1] }}
        className="absolute bottom-12 right-8 w-48 pointer-events-none select-none rounded-xl p-3"
        style={{
          background: 'rgba(4,20,10,0.85)',
          border: '1px solid rgba(52,211,153,0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400/80 text-[9px] font-bold font-mono uppercase tracking-widest">Settlement</span>
        </div>
        <p className="text-emerald-300 text-lg font-black leading-none">$48,500</p>
        <p className="text-emerald-600/70 text-[8px] font-mono mt-0.5">Settled in 0.3s · Visa rails</p>
      </motion.div>

      {/* ── Live activity feed – bottom left ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.55, duration: 0.7, ease: [0.22,1,0.36,1] }}
        className="absolute bottom-10 left-8 w-52 pointer-events-none select-none rounded-xl overflow-hidden"
        style={{
          background: 'rgba(6,14,36,0.9)',
          border: '1px solid rgba(74,123,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div className="px-3 py-2 border-b border-white/5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />
          <span className="text-[#60a5fa]/70 text-[8px] font-bold font-mono uppercase tracking-widest">Live Events</span>
        </div>
        <div className="p-2 space-y-1">
          {STREAM.slice(0, 4).map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-2 px-1 py-0.5 rounded">
                <Icon size={9} style={{ color: item.color, flexShrink: 0 }} />
                <span className="text-white/45 text-[8px] font-mono truncate">{item.label}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── SVG connecting lines ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" style={{ opacity: 0.12 }}>
        <defs>
          <marker id="dot" markerWidth="4" markerHeight="4" refX="2" refY="2">
            <circle cx="2" cy="2" r="1.5" fill="#4a7bff" />
          </marker>
        </defs>
        <line x1="22%" y1="28%" x2="50%" y2="50%" stroke="#4a7bff" strokeWidth="0.7" strokeDasharray="5 8" markerEnd="url(#dot)" />
        <line x1="78%" y1="28%" x2="50%" y2="50%" stroke="#6366f1" strokeWidth="0.7" strokeDasharray="5 8" markerEnd="url(#dot)" />
        <line x1="78%" y1="75%" x2="50%" y2="50%" stroke="#34d399" strokeWidth="0.7" strokeDasharray="5 8" markerEnd="url(#dot)" />
        <line x1="22%" y1="75%" x2="50%" y2="50%" stroke="#60a5fa" strokeWidth="0.7" strokeDasharray="5 8" markerEnd="url(#dot)" />
      </svg>

      {/* ── Center content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8"
        style={{ minHeight: 'calc(100vh - 10rem)' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22,1,0.36,1] }}
          className="w-16 h-16 rounded-2xl mb-5 flex items-center justify-center"
          style={{
            background: 'rgba(20,52,203,0.22)',
            border: '1px solid rgba(74,123,255,0.4)',
            boxShadow: '0 0 40px rgba(20,52,203,0.25)',
          }}
        >
          <Bell className="w-7 h-7 text-[#7fb3ff]" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-lg font-bold text-white tracking-tight mb-2"
        >
          All caught up
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="text-[13px] leading-relaxed max-w-[240px]"
          style={{ color: 'rgba(148,180,255,0.55)' }}
        >
          Payment events, AI decisions, and procurement alerts will appear here in real time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex items-center gap-2 mt-5 text-[10px] font-mono uppercase tracking-widest"
          style={{ color: 'rgba(74,123,255,0.45)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
          System monitoring active
        </motion.div>
      </div>
    </motion.div>
  );
}
