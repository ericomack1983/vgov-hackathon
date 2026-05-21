'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Nav, NavAppName, VisaLogo, Typography } from '@visa/nova-react';
import { VisaSettingsLow, VisaChevronRightTiny } from '@visa/nova-icons-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/context/AuthContext';

/* Circular frosted-glass icon button — bell & gear */
function NavIconBtn({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: 'rgba(255,255,255,0.13)',
      border: '1px solid rgba(255,255,255,0.22)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, position: 'relative',
      '--v-icon-primary': 'white',
      '--v-icon-secondary': 'rgba(255,255,255,0.7)',
    } as React.CSSProperties}>
      {children}
    </div>
  );
}

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const initials = user?.email?.charAt(0).toUpperCase() ?? 'U';
  const username = user?.email?.split('@')[0] ?? '';

  return (
    <Nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
      height: '4rem',
      /* Override surface/nav defaults */
      borderRadius: 0,
      boxShadow: 'none',
      /* Theme overrides */
      '--v-nav-background':    '#1434CB',
      '--v-surface-background':'#1434CB',
      '--v-nav-foreground':    'white',
      '--v-nav-app-name':      'white',
      /* White logo */
      '--v-logo-color':        'white',
      /* Gold bottom accent */
      borderBottom: '3px solid #f7b600',
    } as React.CSSProperties}>

      {/* Left — logo + separator + app name */}
      <VisaLogo />
      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.3)', margin: '0 20px', flexShrink: 0 }} />
      <NavAppName style={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.01em' }}>
        Government Procurement Portal
      </NavAppName>

      {/* Right — icon buttons + user chip */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Notification bell */}
        <NavIconBtn>
          <NotificationBell />
        </NavIconBtn>

        {/* Settings */}
        <NavIconBtn>
          <button
            aria-label="Settings"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
          >
            <VisaSettingsLow style={{ width: 20, height: 20 }} />
          </button>
        </NavIconBtn>

        {/* User pill chip */}
        {user && (
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.13)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 9999,
              padding: '5px 10px 5px 5px',
              cursor: 'pointer',
              '--v-icon-primary': 'rgba(255,255,255,0.65)',
              '--v-icon-secondary': 'rgba(255,255,255,0.5)',
            } as React.CSSProperties}
          >
            {/* Gold avatar circle */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#f7b600', color: '#1A1F71',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, flexShrink: 0,
              fontFamily: 'inherit',
            }}>
              {initials}
            </div>
            {/* Username */}
            <Typography
              tag="span"
              className="v-typography-body-2-bold"
              style={{ color: 'white', whiteSpace: 'nowrap' }}
            >
              {username}
            </Typography>
            {/* Arrow */}
            <VisaChevronRightTiny style={{ width: 14, height: 14, flexShrink: 0 }} />
          </button>
        )}
      </div>
    </Nav>
  );
}
