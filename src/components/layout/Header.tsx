'use client';

import { useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#1434CB] border-b border-white/[0.15] z-30 overflow-hidden">

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
          <svg viewBox="0 0 71 23" aria-label="Visa" className="h-6 w-auto shrink-0" fill="none">
            <path fill="white" fillRule="evenodd" clipRule="evenodd" d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"/>
          </svg>
          <div className="h-5 w-px bg-white/20" />
          <span className="text-white text-sm font-semibold tracking-wide">
            Government Procurement Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
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
