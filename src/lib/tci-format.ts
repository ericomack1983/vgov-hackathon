/**
 * es-GT formatting helpers for the TCI 2.0 modules.
 * Currency is GTQ (`Q18,000.00`); USD is shown as a secondary line on
 * international transactions at a fixed demo rate.
 */

export const USD_TO_GTQ = 7.75;

const gtqFormatter = new Intl.NumberFormat('es-GT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const gtqCompactFormatter = new Intl.NumberFormat('es-GT', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** `Q18,000.00` */
export function formatGTQ(amount: number): string {
  return `Q${gtqFormatter.format(amount)}`;
}

/** `Q18,000` — for tight spots like KPI tiles and progress labels */
export function formatGTQCompact(amount: number): string {
  return `Q${gtqCompactFormatter.format(Math.round(amount))}`;
}

/** `USD 650.00` */
export function formatUSD(amount: number): string {
  return `USD ${gtqFormatter.format(amount)}`;
}

export function usdToGTQ(usd: number): number {
  return Math.round(usd * USD_TO_GTQ * 100) / 100;
}

/** Parse a `YYYY-MM-DD` string as a local date (avoids UTC day-shift). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** `10 mar 2026` */
export function formatDateES(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

/** `10–15 mar 2026` (collapses shared month / year) */
export function formatDateRangeES(startISO: string, endISO: string): string {
  const s = parseISODate(startISO);
  const e = parseISODate(endISO);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${MONTHS_ES[s.getMonth()]} ${s.getFullYear()}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()} ${MONTHS_ES[s.getMonth()]} – ${e.getDate()} ${MONTHS_ES[e.getMonth()]} ${s.getFullYear()}`;
  }
  return `${formatDateES(startISO)} – ${formatDateES(endISO)}`;
}

/** `10 mar 2026, 14:32` — for transaction timestamps */
export function formatDateTimeES(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

/** Emoji flag from an ISO-3166 alpha-2 code. */
export function flagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  return String.fromCodePoint(
    ...countryCode.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/** Today's date as `YYYY-MM-DD` (local). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
