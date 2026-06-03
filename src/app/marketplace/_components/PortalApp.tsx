'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Receipt, FileText, Store, UserCircle, LogOut,
  ChevronLeft, ChevronRight, TrendingUp, Check, Clock, AlertTriangle,
  SlidersHorizontal, CreditCard, Upload, Download, Star, ExternalLink,
  Phone, ArrowRight, CheckCircle2, XCircle, Plus, Tag, Languages,
} from 'lucide-react';
import {
  PROVEEDOR_ACTUAL, VENTAS_PROVEEDOR, COMPRAS_TARJETA, LICITACIONES,
  type Licitacion,
} from '../_data/mock';
import { useLang } from '../i18n';

/* ── Brand token helpers ── */
const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Liquidado:    { color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.2)'   },
  'En Proceso': { color: '#d97706', bg: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.2)'   },
  Pendiente:    { color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.15)' },
  Activo:       { color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.2)'   },
  Borrador:     { color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.15)' },
  Pausado:      { color: '#d97706', bg: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.2)'   },
  Abierta:      { color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.2)'   },
  'Por Cerrar': { color: '#d97706', bg: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.2)'   },
  Cerrada:      { color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.15)' },
};

const balboas = (n: number) => `B/.${n.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const corto   = (n: number) => n >= 1_000_000 ? `B/.${(n/1_000_000).toFixed(2)}M` : n >= 1000 ? `B/.${(n/1000).toFixed(0)}K` : balboas(n);

type Vista = 'panel' | 'ventas' | 'licitaciones' | 'catalogo' | 'perfil';

const card  = 'rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl';
const mono  = 'var(--font-jetbrains-mono, monospace)';

/* ── Reusable status chip ── */
function StatusChip({ estado }: { estado: string }) {
  const s = STATUS_STYLES[estado] ?? STATUS_STYLES.Pendiente;
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {estado}
    </span>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, sub, Icon, accent = '#1b4dff' }: {
  label: string; value: string; sub?: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; accent?: string;
}) {
  return (
    <div className={`${card} p-5`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px]"
          style={{ background: `${accent}18`, border: `1px solid ${accent}25` }}>
          <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
        </div>
      </div>
      <p className="m-0 text-2xl font-bold text-slate-50" style={{ fontFamily: mono }}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

/* ── Panama shield (sidebar) ── */
function PanamaShieldTiny() {
  return (
    <svg width="20" height="23" viewBox="0 0 52 61" fill="none" aria-hidden>
      <path d="M26 2 L50 10 L50 36 Q50 56 26 62 Q2 56 2 36 L2 10 Z" fill="#0a1540" stroke="rgba(20,52,203,0.6)" strokeWidth="1.5" />
      <clipPath id="pst"><path d="M26 2 L50 10 L50 36 Q50 56 26 62 Q2 56 2 36 L2 10 Z" /></clipPath>
      <g clipPath="url(#pst)">
        <rect x="2" y="2" width="24" height="30" fill="rgba(27,77,255,0.65)" />
        <rect x="26" y="32" width="24" height="30" fill="rgba(255,45,85,0.5)" />
      </g>
    </svg>
  );
}

/* ─────────────────────── VIEWS ─────────────────────── */

function VistaPanelPrincipal() {
  const { t } = useLang();
  const prov = PROVEEDOR_ACTUAL;
  const liquidadas = VENTAS_PROVEEDOR.filter((v) => v.estado === 'Liquidado');
  const enProceso  = VENTAS_PROVEEDOR.filter((v) => v.estado === 'En Proceso');
  const pendientes = VENTAS_PROVEEDOR.filter((v) => v.estado === 'Pendiente');
  const ingresos   = liquidadas.reduce((s, x) => s + x.monto, 0);
  const procMonto  = [...enProceso, ...pendientes].reduce((s, x) => s + x.monto, 0);
  const pagTarjeta = COMPRAS_TARJETA.filter((c) => c.estado === 'Liquidado').reduce((s, x) => s + x.monto, 0);

  const barVals = [38000, 51000, 44000, 67000, ingresos];
  const maxBar  = Math.max(...barVals);
  const months  = ['Jul', 'Ago', 'Sep', 'Oct', 'Nov'];

  const onboardingLabels = [
    t('portal.onboarding.0'), t('portal.onboarding.1'), t('portal.onboarding.2'),
    t('portal.onboarding.3'), t('portal.onboarding.4'), t('portal.onboarding.5'),
  ];
  const onboardingStatus = [true, true, true, true, true, false];
  const completados = onboardingStatus.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1434cb]/25 p-6"
        style={{ background: 'radial-gradient(120% 140% at 50% 0%, rgba(27,77,255,0.4) 0%, rgba(13,19,38,0.2) 55%), linear-gradient(160deg,#0c1330 0%,#070b18 100%)' }}>
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(20,52,203,0.22) 0%,transparent 70%)' }} />
        <p className="mb-1 text-[0.7rem] uppercase tracking-[0.14em] text-cyan-300/70">{t('portal.panel.tag')}</p>
        <h2 className="m-0 mb-1.5 text-[2rem] font-bold tracking-[-0.03em] text-white">
          {t('portal.panel.welcomePrefix')}{' '}
          <span className="bg-gradient-to-r from-[#2f6bff] via-[#22d3ee] to-[#4f74ff] bg-clip-text text-transparent">{prov.contacto.nombre.split(' ')[0]}.</span>
        </h2>
        <p className="text-sm text-slate-400/60">{prov.nombre} · {prov.ciudad}, {prov.provincia} · MCC {prov.mcc}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusChip estado="RPE Activo" />
          {prov.certificaciones.map((c) => (
            <span key={c} className="rounded-full border border-[#22d3ee]/25 bg-[#22d3ee]/15 px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#22d3ee]">{c}</span>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t('portal.panel.incomeTotal')}  value={corto(ingresos)}   sub={t('portal.panel.incomeSub')}                                       Icon={TrendingUp}  accent="#1b4dff" />
        <KpiCard label={t('portal.panel.settled')}      value={corto(ingresos)}   sub={`${liquidadas.length} ${t('portal.panel.settledSub')}`}            Icon={CheckCircle2} accent="#16a34a" />
        <KpiCard label={t('portal.panel.inProcess')}    value={corto(procMonto)}  sub={`${enProceso.length + pendientes.length} ${t('portal.panel.inProcessSub')}`} Icon={Clock}      accent="#d97706" />
        <KpiCard label={t('portal.panel.cardPayments')} value={corto(pagTarjeta)} sub={t('portal.panel.cardPaymentsSub')}                                  Icon={CreditCard} accent="#1434cb" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Bar chart */}
        <div className={`${card} p-5`}>
          <p className="mb-4 text-sm font-bold text-slate-50">{t('portal.panel.monthlyChart')}</p>
          <div className="flex items-end gap-3" style={{ height: 160 }}>
            {barVals.map((val, i) => {
              const isActive = i === barVals.length - 1;
              const pct = (val / maxBar) * 100;
              return (
                <div key={months[i]} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[0.7rem] text-slate-400" style={{ fontFamily: mono }}>
                    {val >= 1000 ? `B/.${Math.round(val/1000)}K` : `B/.${val}`}
                  </span>
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: [0.4,0,0.2,1] }}
                    className="w-full rounded-t"
                    style={{ maxHeight: '100%', minHeight: 4, background: isActive ? 'linear-gradient(180deg,#3B82F6,#1b4dff)' : '#e2e8f0' }}
                  />
                  <span className="text-[0.72rem] text-slate-400">{months[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Onboarding */}
        <div className={`${card} p-5`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-50">{t('portal.panel.onboarding')}</p>
            <span className="text-sm font-semibold text-[#86a9ff]" style={{ fontFamily: mono }}>{completados}/{onboardingLabels.length}</span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(completados/onboardingLabels.length)*100}%` }}
              transition={{ duration: 0.8, ease: [0.4,0,0.2,1] }}
              className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#1b4dff,#3B82F6)' }} />
          </div>
          <div className="flex flex-col gap-3">
            {onboardingLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                {onboardingStatus[i]
                  ? <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
                  : <motion.div animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 2, repeat: Infinity }}
                      className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#1b4dff]" />}
                <span className={`text-sm ${onboardingStatus[i] ? 'text-slate-200' : 'text-slate-400'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent sales */}
        <div className={`${card} overflow-hidden`}>
          <div className="border-b border-white/[0.06] px-5 py-4"><p className="text-sm font-bold text-slate-50">{t('portal.panel.recentSales')}</p></div>
          {VENTAS_PROVEEDOR.slice(0, 4).map((v) => (
            <div key={v.id} className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-50">{v.entidad.nombre}</p>
                <p className="truncate text-xs text-slate-400">{v.articulos.slice(0, 40)}{v.articulos.length > 40 ? '…' : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600" style={{ fontFamily: mono }}>+{balboas(v.monto)}</p>
                <StatusChip estado={v.estado} />
              </div>
            </div>
          ))}
        </div>

        {/* Open tenders */}
        <div className={`${card} overflow-hidden`}>
          <div className="border-b border-white/[0.06] px-5 py-4"><p className="text-sm font-bold text-slate-50">{t('portal.panel.openTenders')}</p></div>
          {LICITACIONES.filter((l) => l.estado !== 'Cerrada').slice(0, 3).map((l) => (
            <div key={l.id} className="border-b border-white/[0.06] px-5 py-3.5 last:border-0">
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="flex-1 truncate text-sm font-bold text-slate-50">{l.titulo}</p>
                <span className="shrink-0 rounded-[10px] border border-[#1b4dff]/15 bg-[#1b4dff]/10 px-2 py-0.5 text-[0.7rem] font-bold text-[#86a9ff]">{l.puntajeCoincidencia}%</span>
              </div>
              <p className="text-xs text-slate-400">{l.entidad.split('(')[0].trim()} · {t('portal.licitaciones.closeDate')} {l.fechaCierre}</p>
              <p className="mt-0.5 text-sm font-bold text-slate-50">{corto(l.presupuesto)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Sales History ── */
function VistaHistorialVentas() {
  const { t } = useLang();
  type Filtro = 'Todas' | 'Liquidado' | 'Pendiente' | 'En Proceso';
  const [filtro, setFiltro] = useState<Filtro>('Todas');
  const visibles = filtro === 'Todas' ? VENTAS_PROVEEDOR : VENTAS_PROVEEDOR.filter((v) => v.estado === filtro);
  const total    = visibles.reduce((s, x) => s + x.monto, 0);
  const FILTROS: Filtro[] = ['Todas', 'Liquidado', 'Pendiente', 'En Proceso'];
  const cols = [0,1,2,3,4,5,6].map((i) => t(`portal.ventas.cols.${i}`));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">{t('portal.ventas.title')}</h2>
        <p className="mt-1 text-sm text-slate-400">{t('portal.ventas.sub')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Ventas Totales" value={corto(VENTAS_PROVEEDOR.reduce((s,x)=>s+x.monto,0))} sub={`${VENTAS_PROVEEDOR.length} transacciones`} Icon={Receipt} accent="#1b4dff" />
        <KpiCard label="Liquidado"      value={corto(VENTAS_PROVEEDOR.filter(v=>v.estado==='Liquidado').reduce((s,x)=>s+x.monto,0))} sub="Disponible para retiro" Icon={CheckCircle2} accent="#16a34a" />
        <KpiCard label="En Proceso"     value={corto(VENTAS_PROVEEDOR.filter(v=>v.estado==='En Proceso').reduce((s,x)=>s+x.monto,0))} sub="2–3 días hábiles" Icon={Clock} accent="#d97706" />
        <KpiCard label="Pendiente"      value={corto(VENTAS_PROVEEDOR.filter(v=>v.estado==='Pendiente').reduce((s,x)=>s+x.monto,0))} sub="En espera" Icon={AlertTriangle} accent="#64748b" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
        {FILTROS.map((f) => (
          <button key={f} type="button" onClick={() => setFiltro(f)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              filtro === f ? 'border border-[#1b4dff]/30 bg-[#1b4dff]/10 text-[#86a9ff]' : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:text-slate-200'
            }`}>
            {f === 'Todas' ? t('portal.ventas.all') : f}
          </button>
        ))}
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                {cols.map((c) => <th key={c} className="whitespace-nowrap px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {visibles.map((v) => (
                <tr key={v.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3"><span className="text-xs font-semibold text-slate-200" style={{ fontFamily: mono }}>{v.id}</span></td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-slate-50">{v.entidad.nombre}</p>
                    <p className="text-xs text-slate-400">{v.entidad.dependencia}</p>
                  </td>
                  <td className="px-4 py-3"><span className="block max-w-[200px] truncate text-xs text-slate-300">{v.articulos}</span></td>
                  <td className="px-4 py-3"><span className="whitespace-nowrap text-sm font-bold text-green-600" style={{ fontFamily: mono }}>+{balboas(v.monto)}</span></td>
                  <td className="px-4 py-3"><span className="whitespace-nowrap text-xs text-slate-300" style={{ fontFamily: mono }}>{v.metodoPago}</span></td>
                  <td className="px-4 py-3"><StatusChip estado={v.estado} /></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-300" style={{ fontFamily: mono }}>{v.fechaLiquidacion ?? '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{visibles.length} {visibles.length !== 1 ? t('portal.ventas.records') : t('portal.ventas.record')}</span>
        <span className="text-sm font-bold text-slate-50" style={{ fontFamily: mono }}>{t('portal.ventas.total')} {balboas(total)}</span>
      </div>
    </div>
  );
}

/* ── Tenders ── */
function VistaLicitaciones() {
  const { t } = useLang();
  const [seleccionada, setSeleccionada] = useState<Licitacion | null>(null);

  if (seleccionada) {
    const cumplidas  = seleccionada.requisitos.filter((r) => r.cumple).length;
    const matchColor = seleccionada.puntajeCoincidencia >= 90 ? '#16a34a' : seleccionada.puntajeCoincidencia >= 70 ? '#d97706' : '#D42027';
    const circ       = 2 * Math.PI * 28;
    const offset     = circ - (circ * seleccionada.puntajeCoincidencia) / 100;
    const summaryKeys = [0,1,2,3,4].map((i) => t(`portal.licitaciones.summaryKeys.${i}`));
    const summaryVals = [seleccionada.categoria, seleccionada.entidad.split('(')[0].trim(), corto(seleccionada.presupuesto), seleccionada.fechaCierre, `${cumplidas}/${seleccionada.requisitos.length}`];
    const cerrada = seleccionada.estado === 'Cerrada';

    return (
      <div className="flex flex-col gap-6">
        <button onClick={() => setSeleccionada(null)} className="inline-flex items-center gap-1.5 self-start text-sm text-slate-400 hover:text-slate-100">
          <ChevronLeft className="h-3.5 w-3.5" /> {t('portal.licitaciones.back')}
        </button>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-5">
            <div className={`${card} p-5`}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs text-slate-400" style={{ fontFamily: mono }}>{seleccionada.id}</span>
                    <StatusChip estado={seleccionada.estado} />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-50">{seleccionada.titulo}</h2>
                  <p className="mt-1 text-sm text-slate-400">{seleccionada.entidad} · {seleccionada.categoria}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="m-0 text-2xl font-bold text-slate-50" style={{ fontFamily: mono }}>{corto(seleccionada.presupuesto)}</p>
                  <p className="text-xs text-slate-400">{t('portal.licitaciones.budgetLabel')}</p>
                </div>
              </div>
              <div className="flex gap-6 text-sm text-slate-400">
                <span>{t('portal.licitaciones.published')} <strong className="text-slate-100">{seleccionada.fechaPublicacion}</strong></span>
                <span>{t('portal.licitaciones.closeDate')} <strong className="text-slate-100">{seleccionada.fechaCierre}</strong></span>
              </div>
            </div>

            <div className={`${card} p-5`}>
              <p className="mb-3 text-sm font-bold text-slate-50">{t('portal.licitaciones.descTitle')}</p>
              <p className="text-sm leading-7 text-slate-300">{seleccionada.descripcion}</p>
            </div>

            <div className={`${card} p-5`}>
              <p className="mb-4 text-sm font-bold text-slate-50">{t('portal.licitaciones.reqTitle')} ({cumplidas}/{seleccionada.requisitos.length})</p>
              <div className="flex flex-col gap-3">
                {seleccionada.requisitos.map(({ etiqueta, cumple }) => (
                  <div key={etiqueta} className="flex items-center gap-3">
                    {cumple ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" /> : <XCircle className="h-4 w-4 shrink-0 text-[#D42027]" />}
                    <span className={`flex-1 text-sm ${cumple ? 'text-slate-200' : 'text-slate-400'}`}>{etiqueta}</span>
                    <span className="rounded-[10px] px-2 py-0.5 text-[0.7rem] font-semibold"
                      style={{ background: cumple ? 'rgba(22,163,74,0.1)' : 'rgba(212,32,39,0.1)', color: cumple ? '#16a34a' : '#D42027' }}>
                      {cumple ? t('portal.licitaciones.meets') : t('portal.licitaciones.missing')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button disabled={cerrada}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-400"
              style={cerrada ? undefined : { background: 'linear-gradient(135deg,#1b4dff,#1434cb)' }}>
              {cerrada ? t('portal.licitaciones.submitClosed') : <>{t('portal.licitaciones.submitBtn')} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className={`${card} p-5 text-center`}>
              <p className="mb-4 text-sm font-bold text-slate-50">{t('portal.licitaciones.matchScore')}</p>
              <div className="mb-3 flex justify-center">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <motion.circle cx="40" cy="40" r="28" fill="none" strokeWidth="8" stroke={matchColor} strokeLinecap="round"
                    strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: [0.4,0,0.2,1] }} style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px' }} />
                  <text x="40" y="45" textAnchor="middle" fontSize="15" fontWeight="bold" fill={matchColor} fontFamily={mono}>{seleccionada.puntajeCoincidencia}%</text>
                </svg>
              </div>
              <p className="text-sm font-bold" style={{ color: matchColor }}>
                {seleccionada.puntajeCoincidencia >= 90 ? t('portal.licitaciones.excellent') : seleccionada.puntajeCoincidencia >= 70 ? t('portal.licitaciones.good') : t('portal.licitaciones.partial')}
              </p>
            </div>

            <div className={`${card} p-5`}>
              <p className="mb-3 text-sm font-bold text-slate-50">{t('portal.licitaciones.summaryTitle')}</p>
              <div className="flex flex-col gap-2">
                {summaryKeys.map((k, i) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-xs text-slate-400">{k}</span>
                    <span className="text-right text-xs font-semibold text-slate-200">{summaryVals[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const abiertas  = LICITACIONES.filter((l) => l.estado === 'Abierta').length;
  const porCerrar = LICITACIONES.filter((l) => l.estado === 'Por Cerrar').length;
  const cerradas  = LICITACIONES.filter((l) => l.estado === 'Cerrada').length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">{t('portal.licitaciones.title')}</h2>
        <p className="mt-1 text-sm text-slate-400">{t('portal.licitaciones.sub')}</p>
      </div>
      <div className="flex flex-wrap gap-5 text-sm font-bold">
        <span className="text-green-600">{t('portal.licitaciones.open')} ({abiertas})</span>
        <span className="text-amber-600">{t('portal.licitaciones.closing')} ({porCerrar})</span>
        <span className="text-slate-400">{t('portal.licitaciones.closed')} ({cerradas})</span>
      </div>

      <div className="flex flex-col gap-4">
        {LICITACIONES.map((l) => (
          <motion.button key={l.id} type="button" onClick={() => setSeleccionada(l)}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}
            className={`${card} cursor-pointer p-5 text-left transition-shadow hover:shadow-md`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400" style={{ fontFamily: mono }}>{l.id}</span>
                  <StatusChip estado={l.estado} />
                  <span className="rounded-[10px] border border-[#1b4dff]/15 bg-[#1b4dff]/10 px-2 py-0.5 text-[0.72rem] font-bold text-[#86a9ff]">{l.puntajeCoincidencia}{t('portal.licitaciones.matchSuffix')}</span>
                </div>
                <p className="mb-1 text-sm font-bold text-slate-50">{l.titulo}</p>
                <p className="text-sm text-slate-400">{l.entidad} · {l.categoria}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="m-0 text-lg font-bold text-slate-50" style={{ fontFamily: mono }}>{corto(l.presupuesto)}</p>
                <p className="text-xs text-slate-400">{t('portal.licitaciones.closeDate')} {l.fechaCierre}</p>
                <ChevronRight className="ml-auto mt-1 h-3.5 w-3.5 text-slate-300" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ── Product Catalog ── */
interface Producto { id: string; nombre: string; descripcion: string; precio: number; entregaDias: number; categoria: string; unspsc: string; estado: 'Activo'|'Borrador'|'Pausado'; fechaRegistro: string; vistas: number }
const PRODUCTOS_DEMO: Producto[] = [
  { id:'PRD-001', nombre:'Laptop Corporativa HP EliteBook 840 G9',  descripcion:'Laptop empresarial 14" Core i7-1255U, 16 GB RAM, 512 GB SSD NVMe', precio:1250, entregaDias:10, categoria:'Hardware de Cómputo', unspsc:'43211507', estado:'Activo',   fechaRegistro:'2024-01-15', vistas:143 },
  { id:'PRD-002', nombre:'Monitor Dell 27" 4K P2723QE',              descripcion:'Monitor profesional UHD 4K, panel IPS, USB-C 90 W, altura ajustable',  precio:580,  entregaDias:7,  categoria:'Hardware de Cómputo', unspsc:'43211902', estado:'Activo',   fechaRegistro:'2024-02-01', vistas:89  },
  { id:'PRD-003', nombre:'Mouse Ergonómico Logitech MX Master 3',    descripcion:'Mouse inalámbrico profesional, rueda electromagnética, 7 botones',      precio:89,   entregaDias:5,  categoria:'Periféricos',         unspsc:'43211706', estado:'Activo',   fechaRegistro:'2024-02-20', vistas:212 },
  { id:'PRD-004', nombre:'Disco Duro Externo Seagate 2 TB',          descripcion:'HDD portátil 2.5", USB 3.0, compatible Windows/Mac',                    precio:75,   entregaDias:5,  categoria:'Almacenamiento',      unspsc:'43201803', estado:'Activo',   fechaRegistro:'2024-03-05', vistas:67  },
  { id:'PRD-005', nombre:'Switch Cisco Catalyst 1000-8T',            descripcion:'Switch administrado 8 puertos Gigabit, 2 SFP uplinks',                  precio:420,  entregaDias:14, categoria:'Redes',               unspsc:'43222610', estado:'Borrador', fechaRegistro:'2024-04-10', vistas:12  },
];
const CATEGORIAS_PROD = ['Hardware de Cómputo','Periféricos','Almacenamiento','Redes y Conectividad','Servicios de TI','Mobiliario de Oficina','Seguridad Electrónica','Otro'];
const DEMO_PROD: Record<string, string> = { nombre:'Tablet Gobierno Lenovo Tab P12 Pro', descripcion:'Tablet 12.6" AMOLED, Snapdragon 870, 8 GB RAM, 256 GB, LTE', precio:'650.00', entregaDias:'8', unspsc:'43211503' };

const cFieldCls  = 'h-11 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-400 transition-colors focus:border-[#2f6bff] focus:outline-none';
const cLabelCls  = 'mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400';

function VistaCatalogoProductos() {
  const { t } = useLang();
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_DEMO);
  const [mostraForm, setMostraForm] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre:'', descripcion:'', precio:'', entregaDias:'', categoria:'Hardware de Cómputo', unspsc:'', estado:'Activo' as Producto['estado'] });

  const autoFillF = (campo: keyof typeof nuevo) => { if (!nuevo[campo]) setNuevo((p) => ({ ...p, [campo]: DEMO_PROD[campo] ?? '' })); };

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    const prod: Producto = { id:`PRD-${String(productos.length+1).padStart(3,'0')}`, nombre:nuevo.nombre||DEMO_PROD.nombre, descripcion:nuevo.descripcion||DEMO_PROD.descripcion, precio:parseFloat(nuevo.precio)||650, entregaDias:parseInt(nuevo.entregaDias)||8, categoria:nuevo.categoria, unspsc:nuevo.unspsc||DEMO_PROD.unspsc, estado:nuevo.estado, fechaRegistro:new Date().toISOString().slice(0,10), vistas:0 };
    setProductos((p) => [prod, ...p]);
    setNuevo({ nombre:'', descripcion:'', precio:'', entregaDias:'', categoria:'Hardware de Cómputo', unspsc:'', estado:'Activo' });
    setMostraForm(false);
  };

  const activos = productos.filter((p) => p.estado === 'Activo').length;
  const promedio = productos.length ? productos.reduce((s,p) => s+p.precio, 0)/productos.length : 0;
  const cats = new Set(productos.map((p) => p.categoria)).size;

  const kpiLabels = [0,1,2,3].map((i) => t(`portal.catalogo.kpiLabels.${i}`));
  const kpiSubs   = [0,1,2,3].map((i) => t(`portal.catalogo.kpiSubs.${i}`));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">{t('portal.catalogo.title')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('portal.catalogo.sub')}</p>
        </div>
        <button onClick={() => setMostraForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1b4dff]/30 transition-all hover:shadow-[#1b4dff]/50"
          style={{ background: 'linear-gradient(135deg,#1b4dff,#1434cb)' }}>
          <Plus className="h-4 w-4" /> {t('portal.catalogo.addBtn')}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={kpiLabels[0]} value={String(productos.length)} sub={`${activos} ${kpiSubs[0]}`} Icon={Store} accent="#1b4dff" />
        <KpiCard label={kpiLabels[1]} value={String(activos)}          sub={kpiSubs[1]}                  Icon={CheckCircle2} accent="#16a34a" />
        <KpiCard label={kpiLabels[2]} value={balboas(promedio)}        sub={kpiSubs[2]}                  Icon={TrendingUp} accent="#d97706" />
        <KpiCard label={kpiLabels[3]} value={String(cats)}             sub={kpiSubs[3]}                  Icon={Tag} accent="#1434cb" />
      </div>

      <AnimatePresence>
        {mostraForm && (
          <motion.div key="form" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} transition={{ duration:0.3, ease:[0.4,0,0.2,1] }} className="overflow-hidden">
            <div className={card}>
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <p className="text-sm font-bold text-slate-50">{t('portal.catalogo.newTitle')}</p>
                <p className="text-xs text-slate-400">{t('portal.catalogo.autoFillHint')}</p>
              </div>
              <form onSubmit={agregar} className="p-5">
                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="cat-nombre" className={cLabelCls}>{t('portal.catalogo.nombre')}</label>
                    <input id="cat-nombre" className={cFieldCls} placeholder={DEMO_PROD.nombre} value={nuevo.nombre} required
                      onChange={(e) => setNuevo((p) => ({...p,nombre:e.target.value}))} onFocus={() => autoFillF('nombre')} />
                  </div>
                  <div>
                    <label htmlFor="cat-desc" className={cLabelCls}>{t('portal.catalogo.desc')}</label>
                    <input id="cat-desc" className={cFieldCls} placeholder={DEMO_PROD.descripcion} value={nuevo.descripcion}
                      onChange={(e) => setNuevo((p) => ({...p,descripcion:e.target.value}))} onFocus={() => autoFillF('descripcion')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="cat-precio" className={cLabelCls}>{t('portal.catalogo.precio')}</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm text-slate-400">B/.</span>
                        <input id="cat-precio" className={`${cFieldCls} pl-9`} placeholder={DEMO_PROD.precio} value={nuevo.precio}
                          onChange={(e) => setNuevo((p) => ({...p,precio:e.target.value}))} onFocus={() => autoFillF('precio')} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="cat-entrega" className={cLabelCls}>{t('portal.catalogo.entrega')}</label>
                      <input id="cat-entrega" className={cFieldCls} placeholder={DEMO_PROD.entregaDias} value={nuevo.entregaDias}
                        onChange={(e) => setNuevo((p) => ({...p,entregaDias:e.target.value}))} onFocus={() => autoFillF('entregaDias')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="cat-cat" className={cLabelCls}>{t('portal.catalogo.categoria')}</label>
                      <select id="cat-cat" className={cFieldCls} value={nuevo.categoria} onChange={(e) => setNuevo((p) => ({...p,categoria:e.target.value}))}>
                        {CATEGORIAS_PROD.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="cat-unspsc" className={cLabelCls}>{t('portal.catalogo.unspsc')}</label>
                      <input id="cat-unspsc" className={cFieldCls} placeholder={DEMO_PROD.unspsc} value={nuevo.unspsc}
                        onChange={(e) => setNuevo((p) => ({...p,unspsc:e.target.value}))} onFocus={() => autoFillF('unspsc')} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setMostraForm(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.04]">{t('portal.catalogo.cancelBtn')}</button>
                    <button type="submit" className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#1b4dff,#1434cb)' }}>
                      <Check className="h-4 w-4" /> {t('portal.catalogo.publishBtn')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {productos.map((prod) => (
            <motion.div key={prod.id} layout initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.94 }} transition={{ duration:0.2 }}
              className={`${card} flex h-full flex-col p-5`}>
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#1b4dff]/12 bg-[#1b4dff]/[0.08]">
                  <Store className="h-[18px] w-[18px] text-[#86a9ff]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold text-slate-50">{prod.nombre}</p>
                  <p className="text-xs text-slate-400">{prod.categoria}</p>
                </div>
              </div>
              <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-slate-400">{prod.descripcion}</p>
              <div className="mb-4 flex flex-col gap-1">
                {([['Precio', balboas(prod.precio)], ['Entrega', `${prod.entregaDias} días`], ['UNSPSC', prod.unspsc], ['Vistas', String(prod.vistas)]] as [string,string][]).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{k}</span>
                    <span className={`text-xs font-semibold ${k === 'Precio' ? 'text-[#86a9ff]' : 'text-slate-200'}`} style={{ fontFamily: k === 'Precio' || k === 'UNSPSC' ? mono : undefined }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-3">
                <StatusChip estado={prod.estado} />
                <span className="text-xs text-slate-400" style={{ fontFamily: mono }}>{prod.fechaRegistro}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Profile ── */
function VistaMiPerfil() {
  const { t } = useLang();
  const prov = PROVEEDOR_ACTUAL;
  const [editando, setEditando] = useState(false);

  const DOCUMENTOS = [
    { etiqueta: 'Paz y Salvo Fiscal — DGI',     estado: 'Verificado', fecha: '2024-01-15' },
    { etiqueta: 'Póliza de Seguro',              estado: 'Verificado', fecha: '2024-03-20' },
    { etiqueta: 'Registro Comercial',            estado: 'Verificado', fecha: '2023-11-08' },
    { etiqueta: 'Cert. Empresa Femenina',        estado: 'Verificado', fecha: '2022-06-01' },
    { etiqueta: 'Registro de Proveedores (RPE)', estado: 'Activo',     fecha: '2024-10-01' },
  ];

  const actionIcons = [Store, Download, Phone, ExternalLink];
  const actionColors = ['#1b4dff', '#1434cb', '#16a34a', '#d97706'];
  const actionLabels = [0,1,2,3].map((i) => t(`portal.perfil.actions.${i}`));

  const fieldLabels = [0,1,2,3,4,5,6,7,8].map((i) => t(`portal.perfil.fields.${i}`));
  const fieldValues = [prov.ruc, prov.mcc, prov.tamano, prov.estadoRPE, prov.polizaSeguro, prov.nivelIII ? 'Soportado' : 'No soportado', prov.registradoDesde, prov.aceptaTarjeta ? 'Visa + MC' : 'No', prov.categorias.join(', ')];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">{t('portal.perfil.title')}</h2>
          <p className="mt-1 text-sm text-slate-400">{prov.nombre} — ID: {prov.id}</p>
        </div>
        <button onClick={() => setEditando(!editando)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.04]">
          {editando ? t('portal.perfil.saveBtn') : t('portal.perfil.editBtn')}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-5">
          <div className={`${card} p-5`}>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#1b4dff,#3B82F6)' }}>{prov.nombre[0]}</div>
              <div>
                <p className="text-lg font-semibold text-slate-50">{prov.nombre}</p>
                <p className="text-sm text-slate-400">{prov.ciudad}, {prov.provincia} · {prov.contacto.correo}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <StatusChip estado="RPE Activo" />
                  {prov.certificaciones.map((c) => (
                    <span key={c} className="rounded-full border border-[#22d3ee]/20 bg-[#22d3ee]/10 px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#22d3ee]">{c}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {fieldLabels.map((k, i) => (
                <div key={k}>
                  <p className="mb-0.5 text-[0.7rem] uppercase tracking-[0.08em] text-slate-400">{k}</p>
                  {editando
                    ? <input defaultValue={fieldValues[i]} className="h-9 w-full rounded-lg border border-white/10 px-2 text-sm focus:border-[#1b4dff] focus:outline-none" />
                    : <p className="text-sm font-bold text-slate-100">{fieldValues[i]}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} overflow-hidden`}>
            <div className="border-b border-white/[0.06] px-5 py-4"><p className="text-sm font-bold text-slate-50">{t('portal.perfil.docsTitle')}</p></div>
            {DOCUMENTOS.map(({ etiqueta, estado, fecha }) => (
              <div key={etiqueta} className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-50">{etiqueta}</p>
                    <p className="text-xs text-slate-400">{fecha}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip estado={estado === 'Verificado' ? 'Activo' : estado} />
                  <button className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300">
                    <Upload className="h-3 w-3" /> {t('portal.perfil.replaceBtn')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className={`${card} p-5`}>
            <p className="mb-3 text-sm font-bold text-slate-50">{t('portal.perfil.ratingTitle')}</p>
            <div className="mb-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-[18px] w-[18px]"
                  style={{ color: i < Math.floor(prov.calificacion) ? '#d97706' : '#d1d5db', fill: i < Math.floor(prov.calificacion) ? '#d97706' : 'none' }} />
              ))}
              <span className="ml-1 text-sm font-bold text-slate-100" style={{ fontFamily: mono }}>{prov.calificacion}</span>
            </div>
            <p className="text-xs text-slate-400">{t('portal.perfil.ratingBased').replace('{n}', String(prov.ordenesCompletadas))}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {([[t('portal.perfil.ordenes'), prov.ordenesCompletadas], [t('portal.perfil.ingresos'), corto(prov.ingresos)], [t('portal.perfil.promOrden'), corto(prov.ingresos/prov.ordenesCompletadas)], [t('portal.perfil.desde'), prov.registradoDesde.slice(0,4)]] as [string, string|number][]).map(([k,v]) => (
                <div key={k} className="rounded-[10px] bg-white/[0.04] p-2.5 text-center">
                  <p className="m-0 text-lg font-bold text-slate-50" style={{ fontFamily: mono }}>{v}</p>
                  <p className="text-xs text-slate-400">{k}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} p-5`}>
            <p className="mb-3 text-sm font-bold text-slate-50">{t('portal.perfil.certsTitle')}</p>
            <div className="flex flex-wrap gap-2">
              {[...prov.certificaciones, 'RPE Activo', 'Nivel III'].map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full border border-[#22d3ee]/20 bg-[#22d3ee]/10 px-2.5 py-1 text-xs font-semibold text-[#22d3ee]">
                  <Check className="h-2.5 w-2.5" />{c}
                </span>
              ))}
            </div>
          </div>

          <div className={`${card} p-5`}>
            <p className="mb-3 text-sm font-bold text-slate-50">{t('portal.perfil.actionsTitle')}</p>
            <div className="flex flex-col gap-1">
              {actionLabels.map((label, i) => {
                const Icon = actionIcons[i];
                return (
                  <button key={label} className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left text-slate-200 hover:bg-white/[0.04]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${actionColors[i]}12`, border: `1px solid ${actionColors[i]}20` }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: actionColors[i] }} />
                    </span>
                    <span className="text-sm">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── MAIN PORTAL ─────────────────────── */
interface PortalProps { onSignOut: () => void }

const NAV_ITEMS: { id: Vista; labelKey: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; badgeFn?: () => number }[] = [
  { id: 'panel',        labelKey: 'portal.nav.panel',        Icon: LayoutDashboard },
  { id: 'ventas',       labelKey: 'portal.nav.ventas',       Icon: Receipt },
  { id: 'licitaciones', labelKey: 'portal.nav.licitaciones', Icon: FileText, badgeFn: () => LICITACIONES.filter((l) => l.estado !== 'Cerrada').length },
  { id: 'catalogo',     labelKey: 'portal.nav.catalogo',     Icon: Store },
  { id: 'perfil',       labelKey: 'portal.nav.perfil',       Icon: UserCircle },
];

export function PortalApp({ onSignOut }: PortalProps) {
  const { t, lang, setLang } = useLang();
  const [vista, setVista]         = useState<Vista>('panel');
  const [colapsado, setColapsado] = useState(false);
  const prov = PROVEEDOR_ACTUAL;

  const vistaTitles: Record<Vista, string> = {
    panel: t('portal.nav.panel'), ventas: t('portal.nav.ventas'), licitaciones: t('portal.nav.licitaciones'), catalogo: t('portal.nav.catalogo'), perfil: t('portal.nav.perfil'),
  };

  return (
    <div className="flex min-h-screen"
      style={{ backgroundColor: '#0a0e1a', color: '#f4f6fb', backgroundImage: 'radial-gradient(50% 50% at 85% 0%, rgba(20,52,203,0.1) 0%, transparent 70%), radial-gradient(60% 60% at 10% 100%, rgba(27,77,255,0.1) 0%, transparent 70%)' }}>

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: colapsado ? 64 : 248 }}
        transition={{ duration: 0.35, ease: [0.4,0,0.2,1] }}
        className="fixed left-0 top-0 z-30 flex h-screen flex-col overflow-hidden border-r border-white/[0.06]"
        style={{ background: '#080D1E' }}
      >
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#22d3ee]/30 bg-[#1b4dff]/45">
            <PanamaShieldTiny />
          </div>
          <AnimatePresence initial={false}>
            {!colapsado && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <p className="whitespace-nowrap text-sm font-bold leading-tight text-white">PanamaCompra</p>
                <p className="whitespace-nowrap text-[0.6rem] uppercase tracking-[0.16em] text-[#22d3ee]/50">República de Panamá</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Supplier identity card */}
        <AnimatePresence initial={false}>
          {!colapsado && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
              className="m-3 shrink-0 overflow-hidden rounded-xl border border-[#1b4dff]/20 bg-[#1b4dff]/10 p-3">
              <p className="truncate text-sm font-bold leading-tight text-white">{prov.nombre}</p>
              <p className="mt-0.5 text-xs text-slate-400/65">{prov.ciudad}, {prov.provincia} · MCC {prov.mcc}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[0.65rem] font-bold text-green-400">RPE Activo</span>
                {prov.certificaciones.map((c) => (
                  <span key={c} className="rounded bg-[#22d3ee]/15 px-1.5 py-0.5 text-[0.65rem] font-bold text-[#22d3ee]">{c}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          {NAV_ITEMS.map(({ id, labelKey, Icon, badgeFn }) => {
            const activo = vista === id;
            const badge  = badgeFn?.();
            return (
              <button key={id} type="button" onClick={() => setVista(id)} title={colapsado ? t(labelKey) : undefined}
                className={`mb-1 flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 transition-all ${colapsado ? 'justify-center' : 'justify-start'}`}
                style={{ background: activo ? 'rgba(29,78,216,0.15)' : 'transparent', borderLeft: `3px solid ${activo ? '#3B82F6' : 'transparent'}`, color: activo ? '#93C5FD' : 'rgba(255,255,255,0.6)' }}>
                <span className="relative shrink-0">
                  <Icon className="h-[17px] w-[17px]" />
                  {badge && badge > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1b4dff] text-[0.6rem] font-bold text-white">{badge}</span>
                  )}
                </span>
                <AnimatePresence initial={false}>
                  {!colapsado && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap text-sm font-medium">{t(labelKey)}</motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* Bottom: lang + sign out + collapse */}
        <div className="flex shrink-0 flex-col gap-1 border-t border-white/[0.06] p-2">
          <AnimatePresence initial={false}>
            {!colapsado && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <button type="button" onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                  className="mb-1 flex w-full items-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/50 hover:text-white/80">
                  <Languages className="h-3.5 w-3.5" />
                  {lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="button" onClick={onSignOut} title={colapsado ? t('portal.nav.signOut') : undefined}
            className={`flex items-center gap-3 rounded-[10px] px-3 py-2 text-white/35 hover:text-white/60 ${colapsado ? 'justify-center' : 'justify-start'}`}>
            <LogOut className="h-4 w-4 shrink-0" />
            <AnimatePresence initial={false}>
              {!colapsado && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  className="whitespace-nowrap text-sm">{t('portal.nav.signOut')}</motion.span>
              )}
            </AnimatePresence>
          </button>

          <div className={`flex ${colapsado ? 'justify-center' : 'justify-end'}`}>
            <button type="button" onClick={() => setColapsado((c) => !c)} aria-label={t('portal.nav.collapse')}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.05] text-white/35 hover:text-white/60">
              <motion.span animate={{ rotate: colapsado ? 180 : 0 }} transition={{ duration: 0.35 }} className="flex">
                <ChevronLeft className="h-3 w-3" />
              </motion.span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <motion.div
        animate={{ marginLeft: colapsado ? 64 : 248 }}
        transition={{ duration: 0.35, ease: [0.4,0,0.2,1] }}
        className="flex min-h-screen flex-1 flex-col"
      >
        {/* Top bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 px-6 py-4"
          style={{ background: 'rgba(10,14,26,0.72)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)' }}>
          <p className="text-sm font-bold text-slate-50">{vistaTitles[vista]}</p>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-50">{prov.contacto.nombre}</p>
              <p className="text-xs text-slate-400">{t('portal.perfil.adminRole')}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#1b4dff,#3B82F6)' }}>
              {prov.contacto.nombre.split(' ').map((n) => n[0]).join('')}
            </div>
          </div>
        </div>

        {/* View content */}
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div key={vista}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {vista === 'panel'        && <VistaPanelPrincipal />}
              {vista === 'ventas'       && <VistaHistorialVentas />}
              {vista === 'licitaciones' && <VistaLicitaciones />}
              {vista === 'catalogo'     && <VistaCatalogoProductos />}
              {vista === 'perfil'       && <VistaMiPerfil />}
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
}
