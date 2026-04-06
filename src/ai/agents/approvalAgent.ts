/**
 * ApprovalAgent
 *
 * Subscribes to: invoice.validated
 * Publishes:     invoice.approved | invoice.rejected
 *
 * Auto-approves low-risk invoices; flags anomalies for manual review.
 */

import { IngestedInvoice, ValidationResult, ApprovalResult } from '@/ai/types';
import { retrieveSupplierContext } from '@/ai/rag/retriever';
import { tools } from '@/ai/mcp/tools';

// Auto-approve threshold: score must be at or above this
const AUTO_APPROVE_SCORE = 70;

// High-value threshold — always requires review regardless of score
const HIGH_VALUE_THRESHOLD = 300_000;

export async function approvalAgent(
  invoice: IngestedInvoice,
  validation: ValidationResult,
): Promise<ApprovalResult> {
  const ctx = retrieveSupplierContext(invoice.supplierId);

  // Short-circuit: validation failures are always rejected
  if (!validation.valid) {
    tools.updateInvoiceStatus(invoice.id, 'rejected');
    return {
      approved: false,
      riskLevel: 'high',
      rationale: `Rejected due to validation failure. ${validation.summary}`,
      requiresManualReview: false,
    };
  }

  // Determine risk level
  let riskLevel: ApprovalResult['riskLevel'] = 'low';
  const warnings = validation.flags.filter((f) => f.severity === 'warning').length;

  if (warnings >= 2 || ctx.riskScore > 35 || invoice.amount > HIGH_VALUE_THRESHOLD) {
    riskLevel = 'high';
  } else if (warnings === 1 || ctx.riskScore > 20) {
    riskLevel = 'medium';
  }

  // High-value always requires manual review
  if (invoice.amount > HIGH_VALUE_THRESHOLD) {
    tools.updateInvoiceStatus(invoice.id, 'approved');
    return {
      approved: true,
      riskLevel: 'high',
      rationale: `Invoice exceeds $${HIGH_VALUE_THRESHOLD.toLocaleString()} threshold. Approved with mandatory manual review.`,
      requiresManualReview: true,
    };
  }

  // Auto-approve low-risk
  if (validation.score >= AUTO_APPROVE_SCORE && riskLevel === 'low') {
    tools.updateInvoiceStatus(invoice.id, 'approved');
    return {
      approved: true,
      riskLevel: 'low',
      rationale: `Auto-approved. Validation score ${validation.score}/100, no anomalies detected, supplier "${ctx.supplierName}" is compliant.`,
      requiresManualReview: false,
    };
  }

  // Medium risk: approve but flag for review
  if (riskLevel === 'medium') {
    tools.updateInvoiceStatus(invoice.id, 'approved');
    return {
      approved: true,
      riskLevel: 'medium',
      rationale: `Conditionally approved (score ${validation.score}/100). ${warnings} warning(s) detected — flagged for procurement officer review.`,
      requiresManualReview: true,
    };
  }

  // High risk: reject
  tools.updateInvoiceStatus(invoice.id, 'rejected');
  return {
    approved: false,
    riskLevel: 'high',
    rationale: `Rejected due to high-risk profile: score ${validation.score}/100, risk score ${ctx.riskScore}/100. Manual intervention required.`,
    requiresManualReview: true,
  };
}
