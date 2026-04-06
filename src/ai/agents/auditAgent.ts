/**
 * AuditAgent
 *
 * Subscribes to: * (all events)
 *
 * Appends an immutable entry to the audit trail for every pipeline event.
 */

import { AuditEntry, EventMessage } from '@/ai/types';

// In-process audit log (append-only; in production: write to Supabase / SIEM)
const auditLog: AuditEntry[] = [];

export function auditAgent(message: EventMessage, invoiceId: string, supplierId: string): AuditEntry {
  const entry: AuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    correlationId: message.meta.correlationId,
    event: message.event,
    agent: message.meta.agent ?? 'system',
    invoiceId,
    supplierId,
    timestamp: message.meta.timestamp,
    details: typeof message.data === 'object' && message.data !== null
      ? (message.data as Record<string, unknown>)
      : { raw: message.data },
  };

  auditLog.push(entry);
  return entry;
}

export function getAuditLog(): AuditEntry[] {
  return [...auditLog];
}

export function getAuditLogByCorrelationId(correlationId: string): AuditEntry[] {
  return auditLog.filter((e) => e.correlationId === correlationId);
}
