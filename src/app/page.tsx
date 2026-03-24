'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BeforePortal } from '@/components/BeforePortal';
import { InstallAnimation } from '@/components/InstallAnimation';

type Mode = 'before' | 'installing' | 'after';

export default function DemoController() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('before');
  const [visible, setVisible] = useState(true);

  function transition(next: Mode) {
    setVisible(false);
    setTimeout(() => {
      setMode(next);
      setVisible(true);
    }, 300);
  }

  // When mode flips to 'after', navigate into the real app
  useEffect(() => {
    if (mode === 'after') {
      router.push('/dashboard');
    }
  }, [mode, router]);

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
