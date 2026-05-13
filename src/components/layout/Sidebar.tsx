'use client';

import Link from 'next/link';
import {
  LayoutDashboard, CreditCard, Users, FileText,
  Wallet, Bell, Shield, Receipt, FileCheck, Wifi, Terminal,
  Bot, CheckCircle2, ArrowRight, Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useUI } from '@/context/UIContext';
import { useSidebarActions, SidebarAction } from '@/context/SidebarActionsContext';
import { usePayment } from '@/context/PaymentContext';
import {
  itemVariants, backVariants, glowVariants, sharedTransition,
} from '@/components/ui/glow-menu';

/* ── Glow gradients — nova .v-alternate palette (blue surface + gold active) */
const GLOW_ACTIVE  = 'radial-gradient(ellipse at center, rgba(252,192,21,0.28) 0%, rgba(252,192,21,0.08) 55%, transparent 100%)';
const GLOW_HOVER   = 'radial-gradient(ellipse at center, rgba(255,255,255,0.12) 0%, transparent 65%)';

const NAV_ITEMS: Record<string, Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }> }>> = {
  gov: [
    { label: 'Dashboard',      href: '/dashboard',      icon: LayoutDashboard },
    { label: 'Cards',          href: '/cards',          icon: CreditCard       },
    { label: 'Suppliers',      href: '/suppliers',      icon: Users            },
    { label: 'Procurement',    href: '/rfp',            icon: FileText         },
    { label: 'Payments',       href: '/payment',        icon: Wallet           },
    { label: 'Reconciliation', href: '/reconciliation', icon: FileCheck        },
    { label: 'Transactions',   href: '/transactions',   icon: Receipt          },
    { label: 'Audit Trail',    href: '/audit',          icon: Shield           },
    { label: 'Notifications',  href: '/notifications',  icon: Bell             },
    { label: 'SDK Logs',       href: '/sdk-logs',       icon: Terminal         },
  ],
  supplier: [
    { label: 'My Bids',       href: '/bids',          icon: FileText },
    { label: 'Notifications', href: '/notifications', icon: Bell     },
  ],
  auditor: [
    { label: 'Audit Trail',   href: '/audit',          icon: Shield  },
    { label: 'Transactions',  href: '/transactions',   icon: Receipt },
    { label: 'Notifications', href: '/notifications',  icon: Bell    },
  ],
};

interface SidebarProps { currentPath: string }

const ACTION_CONFIG: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string; glow: string; border: string;
}> = {
  ai:      { icon: Bot,          gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)', glow: 'rgba(99,102,241,0.55)', border: 'rgba(99,102,241,0.5)'  },
  award:   { icon: CheckCircle2, gradient: 'linear-gradient(135deg,#059669,#10b981)', glow: 'rgba(16,185,129,0.55)', border: 'rgba(16,185,129,0.5)'  },
  payment: { icon: CreditCard,   gradient: 'linear-gradient(135deg,#1434CB,#6366f1)', glow: 'rgba(20,52,203,0.55)',  border: 'rgba(99,102,241,0.5)'  },
  upload:  { icon: Upload,       gradient: 'linear-gradient(135deg,#0ea5e9,#6366f1)', glow: 'rgba(14,165,233,0.55)', border: 'rgba(14,165,233,0.5)'  },
};

function ProcurementActions({ actions }: { actions: SidebarAction[] }) {
  return (
    <AnimatePresence>
      {actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
          className="px-3 overflow-hidden"
        >
          {/* divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />

          <p className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.14em] mb-2 px-1">
            Procurement Actions
          </p>

          <div className="space-y-2">
            {actions.map((action, i) => {
              const cfg = ACTION_CONFIG[action.variant];
              const Icon = cfg.icon;

              const inner = (
                <motion.div
                  key={action.id}
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -16, opacity: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative w-full rounded-xl overflow-hidden cursor-pointer"
                  style={{ border: `1px solid ${cfg.border}` }}
                >
                  {/* pulsing glow background */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0.08, 0.22, 0.08] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                    style={{ background: cfg.gradient }}
                  />
                  {/* animated border shimmer */}
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{ boxShadow: [`0 0 0px ${cfg.glow}`, `0 0 14px ${cfg.glow}`, `0 0 0px ${cfg.glow}`] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                  />
                  <div className="relative z-10 flex items-center gap-2.5 px-3 py-2.5">
                    <Icon size={13} className="text-white shrink-0" />
                    <span className="text-[11px] font-semibold text-white flex-1 leading-tight">{action.label}</span>
                    <ArrowRight size={10} className="text-white/50 shrink-0" />
                  </div>
                </motion.div>
              );

              if (action.href) {
                return <Link key={action.id} href={action.href}>{inner}</Link>;
              }
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="w-full text-left disabled:opacity-40"
                >
                  {inner}
                </button>
              );
            })}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-3" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Sidebar({ currentPath }: SidebarProps) {
  const { role } = useUI();
  const { actions } = useSidebarActions();
  const { unreadCount } = usePayment();
  const items = NAV_ITEMS[role] || NAV_ITEMS.gov;

  const prevCountRef = useRef(unreadCount);
  const [bellBump, setBellBump] = useState(false);

  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setBellBump(true);
      const t = setTimeout(() => setBellBump(false), 700);
      prevCountRef.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-[#1434CB] border-r border-white/[0.15] z-20 flex flex-col">
      <nav className="p-3 space-y-0.5 flex-1">
        {items.map((item) => {
          const isActive = item.href === currentPath;
          const isNotifications = item.href === '/notifications';
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              className="relative"
              style={{ perspective: '600px' }}
              whileHover="hover"
              initial="initial"
            >
              {/* Radial glow — always shown for active, triggered on hover */}
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-lg z-0"
                variants={glowVariants}
                animate={isActive ? 'hover' : 'initial'}
                style={{ background: isActive ? GLOW_ACTIVE : GLOW_HOVER }}
              />

              {/* Active solid pill — gold accent (nova .v-alternate active) */}
              {isActive && (
                <div className="absolute inset-0 rounded-lg bg-[#fcc015] z-0" />
              )}

              {/* ── FRONT FACE ── */}
              <Link href={item.href} className="block relative z-10">
                <motion.div
                  variants={itemVariants}
                  transition={sharedTransition}
                  style={{ transformStyle: 'preserve-3d', transformOrigin: 'center bottom' }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] tracking-[0.01em]',
                    isActive ? 'text-[#1A1F71] font-bold' : 'text-white/90 font-medium',
                  )}
                >
                  {/* Bell icon gets shake + badge for notifications */}
                  {isNotifications ? (
                    <span className="relative shrink-0">
                      <motion.span
                        animate={bellBump ? { rotate: [0, -18, 18, -12, 12, -6, 6, 0] } : { rotate: 0 }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        className="block"
                      >
                        <Icon
                          className={cn(
                            'w-4 h-4 transition-colors duration-300',
                            isActive ? 'text-[#1A1F71]' : 'text-white/80',
                          )}
                        />
                      </motion.span>
                      <AnimatePresence mode="popLayout">
                        {unreadCount > 0 && (
                          <motion.span
                            key={unreadCount}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center leading-none"
                            style={{ fontSize: 8 }}
                          >
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  ) : (
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors duration-300',
                        isActive ? 'text-[#1A1F71]' : 'text-white/80',
                      )}
                    />
                  )}
                  {item.label}
                  {/* Inline pill badge on the label row */}
                  {isNotifications && unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="ml-auto bg-red-500 text-white font-bold rounded-full px-1.5 py-0.5 leading-none"
                      style={{ fontSize: 9 }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </motion.div>
              </Link>

              {/* ── BACK FACE (flips in on hover) ── */}
              <motion.div
                variants={backVariants}
                transition={sharedTransition}
                style={{
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'center top',
                  rotateX: 90,
                }}
                className="absolute inset-0 z-10 pointer-events-none"
              >
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold h-full text-white">
                  <Icon className="w-4 h-4 shrink-0 text-white/70" />
                  {item.label}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </nav>

      {/* ── Procurement action buttons (RFP page only) ── */}
      <ProcurementActions actions={actions} />

      {/* ── Rotating Visa card ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div style={{ perspective: '900px' }}>
          <motion.div
            animate={{ rotateY: 360 }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
            style={{ transformStyle: 'preserve-3d', width: 176, height: 112, position: 'relative' }}
          >
            {/* ── Front face ── */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1A1F71] to-[#0d1060] shadow-2xl select-none"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {/* Decorative circles — same as cards page */}
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/5" />

              {/* VCN badge */}
              <div className="absolute top-2 left-3">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/15 text-[7px] font-bold text-white/80 uppercase tracking-wider">
                  <CreditCard size={6} />
                  VCN
                </span>
              </div>

              {/* Chip */}
              <div className="absolute top-7 left-3 w-7 h-5 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner grid grid-cols-2 gap-px p-0.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-sm bg-yellow-600/40" />
                ))}
              </div>

              {/* Contactless */}
              <div className="absolute top-7 left-12">
                <Wifi size={11} className="text-white/60 rotate-90" />
              </div>

              {/* Visa wordmark */}
              <div className="absolute top-3 right-3">
                <svg viewBox="0 0 71 23" className="h-3 w-auto" fill="none">
                  <path fill="white" fillRule="evenodd" clipRule="evenodd" d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"/>
                </svg>
              </div>

              {/* Card number */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 mt-1">
                <p className="font-mono text-white text-[10px] tracking-[0.18em]">•••• •••• •••• 4829</p>
              </div>

              {/* Bottom row */}
              <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                <div>
                  <p className="text-[6px] text-white/50 uppercase tracking-widest mb-0.5">Card Holder</p>
                  <p className="text-white text-[8px] font-semibold tracking-wide uppercase">GOV PROCUREMENT</p>
                </div>
                <div className="text-right">
                  <p className="text-[6px] text-white/50 uppercase tracking-widest mb-0.5">Expires</p>
                  <p className="text-white text-[8px] font-semibold">03/29</p>
                </div>
              </div>
            </div>

            {/* ── Back face ── */}
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] shadow-2xl select-none"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
              {/* Magnetic stripe */}
              <div className="mt-5 h-5 bg-black/60" />
              {/* Signature strip */}
              <div className="mx-3 mt-2 flex items-center gap-1.5">
                <div className="flex-1 h-4 rounded-sm" style={{ background: 'repeating-linear-gradient(90deg,#e2e8f0 0px,#e2e8f0 3px,#cbd5e1 3px,#cbd5e1 6px)' }} />
                <div className="w-8 h-4 rounded-sm bg-white/10 flex items-center justify-center">
                  <span className="text-white/60 font-mono text-[5px]">CVV</span>
                </div>
              </div>
              <p className="text-center text-white/20 font-mono text-[5px] tracking-wider mt-2 px-3">
                AUTHORIZED USE ONLY · VISA GOVERNMENT
              </p>
              {/* Visa on back */}
              <div className="absolute bottom-2.5 right-3">
                <svg viewBox="0 0 71 23" className="h-2.5 w-auto opacity-40" fill="none">
                  <path fill="white" fillRule="evenodd" clipRule="evenodd" d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"/>
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

    </aside>
  );
}
