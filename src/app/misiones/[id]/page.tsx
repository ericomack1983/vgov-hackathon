'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldCheck, CreditCard, Download, Loader2, Check,
  AlertTriangle, Receipt, Wallet, Lock, Ban, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useMissions } from '@/context/MissionsContext';
import { features } from '@/lib/features';
import {
  formatGTQ, formatDateRangeES, formatDateES, flagEmoji, parseISODate,
} from '@/lib/tci-format';
import { countryName } from '@/lib/mock-data/policy-profiles';
import { MissionStatusBadge } from '@/components/tci/MissionStatusBadge';
import { MissionTransactionRow } from '@/components/tci/MissionTransactionRow';
import { PolicyControlsPanel } from '@/components/tci/PolicyControlsPanel';
import { MissionCardVisual } from '@/components/tci/MissionCardVisual';
import { BudgetRing, MiniProgress } from '@/components/tci/BudgetRing';
import { TciToaster } from '@/components/tci/TciToaster';
import { ConfettiCanvas, useConfetti } from '@/components/ui/ConfettiCanvas';
import { issueMissionVcn, fallbackVcn, type IssuedVcn } from '@/lib/mission-issuance';
import type { Mission, PolicyProfile } from '@/lib/mock-data/types';

const TABS = ['Resumen', 'Transacciones', 'Conciliación', 'Política'] as const;
type Tab = typeof TABS[number];

const CARD_PANEL =
  'bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.06)] border border-slate-200 p-6';

const ISSUE_STEPS = [
  'Validando solicitud de VCN…',
  'Contactando red del emisor (Banco CHN)…',
  'Generando credenciales de tarjeta virtual…',
  'Aplicando Visa Payment Controls…',
  '¡VCN emitida exitosamente!',
];

/* ── Overlay de emisión ──────────────────────────────────────────────────── */

function IssuanceOverlay({ mission, profile, onDone }: {
  mission: Mission;
  profile?: PolicyProfile;
  onDone: (vcn: IssuedVcn) => void;
}) {
  const [idx, setIdx] = useState(0);
  /* La llamada al SDK corre en paralelo a la animación; el resultado espera
     en el ref hasta que los pasos terminan. */
  const vcnRef = useRef<IssuedVcn | null>(null);
  /* `onDone` se recrea en cada render del padre; el ref evita reiniciar los pasos. */
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; });

  useEffect(() => {
    let cancelled = false;
    issueMissionVcn(mission, profile).then((vcn) => {
      if (!cancelled) vcnRef.current = vcn;
    });
    return () => { cancelled = true; };
  }, [mission, profile]);

  useEffect(() => {
    if (idx >= ISSUE_STEPS.length - 1) {
      const t = setTimeout(() => doneRef.current(vcnRef.current ?? fallbackVcn(mission)), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIdx((i) => i + 1), 620);
    return () => clearTimeout(t);
  }, [idx, mission]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(3px)' }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}
          >
            <CreditCard size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Emitiendo tarjeta virtual</p>
            <p className="text-xs text-slate-500">Visa · Banco CHN</p>
          </div>
        </div>

        <div className="space-y-3">
          {ISSUE_STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                  i < idx ? 'bg-emerald-500' : i === idx ? 'bg-[#1434CB]' : 'bg-slate-100'
                }`}
              >
                {i < idx ? (
                  <Check size={11} className="text-white" />
                ) : i === idx ? (
                  <Loader2 size={11} className="text-white animate-spin" />
                ) : null}
              </div>
              <span className={`text-xs ${i <= idx ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Página ──────────────────────────────────────────────────────────────── */

const TAB_BY_PARAM: Record<string, Tab> = {
  politica: 'Política',
  transacciones: 'Transacciones',
  conciliacion: 'Conciliación',
  resumen: 'Resumen',
};

export default function MissionDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = use(params);
  const { tab } = use(searchParams);
  const {
    getMission, getEntity, getProfile, getMissionCard, transactionsForMission,
    approveMission, rejectMission, closeMission, releaseBalance, attachReceipt, savePolicyProfile,
  } = useMissions();

  /* Enlace profundo desde el Asistente IA: ?tab=politica.
     La pestaña elegida por el usuario gana sobre la de la URL. */
  const [tabOverride, setTabOverride] = useState<Tab | null>(null);
  const activeTab = tabOverride ?? TAB_BY_PARAM[typeof tab === 'string' ? tab : ''] ?? 'Resumen';
  const setActiveTab = setTabOverride;
  const [issuing, setIssuing] = useState(false);
  const [releasing, setReleasing] = useState(false);
  /* `policyEdits` sólo existe cuando el usuario toca los controles */
  const [policyEdits, setPolicyEdits] = useState<PolicyProfile | null>(null);
  const { handleRef: confettiRef, fire: fireConfetti } = useConfetti();

  const mission = getMission(id);
  const entity = mission ? getEntity(mission.ministry) : undefined;
  const profile = mission ? getProfile(mission.policyProfileId) : undefined;
  const card = mission ? getMissionCard(mission.id) : undefined;
  const txs = mission ? transactionsForMission(mission.id) : [];
  const draftPolicy = policyEdits ?? profile ?? null;

  if (!features.missions) return null;

  if (!mission) {
    return (
      <div className={CARD_PANEL}>
        <p className="text-sm font-semibold text-slate-700">Misión no encontrada</p>
        <p className="text-xs text-slate-400 mt-1">La misión «{id}» no existe o fue archivada.</p>
        <Link href="/misiones" className="mt-4 inline-block text-sm font-semibold text-[#1434CB] hover:underline">
          ← Volver a Misiones
        </Link>
      </div>
    );
  }

  const balance = Math.max(mission.budgetGTQ - mission.spentGTQ, 0);
  const approved = txs.filter((t) => t.status !== 'rechazada');
  const declined = txs.filter((t) => t.status === 'rechazada');
  const withReceipt = approved.filter((t) => t.receiptAttached);
  const missingReceipt = approved.filter((t) => !t.receiptAttached);
  const missionEnded = parseISODate(mission.dates.end) <= new Date();
  const canReconcile = mission.status === 'en_conciliacion' || mission.status === 'cerrada' || missionEnded;
  const isPending = mission.status === 'pendiente_aprobacion';

  function handleApprove() {
    setIssuing(true);
  }

  function finishIssuance(vcn: IssuedVcn) {
    const issued = approveMission(
      mission!.id,
      {
        role: 'Tesorería Nacional',
        user: 'Sandra Gómez',
        date: new Date().toISOString(),
        action: 'aprobado',
      },
      vcn,
    );
    setIssuing(false);
    fireConfetti();
    toast.success(`Tarjeta virtual •••• ${issued.last4} emitida — misión activa`);
  }

  function handleReject() {
    rejectMission(mission!.id, {
      role: 'Tesorería Nacional',
      user: 'Sandra Gómez',
      date: new Date().toISOString(),
      action: 'rechazado',
    });
    toast.error('Misión rechazada — devuelta a borrador');
  }

  function handleClose() {
    closeMission(mission!.id);
    setActiveTab('Conciliación');
    toast.success('Misión cerrada — lista para conciliación');
  }

  function handleRelease() {
    setReleasing(true);
    const released = releaseBalance(mission!.id);
    setTimeout(() => {
      setReleasing(false);
      fireConfetti();
      toast.success(`${formatGTQ(released)} liberados a Tesorería Nacional`);
    }, 1100);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <TciToaster />
      <ConfettiCanvas handleRef={confettiRef} />

      <AnimatePresence>
        {issuing && <IssuanceOverlay mission={mission} profile={profile} onDone={finishIssuance} />}
      </AnimatePresence>

      <Link
        href="/misiones"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1434CB] transition-colors mb-4"
      >
        <ArrowLeft size={14} /> Misiones
      </Link>

      {/* ── Encabezado ── */}
      <div className={`${CARD_PANEL} mb-4`}>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#1434CB] bg-[#EEF1FD] px-2 py-0.5 rounded">
                {mission.id}
              </span>
              <MissionStatusBadge status={mission.status} />
              {entity && (
                <span className="text-xs text-slate-400">
                  {entity.acronym} · {entity.name}
                </span>
              )}
            </div>

            <h1 className="text-xl font-semibold text-slate-900 mt-2">{mission.traveler.name}</h1>
            <p className="text-sm text-slate-500">{mission.traveler.role}</p>

            <div className="flex items-center gap-5 mt-4 flex-wrap">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destino</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  <span className="mr-1.5" aria-hidden>{flagEmoji(mission.destination.countryCode)}</span>
                  {mission.destination.city}, {mission.destination.country}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fechas</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {formatDateRangeES(mission.dates.start, mission.dates.end)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presupuesto</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{formatGTQ(mission.budgetGTQ)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo disponible</p>
                <p className="text-sm font-semibold text-emerald-600 mt-0.5">{formatGTQ(balance)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <BudgetRing spent={mission.spentGTQ} budget={mission.budgetGTQ} />
          </div>
        </div>

        {(mission.status === 'activa' || mission.status === 'aprobada') && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cerrar Misión
            </button>
          </div>
        )}
      </div>

      {/* ── Panel de aprobación ── */}
      <AnimatePresence>
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-4 rounded-xl border border-[#A5B8F3] overflow-hidden"
            style={{ background: 'linear-gradient(to right, #EEF1FD, #f0f4ff)' }}
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} className="text-[#1434CB]" />
                <h2 className="text-sm font-semibold text-slate-800">Aprobación de Tesorería Nacional</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Revise la política que se aplicará a la tarjeta antes de autorizar la emisión.
              </p>

              {profile && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Perfil', value: profile.name },
                    { label: 'Límite por transacción', value: formatGTQ(profile.txnLimitGTQ) },
                    { label: 'Límite diario', value: formatGTQ(profile.dailyLimitGTQ) },
                    {
                      label: 'Países habilitados',
                      value: profile.allowedCountries.map((c) => `${flagEmoji(c)} ${countryName(c)}`).join(', ') || 'Ninguno',
                    },
                    { label: 'Categorías permitidas', value: profile.allowedMCCs.map((m) => m.code).join(', ') || '—' },
                    { label: 'Categorías bloqueadas', value: profile.blockedMCCs.map((m) => m.code).join(', ') || '—' },
                    {
                      label: 'Retiro ATM',
                      value: profile.atmWithdrawal === 'limitado'
                        ? `Limitado · ${formatGTQ(profile.atmDailyCapGTQ ?? 0)}/día`
                        : profile.atmWithdrawal.charAt(0).toUpperCase() + profile.atmWithdrawal.slice(1),
                    },
                    { label: 'Liberación automática', value: profile.autoReleaseUnused ? 'Activada' : 'Desactivada' },
                  ].map((row) => (
                    <div key={row.label} className="rounded-lg bg-white/70 border border-white px-3 py-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{row.label}</p>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{row.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-md"
                  style={{ background: 'linear-gradient(to right, #1434CB, #6366f1)' }}
                >
                  <CreditCard size={14} />
                  Aprobar y Emitir Tarjeta
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                >
                  <XCircle size={14} /> Rechazar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ── */}
      <div className="relative border-b border-slate-200 mb-6">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const disabled = tab === 'Conciliación' && !canReconcile;
            return (
              <button
                key={tab}
                onClick={() => !disabled && setActiveTab(tab)}
                disabled={disabled}
                title={disabled ? 'Disponible al finalizar la misión o al cerrarla' : undefined}
                className={`px-5 py-2.5 text-sm font-medium transition-colors relative z-10 ${
                  disabled ? 'text-slate-300 cursor-not-allowed'
                    : activeTab === tab ? 'text-[#1434CB]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
                {tab === 'Transacciones' && txs.length > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold text-slate-400">{txs.length}</span>
                )}
              </button>
            );
          })}
        </div>
        <div
          className="absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ease-in-out"
          style={{
            background: 'linear-gradient(to right, #1434CB, #6366f1)',
            left: `${TABS.indexOf(activeTab) * 112}px`,
            width: '112px',
          }}
        />
      </div>

      {/* ── Paneles ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── RESUMEN ── */}
          {activeTab === 'Resumen' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className={CARD_PANEL}>
                  <h2 className="text-sm font-semibold text-slate-700 mb-3">Propósito de la misión</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{mission.purpose}</p>

                  <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correo del viajero</p>
                      <p className="text-xs text-slate-700 font-mono">{mission.traveler.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Perfil de política</p>
                      <p className="text-xs text-slate-700">{profile?.name ?? '—'}</p>
                    </div>
                  </div>
                </div>

                <div className={CARD_PANEL}>
                  <h2 className="text-sm font-semibold text-slate-700 mb-4">Ruta de aprobación</h2>
                  {mission.approvals.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Sin aprobaciones registradas — la misión aún está en borrador.
                    </p>
                  ) : (
                    <div className="relative pl-1">
                      {mission.approvals.map((a, i) => (
                        <div key={`${a.role}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
                          {i < mission.approvals.length - 1 && (
                            <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200" />
                          )}
                          <div
                            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                              a.action === 'aprobado' ? 'bg-emerald-50' : 'bg-red-50'
                            }`}
                          >
                            {a.action === 'aprobado'
                              ? <Check size={13} className="text-emerald-600" />
                              : <Ban size={13} className="text-red-500" />}
                          </div>
                          <div className="pt-1">
                            <p className="text-sm font-semibold text-slate-800">{a.role}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {a.user} · {formatDateES(a.date.slice(0, 10))} ·{' '}
                              <span className={a.action === 'aprobado' ? 'text-emerald-600' : 'text-red-500'}>
                                {a.action === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta */}
              <div className="space-y-4">
                {card ? (
                  <div className={CARD_PANEL}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
                      Tarjeta de la misión
                    </p>
                    <MissionCardVisual card={card} compact />
                    <div className="mt-5 space-y-2.5">
                      {[
                        { label: 'ID de tarjeta', value: card.id },
                        { label: 'Número', value: `•••• •••• •••• ${card.last4}` },
                        { label: 'Vence', value: card.expiry },
                        { label: 'Límite', value: formatGTQ(card.spendLimitGTQ) },
                        { label: 'Estado', value: card.blocked ? 'Bloqueada' : 'Activa' },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 text-xs">{row.label}</span>
                          <span className="font-semibold text-slate-800 font-mono text-xs">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={CARD_PANEL}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Tarjeta de la misión
                    </p>
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                      <Lock size={20} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-500">Sin tarjeta emitida</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        La VCN se genera cuando Tesorería Nacional aprueba la misión.
                      </p>
                    </div>
                  </div>
                )}

                <div className={CARD_PANEL}>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Ejecución</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Presupuesto', value: mission.budgetGTQ, color: '#94a3b8' },
                      { label: 'Gastado', value: mission.spentGTQ, color: '#1434CB' },
                      { label: 'Disponible', value: balance, color: '#10b981' },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-slate-500">{row.label}</span>
                          <span className="text-xs font-bold" style={{ color: row.color }}>{formatGTQ(row.value)}</span>
                        </div>
                        <MiniProgress
                          value={row.value}
                          max={mission.budgetGTQ}
                          colors={row.label === 'Disponible' ? ['#10b981', '#34d399'] : ['#1434CB', '#6366f1']}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TRANSACCIONES ── */}
          {activeTab === 'Transacciones' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-slate-600">Movimientos de la misión</span>
                <div className="flex items-center gap-2 ml-auto">
                  {[
                    { label: `${approved.length} aceptadas`, color: '#10b981' },
                    { label: `${declined.length} rechazadas`, color: '#ef4444' },
                    { label: `${missingReceipt.length} sin recibo`, color: '#f59e0b' },
                  ].map((chip) => (
                    <span
                      key={chip.label}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: `${chip.color}14`, color: chip.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: chip.color }} />
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>

              {txs.length === 0 ? (
                <div className="p-16 text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'linear-gradient(135deg,#1434CB15,#6366f115)' }}
                  >
                    <CreditCard size={22} className="text-indigo-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">Sin movimientos todavía</p>
                  <p className="text-xs text-slate-400">
                    Las autorizaciones aparecerán aquí en cuanto el viajero use la tarjeta.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        {['Comercio', 'Monto', 'País', 'Estado', 'Recibo', 'Fecha'].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {txs.map((tx, i) => (
                        <MissionTransactionRow
                          key={tx.id}
                          tx={tx}
                          index={i}
                          onAttachReceipt={mission.status === 'cerrada' ? undefined : (txId) => {
                            attachReceipt(txId);
                            toast.success('Recibo adjuntado');
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── CONCILIACIÓN ── */}
          {activeTab === 'Conciliación' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Presupuesto aprobado', value: formatGTQ(mission.budgetGTQ), icon: <Wallet size={18} />, color: '#1434CB' },
                  { label: 'Gasto real', value: formatGTQ(mission.spentGTQ), icon: <CreditCard size={18} />, color: '#6366f1' },
                  {
                    label: mission.status === 'cerrada' ? 'Saldo liberado' : 'Saldo no utilizado',
                    value: formatGTQ(mission.status === 'cerrada' ? (mission.releasedGTQ ?? 0) : balance),
                    icon: <ShieldCheck size={18} />, color: '#10b981',
                  },
                  { label: 'Excepciones', value: String(declined.length + missingReceipt.length), icon: <AlertTriangle size={18} />, color: '#f59e0b' },
                ].map((tile) => (
                  <div key={tile.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-2">
                      <span style={{ color: tile.color }}>{tile.icon}</span>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{tile.label}</span>
                    </div>
                    <div className="text-2xl font-semibold text-slate-900 mt-2">{tile.value}</div>
                  </div>
                ))}
              </div>

              {/* Liberación de saldo */}
              <div className={CARD_PANEL}>
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-700">Liberación de saldo</h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-lg">
                      {mission.status === 'cerrada'
                        ? `Se liberaron ${formatGTQ(mission.releasedGTQ ?? 0)} a Tesorería Nacional el ${formatDateES((mission.releasedAt ?? '').slice(0, 10))}. La tarjeta quedó desactivada.`
                        : `El saldo no ejecutado de ${formatGTQ(balance)} regresa a Tesorería Nacional y la tarjeta se desactiva al cerrar la misión.`}
                    </p>
                  </div>

                  {mission.status === 'cerrada' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                      <Check size={12} /> Saldo liberado
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRelease}
                      disabled={releasing}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60"
                      style={{ background: 'linear-gradient(to right, #059669, #10b981)' }}
                    >
                      {releasing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                      {releasing ? 'Liberando…' : 'Liberar saldo a Tesorería'}
                    </button>
                  )}
                </div>

                {/* Barra ejecutado vs. liberado */}
                <div className="mt-5">
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(mission.spentGTQ / mission.budgetGTQ) * 100}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: 'linear-gradient(to right, #1434CB, #6366f1)' }}
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(balance / mission.budgetGTQ) * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        background: mission.status === 'cerrada'
                          ? 'linear-gradient(to right, #059669, #34d399)'
                          : 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 6px, #f1f5f9 6px, #f1f5f9 12px)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[11px]">
                    <span className="text-slate-500">
                      Ejecutado <span className="font-semibold text-[#1434CB]">{formatGTQ(mission.spentGTQ)}</span>
                    </span>
                    <span className="text-slate-500">
                      {mission.status === 'cerrada' ? 'Liberado' : 'No utilizado'}{' '}
                      <span className="font-semibold text-emerald-600">
                        {formatGTQ(mission.status === 'cerrada' ? (mission.releasedGTQ ?? balance) : balance)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Recibos y excepciones */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={CARD_PANEL}>
                  <h2 className="text-sm font-semibold text-slate-700 mb-4">Recibos</h2>
                  <div className="space-y-0">
                    {[
                      { label: 'Recibos adjuntos', value: withReceipt.length, color: 'bg-emerald-500' },
                      { label: 'Recibos faltantes', value: missingReceipt.length, color: 'bg-amber-500' },
                      { label: 'Cargos sin recibo requerido', value: declined.length, color: 'bg-slate-300' },
                    ].map((row, i, arr) => (
                      <div
                        key={row.label}
                        className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${row.color}`} />
                          <span className="text-sm text-slate-600">{row.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {missingReceipt.length > 0 && (
                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                      <p className="text-[11px] font-semibold text-amber-700 mb-1">Pendientes de recibo</p>
                      {missingReceipt.map((t) => (
                        <p key={t.id} className="text-[11px] text-amber-600">
                          {t.merchant} — {formatGTQ(t.amountGTQ)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className={CARD_PANEL}>
                  <h2 className="text-sm font-semibold text-slate-700 mb-4">Excepciones marcadas</h2>
                  {declined.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin rechazos de política durante la misión.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {declined.map((t) => (
                        <div key={t.id} className="flex items-start gap-3 rounded-lg bg-red-50/60 border border-red-100 px-3 py-2.5">
                          <Ban size={13} className="text-red-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800">{t.merchant}</p>
                            <p className="text-[11px] text-slate-500">
                              {formatGTQ(t.amountGTQ)} · MCC {t.mcc.code} · {t.declineReason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toast.success('Informe de conciliación exportado (demo)')}
                    className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <Download size={14} /> Exportar informe
                  </button>
                </div>
              </div>

              {/* Detalle conciliado */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Receipt size={13} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">Detalle de movimientos conciliados</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        {['Comercio', 'Monto', 'País', 'Estado', 'Recibo', 'Fecha'].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {txs.map((tx, i) => <MissionTransactionRow key={tx.id} tx={tx} index={i} />)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── POLÍTICA ── */}
          {activeTab === 'Política' && (
            draftPolicy ? (
              <PolicyControlsPanel
                profile={draftPolicy}
                onChange={setPolicyEdits}
                readOnly={mission.status === 'cerrada'}
                showFooter
                onSave={savePolicyProfile}
                onApplyToCard={savePolicyProfile}
              />
            ) : (
              <div className={CARD_PANEL}>
                <p className="text-xs text-slate-400">Esta misión no tiene un perfil de política asociado.</p>
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
