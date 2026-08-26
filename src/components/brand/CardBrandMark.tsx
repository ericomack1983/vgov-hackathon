'use client';

/**
 * Network mark for the card faces.
 *
 * Visa renders through Nova's own `VisaLogo` rather than the word "VISA" set in
 * a bold font — the real wordmark has its own letterforms and proportions, and a
 * typeface approximation reads as a mock-up on a card image. Nova ships no
 * Mastercard or Amex logo, so those keep a text wordmark.
 */

import { VisaLogo } from '@visa/nova-react';

type Brand = 'Visa' | 'Mastercard' | 'Amex';

const TEXT_LABEL: Record<Exclude<Brand, 'Visa'>, string> = {
  Mastercard: 'MC',
  Amex: 'AMEX',
};

export function CardBrandMark({
  brand,
  height = 20,
  color = 'white',
}: {
  brand: Brand;
  /** Logo height in px; the width follows the mark's own aspect ratio. */
  height?: number;
  color?: string;
}) {
  if (brand === 'Visa') {
    return (
      <VisaLogo
        aria-label="Visa"
        style={{ height, width: 'auto', display: 'block', '--v-logo-color': color } as React.CSSProperties}
      />
    );
  }

  return (
    <span
      className="font-black tracking-widest"
      style={{ color, fontSize: height * 0.7, lineHeight: 1 }}
    >
      {TEXT_LABEL[brand]}
    </span>
  );
}
