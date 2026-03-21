import { RFP, Transaction } from '@/lib/mock-data/types';

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: 'rfp_created' | 'rfp_published' | 'bid_submitted' | 'evaluation_run'
       | 'supplier_awarded' | 'override_applied' | 'payment_initiated'
       | 'payment_settled';
  description: string;
  rfpId: string;
  rfpTitle: string;
  actor: string;
  metadata?: Record<string, string>;
}

export function buildAuditTrail(rfps: RFP[], transactions: Transaction[]): AuditEvent[] {
  const events: AuditEvent[] = [];

  for (const rfp of rfps) {
    // RFP created
    events.push({
      id: `evt-${rfp.id}-created`,
      timestamp: rfp.createdAt,
      type: 'rfp_created',
      description: `RFP "${rfp.title}" created`,
      rfpId: rfp.id,
      rfpTitle: rfp.title,
      actor: 'Gov Officer',
    });

    // RFP published (if not Draft)
    if (rfp.status !== 'Draft') {
      const publishedAt = new Date(new Date(rfp.createdAt).getTime() + 60_000).toISOString();
      events.push({
        id: `evt-${rfp.id}-published`,
        timestamp: publishedAt,
        type: 'rfp_published',
        description: `RFP "${rfp.title}" published for bidding`,
        rfpId: rfp.id,
        rfpTitle: rfp.title,
        actor: 'Gov Officer',
      });
    }

    // Bids submitted
    for (const bid of rfp.bids) {
      events.push({
        id: `evt-${rfp.id}-bid-${bid.id}`,
        timestamp: bid.submittedAt,
        type: 'bid_submitted',
        description: `${bid.supplierName} submitted bid of $${bid.amount.toLocaleString()}`,
        rfpId: rfp.id,
        rfpTitle: rfp.title,
        actor: 'Supplier',
        metadata: { supplierId: bid.supplierId, amount: String(bid.amount) },
      });
    }

    // Evaluation run
    if (rfp.evaluationResults) {
      const lastBidTime = rfp.bids.length > 0
        ? Math.max(...rfp.bids.map(b => new Date(b.submittedAt).getTime()))
        : new Date(rfp.createdAt).getTime();
      const evalTime = new Date(lastBidTime + 120_000).toISOString();
      events.push({
        id: `evt-${rfp.id}-evaluation`,
        timestamp: evalTime,
        type: 'evaluation_run',
        description: `AI evaluation completed - ${rfp.evaluationResults.length} bids scored`,
        rfpId: rfp.id,
        rfpTitle: rfp.title,
        actor: 'System',
      });

      // Override applied
      if (rfp.overrideWinnerId) {
        const overrideTime = new Date(new Date(evalTime).getTime() + 60_000).toISOString();
        events.push({
          id: `evt-${rfp.id}-override`,
          timestamp: overrideTime,
          type: 'override_applied',
          description: `Manual override applied: ${rfp.overrideJustification}`,
          rfpId: rfp.id,
          rfpTitle: rfp.title,
          actor: 'Gov Officer',
        });
      }
    }

    // Supplier awarded
    if (rfp.selectedWinnerId && (rfp.status === 'Awarded' || rfp.status === 'Paid')) {
      const baseTime = rfp.evaluationResults
        ? Math.max(...rfp.bids.map(b => new Date(b.submittedAt).getTime())) + 180_000
        : new Date(rfp.createdAt).getTime() + 300_000;
      const awardTime = new Date(baseTime).toISOString();
      events.push({
        id: `evt-${rfp.id}-awarded`,
        timestamp: awardTime,
        type: 'supplier_awarded',
        description: `Supplier awarded for RFP "${rfp.title}"`,
        rfpId: rfp.id,
        rfpTitle: rfp.title,
        actor: 'Gov Officer',
      });
    }
  }

  // Transaction events
  for (const tx of transactions) {
    const rfp = rfps.find(r => r.id === tx.rfpId);
    const rfpTitle = rfp?.title ?? 'Unknown RFP';

    events.push({
      id: `evt-tx-${tx.id}-initiated`,
      timestamp: tx.createdAt,
      type: 'payment_initiated',
      description: `${tx.method} payment of $${tx.amount.toLocaleString()} to ${tx.supplierName}`,
      rfpId: tx.rfpId,
      rfpTitle,
      actor: 'Gov Officer',
      metadata: { orderId: tx.orderId, txHash: tx.txHash || '' },
    });

    if (tx.settledAt) {
      events.push({
        id: `evt-tx-${tx.id}-settled`,
        timestamp: tx.settledAt,
        type: 'payment_settled',
        description: `Payment settled - ${tx.method} $${tx.amount.toLocaleString()} to ${tx.supplierName}`,
        rfpId: tx.rfpId,
        rfpTitle,
        actor: 'System',
        metadata: { orderId: tx.orderId, txHash: tx.txHash || '' },
      });
    }
  }

  // Sort newest first
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events;
}

export function getEventIcon(type: AuditEvent['type']): string {
  const map: Record<AuditEvent['type'], string> = {
    rfp_created: 'FileText',
    rfp_published: 'Send',
    bid_submitted: 'FileInput',
    evaluation_run: 'Bot',
    supplier_awarded: 'Award',
    override_applied: 'AlertTriangle',
    payment_initiated: 'CreditCard',
    payment_settled: 'CheckCircle',
  };
  return map[type];
}

export function getEventColor(type: AuditEvent['type']): string {
  const map: Record<AuditEvent['type'], string> = {
    rfp_created: 'text-slate-500',
    rfp_published: 'text-indigo-500',
    bid_submitted: 'text-blue-500',
    evaluation_run: 'text-purple-500',
    supplier_awarded: 'text-emerald-500',
    override_applied: 'text-amber-500',
    payment_initiated: 'text-indigo-500',
    payment_settled: 'text-emerald-500',
  };
  return map[type];
}
