/**
 * Emisión de VCN para misiones — capa compartida.
 *
 * Both entry points that can issue a mission card go through `issueMissionVcn`:
 *   • /misiones/[id] — «Aprobar y Emitir Tarjeta» (Tesorería Nacional)
 *   • /cards         — emisión manual con misión seleccionada
 *
 * It drives the same Visa sandbox services as the /cards flow (VPA onboarding →
 * VCN provisioning → VPC enrolment → IPC rules), but derives the rule set from
 * the mission's policy profile instead of the ad-hoc card form.
 */

import {
  vcnService, vpaService, vpcService,
  buildSPVRule, buildAmountRule, buildBlockRule,
  type VCNRule,
} from '@/lib/visa-sdk';
import type { Mission, PolicyProfile } from '@/lib/mock-data/types';

/** ISO 4217 numérico — quetzal guatemalteco. */
const GTQ = '320';

const CLIENT_ID = 'B2BWS_1_1_9999';

export interface IssuedVcn {
  last4: string;
  /** MM/YY */
  expiry: string;
  proxyNumber?: string;
}

export function randomLast4(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Vence 3 años después del fin de la misión, como la tarjeta corporativa. */
export function expiryFromMission(mission: Pick<Mission, 'dates'>): string {
  const end = new Date(mission.dates.end);
  const valid = Number.isNaN(end.getTime()) ? new Date() : end;
  return `${String(valid.getMonth() + 1).padStart(2, '0')}/${String(valid.getFullYear() + 3).slice(-2)}`;
}

/** Fallback usado cuando el SDK no responde — mantiene la demo fluida. */
export function fallbackVcn(mission: Pick<Mission, 'dates'>): IssuedVcn {
  return { last4: randomLast4(), expiry: expiryFromMission(mission) };
}

/** Traduce el perfil de política a reglas VCN. */
function rulesFromPolicy(mission: Mission, profile?: PolicyProfile): VCNRule[] {
  const rules: VCNRule[] = [
    buildSPVRule({
      spendLimitAmount: mission.budgetGTQ,
      maxAuth: 20,
      currencyCode: GTQ,
      rangeType: 'monthly',
    }),
  ];

  if (profile) {
    rules.push(buildAmountRule('PUR', profile.txnLimitGTQ, GTQ));
    if (profile.atmWithdrawal === 'bloqueado') rules.push(buildBlockRule('ATM'));
    // Cada MCC bloqueado del perfil viaja como su propia regla BLK.
    profile.blockedMCCs.forEach((mcc) => rules.push(buildBlockRule(`MCC${mcc.code}`)));
  } else {
    rules.push(buildAmountRule('PUR', mission.budgetGTQ, GTQ));
    rules.push(buildBlockRule('ATM'));
  }

  return rules;
}

/**
 * Emite una VCN real (sandbox) para la misión. Nunca lanza: si el SDK falla se
 * devuelve un `fallbackVcn` para que la aprobación no quede bloqueada.
 */
export async function issueMissionVcn(
  mission: Mission,
  profile?: PolicyProfile,
): Promise<IssuedVcn> {
  try {
    // 0 — VPA: buyer → cuenta de fondeo → proxy pool
    const buyer = await vpaService.Buyer.createBuyer({
      clientId: CLIENT_ID,
      buyerName: mission.traveler.name || 'Viajero',
      currencyCode: GTQ,
    });
    await vpaService.FundingAccount.addFundingAccount({
      clientId: CLIENT_ID,
      buyerId: buyer.buyerId,
      accountNumber: '4111111111111111',
    });
    const pool = await vpaService.ProxyPool.createProxyPool({
      clientId: CLIENT_ID,
      proxyPoolId: `POOL-${buyer.buyerId}`,
      size: 50,
    });

    // 1 — VCN: provisiona la tarjeta con las reglas del perfil
    const resp = await vcnService.requestVirtualCard({
      clientId: CLIENT_ID,
      buyerId: buyer.buyerId,
      messageId: Date.now().toString(),
      action: 'A',
      numberOfCards: '1',
      proxyPoolId: pool.proxyPoolId,
      requisitionDetails: {
        startDate: mission.dates.start,
        endDate: mission.dates.end,
        timeZone: 'UTC-6',
        rules: rulesFromPolicy(mission, profile),
      },
    });

    const account = resp.accounts[0];
    if (!account) return fallbackVcn(mission);

    // 2 — VPC: enrola la tarjeta para alertas al viajero
    const vpcAcct = await vpcService.AccountManagement.createAccount({
      accountNumber: account.accountNumber,
      contacts: [{
        name: mission.traveler.name,
        email: mission.traveler.email,
        notifyOn: ['transaction_declined', 'account_blocked'],
      }],
    });

    // 3 — IPC: reglas sugeridas a partir del propósito de la misión
    const prompt = mission.purpose || `viático ${mission.destination.city}`;
    const { suggestions } = await vpcService.IPC.getSuggestedRules({ prompt, currencyCode: GTQ });
    if (suggestions[0]) {
      await vpcService.IPC.setSuggestedRules(suggestions[0].ruleSetId, vpcAcct.accountId);
    }

    return {
      last4: account.accountNumber.slice(-4),
      // El sandbox devuelve YYYY-MM; la tarjeta se muestra en MM/YY.
      expiry: normalizeExpiry(account.expiryDate) ?? expiryFromMission(mission),
      proxyNumber: account.proxyNumber,
    };
  } catch {
    // No bloqueante — la aprobación continúa con credenciales de respaldo.
    return fallbackVcn(mission);
  }
}

/** Acepta 'YYYY-MM', 'MM/YY' o 'MM/YYYY' y normaliza a 'MM/YY'. */
function normalizeExpiry(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const iso = /^(\d{4})-(\d{2})$/.exec(raw);
  if (iso) return `${iso[2]}/${iso[1].slice(-2)}`;
  const slash = /^(\d{2})\/(\d{2}|\d{4})$/.exec(raw);
  if (slash) return `${slash[1]}/${slash[2].slice(-2)}`;
  return undefined;
}
