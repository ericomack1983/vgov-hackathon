/**
 * Card payment pipe — CyberSource direct Payments API.
 *
 * Runs `authorize` (POST /pts/v2/payments) then `capture`
 * (POST /pts/v2/payments/{id}/captures) against the shared sandbox account.
 * Card data never reaches the browser: the client sends an amount and a brand,
 * and the brand selects a documented sandbox test card on this side.
 *
 * Credentials resolve inside cybs-client (`loadCredentials`): real env vars →
 * ./.env → ~/.cybs/sandbox.env. Nothing secret lives in this repo.
 */

import { NextRequest, NextResponse } from 'next/server';
import cybs from '@/lib/cybs/cybs-client';
import {
  buildEnhancedData,
  summarizeEnhancedData,
  EnhancedDataError,
  type EnhancedDataInput,
  type EnhancedDataSummary,
} from '@/lib/cybs/enhancedData';

// The CyberSource SDK is Node-only (crypto, fs, http signatures).
export const runtime = 'nodejs';

type Brand = 'Visa' | 'Mastercard' | 'Amex';

// Demo cards carry only a last4, so the brand picks the sandbox PAN. `type` on
// each entry is the CyberSource card code (001 Visa · 002 MC · 003 Amex).
const CARD_FOR_BRAND: Record<Brand, unknown> = {
  Visa:       cybs.TEST_CARDS.visa,
  Mastercard: cybs.TEST_CARDS.mastercard,
  Amex:       cybs.TEST_CARDS.amex,
};

/** Subset of the CyberSource payment response this route reads. */
interface CybsResponse {
  id?: string;
  status?: string;
  reconciliationId?: string;
  submitTimeUtc?: string;
  processorInformation?: { approvalCode?: string; responseCode?: string };
  errorInformation?: { reason?: string; message?: string };
}

/** Error shape cybs-client rejects with — real HTTP status plus parsed body. */
interface CybsError extends Error {
  httpStatus?: number;
  body?: { correlationId?: string; reason?: string } | string | null;
  details?: { field?: string; reason?: string }[] | null;
}

function badRequest(message: string): NextResponse {
  return NextResponse.json({ ok: false, stage: 'request', reason: message }, { status: 400 });
}

/**
 * Translate a CyberSource failure into something actionable. The status code is
 * what separates "our request is wrong" from "this account was never entitled".
 */
function describe(err: CybsError): { reason: string; hint?: string; correlationId?: string } {
  const body = typeof err.body === 'object' && err.body ? err.body : null;
  const fields = err.details?.map((d) => d.field).filter(Boolean).join(', ');

  switch (err.httpStatus) {
    case 400:
      return { reason: err.message, hint: fields ? `Invalid fields: ${fields}` : undefined };
    case 401:
      return { reason: 'CyberSource rejected the credentials', hint: 'Check CYBS_* values and the machine clock — HTTP Signature fails on skewed timestamps.' };
    case 403:
      return { reason: 'Request not permitted for this merchant account', hint: 'Service entitlement, not code. Contact support with the correlationId.', correlationId: body?.correlationId };
    default:
      return { reason: err.message || 'CyberSource request failed' };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body');
  }

  const { amount, brand, reference, currency, enhanced } = (body ?? {}) as Record<string, unknown>;

  const numericAmount = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return badRequest('`amount` must be a positive number');
  }
  if (typeof brand !== 'string' || !(brand in CARD_FOR_BRAND)) {
    return badRequest('`brand` must be one of Visa, Mastercard, Amex');
  }
  if (typeof reference !== 'string' || !reference.trim()) {
    return badRequest('`reference` is required — it becomes clientReferenceInformation.code');
  }

  // Amounts travel as strings; a JS number behaves unpredictably at CyberSource.
  const total = numericAmount.toFixed(2);
  const cur = typeof currency === 'string' && currency ? currency : 'USD';
  const card = CARD_FOR_BRAND[brand as Brand];

  // Level II / Level III enhanced data, when the caller supplied a purchase to
  // describe. Both the authorization and the capture carry it.
  let extra: Record<string, unknown> | undefined;
  let enhancedSummary: EnhancedDataSummary | undefined;
  if (enhanced) {
    try {
      const input = enhanced as EnhancedDataInput;
      extra = buildEnhancedData(input) as unknown as Record<string, unknown>;
      enhancedSummary = summarizeEnhancedData(input);
    } catch (e) {
      if (e instanceof EnhancedDataError) return badRequest(e.message);
      throw e;
    }
  }

  let auth: CybsResponse;
  try {
    auth = await cybs.authorize({
      amount: total,
      currency: cur,
      card,
      billTo: cybs.TEST_BILL_TO, // mandatory with a raw card — 400 MISSING_FIELD without it
      code: reference,
      extra,
    });
  } catch (e) {
    const err = describe(e as CybsError);
    const status = (e as CybsError).httpStatus;
    console.error('[cybs] authorize failed', { httpStatus: status, reason: err.reason, details: (e as CybsError).details });
    return NextResponse.json(
      { ok: false, stage: 'authorize', ...err },
      { status: status === 400 || status === 401 || status === 403 ? 200 : 502 },
    );
  }

  // Decision Manager flags some authorizations for review — large award amounts
  // trigger it routinely. The flag is advisory: the authorization is valid and
  // can still be captured, which is what a merchant does once it accepts the
  // order. Capturing also creates the settlement record, and Level II/III data
  // lives on settlement — an auth-only transaction shows no enhanced data in the
  // Business Center. So capture, and report the flag rather than hiding it.
  const flaggedForReview = auth.status === 'AUTHORIZED_PENDING_REVIEW';

  if (auth.status !== 'AUTHORIZED' && !flaggedForReview) {
    // A decline is a valid answer, not a transport failure — 200 with ok:false.
    return NextResponse.json({
      ok: false,
      stage: 'authorize',
      status: auth.status ?? 'UNKNOWN',
      reason: auth.errorInformation?.reason ?? auth.errorInformation?.message ?? 'Authorization declined',
      responseCode: auth.processorInformation?.responseCode,
      authorizationId: auth.id,
    }, { status: 200 });
  }

  let capture: CybsResponse;
  try {
    capture = await cybs.capture(auth.id, { amount: total, currency: cur, code: reference, extra });
  } catch (e) {
    const err = describe(e as CybsError);
    console.error('[cybs] capture failed', {
      httpStatus: (e as CybsError).httpStatus,
      reason: err.reason,
      details: (e as CybsError).details,
    });

    // The authorization succeeded, so a hold is sitting on the card for money
    // that will never be taken. Release it rather than leaving the cardholder's
    // limit consumed until it expires.
    let reversed = false;
    try {
      await cybs.reverse(auth.id, { amount: total, code: reference });
      reversed = true;
    } catch (reverseErr) {
      console.error('[cybs] auth reversal failed', {
        authorizationId: auth.id,
        reason: (reverseErr as CybsError).message,
      });
    }

    // The hold existed but the money never moved — say so rather than claiming success.
    return NextResponse.json(
      {
        ok: false,
        stage: 'capture',
        authorizationId: auth.id,
        approvalCode: auth.processorInformation?.approvalCode,
        authorizationReversed: reversed,
        ...err,
      },
      { status: 200 },
    );
  }

  // PENDING is the correct successful capture result — settlement runs in batch.
  return NextResponse.json({
    ok: true,
    ...(flaggedForReview
      ? { review: true, reviewReason: auth.errorInformation?.reason ?? 'DECISION_PROFILE_REVIEW' }
      : {}),
    authorizationId: auth.id,
    captureId: capture.id,
    status: capture.status,
    approvalCode: auth.processorInformation?.approvalCode,
    reconciliationId: capture.reconciliationId ?? auth.reconciliationId,
    submitTimeUtc: capture.submitTimeUtc ?? auth.submitTimeUtc,
    reference,
    amount: total,
    currency: cur,
    ...(enhancedSummary ? { enhanced: enhancedSummary } : {}),
  });
}
