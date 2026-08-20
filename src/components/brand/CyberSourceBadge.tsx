'use client';

/**
 * Visa · CyberSource marks.
 *
 * The rails that actually process a payment should be named where the payment
 * happens, in the same visual language as the VPC Reporting API chip on
 * /reconciliation — one badge, two tones, rather than an emoji per screen.
 */

import { VisaLogo } from '@visa/nova-react';

/**
 * Inline chip: VISA logo + CyberSource wordmark.
 *
 * `light` sits on white surfaces, `dark` on the navy settlement panels.
 */
export function CyberSourceBadge({
  label = 'CyberSource',
  tone = 'light',
  className = '',
}: {
  label?: string;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const palette = tone === 'dark'
    ? { color: '#93bbff', background: 'rgba(20,52,203,0.22)', border: '1px solid rgba(147,187,255,0.25)' }
    : { color: '#1434CB', background: 'rgba(20,52,203,0.06)', border: '1px solid rgba(20,52,203,0.14)' };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold tracking-wide whitespace-nowrap ${className}`}
      style={palette}
    >
      <VisaLogo
        style={{ height: 9, width: 'auto', '--v-logo-color': palette.color } as React.CSSProperties}
      />
      <span style={{ letterSpacing: '0.04em' }}>{label}</span>
    </span>
  );
}

/**
 * Square tile carrying the Visa mark, for list rows where an icon slot needs to
 * say "this rail is processed by Visa · CyberSource".
 */
export function VisaMarkTile({
  active = false,
  size = 38,
}: {
  active?: boolean;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl shrink-0 transition-colors duration-200"
      style={{
        width: size,
        height: size,
        background: active ? '#1434CB' : 'rgba(20,52,203,0.08)',
      }}
    >
      <VisaLogo
        style={{
          height: size * 0.32,
          width: 'auto',
          '--v-logo-color': active ? '#ffffff' : '#1434CB',
        } as React.CSSProperties}
      />
    </span>
  );
}
