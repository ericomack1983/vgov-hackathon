'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plane, Plus, Filter, ChevronRight } from 'lucide-react';
import { useMissions } from '@/context/MissionsContext';
import { features } from '@/lib/features';
import { formatGTQ, formatDateRangeES, flagEmoji, parseISODate } from '@/lib/tci-format';
import { MissionStatusBadge, MISSION_STATUS_LABEL } from '@/components/tci/MissionStatusBadge';
import { MiniProgress } from '@/components/tci/BudgetRing';
import { MissionWizard } from '@/components/tci/MissionWizard';
import { TciToaster } from '@/components/tci/TciToaster';
import type { MissionStatus } from '@/lib/mock-data/types';
import { useT } from '@/context/LanguageContext';

const ALL_STATUSES: MissionStatus[] = [
  'borrador', 'pendiente_aprobacion', 'aprobada', 'activa', 'en_conciliacion', 'cerrada',
];

const INPUT_CLASS =
  'rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1434CB] focus:border-[#1434CB]';

export default function MisionesPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = useT();
  const { nueva } = use(searchParams);
  const { missions, entities, activeMissionCount, pendingReleaseGTQ } = useMissions();

  /* Enlace profundo desde el Asistente IA: /misiones?nueva=1.
     La acción del usuario gana sobre el parámetro de la URL. */
  const [wizardToggle, setWizardOpen] = useState<boolean | null>(null);
  const wizardOpen = wizardToggle ?? nueva === '1';
  const [ministryFilter, setMinistryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MissionStatus>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filtered = useMemo(() => {
    return missions
      .filter((m) => (ministryFilter === 'all' ? true : m.ministry === ministryFilter))
      .filter((m) => (statusFilter === 'all' ? true : m.status === statusFilter))
      .filter((m) => (from ? parseISODate(m.dates.end) >= parseISODate(from) : true))
      .filter((m) => (to ? parseISODate(m.dates.start) <= parseISODate(to) : true))
      .sort((a, b) => parseISODate(b.dates.start).getTime() - parseISODate(a.dates.start).getTime());
  }, [missions, ministryFilter, statusFilter, from, to]);

  if (!features.missions) return null;

  const acronym = (id: string) => entities.find((e) => e.id === id)?.acronym ?? '—';
  const entityName = (id: string) => entities.find((e) => e.id === id)?.name ?? '—';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <TciToaster />

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}
          >
            <Plane size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{t('page.missions.title')}</h1>
            <p className="text-sm text-slate-500">Viáticos y gasto de misión con controles de política en la tarjeta</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-md"
          style={{ background: 'linear-gradient(to right, #1434CB, #6366f1)' }}
        >
          <Plus size={14} />
          Nueva Misión
        </button>
      </div>

      {/* ── Resumen ── */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total de misiones', value: String(missions.length), color: '#6366f1', bg: 'bg-indigo-50' },
          { label: 'Activas', value: String(activeMissionCount), color: '#1434CB', bg: 'bg-blue-50' },
          {
            label: 'Pendientes de aprobación',
            value: String(missions.filter((m) => m.status === 'pendiente_aprobacion').length),
            color: '#f59e0b', bg: 'bg-amber-50',
          },
          { label: 'Saldo por liberar', value: formatGTQ(pendingReleaseGTQ), color: '#10b981', bg: 'bg-emerald-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl px-4 py-3`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filtros */}
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Filter size={13} className="text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Filtros:</span>
          </div>

          <select
            aria-label="Filtrar por ministerio"
            value={ministryFilter}
            onChange={(e) => setMinistryFilter(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="all">Todos los ministerios</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>{e.acronym} — {e.name}</option>
            ))}
          </select>

          <select
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | MissionStatus)}
            className={INPUT_CLASS}
          >
            <option value="all">Todos los estados</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{MISSION_STATUS_LABEL[s]}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <label htmlFor="mis-from" className="text-xs text-slate-400">Del</label>
            <input id="mis-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={INPUT_CLASS} />
            <label htmlFor="mis-to" className="text-xs text-slate-400">al</label>
            <input id="mis-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className={INPUT_CLASS} />
          </div>

          {(ministryFilter !== 'all' || statusFilter !== 'all' || from || to) && (
            <button
              type="button"
              onClick={() => { setMinistryFilter('all'); setStatusFilter('all'); setFrom(''); setTo(''); }}
              className="text-[11px] font-semibold text-[#1434CB] hover:text-[#0B1E8A]"
            >
              Limpiar
            </button>
          )}

          <span className="ml-auto text-[10px] text-slate-400">
            {filtered.length} misi{filtered.length === 1 ? 'ón' : 'ones'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg,#1434CB15,#6366f115)' }}
            >
              <Plane size={22} className="text-indigo-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">No hay misiones que coincidan</p>
            <p className="text-xs text-slate-400">Ajuste los filtros o cree una nueva misión.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['ID', 'Ministerio', 'Viajero', 'Destino', 'Fechas', 'Presupuesto', 'Gastado', 'Estado', ''].map((h, i) => (
                    <th
                      key={h || `sp-${i}`}
                      className={`px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${h ? '' : 'w-8'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/misiones/${m.id}`} className="text-xs font-bold text-[#1434CB] font-mono hover:underline">
                        {m.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-700">{acronym(m.ministry)}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{entityName(m.ministry)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-800">{m.traveler.name}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{m.traveler.role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm mr-1" aria-hidden>{flagEmoji(m.destination.countryCode)}</span>
                      <span className="text-xs text-slate-600">{m.destination.city}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDateRangeES(m.dates.start, m.dates.end)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">
                      {formatGTQ(m.budgetGTQ)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">{formatGTQ(m.spentGTQ)}</p>
                      <MiniProgress value={m.spentGTQ} max={m.budgetGTQ} width={92} />
                    </td>
                    <td className="px-4 py-3"><MissionStatusBadge status={m.status} /></td>
                    <td className="px-4 py-3">
                      <Link href={`/misiones/${m.id}`} aria-label={`Ver ${m.id}`} className="text-slate-300 hover:text-[#1434CB] transition-colors block">
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MissionWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
    </motion.div>
  );
}
