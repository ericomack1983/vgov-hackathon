import { Bid, Supplier, RFP, DimensionScores, ScoredBid } from '@/lib/mock-data/types';

export const WEIGHTS = {
  price:       0.25,
  delivery:    0.20,
  reliability: 0.20,
  compliance:  0.15,
  risk:        0.10,
  vaa:         0.10, // Visa Advanced Authorization Score
} as const;

function computeDimensions(bid: Bid, supplier: Supplier, rfp: RFP): DimensionScores {
  const price       = Math.max(0, Math.min(100, (1 - bid.amount / rfp.budgetCeiling) * 100));
  const delivery    = Math.max(0, Math.min(100, (1 - bid.deliveryDays / 365) * 100));
  const reliability = supplier.pastPerformance;
  const compliance  =
    (supplier.complianceStatus === 'Compliant' ? 60 : supplier.complianceStatus === 'Pending Review' ? 30 : 0) +
    Math.min(40, supplier.certifications.length * 10);
  const risk = Math.max(0, 100 - supplier.riskScore);
  const vaa  = supplier.vaaScore ?? 50; // default 50 if not fetched

  return { price, delivery, reliability, compliance, risk, vaa };
}

function computeComposite(dimensions: DimensionScores): number {
  return Math.round(
    dimensions.price       * WEIGHTS.price +
    dimensions.delivery    * WEIGHTS.delivery +
    dimensions.reliability * WEIGHTS.reliability +
    dimensions.compliance  * WEIGHTS.compliance +
    dimensions.risk        * WEIGHTS.risk +
    dimensions.vaa         * WEIGHTS.vaa
  );
}

export function scoreBids(bids: Bid[], suppliers: Supplier[], rfp: RFP): ScoredBid[] {
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));
  const scored: ScoredBid[] = [];

  for (const bid of bids) {
    const supplier = supplierMap.get(bid.supplierId);
    if (!supplier) continue;
    const dimensions = computeDimensions(bid, supplier, rfp);
    const composite  = computeComposite(dimensions);
    scored.push({ bid, supplier, dimensions, composite, rank: 0, isWinner: false });
  }

  scored.sort((a, b) => b.composite - a.composite);
  scored.forEach((s, i) => { s.rank = i + 1; s.isWinner = i === 0; });
  return scored;
}

export function generateOverrideNarrative(selected: ScoredBid, best: ScoredBid): string {
  const dims = ['price', 'delivery', 'reliability', 'compliance', 'risk', 'vaa'] as (keyof DimensionScores)[];
  const gap = best.composite - selected.composite;

  // Find the dimension where selected is furthest behind best
  let weakDim = dims[0];
  let worstGap = -Infinity;
  for (const d of dims) {
    const diff = best.dimensions[d] - selected.dimensions[d];
    if (diff > worstGap) { worstGap = diff; weakDim = d; }
  }

  // Find the dimension where selected actually beats best (if any)
  let edgeDim: string | null = null;
  let edgeGap = 0;
  for (const d of dims) {
    const diff = selected.dimensions[d] - best.dimensions[d];
    if (diff > edgeGap) { edgeGap = diff; edgeDim = d; }
  }

  const vaaLine = best.dimensions.vaa > selected.dimensions.vaa
    ? ` Visa VAA score confirms ${best.supplier.name} carries lower payment risk (${best.dimensions.vaa} vs ${selected.dimensions.vaa.toFixed(0)}).`
    : '';

  const edgeLine = edgeDim && edgeGap > 2
    ? ` Note: ${selected.supplier.name} does edge ahead on ${edgeDim} (+${edgeGap.toFixed(0)} pts), but this dimension carries less weight in the composite model.`
    : '';

  return `⚠ Manual override detected. You selected ${selected.supplier.name} (rank #${selected.rank}, ${selected.composite}/100), bypassing the AI recommendation.\n\n${best.supplier.name} scores ${gap} points higher at ${best.composite}/100. The largest gap is in ${weakDim}: ${best.supplier.name} scores ${best.dimensions[weakDim].toFixed(0)} vs ${selected.dimensions[weakDim].toFixed(0)} for ${selected.supplier.name}.${vaaLine}${edgeLine}\n\nThis override will be logged for audit and compliance review.`;
}

export function generateNarrative(ranked: ScoredBid[]): string {
  if (ranked.length === 0) return 'No bids to evaluate.';
  if (ranked.length === 1) {
    const w = ranked[0];
    return `${w.supplier.name} is the sole bidder with a composite score of ${w.composite}/100 and a VAA Score of ${w.dimensions.vaa}.`;
  }
  const winner   = ranked[0];
  const runnerUp = ranked[1];
  const dims     = ['price','delivery','reliability','compliance','risk','vaa'] as (keyof DimensionScores)[];
  let topDim = dims[0], topVal = winner.dimensions[dims[0]];
  for (const d of dims) if (winner.dimensions[d] > topVal) { topDim = d; topVal = winner.dimensions[d]; }
  let weakDim = dims[0], weakVal = runnerUp.dimensions[dims[0]];
  for (const d of dims) if (runnerUp.dimensions[d] < weakVal) { weakDim = d; weakVal = runnerUp.dimensions[d]; }
  const gap = winner.composite - runnerUp.composite;
  return `${winner.supplier.name} leads with a composite score of ${winner.composite}/100 and a Visa Advanced Authorization (VAA) Score of ${winner.dimensions.vaa}, reflecting high payment reliability. Their strongest dimension is ${topDim} (${topVal.toFixed(0)}/100). ${runnerUp.supplier.name} scored ${gap} points lower, primarily due to weak ${weakDim} (${weakVal.toFixed(0)}/100).`;
}
