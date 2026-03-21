import { Bid, Supplier, RFP, DimensionScores, ScoredBid } from '@/lib/mock-data/types';

export const WEIGHTS = {
  price: 0.30,
  delivery: 0.20,
  reliability: 0.25,
  compliance: 0.15,
  risk: 0.10,
} as const;

function computeDimensions(bid: Bid, supplier: Supplier, rfp: RFP): DimensionScores {
  const price = Math.max(0, Math.min(100, (1 - bid.amount / rfp.budgetCeiling) * 100));
  const delivery = Math.max(0, Math.min(100, (1 - bid.deliveryDays / 365) * 100));
  const reliability = supplier.pastPerformance;
  const compliance =
    (supplier.complianceStatus === 'Compliant' ? 60 : supplier.complianceStatus === 'Pending Review' ? 30 : 0) +
    Math.min(40, supplier.certifications.length * 10);
  const risk = Math.max(0, 100 - supplier.riskScore);

  return { price, delivery, reliability, compliance, risk };
}

function computeComposite(dimensions: DimensionScores): number {
  return Math.round(
    dimensions.price * WEIGHTS.price +
    dimensions.delivery * WEIGHTS.delivery +
    dimensions.reliability * WEIGHTS.reliability +
    dimensions.compliance * WEIGHTS.compliance +
    dimensions.risk * WEIGHTS.risk
  );
}

export function scoreBids(bids: Bid[], suppliers: Supplier[], rfp: RFP): ScoredBid[] {
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

  const scored: ScoredBid[] = [];

  for (const bid of bids) {
    const supplier = supplierMap.get(bid.supplierId);
    if (!supplier) continue;

    const dimensions = computeDimensions(bid, supplier, rfp);
    const composite = computeComposite(dimensions);

    scored.push({
      bid,
      supplier,
      dimensions,
      composite,
      rank: 0,
      isWinner: false,
    });
  }

  scored.sort((a, b) => b.composite - a.composite);

  for (let i = 0; i < scored.length; i++) {
    scored[i].rank = i + 1;
    scored[i].isWinner = i === 0;
  }

  return scored;
}

export function generateNarrative(ranked: ScoredBid[]): string {
  if (ranked.length === 0) return 'No bids to evaluate.';
  if (ranked.length === 1) {
    const winner = ranked[0];
    return `${winner.supplier.name} is the sole bidder with a composite score of ${winner.composite}/100.`;
  }

  const winner = ranked[0];
  const runnerUp = ranked[1];

  const dimensionNames: (keyof DimensionScores)[] = ['price', 'delivery', 'reliability', 'compliance', 'risk'];

  // Winner's top dimension
  let topDimension = dimensionNames[0];
  let topDimensionValue = winner.dimensions[topDimension];
  for (const dim of dimensionNames) {
    if (winner.dimensions[dim] > topDimensionValue) {
      topDimension = dim;
      topDimensionValue = winner.dimensions[dim];
    }
  }

  // Runner-up's weakest dimension
  let weakestDimension = dimensionNames[0];
  let weakestValue = runnerUp.dimensions[weakestDimension];
  for (const dim of dimensionNames) {
    if (runnerUp.dimensions[dim] < weakestValue) {
      weakestDimension = dim;
      weakestValue = runnerUp.dimensions[dim];
    }
  }

  const gap = winner.composite - runnerUp.composite;

  return `Based on ${winner.supplier.name}'s strong ${topDimension} score of ${topDimensionValue}/100 and competitive pricing at $${winner.bid.amount.toLocaleString()}, they represent the best value. ${runnerUp.supplier.name} scored ${gap} points lower, primarily due to ${weakestDimension}.`;
}
