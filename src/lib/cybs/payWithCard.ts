/**
 * Browser-side entry point for the card pipe.
 *
 * Posts to /api/payments/card, which runs the real CyberSource
 * authorize → capture. No card data is involved on this side: the selected
 * card's brand is all the server needs to pick a sandbox PAN.
 *
 * Every call is mirrored into the SDK console (/sdk-logs) so the payment leg is
 * visible next to the VCN/VPA/B2B calls it sits behind.
 */

import { sdkLogger } from '@/lib/sdk-logger';
import type { EnhancedDataInput, EnhancedDataSummary } from '@/lib/cybs/enhancedData';

export interface CardPaymentRequest {
  /** Charge amount in major units — formatted to 2 decimals server-side. */
  amount: number;
  brand: 'Visa' | 'Mastercard' | 'Amex';
  /** Becomes clientReferenceInformation.code — use the order id. */
  reference: string;
  currency?: string;
  /**
   * Level II / Level III commercial card data. Sent on both the authorization
   * and the capture, so the settled record carries the line items.
   */
  enhanced?: EnhancedDataInput;
}

export interface CardPaymentSuccess {
  ok: true;
  /** POST /pts/v2/payments — the authorization hold. */
  authorizationId: string;
  /**
   * POST /pts/v2/payments/{id}/captures — settles in the next batch. Absent when
   * Decision Manager held the authorization for review, since nothing captured.
   */
  captureId?: string;
  /** `PENDING` after capture, `AUTHORIZED_PENDING_REVIEW` when held. */
  status: string;
  /** The authorization succeeded but is held for manual review — funds unmoved. */
  review?: boolean;
  reviewReason?: string;
  /** Issuer approval — `831000` in sandbox. */
  approvalCode?: string;
  reconciliationId?: string;
  submitTimeUtc?: string;
  /** Present when Level II/III data accompanied the payment. */
  enhanced?: EnhancedDataSummary;
}

export interface CardPaymentFailure {
  ok: false;
  stage: 'request' | 'authorize' | 'capture' | 'network';
  reason: string;
  hint?: string;
  status?: string;
  correlationId?: string;
  /** Present when the authorization succeeded but the capture did not. */
  authorizationId?: string;
}

export type CardPaymentResult = CardPaymentSuccess | CardPaymentFailure;

const ENDPOINT = '/pts/v2/payments';

export async function payWithCard(req: CardPaymentRequest): Promise<CardPaymentResult> {
  const startedAt = performance.now();

  const log = (status: 'success' | 'error', response: unknown, error?: string) => {
    sdkLogger.log({
      service: 'CYBS',
      method: 'authorize + capture',
      endpoint: ENDPOINT,
      status,
      durationMs: Math.round(performance.now() - startedAt),
      payload: req, // amount/brand/reference only — never a PAN
      response,
      error,
    });
  };

  let result: CardPaymentResult;
  try {
    const res = await fetch('/api/payments/card', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
    result = (await res.json()) as CardPaymentResult;
  } catch (e) {
    const failure: CardPaymentFailure = {
      ok: false,
      stage: 'network',
      reason: e instanceof Error ? e.message : 'Could not reach the payment service',
    };
    log('error', null, failure.reason);
    return failure;
  }

  if (result.ok) log('success', result);
  else log('error', result, result.reason);

  return result;
}
