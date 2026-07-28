'use client';

import {
  createContext, useContext, useReducer, useMemo, useCallback, useEffect, useRef, ReactNode,
} from 'react';
import {
  Mission, MissionApproval, MissionCard, MissionStatus, MissionTransaction,
  PolicyProfile, Entity,
} from '@/lib/mock-data/types';
import { MOCK_MISSIONS, MOCK_MISSION_TRANSACTIONS } from '@/lib/mock-data/missions';
import { MOCK_POLICY_PROFILES } from '@/lib/mock-data/policy-profiles';
import { MOCK_ENTITIES } from '@/lib/mock-data/entities';
import { features } from '@/lib/features';
import { usePayment } from './PaymentContext';

/* ── Seed cards for the missions that already carry a cardId ─────────────── */

const SEED_CARDS: MissionCard[] = [
  {
    id: 'mis-card-0042', missionId: 'MIS-2026-0042', holderName: 'Juan Pérez',
    brand: 'Visa', type: 'credit', usageType: 'multi-use', last4: '7412', expiry: '03/29',
    spendLimitGTQ: 18_000, policyProfileId: 'pol-intl-us', issuedAt: '2026-03-06T11:06:00.000Z',
  },
  {
    id: 'mis-card-0047', missionId: 'MIS-2026-0047', holderName: 'Diego Herrera',
    brand: 'Visa', type: 'credit', usageType: 'multi-use', last4: '2038', expiry: '07/29',
    spendLimitGTQ: 22_000, policyProfileId: 'pol-intl-us', issuedAt: '2026-06-30T16:12:00.000Z',
  },
  {
    id: 'mis-card-0018', missionId: 'MIS-2026-0018', holderName: 'Carlos Mendoza Ruiz',
    brand: 'Visa', type: 'credit', usageType: 'multi-use', last4: '9165', expiry: '01/29',
    spendLimitGTQ: 9_000, policyProfileId: 'pol-nacional', blocked: true,
    issuedAt: '2026-01-08T13:26:00.000Z',
  },
];

/* ── State ───────────────────────────────────────────────────────────────── */

interface MissionsState {
  missions: Mission[];
  missionTransactions: MissionTransaction[];
  policyProfiles: PolicyProfile[];
  entities: Entity[];
  missionCards: MissionCard[];
}

const INITIAL_STATE: MissionsState = {
  missions: MOCK_MISSIONS,
  missionTransactions: MOCK_MISSION_TRANSACTIONS,
  policyProfiles: MOCK_POLICY_PROFILES,
  entities: MOCK_ENTITIES,
  missionCards: SEED_CARDS,
};

type MissionsAction =
  | { type: 'ADD_MISSION'; payload: Mission }
  | { type: 'UPDATE_MISSION'; payload: { id: string; patch: Partial<Mission> } }
  | { type: 'ISSUE_CARD'; payload: MissionCard }
  | { type: 'ADD_MISSION_TX'; payload: MissionTransaction }
  | { type: 'RECONCILE_TXS'; payload: string }
  | { type: 'ATTACH_RECEIPT'; payload: string }
  | { type: 'UPSERT_PROFILE'; payload: PolicyProfile }
  | { type: 'ADD_ENTITY'; payload: Entity }
  | { type: 'UPDATE_ENTITY'; payload: { id: string; patch: Partial<Entity> } };

function missionsReducer(state: MissionsState, action: MissionsAction): MissionsState {
  switch (action.type) {
    case 'ADD_MISSION':
      return { ...state, missions: [action.payload, ...state.missions] };

    case 'UPDATE_MISSION':
      return {
        ...state,
        missions: state.missions.map((m) =>
          m.id === action.payload.id ? { ...m, ...action.payload.patch } : m,
        ),
      };

    case 'ISSUE_CARD':
      return {
        ...state,
        missionCards: [action.payload, ...state.missionCards.filter((c) => c.id !== action.payload.id)],
      };

    case 'ADD_MISSION_TX':
      return { ...state, missionTransactions: [action.payload, ...state.missionTransactions] };

    case 'RECONCILE_TXS':
      return {
        ...state,
        missionTransactions: state.missionTransactions.map((t) =>
          t.missionId === action.payload && (t.status === 'aprobada' || t.status === 'pendiente_recibo')
            ? { ...t, status: 'conciliada' }
            : t,
        ),
      };

    case 'ATTACH_RECEIPT':
      return {
        ...state,
        missionTransactions: state.missionTransactions.map((t) =>
          t.id === action.payload
            ? { ...t, receiptAttached: true, status: t.status === 'pendiente_recibo' ? 'aprobada' : t.status }
            : t,
        ),
      };

    case 'UPSERT_PROFILE':
      return {
        ...state,
        policyProfiles: state.policyProfiles.some((p) => p.id === action.payload.id)
          ? state.policyProfiles.map((p) => (p.id === action.payload.id ? action.payload : p))
          : [...state.policyProfiles, action.payload],
      };

    case 'ADD_ENTITY':
      return { ...state, entities: [...state.entities, action.payload] };

    case 'UPDATE_ENTITY':
      return {
        ...state,
        entities: state.entities.map((e) =>
          e.id === action.payload.id ? { ...e, ...action.payload.patch } : e,
        ),
      };

    default:
      return state;
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const ACTIVE_STATUSES: MissionStatus[] = ['aprobada', 'activa', 'en_conciliacion'];

function nextMissionId(missions: Mission[]): string {
  const year = new Date().getFullYear();
  const max = missions.reduce((acc, m) => {
    const n = Number(m.id.split('-').pop());
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `MIS-${year}-${String(max + 1).padStart(4, '0')}`;
}

function randomLast4(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export interface EntityStats {
  /** gasto base de la entidad + gasto ejecutado en misiones */
  executedGTQ: number;
  /** presupuesto comprometido por misiones activas todavía no ejecutado */
  committedGTQ: number;
  executedPct: number;
  activeCards: number;
  activeMissions: number;
  missions: Mission[];
}

export interface NewMissionInput {
  ministry: string;
  traveler: { name: string; role: string; email: string };
  destination: { city: string; country: string; countryCode: string };
  dates: { start: string; end: string };
  purpose: string;
  budgetGTQ: number;
  policyProfileId: string;
  /** perfil ajustado en el paso 2 del asistente — se guarda como perfil propio */
  customProfile?: PolicyProfile;
}

interface MissionsContextValue extends MissionsState {
  /* selectores */
  getMission: (id: string) => Mission | undefined;
  getEntity: (id: string) => Entity | undefined;
  getProfile: (id: string) => PolicyProfile | undefined;
  getMissionCard: (missionId: string) => MissionCard | undefined;
  transactionsForMission: (missionId: string) => MissionTransaction[];
  entityStats: (entityId: string) => EntityStats;
  childEntities: (parentId?: string) => Entity[];
  /* métricas para el dashboard */
  activeMissionCount: number;
  pendingReleaseGTQ: number;
  /* acciones */
  createMission: (input: NewMissionInput, asDraft?: boolean) => Mission;
  approveMission: (id: string, approval: MissionApproval) => MissionCard;
  rejectMission: (id: string, approval: MissionApproval) => void;
  closeMission: (id: string) => void;
  releaseBalance: (id: string) => number;
  attachReceipt: (txId: string) => void;
  savePolicyProfile: (profile: PolicyProfile) => void;
  addEntity: (entity: Entity) => void;
  updateApprovalChain: (entityId: string, chain: string[]) => void;
}

const MissionsContext = createContext<MissionsContextValue | undefined>(undefined);

/* ── Provider ────────────────────────────────────────────────────────────── */

export function MissionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(missionsReducer, INITIAL_STATE);
  const { addNotification } = usePayment();
  const seededRef = useRef(false);

  /* Notificaciones sembradas — sólo con el módulo activo, una sola vez */
  useEffect(() => {
    if (!features.missions || seededRef.current) return;
    seededRef.current = true;

    addNotification({
      id: 'notif-mis-001',
      type: 'procurement',
      title: 'Misión pendiente de aprobación',
      message: 'MIS-2026-0051 — Ana Lucía Morales (MINEX) · Nueva York, EE.UU. · Q14,500.00 requiere aprobación de Tesorería Nacional.',
      timestamp: '2026-07-25T10:03:00.000Z',
      read: false,
      missionId: 'MIS-2026-0051',
    });
    addNotification({
      id: 'notif-mis-002',
      type: 'payment',
      title: 'Transacción rechazada',
      message: 'MIS-2026-0042 — Best Buy (MCC 5732) por USD 900.00 / Q6,975.00 fue rechazada: MCC no autorizado.',
      timestamp: '2026-03-12T20:47:00.000Z',
      read: false,
      missionId: 'MIS-2026-0042',
    });
    addNotification({
      id: 'notif-mis-003',
      type: 'system',
      title: 'Conciliación lista para revisión',
      message: 'MIS-2026-0047 — Diego Herrera (MINFIN) cerró el viaje. Saldo no utilizado: Q14,172.50 · 1 recibo faltante.',
      timestamp: '2026-07-12T08:15:00.000Z',
      read: false,
      missionId: 'MIS-2026-0047',
    });
  }, [addNotification]);

  /* ── selectores ──────────────────────────────────────────────────────── */

  const getMission = useCallback(
    (id: string) => state.missions.find((m) => m.id === id),
    [state.missions],
  );
  const getEntity = useCallback(
    (id: string) => state.entities.find((e) => e.id === id),
    [state.entities],
  );
  const getProfile = useCallback(
    (id: string) => state.policyProfiles.find((p) => p.id === id),
    [state.policyProfiles],
  );
  const getMissionCard = useCallback(
    (missionId: string) => state.missionCards.find((c) => c.missionId === missionId),
    [state.missionCards],
  );
  const transactionsForMission = useCallback(
    (missionId: string) =>
      state.missionTransactions
        .filter((t) => t.missionId === missionId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [state.missionTransactions],
  );
  const childEntities = useCallback(
    (parentId?: string) => state.entities.filter((e) => e.parentId === parentId),
    [state.entities],
  );

  const entityStats = useCallback(
    (entityId: string): EntityStats => {
      const entity = state.entities.find((e) => e.id === entityId);
      const missions = state.missions.filter((m) => m.ministry === entityId);
      const missionSpend = missions.reduce((s, m) => s + m.spentGTQ, 0);
      const committed = missions
        .filter((m) => ACTIVE_STATUSES.includes(m.status))
        .reduce((s, m) => s + Math.max(m.budgetGTQ - m.spentGTQ, 0), 0);
      const executed = (entity?.spentGTQ ?? 0) + missionSpend;
      const budget = entity?.budgetGTQ ?? 0;
      const missionCards = state.missionCards.filter(
        (c) => !c.blocked && missions.some((m) => m.id === c.missionId),
      ).length;

      return {
        executedGTQ: executed,
        committedGTQ: committed,
        executedPct: budget > 0 ? Math.min(Math.round((executed / budget) * 100), 100) : 0,
        activeCards: (entity?.activeCards ?? 0) + missionCards,
        activeMissions: missions.filter((m) => ACTIVE_STATUSES.includes(m.status)).length,
        missions,
      };
    },
    [state.entities, state.missions, state.missionCards],
  );

  const activeMissionCount = useMemo(
    () => state.missions.filter((m) => ACTIVE_STATUSES.includes(m.status)).length,
    [state.missions],
  );

  const pendingReleaseGTQ = useMemo(
    () =>
      state.missions
        .filter((m) => m.status === 'activa' || m.status === 'en_conciliacion' || m.status === 'aprobada')
        .reduce((s, m) => s + Math.max(m.budgetGTQ - m.spentGTQ, 0), 0),
    [state.missions],
  );

  /* ── acciones ────────────────────────────────────────────────────────── */

  const createMission = useCallback(
    (input: NewMissionInput, asDraft = false): Mission => {
      const missionId = nextMissionId(state.missions);
      let policyProfileId = input.policyProfileId;

      if (input.customProfile) {
        /* La política ajustada se guarda como perfil propio de esta misión */
        const custom: PolicyProfile = {
          ...input.customProfile,
          id: `pol-${missionId.toLowerCase()}`,
          name: `${input.customProfile.name} (ajustada)`,
        };
        dispatch({ type: 'UPSERT_PROFILE', payload: custom });
        policyProfileId = custom.id;
      }

      const mission: Mission = {
        id: missionId,
        ministry: input.ministry,
        traveler: input.traveler,
        destination: input.destination,
        dates: input.dates,
        purpose: input.purpose,
        budgetGTQ: input.budgetGTQ,
        spentGTQ: 0,
        status: asDraft ? 'borrador' : 'pendiente_aprobacion',
        policyProfileId,
        approvals: [],
      };

      dispatch({ type: 'ADD_MISSION', payload: mission });

      if (!asDraft) {
        const entity = state.entities.find((e) => e.id === input.ministry);
        addNotification({
          id: `notif-${mission.id}`,
          type: 'procurement',
          title: 'Misión pendiente de aprobación',
          message: `${mission.id} — ${mission.traveler.name} (${entity?.acronym ?? '—'}) · ${mission.destination.city} requiere aprobación.`,
          timestamp: new Date().toISOString(),
          read: false,
          missionId: mission.id,
        });
      }

      return mission;
    },
    [state.missions, state.entities, addNotification],
  );

  const approveMission = useCallback(
    (id: string, approval: MissionApproval): MissionCard => {
      const mission = state.missions.find((m) => m.id === id);
      const cardId = `mis-card-${id.split('-').pop()}`;
      const end = mission ? new Date(mission.dates.end) : new Date();
      const expiry = `${String(end.getMonth() + 1).padStart(2, '0')}/${String(end.getFullYear() + 3).slice(-2)}`;

      const card: MissionCard = {
        id: cardId,
        missionId: id,
        holderName: mission?.traveler.name ?? 'Viajero',
        brand: 'Visa',
        type: 'credit',
        usageType: 'multi-use',
        last4: randomLast4(),
        expiry,
        spendLimitGTQ: mission?.budgetGTQ ?? 0,
        policyProfileId: mission?.policyProfileId ?? '',
        issuedAt: new Date().toISOString(),
      };

      dispatch({ type: 'ISSUE_CARD', payload: card });
      dispatch({
        type: 'UPDATE_MISSION',
        payload: {
          id,
          patch: {
            status: 'activa',
            cardId,
            approvals: [...(mission?.approvals ?? []), approval],
          },
        },
      });

      addNotification({
        id: `notif-${id}-card`,
        type: 'payment',
        title: 'Tarjeta virtual emitida',
        message: `${id} — VCN •••• ${card.last4} emitida a ${card.holderName} con la política aplicada. La misión está activa.`,
        timestamp: new Date().toISOString(),
        read: false,
        missionId: id,
      });

      return card;
    },
    [state.missions, addNotification],
  );

  const rejectMission = useCallback(
    (id: string, approval: MissionApproval) => {
      const mission = state.missions.find((m) => m.id === id);
      dispatch({
        type: 'UPDATE_MISSION',
        payload: { id, patch: { status: 'borrador', approvals: [...(mission?.approvals ?? []), approval] } },
      });
    },
    [state.missions],
  );

  const closeMission = useCallback((id: string) => {
    dispatch({ type: 'UPDATE_MISSION', payload: { id, patch: { status: 'en_conciliacion' } } });
  }, []);

  const releaseBalance = useCallback(
    (id: string): number => {
      const mission = state.missions.find((m) => m.id === id);
      if (!mission) return 0;
      const released = Math.max(mission.budgetGTQ - mission.spentGTQ, 0);

      dispatch({ type: 'RECONCILE_TXS', payload: id });
      dispatch({
        type: 'UPDATE_MISSION',
        payload: {
          id,
          patch: { status: 'cerrada', releasedGTQ: released, releasedAt: new Date().toISOString() },
        },
      });

      addNotification({
        id: `notif-${id}-release`,
        type: 'system',
        title: 'Saldo liberado a Tesorería',
        message: `${id} — Se liberaron Q${released.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} de saldo no utilizado. Misión cerrada.`,
        timestamp: new Date().toISOString(),
        read: false,
        missionId: id,
      });

      return released;
    },
    [state.missions, addNotification],
  );

  const attachReceipt = useCallback((txId: string) => {
    dispatch({ type: 'ATTACH_RECEIPT', payload: txId });
  }, []);

  const savePolicyProfile = useCallback((profile: PolicyProfile) => {
    dispatch({ type: 'UPSERT_PROFILE', payload: profile });
  }, []);

  const addEntity = useCallback((entity: Entity) => {
    dispatch({ type: 'ADD_ENTITY', payload: entity });
  }, []);

  const updateApprovalChain = useCallback((entityId: string, chain: string[]) => {
    dispatch({ type: 'UPDATE_ENTITY', payload: { id: entityId, patch: { approvalChain: chain } } });
  }, []);

  const value = useMemo<MissionsContextValue>(
    () => ({
      ...state,
      getMission, getEntity, getProfile, getMissionCard,
      transactionsForMission, entityStats, childEntities,
      activeMissionCount, pendingReleaseGTQ,
      createMission, approveMission, rejectMission, closeMission,
      releaseBalance, attachReceipt, savePolicyProfile, addEntity, updateApprovalChain,
    }),
    [
      state, getMission, getEntity, getProfile, getMissionCard,
      transactionsForMission, entityStats, childEntities,
      activeMissionCount, pendingReleaseGTQ,
      createMission, approveMission, rejectMission, closeMission,
      releaseBalance, attachReceipt, savePolicyProfile, addEntity, updateApprovalChain,
    ],
  );

  return <MissionsContext.Provider value={value}>{children}</MissionsContext.Provider>;
}

export function useMissions() {
  const ctx = useContext(MissionsContext);
  if (!ctx) throw new Error('useMissions must be used within MissionsProvider');
  return ctx;
}
