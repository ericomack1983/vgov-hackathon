'use client';

import Link from 'next/link';
import {
  LayoutDashboard, CreditCard, Users, FileText,
  Wallet, Bell, Shield, Receipt, FileCheck, Wifi,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUI } from '@/context/UIContext';
import {
  itemVariants, backVariants, glowVariants, sharedTransition,
} from '@/components/ui/glow-menu';

/* ── Per-item glow + icon colour config ──────────────────────────────── */
const NAV_STYLE: Record<string, { gradient: string; iconColor: string }> = {
  '/dashboard':      { gradient: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, rgba(37,99,235,0.08) 50%, transparent 100%)',  iconColor: 'text-blue-400'   },
  '/cards':          { gradient: 'radial-gradient(circle, rgba(167,139,250,0.22) 0%, rgba(124,58,237,0.08) 50%, transparent 100%)', iconColor: 'text-violet-400' },
  '/suppliers':      { gradient: 'radial-gradient(circle, rgba(34,211,238,0.22) 0%, rgba(6,182,212,0.08) 50%, transparent 100%)',   iconColor: 'text-cyan-400'   },
  '/rfp':            { gradient: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(79,70,229,0.08) 50%, transparent 100%)',   iconColor: 'text-indigo-400' },
  '/payment':        { gradient: 'radial-gradient(circle, rgba(52,211,153,0.22) 0%, rgba(16,185,129,0.08) 50%, transparent 100%)',  iconColor: 'text-emerald-400'},
  '/reconciliation': { gradient: 'radial-gradient(circle, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.08) 50%, transparent 100%)',  iconColor: 'text-amber-400'  },
  '/transactions':   { gradient: 'radial-gradient(circle, rgba(251,146,60,0.22) 0%, rgba(234,88,12,0.08) 50%, transparent 100%)',   iconColor: 'text-orange-400' },
  '/audit':          { gradient: 'radial-gradient(circle, rgba(251,113,133,0.22) 0%, rgba(225,29,72,0.08) 50%, transparent 100%)',  iconColor: 'text-rose-400'   },
  '/notifications':  { gradient: 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(14,165,233,0.08) 50%, transparent 100%)',  iconColor: 'text-sky-400'    },
  '/bids':           { gradient: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(79,70,229,0.08) 50%, transparent 100%)',   iconColor: 'text-indigo-400' },
};

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

export function Sidebar({ currentPath }: SidebarProps) {
  const { role } = useUI();
  const items = NAV_ITEMS[role] || NAV_ITEMS.gov;

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-slate-900 border-r border-slate-800 z-20 flex flex-col">
      <nav className="p-3 space-y-0.5 flex-1">
        {items.map((item) => {
          const isActive = item.href === currentPath;
          const Icon = item.icon;
          const style = NAV_STYLE[item.href] ?? {
            gradient: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 100%)',
            iconColor: 'text-slate-400',
          };

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
                style={{ background: style.gradient }}
              />

              {/* Active solid pill (behind glow) */}
              {isActive && (
                <div className="absolute inset-0 rounded-lg bg-[#1434CB]/80 z-0" />
              )}

              {/* ── FRONT FACE ── */}
              <Link href={item.href} className="block relative z-10">
                <motion.div
                  variants={itemVariants}
                  transition={sharedTransition}
                  style={{ transformStyle: 'preserve-3d', transformOrigin: 'center bottom' }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium',
                    isActive ? 'text-white' : 'text-slate-400',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors duration-300',
                      isActive ? 'text-white' : style.iconColor,
                    )}
                  />
                  {item.label}
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
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold h-full',
                    isActive ? 'text-white' : 'text-white',
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', style.iconColor)} />
                  {item.label}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </nav>

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
              className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1434CB] to-[#0a1f8f] shadow-2xl select-none"
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
                <svg viewBox="0 0 72 24" className="h-3 w-auto">
                  <path fill="white" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
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
                <svg viewBox="0 0 72 24" className="h-2.5 w-auto opacity-40">
                  <path fill="white" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

    </aside>
  );
}
