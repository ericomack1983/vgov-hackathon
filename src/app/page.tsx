'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BeforePortal } from '@/components/BeforePortal';
import { InstallAnimation } from '@/components/InstallAnimation';

type Mode = 'before' | 'installing' | 'after';

export default function DemoController() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('before');
  const [visible, setVisible] = useState(true);

  // If already authenticated, go straight to the app
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  function transition(next: Mode) {
    setVisible(false);
    setTimeout(() => {
      setMode(next);
      setVisible(true);
    }, 300);
  }

  useEffect(() => {
    if (mode === 'after') {
      router.push('/login');
    }
  }, [mode, router]);

  // Wait for auth to resolve before rendering anything
  if (loading) return null;
  // Already logged in — suppress render while redirect fires
  if (user) return null;

  return (
    <div
      className="transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {mode === 'before' && (
        <BeforePortal onInstall={() => transition('installing')} />
      )}
      {mode === 'installing' && (
        <InstallAnimation onComplete={() => transition('after')} />
      )}
    </div>
  );
}
