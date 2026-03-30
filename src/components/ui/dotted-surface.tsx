'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'> & {
  /** force a specific color mode; defaults to 'dark' */
  colorMode?: 'dark' | 'light';
};

/**
 * Contained dotted-wave surface — sizes itself to its parent element,
 * not to the window. Safe to embed anywhere (sidebar, card, etc.).
 */
export function DottedSurface({
  className,
  colorMode = 'dark',
  ...props
}: DottedSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const SEPARATION = 28;
    const AMOUNTX   = 18;
    const AMOUNTY   = 14;

    const w = container.clientWidth  || 224;
    const h = container.clientHeight || 120;

    // ── Scene ──────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(55, w / h, 1, 5000);
    camera.position.set(0, 120, 380);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── Particles ──────────────────────────────────────────────────────
    const positions: number[] = [];

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        positions.push(
          ix * SEPARATION - (AMOUNTX * SEPARATION) / 2,
          0,
          iy * SEPARATION - (AMOUNTY * SEPARATION) / 2,
        );
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    // Color: bright white/blue for dark sidebar
    const dotColor = colorMode === 'dark'
      ? new THREE.Color('#5b7fff')   // soft Visa-blue tint
      : new THREE.Color('#1434CB');

    const material = new THREE.PointsMaterial({
      size: 3.5,
      color: dotColor,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ── Animation ──────────────────────────────────────────────────────
    let count = 0;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const pos = geometry.attributes.position.array as Float32Array;

      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          pos[i * 3 + 1] =
            Math.sin((ix + count) * 0.35) * 16 +
            Math.sin((iy + count) * 0.55) * 16;
          i++;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      // Gently pulse opacity
      material.opacity = 0.4 + Math.sin(count * 0.5) * 0.15;

      renderer.render(scene, camera);
      count += 0.06;
    };

    animate();

    // ── Resize ─────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(container);

    // ── Cleanup ────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [colorMode]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-hidden', className)}
      {...props}
    />
  );
}
