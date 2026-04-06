/**
 * RAG retriever — builds supplier context from historical data.
 * Used by agents to ground decisions in real history rather than guessing.
 */

import { tools } from '@/ai/mcp/tools';
import { SupplierContext } from '@/ai/types';

// Mock contract limits per supplier (would come from a contracts DB in production)
const CONTRACT_LIMITS: Record<string, number> = {
  'sup-001': 500_000,
  'sup-002': 200_000,
  'sup-003': 400_000,
  'sup-004': 300_000,
  'sup-005': 600_000,
  'sup-006': 250_000,
  'sup-007': 350_000,
  'sup-008': 150_000,
};

const DEFAULT_CONTRACT_LIMIT = 100_000;

export function retrieveSupplierContext(supplierId: string): SupplierContext {
  const supplier = tools.getSupplier(supplierId);

  if (!supplier) {
    return {
      supplierId,
      supplierName: 'Unknown Supplier',
      complianceStatus: 'Non-Compliant',
      riskScore: 100,
      pastInvoiceCount: 0,
      avgInvoiceAmount: 0,
      maxInvoiceAmount: 0,
      contractLimit: DEFAULT_CONTRACT_LIMIT,
      recentAmounts: [],
    };
  }

  // Pull invoice history from store
  const invoiceHistory = tools.getSupplierInvoiceHistory(supplierId);

  // Also use historical transactions from mock data
  const txHistory = tools.getTransactionsBySupplier(supplierId);
  const txAmounts = txHistory.map((t) => t.amount);
  const invoiceAmounts = invoiceHistory.map((i) => i.amount);

  const allAmounts = [...txAmounts, ...invoiceAmounts];
  const recentAmounts = allAmounts.slice(-10); // last 10

  const avgInvoiceAmount =
    allAmounts.length > 0
      ? allAmounts.reduce((s, a) => s + a, 0) / allAmounts.length
      : 0;

  const maxInvoiceAmount =
    allAmounts.length > 0 ? Math.max(...allAmounts) : 0;

  return {
    supplierId,
    supplierName: supplier.name,
    complianceStatus: supplier.complianceStatus,
    riskScore: supplier.riskScore,
    pastInvoiceCount: allAmounts.length,
    avgInvoiceAmount,
    maxInvoiceAmount,
    contractLimit: CONTRACT_LIMITS[supplierId] ?? DEFAULT_CONTRACT_LIMIT,
    recentAmounts,
  };
}
