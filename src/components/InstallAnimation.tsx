'use client';

import { useEffect, useState } from 'react';

const LINES = [
  'Initializing payment rails...',
  'Connecting to Visa network...',
  'Provisioning virtual cards...',
  'Applying MCC restrictions: Healthcare...',
  'Enabling real-time authorization...',
  'Activating AI procurement agent...',
  'Enabling instant settlement...',
];

const LINE_DELAY = 420; // ms per line

interface Props {
  onComplete: () => void;
}

export function InstallAnimation({ onComplete }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visibleCount < LINES.length) {
      const t = setTimeout(() => setVisibleCount((c) => c + 1), LINE_DELAY);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setDone(true), 500);
      return () => clearTimeout(t);
    }
  }, [visibleCount]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(onComplete, 1100);
    return () => clearTimeout(t);
  }, [done, onComplete]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 font-mono">
      <div className="w-full max-w-xl space-y-1">

        {/* Prompt header */}
        <p className="text-green-500 text-xs mb-4 opacity-60">
          $ govpay install --env=production
        </p>

        {LINES.map((line, i) => (
          <div
            key={i}
            className={`text-sm transition-opacity duration-300 ${i < visibleCount ? 'opacity-100' : 'opacity-0'}`}
          >
            <span className="text-green-400 mr-2">▸</span>
            <span className="text-green-300">{line}</span>
          </div>
        ))}

        {done && (
          <div className="pt-4 space-y-2">
            <p className="text-green-400 text-base font-semibold tracking-wide animate-pulse">
              ✅ GovPay SDK Installed
            </p>
            <p className="text-green-600 text-xs">
              Launching AI procurement dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
