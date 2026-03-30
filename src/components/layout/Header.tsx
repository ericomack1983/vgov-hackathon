'use client';

import { useRouter } from 'next/navigation';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Landmark, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-700 z-30 overflow-hidden">

      {/* Flowing diagonal ribbons — Visa brand motion */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg width="100%" height="100%" viewBox="0 0 1440 64" preserveAspectRatio="xMidYMid slice">
          <defs>
            <style>{`
              @keyframes ribbonDrift {
                0%   { transform: translateX(0); }
                100% { transform: translateX(-120px); }
              }
              .ribbons { animation: ribbonDrift 14s linear infinite; }
            `}</style>
          </defs>
          <g className="ribbons">
            {/* Wide soft bands — varying opacity for depth */}
            {[
              { x1: 820, x2: 1060, op: 0.07, w: 38 },
              { x1: 860, x2: 1100, op: 0.10, w: 22 },
              { x1: 895, x2: 1135, op: 0.13, w: 14 },
              { x1: 922, x2: 1162, op: 0.17, w: 9  },
              { x1: 944, x2: 1184, op: 0.22, w: 6  },
              { x1: 962, x2: 1202, op: 0.28, w: 4  },
              { x1: 978, x2: 1218, op: 0.18, w: 3  },
              { x1: 992, x2: 1232, op: 0.10, w: 2  },
              /* Gold accent */
              { x1: 955, x2: 1195, op: 0.55, w: 1.2, gold: true },
            ].map((r, i) => (
              <line
                key={i}
                x1={r.x1} y1={80}
                x2={r.x2} y2={-20}
                stroke={r.gold ? '#F7B600' : 'white'}
                strokeWidth={r.w}
                strokeOpacity={r.op}
              />
            ))}
            {/* Duplicate set offset right for seamless loop */}
            {[
              { x1: 1060, x2: 1300, op: 0.07, w: 38 },
              { x1: 1100, x2: 1340, op: 0.10, w: 22 },
              { x1: 1135, x2: 1375, op: 0.13, w: 14 },
              { x1: 1162, x2: 1402, op: 0.17, w: 9  },
              { x1: 1184, x2: 1424, op: 0.22, w: 6  },
              { x1: 1202, x2: 1442, op: 0.28, w: 4  },
              { x1: 1218, x2: 1458, op: 0.18, w: 3  },
              { x1: 1232, x2: 1472, op: 0.10, w: 2  },
              { x1: 1195, x2: 1435, op: 0.55, w: 1.2, gold: true },
            ].map((r, i) => (
              <line
                key={`b${i}`}
                x1={r.x1} y1={80}
                x2={r.x2} y2={-20}
                stroke={r.gold ? '#F7B600' : 'white'}
                strokeWidth={r.w}
                strokeOpacity={r.op}
              />
            ))}
          </g>
        </svg>
      </div>

      <div className="flex items-center justify-between px-6 h-full relative">
        {/* Visa wordmark + product name */}
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 72 24" aria-label="Visa" className="h-6 w-auto shrink-0">
            <path fill="white" d="M27.5 1.2l-4.7 21.6h-5L22.4 1.2h5.1zm19.4 14l2.6-7.2 1.5 7.2h-4.1zm5.6 7.6h4.6L53 1.2h-4.2c-.9 0-1.7.5-2.1 1.3L39.3 22.8h5l1-2.7h6.1l.6 2.7zm-12.5-7c0-4.9-6.8-5.2-6.7-7.4 0-.7.6-1.4 2-1.5 1.3-.1 2.7.1 3.9.7l.7-3.3C38.7 3.8 37.2 3.5 35.7 3.5c-4.7 0-8 2.5-8 6 0 2.6 2.3 4.1 4.1 4.9 1.8.9 2.4 1.5 2.4 2.3 0 1.2-1.4 1.8-2.8 1.8-2.3 0-3.6-.6-4.7-1.1l-.8 3.5c1.1.5 3 .9 5.1.9 4.8 0 8-2.4 8-6.1zm-17.2-14.6L16.4 22.8h-5.1L8.4 4.9C8.2 4 7.7 3.2 6.8 2.8 5.3 2.1 3.5 1.6 1.9 1.3L2 1.2h8.1c1.1 0 2 .7 2.3 1.8l2.1 11.1 5.3-12.9h5.1z"/>
          </svg>
          <div className="h-5 w-px bg-white/20" />
          <span className="text-white text-sm font-semibold tracking-wide">
            Government Procurement Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <RoleSwitcher />
          <NotificationBell />
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-white/20">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white leading-none">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
