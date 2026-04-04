'use client';

import { useRef, useCallback, useEffect } from 'react';

/* ── Particle physics ─────────────────────────────────────────── */
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  w: number; h: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  shape: 'rect' | 'strip' | 'dot';
}

const COLORS = [
  '#1434CB', '#6366f1', '#4f46e5',   // Visa navy / indigo
  '#FAA61A', '#FCD34D',               // gold
  '#10b981', '#34d399',               // emerald
  '#ffffff', '#e0e7ff',               // white / soft lavender
];

function makeParticle(x: number, y: number): Particle {
  const angle = (Math.random() * 120 - 60) * (Math.PI / 180); // -60° to +60° from straight down
  const speed = 6 + Math.random() * 10;
  const shape: Particle['shape'] = Math.random() < 0.5 ? 'rect' : Math.random() < 0.7 ? 'strip' : 'dot';
  const w = shape === 'dot' ? 5 + Math.random() * 4 : shape === 'strip' ? 2 + Math.random() * 2 : 7 + Math.random() * 7;
  const h = shape === 'dot' ? w : shape === 'strip' ? 12 + Math.random() * 14 : 5 + Math.random() * 5;
  return {
    x, y,
    vx: Math.sin(angle) * speed,
    vy: -Math.cos(angle) * speed * 0.5 - Math.random() * 4, // slight upward burst
    w, h,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.25,
    opacity: 1,
    shape,
  };
}

/* ── Component ────────────────────────────────────────────────── */
export interface ConfettiHandle {
  fire: () => void;
}

export function useConfetti() {
  const handleRef = useRef<ConfettiHandle | null>(null);
  const fire = useCallback(() => handleRef.current?.fire(), []);
  return { handleRef, fire };
}

export function ConfettiCanvas({ handleRef }: { handleRef: React.MutableRefObject<ConfettiHandle | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const particles = useRef<Particle[]>([]);

  const fire = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    // Three burst origins: center-top, left quarter, right quarter
    const origins = [W * 0.35, W * 0.5, W * 0.65];
    const burst: Particle[] = [];
    origins.forEach((ox) => {
      for (let i = 0; i < 55; i++) burst.push(makeParticle(ox, H * 0.08));
    });
    particles.current = burst;

    cancelAnimationFrame(rafRef.current);

    const tick = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      particles.current = particles.current.filter((p) => p.opacity > 0.02 && p.y < H + 40);

      for (const p of particles.current) {
        // physics
        p.vy += 0.28;           // gravity
        p.vx *= 0.992;          // air drag
        p.vy *= 0.992;
        p.x  += p.vx;
        p.y  += p.vy;
        p.rotation += p.rotSpeed;

        // fade when near bottom or after long travel
        if (p.y > H * 0.72) p.opacity -= 0.022;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === 'dot') {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }

      if (particles.current.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Expose fire via ref
  useEffect(() => {
    handleRef.current = { fire };
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [fire, handleRef]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999, width: '100vw', height: '100vh' }}
    />
  );
}
