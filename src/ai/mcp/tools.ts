/**
 * MCP-style tool wrappers over existing services.
 * These provide typed, named access to data sources — no business logic here.
 */

import { MOCK_SUPPLIERS } from '@/lib/mock-data/suppliers';
import { MOCK_RFPS } from '@/lib/mock-data/rfps';
import { MOCK_TRANSACTIONS } from '@/lib/mock-data/transactions';
import { Supplier, RFP, Transaction } from '@/lib/mock-data/types';
import { IngestedInvoice } from '@/ai/types';

// In-process invoice store (replaces DB for this demo)
const invoiceStore = new Map<string, IngestedInvoice>();

export const tools = {
  // ── Supplier service ──────────────────────────────────────────────

  getSupplier(id: string): Supplier | undefined {
    return MOCK_SUPPLIERS.find((s) => s.id === id);
  },

  listSuppliers(): Supplier[] {
    return MOCK_SUPPLIERS;
  },

  // ── RFP / invoice service ─────────────────────────────────────────

  getRFP(id: string): RFP | undefined {
    return MOCK_RFPS.find((r) => r.id === id);
  },

  getSupplierInvoiceHistory(supplierId: string): IngestedInvoice[] {
    return Array.from(invoiceStore.values()).filter(
      (inv) => inv.supplierId === supplierId,
    );
  },

  createInvoice(invoice: IngestedInvoice): IngestedInvoice {
    invoiceStore.set(invoice.id, invoice);
    return invoice;
  },

  updateInvoiceStatus(
    id: string,
    status: IngestedInvoice['status'],
  ): IngestedInvoice | undefined {
    const inv = invoiceStore.get(id);
    if (!inv) return undefined;
    const updated = { ...inv, status };
    invoiceStore.set(id, updated);
    return updated;
  },

  getInvoice(id: string): IngestedInvoice | undefined {
    return invoiceStore.get(id);
  },

  // ── Payment service ───────────────────────────────────────────────

  getTransactionsBySupplier(supplierId: string): Transaction[] {
    return MOCK_TRANSACTIONS.filter((t) => t.supplierId === supplierId);
  },

  createTransaction(tx: Transaction): Transaction {
    // In a real system this would persist; here we just return it
    return tx;
  },
};

export type Tools = typeof tools;
