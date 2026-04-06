/**
 * Confidence scoring: maps AI pipeline output to 4 named dimensions
 * and a single final confidence score (0–100).
 */

import { ValidationResult, ValidationFlag } from '@/ai/types';

export interface InvoiceDimensions {
  legitimacy: number;           // invoice is authentic and self-consistent
  risk: number;                 // supplier risk & anomalies
  historicalConsistency: number;// alignment with past behaviour
  policyCompliance: number;     // contract limits & compliance rules
}

export interface ConfidenceScore extends InvoiceDimensions {
  confidence: number;           // 0–100 final weighted score
}

// Weights must sum to 1
const WEIGHTS = {
  legitimacy:            0.30,
  risk:                  0.25,
  historicalConsistency: 0.25,
  policyCompliance:      0.20,
} as const;

function flagImpact(flags: ValidationFlag[], codes: string[], warn = 10, critical = 35): number {
  let deduction = 0;
  for (const flag of flags) {
    if (codes.some((c) => flag.code.includes(c))) {
      deduction += flag.severity === 'critical' ? critical : flag.severity === 'warning' ? warn : 0;
    }
  }
  return deduction;
}

export function computeConfidence(
  validation: ValidationResult,
  supplierRiskScore: number,
  complianceStatus: string,
): ConfidenceScore {
  const { flags } = validation;

  // ── Legitimacy ─────────────────────────────────────────────────────
  let legitimacy = 100;
  // Any critical flag tanks legitimacy
  legitimacy -= flagImpact(flags, ['SUPPLIER_NON_COMPLIANT', 'EXCEEDS_CONTRACT_LIMIT'], 5, 40);
  // Warnings are minor
  legitimacy -= flags.filter((f) => f.severity === 'warning').length * 8;
  legitimacy = clamp(legitimacy);

  // ── Risk ───────────────────────────────────────────────────────────
  // Map supplier risk score (0 = no risk, 100 = max risk) to 0-100 inverse
  let risk = Math.max(0, 100 - supplierRiskScore * 1.4);
  risk -= flagImpact(flags, ['ANOMALY', 'HIGH_RISK'], 12, 30);
  risk = clamp(risk);

  // ── Historical Consistency ─────────────────────────────────────────
  let historicalConsistency = 95;
  const deviationCritical = flags.find(
    (f) => f.code === 'AMOUNT_ANOMALY_CRITICAL',
  );
  const deviationWarning = flags.find(
    (f) => f.code === 'AMOUNT_ANOMALY_WARNING',
  );
  const noHistory = flags.find((f) => f.code === 'NO_HISTORY');

  if (deviationCritical) historicalConsistency = 35;
  else if (deviationWarning) historicalConsistency = 68;
  else if (noHistory) historicalConsistency = 78; // no history → uncertain, not bad
  historicalConsistency = clamp(historicalConsistency);

  // ── Policy Compliance ─────────────────────────────────────────────
  let policyCompliance = 100;
  if (complianceStatus === 'Non-Compliant') policyCompliance -= 55;
  else if (complianceStatus === 'Pending Review') policyCompliance -= 18;
  policyCompliance -= flagImpact(flags, ['EXCEEDS_CONTRACT_LIMIT'], 0, 38);
  policyCompliance -= flagImpact(flags, ['NEAR_CONTRACT_LIMIT'], 8, 0);
  policyCompliance = clamp(policyCompliance);

  // ── Weighted confidence ────────────────────────────────────────────
  const confidence = Math.round(
    legitimacy            * WEIGHTS.legitimacy +
    risk                  * WEIGHTS.risk +
    historicalConsistency * WEIGHTS.historicalConsistency +
    policyCompliance      * WEIGHTS.policyCompliance,
  );

  return { legitimacy, risk, historicalConsistency, policyCompliance, confidence };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function confidenceToDecision(confidence: number): 'auto_approved' | 'manual_review' | 'rejected' {
  if (confidence >= 95) return 'auto_approved';
  if (confidence >= 40) return 'manual_review';
  return 'rejected';
}
