'use client';

import Link from 'next/link';
import {
  VisaDashboardLow,
  VisaCardGenericLow,
  VisaGlobalLow,
  VisaDocumentLow,
  VisaWalletLow,
  VisaCheckmarkLow,
  VisaTransactionsLow,
  VisaSecurityLockLow,
  VisaNotificationsLow,
  VisaLogLow,
  VisaArtificialIntelligenceLow,
  VisaLogCompletedLow,
  VisaFileUploadLow,
  VisaArrowForwardTiny,
  VisaArrowBackTiny,
  VisaCartLow,
  VisaTransitAirplaneLow,
  VisaGovernmentLow,
} from '@visa/nova-icons-react';
import { features } from '@/lib/features';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useUI } from '@/context/UIContext';
import { useSidebarActions, SidebarAction } from '@/context/SidebarActionsContext';
import { usePayment } from '@/context/PaymentContext';
import { SidebarCard } from './SidebarCard';

type NovaIcon = React.ComponentType<{ style?: React.CSSProperties; 'aria-hidden'?: boolean }>;

const ICON_WHITE  = { '--v-icon-primary': 'rgba(255,255,255,0.8)', '--v-icon-secondary': 'rgba(255,255,255,0.55)' } as React.CSSProperties;
const ICON_BRIGHT = { '--v-icon-primary': 'white',                 '--v-icon-secondary': 'white'                 } as React.CSSProperties;
const ICON_GOLD   = { '--v-icon-primary': '#f7b600',               '--v-icon-secondary': '#f7b600'               } as React.CSSProperties;

type NavItem = { label: string; href: string; icon: NovaIcon };

const NAV_ITEMS: Record<string, NavItem[]> = {
  gov: [
    { label: 'Dashboard',      href: '/dashboard',      icon: VisaDashboardLow      },
    { label: 'Cards',          href: '/cards',          icon: VisaCardGenericLow    },
    ...(features.missions
      ? [{ label: 'Misiones',  href: '/misiones',       icon: VisaTransitAirplaneLow as NovaIcon }]
      : []),
    { label: 'Suppliers',      href: '/suppliers',      icon: VisaGlobalLow         },
    { label: 'Procurement',    href: '/rfp',            icon: VisaDocumentLow       },
    { label: 'Marketplace',    href: '/petty-cash',     icon: VisaCartLow           },
    { label: 'Payments',       href: '/payment',        icon: VisaWalletLow         },
    { label: 'Reconciliation', href: '/reconciliation', icon: VisaCheckmarkLow      },
    { label: 'Transactions',   href: '/transactions',   icon: VisaTransactionsLow   },
    { label: 'Audit Trail',    href: '/audit',          icon: VisaSecurityLockLow   },
    { label: 'Notifications',  href: '/notifications',  icon: VisaNotificationsLow  },
    ...(features.entityHierarchy
      ? [{ label: 'Entidades', href: '/entidades',      icon: VisaGovernmentLow as NovaIcon }]
      : []),
    { label: 'SDK Logs',       href: '/sdk-logs',       icon: VisaLogLow            },
  ],
  supplier: [
    { label: 'My Bids',       href: '/bids',          icon: VisaDocumentLow       },
    { label: 'Notifications', href: '/notifications', icon: VisaNotificationsLow  },
  ],
  auditor: [
    { label: 'Audit Trail',   href: '/audit',          icon: VisaSecurityLockLow  },
    { label: 'Transactions',  href: '/transactions',   icon: VisaTransactionsLow  },
    { label: 'Notifications', href: '/notifications',  icon: VisaNotificationsLow },
  ],
};

const ACTION_ICON_MAP: Record<string, NovaIcon> = {
  ai:      VisaArtificialIntelligenceLow,
  award:   VisaLogCompletedLow,
  payment: VisaCardGenericLow,
  upload:  VisaFileUploadLow,
};

/**
 * These buttons sit on the blue sidebar, so a translucent blue fill left them
 * barely legible against it. The surface is white and the ink is the variant's
 * brand colour — the inversion is what makes them readable, and the tint pulse
 * stays subtle enough not to eat the contrast.
 */
const ACTION_STYLES: Record<string, { ink: string; tint: string; border: string }> = {
  ai:      { ink: '#4f46e5', tint: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: 'rgba(99,102,241,0.35)' },
  award:   { ink: '#059669', tint: 'linear-gradient(135deg,#059669,#10b981)', border: 'rgba(16,185,129,0.35)' },
  payment: { ink: '#1434CB', tint: 'linear-gradient(135deg,#1434CB,#6366f1)', border: 'rgba(20,52,203,0.35)'  },
  upload:  { ink: '#0284c7', tint: 'linear-gradient(135deg,#0ea5e9,#6366f1)', border: 'rgba(14,165,233,0.35)' },
};

const RING_DELAYS = [0, 0.7, 1.4];

const EASE = [0.4, 0, 0.2, 1] as const;

function ProcurementActions({ actions, collapsed }: { actions: SidebarAction[]; collapsed: boolean }) {
  return (
    <AnimatePresence>
      {actions.length > 0 && !collapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
          style={{ padding: '0 12px', overflow: 'hidden' }}
        >
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', margin: '4px 0 10px' }} />
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8, paddingLeft: 4 }}>
            Procurement Actions
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {actions.map((action, i) => {
              const cfg = ACTION_STYLES[action.variant] ?? ACTION_STYLES.ai;
              const Icon = ACTION_ICON_MAP[action.variant] ?? VisaDocumentLow;

              const btn = (
                <motion.div
                  key={action.id}
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -16, opacity: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                  style={{ position: 'relative', width: '100%' }}
                >
                  {RING_DELAYS.map((delay, ri) => (
                    <motion.div
                      key={ri}
                      style={{
                        position: 'absolute', inset: 0, borderRadius: 12,
                        border: '1.5px solid rgba(255,255,255,0.55)',
                        pointerEvents: 'none',
                      }}
                      animate={{ scale: [1, 1.55], opacity: [0.65, 0] }}
                      transition={{ duration: 2.1, repeat: Infinity, delay, ease: 'easeOut' }}
                    />
                  ))}

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      position: 'relative', width: '100%', borderRadius: 12,
                      overflow: 'hidden', cursor: 'pointer',
                      background: '#ffffff',
                      border: `1px solid ${cfg.border}`,
                      boxShadow: '0 2px 10px rgba(3,10,40,0.22)',
                      '--v-icon-primary': cfg.ink,
                      '--v-icon-secondary': cfg.ink,
                    } as React.CSSProperties}
                  >
                    <motion.div
                      style={{ position: 'absolute', inset: 0, background: cfg.tint }}
                      animate={{ opacity: [0.05, 0.13, 0.05] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                    />
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                      <Icon style={{ width: 14, height: 14, flexShrink: 0 }} aria-hidden />
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.ink, flex: 1, lineHeight: 1.3, letterSpacing: '0.01em' }}>{action.label}</span>
                      <VisaArrowForwardTiny style={{ width: 10, height: 10, flexShrink: 0 }} aria-hidden />
                    </div>
                  </motion.div>
                </motion.div>
              );

              if (action.href) return <Link key={action.id} href={action.href} style={{ display: 'block' }}>{btn}</Link>;
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  style={{
                    width: '100%', textAlign: 'left',
                    background: 'none', border: 'none', padding: 0,
                    opacity: action.disabled ? 0.4 : 1,
                    cursor: action.disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {btn}
                </button>
              );
            })}
          </div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', marginTop: 10 }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavItem({
  href, label, icon: Icon, isActive, badge, bellBump, collapsed,
}: {
  href: string;
  label: string;
  icon: NovaIcon;
  isActive: boolean;
  badge?: number;
  bellBump?: boolean;
  collapsed?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isNotifications = href === '/notifications';
  const iconVars = isActive ? ICON_GOLD : hovered ? ICON_BRIGHT : ICON_WHITE;

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 12,
        padding: collapsed ? '10px 0' : '10px 14px',
        borderRadius: 8, marginBottom: 2,
        fontSize: 13, fontWeight: isActive ? 700 : 500,
        color: isActive ? '#f7b600' : (hovered ? 'white' : 'rgba(255,255,255,0.85)'),
        textDecoration: 'none', position: 'relative',
        borderLeft: isActive ? '3px solid #f7b600' : '3px solid transparent',
        background: isActive ? 'rgba(247,182,0,0.12)' : hovered ? 'rgba(255,255,255,0.07)' : 'transparent',
        transition: 'color 0.15s, background 0.15s',
        overflow: 'hidden',
        ...iconVars,
      }}
    >
      {isNotifications ? (
        <span style={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
          <motion.span
            animate={bellBump ? { rotate: [0, -18, 18, -12, 12, -6, 6, 0] } : { rotate: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{ display: 'flex' }}
          >
            <Icon style={{ width: 18, height: 18 }} aria-hidden />
          </motion.span>
          {(badge ?? 0) > 0 && (
            <span style={{
              position: 'absolute', top: -5, right: -5,
              background: '#de3730', color: 'white',
              fontSize: 8, fontWeight: 700,
              minWidth: 14, height: 14, padding: '0 2px',
              borderRadius: 9999, display: 'flex',
              alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}>
              {(badge ?? 0) > 9 ? '9+' : badge}
            </span>
          )}
        </span>
      ) : (
        <Icon style={{ width: 18, height: 18, flexShrink: 0 }} aria-hidden />
      )}

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {!collapsed && isNotifications && (badge ?? 0) > 0 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              marginLeft: 'auto', background: '#de3730', color: 'white',
              fontSize: 9, fontWeight: 700, borderRadius: 9999,
              padding: '2px 6px', lineHeight: 1, whiteSpace: 'nowrap',
            }}
          >
            {(badge ?? 0) > 9 ? '9+' : badge}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

interface SidebarProps {
  currentPath: string;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ currentPath, collapsed, onToggle }: SidebarProps) {
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
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.38, ease: EASE }}
      style={{
        position: 'fixed', left: 0, top: '4rem',
        height: 'calc(100vh - 4rem)',
        background: '#1434CB',
        borderRight: '1px solid rgba(255,255,255,0.15)',
        zIndex: 20, display: 'flex', flexDirection: 'column',
        overflowY: 'auto', overflowX: 'hidden',
        ...ICON_WHITE,
      }}
    >
      <nav style={{ padding: '8px', flex: 1 }}>
        {items.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={
              item.href === currentPath ||
              /* rutas TCI 2.0 con detalle anidado (/misiones/:id) */
              (item.href === '/misiones' && currentPath.startsWith('/misiones/'))
            }
            badge={item.href === '/notifications' ? unreadCount : undefined}
            bellBump={item.href === '/notifications' ? bellBump : undefined}
            collapsed={collapsed}
          />
        ))}
        <ProcurementActions actions={actions} collapsed={collapsed} />
      </nav>

      {/* Premium floating Visa card — brand accent */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ overflow: 'hidden', flexShrink: 0 }}
          >
            <SidebarCard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <div style={{
        padding: collapsed ? '12px 0' : '12px 8px',
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'flex-end',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <motion.button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.14)' }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            cursor: 'pointer', flexShrink: 0,
            ...ICON_WHITE,
          }}
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.38, ease: EASE }}
            style={{ display: 'flex' }}
          >
            <VisaArrowBackTiny style={{ width: 12, height: 12 }} aria-hidden />
          </motion.span>
        </motion.button>
      </div>
    </motion.aside>
  );
}
