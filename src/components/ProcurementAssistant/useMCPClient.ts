'use client';

import { useCallback, useRef } from 'react';
import { TWO_PHASE_TOOLS, ConfirmationData, MCPCallResult } from './types';

/* ── Intent classification ────────────────────────────────────────────────── */
function classifyIntent(text: string): { tool: string; params: Record<string, unknown> } | null {
  const t = text.toLowerCase();

  // Supplier checks
  if (/bulk check|verify all|all suppliers/.test(t)) {
    const names = text.match(/["']([^"']+)["']/g)?.map(n => n.replace(/['"]/g, '')) ?? [];
    return { tool: 'sms_bulk_check_suppliers', params: { supplierNames: names } };
  }
  if (/check.*supplier|verify.*supplier|supplier.*register|is.*register|registered.*visa/.test(t)) {
    const nameMatch = text.match(/check\s+(?:if\s+)?([A-Z][a-zA-Z\s&.,]+?)(?:\s+is|\s+in|\s+for|$)/i);
    return {
      tool: 'sms_check_supplier',
      params: {
        supplierName: nameMatch?.[1]?.trim() ?? 'Unknown Supplier',
        supplierCountryCode: 'US',
      },
    };
  }

  // Bid evaluation
  if (/score.*bid|evaluat.*bid|rank.*bid|rfp|evaluat.*proposal/.test(t)) {
    const budgetMatch = text.match(/\$?([\d,]+)/);
    const rfpMatch = text.match(/rfp\s+([a-zA-Z0-9-]+)/i);
    return {
      tool: 'ai_evaluate_bids',
      params: {
        rfpId: rfpMatch?.[1] ?? 'RFP-001',
        budgetCeiling: budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, ''), 10) : 100000,
      },
    };
  }

  // Payment controls
  if (/suggest.*rule|payment control|spending rule|limit|ipc/.test(t)) {
    return {
      tool: 'vpc_suggest_rules',
      params: { prompt: text, currencyCode: '840' },
    };
  }
  if (/apply.*rule|set.*rule/.test(t)) {
    const accountMatch = text.match(/account\s+([a-zA-Z0-9-]+)/i);
    return {
      tool: 'vpc_apply_rules',
      params: { accountId: accountMatch?.[1] ?? 'VPC-ACCT-001', prompt: text },
    };
  }
  if (/get.*rule|current.*rule|show.*rule/.test(t)) {
    const accountMatch = text.match(/account\s+([a-zA-Z0-9-]+)/i);
    return { tool: 'vpc_get_rules', params: { accountId: accountMatch?.[1] ?? 'VPC-ACCT-001' } };
  }
  if (/transaction.*histor|declined.*transaction|histor.*transaction/.test(t)) {
    const accountMatch = text.match(/account\s+([a-zA-Z0-9-]+)/i);
    return {
      tool: 'vpc_get_transaction_history',
      params: { accountId: accountMatch?.[1] ?? 'VPC-ACCT-001' },
    };
  }

  // Issue virtual card
  if (/issue.*card|virtual card|vcn/.test(t)) {
    const amountMatch = text.match(/\$?([\d,]+)/);
    const supplierMatch = text.match(/(?:to|for)\s+([A-Z][a-zA-Z\s&.,]+?)(?:\s+\$|\s+for|\s+valid|,|$)/i);
    const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, ''), 10) : 10000;
    const d = new Date();
    return {
      tool: 'vcn_issue_virtual_card',
      params: {
        supplierName: supplierMatch?.[1]?.trim() ?? 'Supplier',
        amount,
        startDate: d.toISOString().split('T')[0],
        endDate: new Date(d.setMonth(d.getMonth() + 6)).toISOString().split('T')[0],
      },
    };
  }

  // BIP payment
  if (/initiate.*payment|bip|pay.*supplier|buyer.*initiat/.test(t)) {
    const amountMatch = text.match(/\$?([\d,]+)/);
    const supplierMatch = text.match(/(?:to|supplier)\s+([A-Z][a-zA-Z\s&.,]+?)(?:\s+\$|,|$)/i);
    return {
      tool: 'bip_initiate_payment',
      params: {
        supplierName: supplierMatch?.[1]?.trim() ?? 'Supplier',
        paymentAmount: amountMatch ? parseInt(amountMatch[1].replace(/,/g, ''), 10) : 5000,
      },
    };
  }

  // SIP
  if (/sip.*approv|approv.*sip|approv.*requisition/.test(t)) {
    const amountMatch = text.match(/\$?([\d,]+)/);
    const reqMatch = text.match(/requisition\s+([a-zA-Z0-9-]+)/i);
    return {
      tool: 'sip_approve_payment',
      params: {
        requisitionId: reqMatch?.[1] ?? 'SIP-REQ-001',
        approvedAmount: amountMatch ? parseInt(amountMatch[1].replace(/,/g, ''), 10) : 5000,
      },
    };
  }

  // Unblock
  if (/unblock|re-?enable|restore.*card|activate.*card|unfreeze/.test(t)) {
    const accountMatch = text.match(/account\s+([a-zA-Z0-9-]+)/i);
    return {
      tool: 'vpc_unblock_account',
      params: { accountId: accountMatch?.[1] ?? 'VPC-ACCT-001' },
    };
  }

  // Block
  if (/block|emergency.*block|freeze.*account/.test(t)) {
    const accountMatch = text.match(/account\s+([a-zA-Z0-9-]+)/i);
    return {
      tool: 'vpc_block_account',
      params: { accountId: accountMatch?.[1] ?? 'VPC-ACCT-001' },
    };
  }

  // Settlement
  if (/settl/.test(t)) {
    const amountMatch = text.match(/\$?([\d,]+)/);
    const orderMatch = text.match(/order\s+([a-zA-Z0-9-]+)/i);
    return {
      tool: 'settlement_initiate',
      params: {
        orderId: orderMatch?.[1] ?? 'ORD-001',
        amount: amountMatch ? parseInt(amountMatch[1].replace(/,/g, ''), 10) : 1000,
        method: 'USD',
      },
    };
  }

  // BIP status / cancel
  if (/payment.*status|status.*payment|bip.*status/.test(t)) {
    const paymentMatch = text.match(/payment\s+([a-zA-Z0-9-]+)/i);
    return { tool: 'bip_get_status', params: { paymentId: paymentMatch?.[1] ?? 'BIP-001' } };
  }
  if (/cancel.*payment/.test(t)) {
    const paymentMatch = text.match(/payment\s+([a-zA-Z0-9-]+)/i);
    return { tool: 'bip_cancel_payment', params: { paymentId: paymentMatch?.[1] ?? 'BIP-001' } };
  }

  return null;
}

/* ── Build a human-readable confirmation summary ───────────────── */
function buildConfirmationSummary(
  tool: string,
  params: Record<string, unknown>,
): ConfirmationData['summary'] {
  if (tool === 'vcn_issue_virtual_card') {
    return {
      title: '⚠ Confirmation required — Virtual Card',
      fields: [
        { label: 'Supplier', value: String(params.supplierName ?? '') },
        { label: 'Amount',   value: `$${Number(params.amount ?? 0).toLocaleString()}` },
        { label: 'Valid',    value: `${params.startDate} – ${params.endDate}` },
        { label: 'Network',  value: 'Visa B2B' },
      ],
    };
  }
  if (tool === 'bip_initiate_payment') {
    return {
      title: '⚠ Confirmation required — Payment',
      fields: [
        { label: 'Supplier', value: String(params.supplierName ?? '') },
        { label: 'Amount',   value: `$${Number(params.paymentAmount ?? 0).toLocaleString()}` },
        { label: 'Method',   value: 'Buyer-Initiated Payment (BIP)' },
        { label: 'Rails',    value: 'Visa network' },
      ],
    };
  }
  if (tool === 'sip_approve_payment') {
    return {
      title: '⚠ Confirmation required — SIP Approval',
      fields: [
        { label: 'Requisition', value: String(params.requisitionId ?? '') },
        { label: 'Amount',      value: `$${Number(params.approvedAmount ?? 0).toLocaleString()}` },
        { label: 'Method',      value: 'Supplier-Initiated Payment (SIP)' },
      ],
    };
  }
  return { title: 'Confirmation required', fields: [] };
}

/* ── Call the API proxy ────────────────────────────────────────── */
async function callMCP(
  tool: string,
  params: Record<string, unknown>,
): Promise<MCPCallResult> {
  const res = await fetch('/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, params }),
  });
  const json = await res.json() as { ok?: boolean; error?: string; data?: Record<string, unknown> };
  if (!res.ok || json.error) {
    return { ok: false, tool, error: json.error ?? 'Request failed' };
  }
  return { ok: true, tool, data: json.data as Record<string, unknown> };
}

/* ── Main hook ────────────────────────────────────────────────── */
export function useMCPClient() {
  const pendingConfirmRef = useRef<{
    tool: string;
    params: Record<string, unknown>;
    phase1Result?: Record<string, unknown>;
  } | null>(null);

  const processMessage = useCallback(async (
    text: string,
    onToolStart: (toolName: string) => void,
    onResult: (toolName: string, result: MCPCallResult) => void,
    onNeedsConfirmation: (data: ConfirmationData) => void,
    onFallback: (text: string) => void,
  ) => {
    const classified = classifyIntent(text);

    if (!classified) {
      onFallback(text);
      return;
    }

    const { tool, params } = classified;

    if (TWO_PHASE_TOOLS.has(tool)) {
      // Store for phase 2
      pendingConfirmRef.current = { tool, params };
      onNeedsConfirmation({ tool, params, summary: buildConfirmationSummary(tool, params) });
      return;
    }

    onToolStart(tool);
    const result = await callMCP(tool, params);
    onResult(tool, result);
  }, []);

  const confirmAction = useCallback(async (
    data: ConfirmationData,
    onToolStart: (toolName: string) => void,
    onResult: (toolName: string, result: MCPCallResult) => void,
  ) => {
    const { tool, params } = data;
    onToolStart(tool);
    const result = await callMCP(tool, { ...params, confirmed: true });
    onResult(tool, result);
  }, []);

  return { processMessage, confirmAction };
}
