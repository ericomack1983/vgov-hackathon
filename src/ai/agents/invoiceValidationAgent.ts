/**
 * InvoiceValidationAgent
 *
 * Subscribes to: invoice.created
 * Publishes:     invoice.validated
 *
 * Validates invoice against:
 *  - Supplier compliance status
 *  - Contract limit
 *  - Deviation from historical average
 */

import { IngestedInvoice, ValidationResult, ValidationFlag, SupplierContext } from '@/ai/types';
import { retrieveSupplierContext } from '@/ai/rag/retriever';
import { tools } from '@/ai/mcp/tools';

const DEVIATION_WARNING_THRESHOLD = 0.30;  // 30% above avg → warning
const DEVIATION_CRITICAL_THRESHOLD = 0.75; // 75% above avg → critical

export async function invoiceValidationAgent(
  invoice: IngestedInvoice,
): Promise<ValidationResult> {
  const ctx: SupplierContext = retrieveSupplierContext(invoice.supplierId);
  const flags: ValidationFlag[] = [];
  let score = 100;

  // ── 1. Supplier compliance ────────────────────────────────────────
  if (ctx.complianceStatus === 'Non-Compliant') {
    flags.push({
      code: 'SUPPLIER_NON_COMPLIANT',
      severity: 'critical',
      message: `Supplier "${ctx.supplierName}" is Non-Compliant. Invoice blocked.`,
    });
    score -= 50;
  } else if (ctx.complianceStatus === 'Pending Review') {
    flags.push({
      code: 'SUPPLIER_PENDING_REVIEW',
      severity: 'warning',
      message: `Supplier "${ctx.supplierName}" compliance is under review.`,
    });
    score -= 15;
  }

  // ── 2. Contract limit check ───────────────────────────────────────
  if (invoice.amount > ctx.contractLimit) {
    flags.push({
      code: 'EXCEEDS_CONTRACT_LIMIT',
      severity: 'critical',
      message: `Invoice amount $${invoice.amount.toLocaleString()} exceeds contract limit $${ctx.contractLimit.toLocaleString()}.`,
    });
    score -= 40;
  } else if (invoice.amount > ctx.contractLimit * 0.9) {
    flags.push({
      code: 'NEAR_CONTRACT_LIMIT',
      severity: 'warning',
      message: `Invoice amount is within 10% of contract limit ($${ctx.contractLimit.toLocaleString()}).`,
    });
    score -= 10;
  }

  // ── 3. Deviation from historical average ─────────────────────────
  if (ctx.avgInvoiceAmount > 0) {
    const deviation = (invoice.amount - ctx.avgInvoiceAmount) / ctx.avgInvoiceAmount;

    if (deviation > DEVIATION_CRITICAL_THRESHOLD) {
      flags.push({
        code: 'AMOUNT_ANOMALY_CRITICAL',
        severity: 'critical',
        message: `Amount is ${(deviation * 100).toFixed(0)}% above historical average ($${Math.round(ctx.avgInvoiceAmount).toLocaleString()}).`,
      });
      score -= 30;
    } else if (deviation > DEVIATION_WARNING_THRESHOLD) {
      flags.push({
        code: 'AMOUNT_ANOMALY_WARNING',
        severity: 'warning',
        message: `Amount is ${(deviation * 100).toFixed(0)}% above historical average ($${Math.round(ctx.avgInvoiceAmount).toLocaleString()}).`,
      });
      score -= 10;
    } else if (deviation < -0.5) {
      flags.push({
        code: 'AMOUNT_UNUSUALLY_LOW',
        severity: 'info',
        message: `Amount is ${Math.abs(deviation * 100).toFixed(0)}% below historical average — possible underquote.`,
      });
    }
  } else {
    // First invoice from this supplier
    flags.push({
      code: 'NO_HISTORY',
      severity: 'info',
      message: `No prior invoice history for "${ctx.supplierName}". Baseline established.`,
    });
  }

  // ── 4. Risk score check ───────────────────────────────────────────
  if (ctx.riskScore > 40) {
    flags.push({
      code: 'HIGH_RISK_SUPPLIER',
      severity: 'warning',
      message: `Supplier risk score is ${ctx.riskScore}/100 (elevated).`,
    });
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));
  const hasCritical = flags.some((f) => f.severity === 'critical');

  // Persist validated status
  tools.updateInvoiceStatus(
    invoice.id,
    hasCritical ? 'validation_failed' : 'validated',
  );

  return {
    valid: !hasCritical,
    score,
    flags,
    summary: hasCritical
      ? `Validation FAILED (score ${score}/100). ${flags.filter((f) => f.severity === 'critical').length} critical issue(s) found.`
      : `Validation PASSED (score ${score}/100). ${flags.length} flag(s) noted.`,
  };
}
