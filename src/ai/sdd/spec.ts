/**
 * SDD (Spec-Driven Development) agent specification.
 *
 * Defines which agent handles which event, and what it publishes.
 * The orchestrator reads this at startup — no hardcoded routing.
 */

export interface AgentSpec {
  name: string;
  subscribes: string;  // event name or "*" for wildcard
  publishes: string | null;
  description: string;
}

export const AGENT_SPECS: AgentSpec[] = [
  {
    name: 'invoice_validation',
    subscribes: 'invoice.created',
    publishes: 'invoice.validated',
    description: 'Validates invoice against supplier history, compliance, and contract limits using RAG.',
  },
  {
    name: 'approval',
    subscribes: 'invoice.validated',
    publishes: 'invoice.approved',
    description: 'Auto-approves low-risk invoices; flags anomalies for manual review.',
  },
  {
    name: 'payment',
    subscribes: 'invoice.approved',
    publishes: 'payment.executed',
    description: 'Triggers payment via Visa B2B rails after approval.',
  },
  {
    name: 'audit',
    subscribes: '*',
    publishes: null,
    description: 'Logs all pipeline events to the immutable audit trail.',
  },
];

// Build a lookup map: event → agent specs that handle it
export function buildEventRoutes(specs: AgentSpec[]): Map<string, AgentSpec[]> {
  const routes = new Map<string, AgentSpec[]>();

  for (const spec of specs) {
    if (spec.subscribes === '*') continue; // wildcards handled separately
    const existing = routes.get(spec.subscribes) ?? [];
    routes.set(spec.subscribes, [...existing, spec]);
  }

  return routes;
}

export const wildcardAgents = AGENT_SPECS.filter((s) => s.subscribes === '*');
