/**
 * POST /api/mcp
 *
 * Proxy for the Visa procurement MCP tools.
 * Receives { tool, params } and routes to the appropriate SDK service.
 *
 * Body: { tool: string; params: Record<string, unknown> }
 * Response: { ok: boolean; data?: unknown; error?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { vcnService, vpaService, b2bService, vpcService } from '@/lib/visa-sdk';
import { scoreBids, generateNarrative } from '@/lib/ai-engine';
import { MOCK_SUPPLIERS } from '@/lib/mock-data/suppliers';
import { MOCK_RFPS } from '@/lib/mock-data/rfps';
import { v4 as uuid } from 'uuid';

// ── Supplier check mock (SMS — Visa Supplier Matching Service) ──────────────
// VisaNetworkService is not yet in the local SDK wrapper, so we mock it here
// with realistic sandbox responses based on the Visa SMS API specification.

const KNOWN_SUPPLIERS: Record<string, { mcc: string; score: number; caid: string }> = {
  default: { mcc: '5047', score: 87, caid: 'CAID-SANDBOX-001' },
};

function mockSMSCheck(supplierName: string, countryCode = 'US') {
  const lower = supplierName.toLowerCase();
  // Boost score for names that match mock data suppliers
  const match = MOCK_SUPPLIERS.find(s => s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase().split(' ')[0]));
  const base = KNOWN_SUPPLIERS.default;
  const score = match ? (match.vsmsScore ?? base.score) : base.score;
  return {
    supplierName,
    countryCode,
    score,
    mcc: base.mcc,
    caid: base.caid,
    registeredInVisaNetwork: score >= 70,
    matchedAt: new Date().toISOString(),
  };
}

// ── Tool dispatch ───────────────────────────────────────────────────────────

async function dispatch(
  tool: string,
  params: Record<string, unknown>,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {

  switch (tool) {

    // ── Supplier Intelligence ─────────────────────────────────────────── //

    case 'sms_check_supplier': {
      const result = mockSMSCheck(
        String(params.supplierName ?? ''),
        String(params.supplierCountryCode ?? 'US'),
      );
      return { ok: true, data: result };
    }

    case 'sms_bulk_check_suppliers': {
      const names = Array.isArray(params.supplierNames)
        ? params.supplierNames as string[]
        : [String(params.supplierName ?? '')];
      const results = names.map(n => mockSMSCheck(n));
      return { ok: true, data: { results, total: results.length } };
    }

    case 'ai_evaluate_bids': {
      const rfpId = String(params.rfpId ?? 'RFP-001');
      const rfp = MOCK_RFPS.find(r => r.id === rfpId) ?? MOCK_RFPS[0];
      if (!rfp) return { ok: false, error: `RFP ${rfpId} not found` };
      const bids = rfp.bids ?? [];
      if (!bids.length) return { ok: false, error: 'No bids found for this RFP' };
      const scored = scoreBids(bids, MOCK_SUPPLIERS, rfp);
      const narrative = generateNarrative(scored);
      const ranked = scored.map(s => ({
        rank:         s.rank,
        supplierName: s.supplier.name,
        composite:    s.composite,
        dimensions:   s.dimensions,
        isWinner:     s.isWinner,
        amount:       s.bid.amount,
      }));
      return { ok: true, data: { ranked, narrative, rfpId } };
    }

    // ── Payment Controls ──────────────────────────────────────────────── //

    case 'vpc_suggest_rules': {
      const result = await vpcService.IPC.getSuggestedRules({
        prompt: String(params.prompt ?? ''),
        currencyCode: String(params.currencyCode ?? '840'),
      });
      return { ok: true, data: result };
    }

    case 'vpc_apply_rules': {
      const accountId = String(params.accountId ?? 'VPC-ACCT-001');
      // If a ruleSetId was provided, use IPC apply; otherwise suggest + apply
      if (params.ruleSetId) {
        const result = await vpcService.IPC.setSuggestedRules(
          String(params.ruleSetId),
          accountId,
        );
        return { ok: true, data: result };
      }
      // Suggest rules from prompt and apply
      const suggested = await vpcService.IPC.getSuggestedRules({
        prompt: String(params.prompt ?? 'general procurement'),
        currencyCode: '840',
      });
      const top = suggested.suggestions[0];
      const applied = await vpcService.IPC.setSuggestedRules(top.ruleSetId, accountId);
      return { ok: true, data: { ...applied, rules: top.rules, rationale: top.rationale } };
    }

    case 'vpc_set_rules_manual': {
      const accountId = String(params.accountId ?? 'VPC-ACCT-001');
      const rules = Array.isArray(params.rules) ? params.rules : [];
      const result = await vpcService.Rules.setRules(accountId, rules as Parameters<typeof vpcService.Rules.setRules>[1]);
      return { ok: true, data: result };
    }

    case 'vpc_get_rules': {
      // Rules are not independently stored in sandbox — return a mock active rule set
      return {
        ok: true,
        data: {
          accountId: String(params.accountId ?? 'VPC-ACCT-001'),
          rules: [
            { ruleCode: 'SPV', spendVelocity: { limitAmount: 10000, currencyCode: '840', periodType: 'monthly', maxAuthCount: 20 } },
            { ruleCode: 'CHN', channel: { allowOnline: true, allowPOS: true, allowATM: false } },
          ],
          activeAt: new Date().toISOString(),
        },
      };
    }

    case 'vpc_create_account': {
      const accountNumber = String(params.accountNumber ?? '4111111111111111');
      const contacts = Array.isArray(params.contacts) ? params.contacts as Parameters<typeof vpcService.AccountManagement.createAccount>[0]['contacts'] : [];
      const result = await vpcService.AccountManagement.createAccount({ accountNumber, contacts });
      return { ok: true, data: result };
    }

    case 'vpc_block_account': {
      const accountId = String(params.accountId ?? 'VPC-ACCT-001');
      const result = await vpcService.Rules.blockAccount(accountId);
      return { ok: true, data: result };
    }

    case 'vpc_unblock_account': {
      const accountId = String(params.accountId ?? 'VPC-ACCT-001');
      const result = await vpcService.Rules.enableRules(accountId);
      return { ok: true, data: { accountId, status: result.status, enabledAt: result.enabledAt } };
    }

    case 'vpc_get_transaction_history': {
      const accountId = String(params.accountId ?? 'VPC-ACCT-001');
      const transactions = await vpcService.Reporting.getTransactionHistory(accountId);
      return { ok: true, data: { accountId, transactions, total: transactions.length } };
    }

    // ── Payments — two-phase (phase 2 reached via confirmed: true) ─────── //

    case 'vcn_issue_virtual_card': {
      const clientId = 'B2BWS_1_1_9999';
      const messageId = uuid();
      const amount = Number(params.amount ?? 10000);
      const now = new Date();
      const sixMonths = new Date(now);
      sixMonths.setMonth(sixMonths.getMonth() + 6);

      const result = await vcnService.requestVirtualCard({
        clientId,
        buyerId: '9999',
        messageId,
        action: 'A',
        numberOfCards: '1',
        proxyPoolId: 'Proxy12345',
        requisitionDetails: {
          startDate: String(params.startDate ?? now.toISOString().split('T')[0]),
          endDate:   String(params.endDate   ?? sixMonths.toISOString().split('T')[0]),
          timeZone:  'UTC-5',
          rules: [
            { ruleCode: 'SPV', spendLimitAmount: amount, maxAuth: 5, currencyCode: '840', rangeType: 'monthly' },
            { ruleCode: 'BLK', blockCode: 'ATM' },
            { ruleCode: 'BLK', blockCode: 'ECOM' },
          ],
        },
      });
      return { ok: true, data: result };
    }

    case 'bip_initiate_payment': {
      const result = await b2bService.BIP.initiate({
        messageId:     uuid(),
        clientId:      'B2BWS_1_1_9999',
        buyerId:       '9999',
        supplierId:    String(params.supplierId ?? 'SUPP-001'),
        paymentAmount: Number(params.paymentAmount ?? 5000),
        currencyCode:  '840',
        invoiceNumber: params.invoiceNumber as string | undefined,
        memo:          `BIP via AI Procurement Assistant`,
      });
      return { ok: true, data: result };
    }

    case 'sip_submit_request': {
      const now = new Date();
      const result = await b2bService.SIP.submitRequest({
        messageId:       uuid(),
        clientId:        'B2BWS_1_1_9999',
        supplierId:      String(params.supplierId ?? 'SUPP-001'),
        buyerId:         '9999',
        requestedAmount: Number(params.requestedAmount ?? 5000),
        currencyCode:    '840',
        invoiceNumber:   params.invoiceNumber as string | undefined,
        startDate:       String(params.startDate ?? now.toISOString().split('T')[0]),
        endDate:         String(params.endDate   ?? new Date(now.setMonth(now.getMonth() + 1)).toISOString().split('T')[0]),
      });
      return { ok: true, data: result };
    }

    case 'sip_approve_payment': {
      const result = await b2bService.SIP.approve({
        messageId:      uuid(),
        clientId:       'B2BWS_1_1_9999',
        buyerId:        '9999',
        requisitionId:  String(params.requisitionId ?? 'SIP-REQ-001'),
        approvedAmount: Number(params.approvedAmount ?? 5000),
        currencyCode:   '840',
      });
      return { ok: true, data: result };
    }

    case 'bip_get_status': {
      const result = await b2bService.BIP.getStatus({
        messageId: uuid(),
        clientId:  'B2BWS_1_1_9999',
        paymentId: String(params.paymentId ?? 'BIP-001'),
      });
      return { ok: true, data: result };
    }

    case 'bip_cancel_payment': {
      const result = await b2bService.BIP.cancel({
        messageId: uuid(),
        clientId:  'B2BWS_1_1_9999',
        paymentId: String(params.paymentId ?? 'BIP-001'),
      });
      return { ok: true, data: result };
    }

    case 'sip_reject_payment': {
      const result = await b2bService.SIP.reject({
        messageId:     uuid(),
        clientId:      'B2BWS_1_1_9999',
        requisitionId: String(params.requisitionId ?? 'SIP-REQ-001'),
      });
      return { ok: true, data: result };
    }

    case 'settlement_initiate': {
      // Use SDK settlement state machine
      const orderId = String(params.orderId ?? 'ORD-001');
      const amount  = Number(params.amount ?? 0);
      const method  = String(params.method ?? 'USD');
      return {
        ok: true,
        data: {
          orderId,
          amount,
          method,
          status: 'processing',
          startedAt: new Date().toISOString(),
          estimatedSettlementMs: 2000,
        },
      };
    }

    case 'vpa_create_buyer': {
      const result = await vpaService.Buyer.createBuyer({
        clientId:     String(params.clientId ?? 'B2BWS_1_1_9999'),
        buyerName:    String(params.buyerName ?? 'Government Agency'),
        currencyCode: String(params.currencyCode ?? '840'),
      });
      return { ok: true, data: result };
    }

    case 'vpa_process_payment': {
      const result = await vpaService.Payment.processPayment({
        clientId:      String(params.clientId ?? 'B2BWS_1_1_9999'),
        buyerId:       String(params.buyerId ?? '9999'),
        supplierId:    String(params.supplierId ?? 'SUPP-001'),
        amount:        Number(params.amount ?? 0),
        currencyCode:  String(params.currencyCode ?? '840'),
        paymentMethod: (params.paymentMethod as 'BIP' | 'SIP') ?? 'BIP',
      });
      return { ok: true, data: result };
    }

    // ── AI chat fallback ─────────────────────────────────────────────── //

    case 'ai_chat': {
      const message = String(params.message ?? '');
      const TOOL_LIST = `sms_check_supplier, sms_bulk_check_suppliers, ai_evaluate_bids,
vpc_suggest_rules, vpc_apply_rules, vpc_block_account, vpc_get_transaction_history,
vcn_issue_virtual_card, bip_initiate_payment, sip_approve_payment, settlement_initiate`;

      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const anthropic = new Anthropic();
        const msg = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system: `You are an AI Procurement Assistant embedded in a government procurement portal.
Available tools: ${TOOL_LIST}
Keep replies under 120 words. Be direct and actionable. Suggest relevant tools when applicable.`,
          messages: [{ role: 'user', content: message }],
        });
        const reply = msg.content[0].type === 'text' ? msg.content[0].text : 'I can help with procurement tasks. Try asking about suppliers, bids, or payments.';
        return { ok: true, data: { reply } };
      } catch {
        return {
          ok: true,
          data: {
            reply: `I understand your request. To help you effectively, try asking specifically about:
• Checking a supplier's Visa network status
• Evaluating bids for an RFP
• Setting up payment controls
• Issuing virtual cards for suppliers`,
          },
        };
      }
    }

    default:
      return { ok: false, error: `Unknown tool: ${tool}` };
  }
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { tool, params } = body as { tool?: unknown; params?: unknown };

  if (typeof tool !== 'string' || !tool) {
    return NextResponse.json({ ok: false, error: 'Missing required field: tool' }, { status: 422 });
  }

  const safeParams = (params && typeof params === 'object' && !Array.isArray(params))
    ? params as Record<string, unknown>
    : {};

  try {
    const result = await dispatch(tool, safeParams);
    if (!result.ok) {
      return NextResponse.json(result, { status: 422 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
