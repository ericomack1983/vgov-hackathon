'use client';

import { useEffect, useState, useRef } from 'react';

const STEPS = [
  { label: 'Initializing payment rails...',                   color: '#4ade80' },
  { label: 'Establishing TLS 1.3 mutual authentication...',   color: '#22d3ee' },
  { label: 'Generating JWE encryption keys...',               color: '#60a5fa' },
  { label: 'Connecting to Visa network...',                   color: '#a78bfa' },
  { label: 'Installing Visa Supplier Matching Service API...', color: '#fbbf24' },
  { label: 'Installing Visa Pseudo Account API...',           color: '#fb923c' },
  { label: 'Installing Visa Payment Controls API...',         color: '#f87171' },
  { label: 'Provisioning virtual cards...',                   color: '#e879f9' },
  { label: 'Applying MCC restrictions: Healthcare...',        color: '#2dd4bf' },
  { label: 'Enabling real-time authorization...',             color: '#c084fc' },
  { label: 'Activating AI procurement agent...',              color: '#fbbf24' },
  { label: 'Enabling instant settlement...',                  color: '#34d399' },
];

const LINE_DELAY = 560;
const NUM_RUNGS  = 26;

interface Props { onComplete: () => void }

export function InstallAnimation({ onComplete }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const progressRef  = useRef(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [done, setDone] = useState(false);

  // Keep progressRef in sync without restarting the canvas loop
  useEffect(() => {
    progressRef.current = visibleCount / STEPS.length;
  }, [visibleCount]);

  // Single continuous canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) return;

    // Retina sharpness
    const dpr = window.devicePixelRatio || 1;
    const W_CSS = 180, H_CSS = 500;
    canvas.width  = W_CSS * dpr;
    canvas.height = H_CSS * dpr;
    canvas.style.width  = `${W_CSS}px`;
    canvas.style.height = `${H_CSS}px`;
    ctx.scale(dpr, dpr);

    const cx = W_CSS / 2;
    const amp = 52;
    const start = Date.now();
    let animId: number;

    function draw() {
      const t       = (Date.now() - start) / 1000;
      const prog    = progressRef.current;
      const numLit  = Math.floor(prog * NUM_RUNGS);
      const rotSpeed = 0.5 + prog * 1.4; // DNA spins faster as it evolves

      ctx.clearRect(0, 0, W_CSS, H_CSS);

      const spacing = (H_CSS - 40) / NUM_RUNGS;

      // ── Backbone strands ──────────────────────────────────────────
      for (let strand = 0; strand < 2; strand++) {
        const phase = strand === 0 ? 0 : Math.PI;
        ctx.beginPath();
        for (let i = 0; i <= NUM_RUNGS; i++) {
          const y     = 20 + i * spacing;
          const angle = (i / NUM_RUNGS) * Math.PI * 6 + t * rotSpeed + phase;
          const x     = cx + amp * Math.sin(angle);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const strandColor = strand === 0 ? '34,197,94' : '99,102,241';
        ctx.strokeStyle = prog > 0.05
          ? `rgba(${strandColor},${0.25 + 0.55 * prog})`
          : 'rgba(60,60,60,0.5)';
        ctx.lineWidth   = 1.5;
        ctx.shadowColor = prog > 0.05 ? `rgb(${strandColor})` : 'transparent';
        ctx.shadowBlur  = prog > 0.05 ? 6 * prog : 0;
        ctx.stroke();
      }

      // ── Rungs + nodes ─────────────────────────────────────────────
      ctx.shadowBlur = 0;
      for (let i = 0; i < NUM_RUNGS; i++) {
        const y     = 20 + i * spacing;
        const angle = (i / NUM_RUNGS) * Math.PI * 6 + t * rotSpeed;
        const x1    = cx + amp * Math.sin(angle);
        const x2    = cx + amp * Math.sin(angle + Math.PI);

        const isLit   = i < numLit;
        const stepIdx = Math.min(Math.floor((i / NUM_RUNGS) * STEPS.length), STEPS.length - 1);
        const col     = STEPS[stepIdx].color;
        const depth   = (Math.cos(angle) + 1) / 2; // 0–1 for 3-D illusion

        // Rung connector
        const rungAlpha = isLit ? 0.35 + 0.55 * depth : 0.06;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = isLit
          ? col + Math.round(rungAlpha * 255).toString(16).padStart(2, '0')
          : `rgba(35,35,35,${rungAlpha})`;
        ctx.lineWidth   = isLit ? 1 + depth * 1.5 : 0.8;
        ctx.shadowColor = isLit ? col : 'transparent';
        ctx.shadowBlur  = isLit ? 8 * depth : 0;
        ctx.stroke();

        // Nodes (size grows with depth for 3-D pop)
        const r = isLit ? 2.5 + depth * 3.5 : 1.8;
        for (const x of [x1, x2]) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle  = isLit ? col : '#1c1c1c';
          ctx.shadowColor = isLit ? col : 'transparent';
          ctx.shadowBlur  = isLit ? 14 * depth : 0;
          ctx.fill();
        }
      }

      // ── Completion pulse ──────────────────────────────────────────
      if (prog >= 1) {
        ctx.shadowBlur = 0;
        const pulse = (Math.sin(t * 2.5) + 1) / 2;
        const g = ctx.createRadialGradient(cx, H_CSS / 2, 0, cx, H_CSS / 2, 90);
        g.addColorStop(0, `rgba(52,211,153,${0.18 * pulse})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W_CSS, H_CSS);
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Step progression
  useEffect(() => {
    if (visibleCount < STEPS.length) {
      const t = setTimeout(() => setVisibleCount(c => c + 1), LINE_DELAY);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone(true), 600);
    return () => clearTimeout(t);
  }, [visibleCount]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(onComplete, 1500);
    return () => clearTimeout(t);
  }, [done, onComplete]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 font-mono">
      <div className="w-full max-w-3xl flex gap-10 items-center">

        {/* DNA helix */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <p className="text-gray-600 text-[10px] tracking-widest uppercase">System DNA</p>
          <canvas ref={canvasRef} />
          <p
            className="text-[10px] tracking-widest uppercase transition-all duration-700"
            style={{ color: done ? '#34d399' : '#374151' }}
          >
            {done ? 'Evolved ✦' : 'Mutating…'}
          </p>
        </div>

        {/* Install log */}
        <div className="flex-1">
          <p className="text-green-500 text-xs mb-6 opacity-50">$ govpay install --env=production</p>

          <div className="space-y-[6px]">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="text-sm flex items-center gap-2 transition-all duration-500"
                style={{
                  opacity:   i < visibleCount ? 1 : 0,
                  transform: i < visibleCount ? 'translateX(0)' : 'translateX(-10px)',
                }}
              >
                <span style={{ color: step.color }}>▸</span>
                <span style={{ color: step.color }}>{step.label}</span>
              </div>
            ))}
          </div>

          {done && (
            <div className="mt-8 space-y-2">
              <p className="text-green-400 text-base font-semibold tracking-wide animate-pulse">
                ✅ GovPay SDK Installed
              </p>
              <p className="text-green-600 text-xs">
                Launching AI procurement dashboard…
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
