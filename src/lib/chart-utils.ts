export interface DonutSegment {
  color: string;
  percentage: number;
  label: string;
  value: number;
}

export function computeDonutSegments(
  usdTotal: number,
  usdcTotal: number
): DonutSegment[] {
  const total = usdTotal + usdcTotal;
  if (total === 0) return [];
  return [
    { color: '#1434CB', percentage: usdTotal / total, label: 'Visa (USD)', value: usdTotal },
    { color: '#8b5cf6', percentage: usdcTotal / total, label: 'USDC (Visa Network)', value: usdcTotal },
  ];
}

export interface ChartPoint {
  x: number;
  y: number;
  label: string;
  value: number;
}

export function buildAreaPath(
  points: ChartPoint[],
  width: number,
  height: number
): string {
  if (points.length === 0) return '';
  const line = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');
  return `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
}

export function transactionsToChartPoints(
  transactions: Array<{ createdAt: string; amount: number; status: string }>,
  width: number,
  height: number,
  padding: number = 20
): ChartPoint[] {
  const settled = transactions
    .filter((t) => t.status === 'Settled')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (settled.length === 0) return [];

  let cumulative = 0;
  const cumulativePoints = settled.map((t) => {
    cumulative += t.amount;
    return { date: t.createdAt, total: cumulative };
  });

  const maxTotal = cumulativePoints[cumulativePoints.length - 1].total;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return cumulativePoints.map((p, i) => ({
    x: padding + (settled.length === 1 ? usableWidth / 2 : (i / (settled.length - 1)) * usableWidth),
    y: padding + usableHeight - (p.total / maxTotal) * usableHeight,
    label: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: p.total,
  }));
}

export function computeCategorySpend(
  transactions: Array<{ amount: number; status: string; rfpId: string }>,
  rfps: Array<{ id: string; category: string }>
): { category: string; amount: number }[] {
  const rfpCategories = new Map(rfps.map((r) => [r.id, r.category]));
  const totals: Record<string, number> = {};

  transactions
    .filter((t) => t.status === 'Settled')
    .forEach((t) => {
      // Create a snake_case key to match the user's expected 'food_services', 'technology' format from the image.
      const rawCategory = rfpCategories.get(t.rfpId) || 'Uncategorized';
      const snakeCategory = rawCategory.toLowerCase().replace(/\s+/g, '_');
      totals[snakeCategory] = (totals[snakeCategory] || 0) + t.amount;
    });

  return Object.entries(totals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
