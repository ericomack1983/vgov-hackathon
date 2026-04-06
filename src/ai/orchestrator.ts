/**
 * AI Orchestrator
 *
 * Event-driven pipeline router. Reads routing from SDD spec — no hardcoded logic.
 * Agents communicate exclusively via EventMessage envelopes.
 */

import { EventEmitter } from 'events';
import { AGENT_SPECS, buildEventRoutes, wildcardAgents } from '@/ai/sdd/spec';
import { invoiceValidationAgent } from '@/ai/agents/invoiceValidationAgent';
import { approvalAgent } from '@/ai/agents/approvalAgent';
import { paymentAgent } from '@/ai/agents/paymentAgent';
import { auditAgent, getAuditLogByCorrelationId } from '@/ai/agents/auditAgent';
import {
  EventMessage,
  IngestedInvoice,
  ValidationResult,
  ApprovalResult,
  PipelineResult,
} from '@/ai/types';

// ── Shared event bus ───────────────────────────────────────────────────────

export const eventBus = new EventEmitter();
eventBus.setMaxListeners(50);

// Build routes from SDD spec
const eventRoutes = buildEventRoutes(AGENT_SPECS);

// ── Helper: emit + audit ───────────────────────────────────────────────────

function emit<T>(
  event: string,
  data: T,
  correlationId: string,
  agent: string,
  invoiceId: string,
  supplierId: string,
): EventMessage<T> {
  const message: EventMessage<T> = {
    event,
    data,
    meta: { timestamp: new Date().toISOString(), agent, correlationId },
  };

  // Wildcard agents (audit) get every message
  for (const spec of wildcardAgents) {
    if (spec.name === 'audit') {
      auditAgent(message as EventMessage, invoiceId, supplierId);
    }
  }

  eventBus.emit(event, message);
  return message;
}

// ── Main pipeline ──────────────────────────────────────────────────────────

export async function runPipeline(invoice: IngestedInvoice): Promise<PipelineResult> {
  const correlationId = invoice.id;
  const { supplierId } = invoice;

  // ── Step 1: invoice.created ─────────────────────────────────────
  emit(
    'invoice.created',
    { invoiceId: invoice.id, supplierId, amount: invoice.amount },
    correlationId,
    'ingestion',
    invoice.id,
    supplierId,
  );

  // ── Step 2: invoice_validation agent ────────────────────────────
  const validation: ValidationResult = await invoiceValidationAgent(invoice);

  emit(
    'invoice.validated',
    { invoiceId: invoice.id, valid: validation.valid, score: validation.score, flags: validation.flags },
    correlationId,
    'invoice_validation',
    invoice.id,
    supplierId,
  );

  // ── Step 3: approval agent ───────────────────────────────────────
  const approval: ApprovalResult = await approvalAgent(invoice, validation);

  const approvalEvent = approval.approved ? 'invoice.approved' : 'invoice.rejected';
  emit(
    approvalEvent,
    { invoiceId: invoice.id, approved: approval.approved, riskLevel: approval.riskLevel },
    correlationId,
    'approval',
    invoice.id,
    supplierId,
  );

  // ── Step 4: payment agent (only if approved) ─────────────────────
  let paymentResult = null;

  if (approval.approved) {
    paymentResult = await paymentAgent(invoice, approval);

    const paymentEvent = paymentResult.success ? 'payment.executed' : 'payment.failed';
    emit(
      paymentEvent,
      {
        invoiceId: invoice.id,
        transactionId: paymentResult.transaction?.id,
        amount: invoice.amount,
        success: paymentResult.success,
        error: paymentResult.error,
      },
      correlationId,
      'payment',
      invoice.id,
      supplierId,
    );
  }

  // ── Collect audit trail for this pipeline run ────────────────────
  const auditTrail = getAuditLogByCorrelationId(correlationId);

  return {
    correlationId,
    invoice,
    validation,
    approval,
    payment: paymentResult,
    auditTrail,
    completedAt: new Date().toISOString(),
  };
}
