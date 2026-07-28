'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, ChevronDown, ChevronRight, ArrowUp, ArrowDown,
  X, CreditCard, Plane, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useMissions } from '@/context/MissionsContext';
import { features } from '@/lib/features';
import { formatGTQ, formatGTQCompact, formatDateRangeES, flagEmoji } from '@/lib/tci-format';
import { MissionStatusBadge } from '@/components/tci/MissionStatusBadge';
import { MiniProgress } from '@/components/tci/BudgetRing';
import { TciToaster } from '@/components/tci/TciToaster';
import type { Entity, EntityType } from '@/lib/mock-data/types';

const CARD_PANEL =
  'bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.06)] border border-slate-200 p-6';
const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1434CB] focus:border-[#1434CB]';
const LABEL_CLASS = 'block text-sm font-semibold text-slate-700 mb-1';

const TYPE_LABEL: Record<EntityType, string> = {
  ministerio: 'Ministerio',
  agencia: 'Agencia',
  programa: 'Programa',
};

/* ── Nodo del árbol ──────────────────────────────────────────────────────── */

function TreeNode({
  entity, depth, selectedId, onSelect,
}: {
  entity: Entity; depth: number; selectedId: string; onSelect: (id: string) => void;
}) {
  const { childEntities, entityStats } = useMissions();
  const [open, setOpen] = useState(true);
  const children = childEntities(entity.id);
  const stats = entityStats(entity.id);
  const selected = selectedId === entity.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 rounded-lg transition-colors ${
          selected ? 'bg-[#EEF1FD]' : 'hover:bg-slate-50'
        }`}
        style={{ paddingLeft: depth * 14 }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`p-1 text-slate-300 hover:text-slate-500 transition-colors ${children.length ? '' : 'invisible'}`}
          aria-label={open ? 'Colapsar' : 'Expandir'}
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <button
          type="button"
          onClick={() => onSelect(entity.id)}
          className="flex-1 min-w-0 text-left py-2 pr-2"
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold ${selected ? 'text-[#1434CB]' : 'text-slate-700'}`}
            >
              {entity.acronym}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {TYPE_LABEL[entity.type]}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{entity.name}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <MiniProgress value={stats.executedGTQ} max={entity.budgetGTQ} />
            <span className="text-[9px] font-semibold text-slate-400 shrink-0 tabular-nums">
              {stats.executedPct}%
            </span>
          </div>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {children.map((child) => (
              <TreeNode
                key={child.id}
                entity={child}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Modal de registro ───────────────────────────────────────────────────── */

function RegisterEntityModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { entities, addEntity } = useMissions();
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [type, setType] = useState<EntityType>('ministerio');
  const [parentId, setParentId] = useState('ent-tesoreria');
  const [budget, setBudget] = useState('');
  const [chain, setChain] = useState('Gestor de Viajes, Tesorería Nacional');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Ingrese el nombre de la entidad';
    if (!acronym.trim()) next.acronym = 'Ingrese las siglas';
    if (Number(budget) <= 0) next.budget = 'El presupuesto debe ser mayor a cero';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const slug = acronym.trim().toLowerCase().replace(/\s+/g, '-');
    const suffix = entities.some((e) => e.id === `ent-${slug}`) ? `-${entities.length + 1}` : '';

    const entity: Entity = {
      id: `ent-${slug}${suffix}`,
      name: name.trim(),
      acronym: acronym.trim().toUpperCase(),
      type,
      parentId: parentId || undefined,
      budgetGTQ: Number(budget),
      spentGTQ: 0,
      activeCards: 0,
      activeMissions: 0,
      approvalChain: chain.split(',').map((c) => c.trim()).filter(Boolean),
    };

    addEntity(entity);
    toast.success(`${entity.acronym} registrada`);
    setName(''); setAcronym(''); setBudget(''); setErrors({});
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">Registrar Entidad</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-1">Añada un ministerio, agencia o programa a la jerarquía.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="ent-name" className={LABEL_CLASS}>Nombre</label>
            <input id="ent-name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS}
              placeholder="Ministerio de Educación" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ent-acronym" className={LABEL_CLASS}>Siglas</label>
              <input id="ent-acronym" value={acronym} onChange={(e) => setAcronym(e.target.value)} className={INPUT_CLASS}
                placeholder="MINEDUC" />
              {errors.acronym && <p className="mt-1 text-xs text-red-600">{errors.acronym}</p>}
            </div>
            <div>
              <label htmlFor="ent-type" className={LABEL_CLASS}>Tipo</label>
              <select id="ent-type" value={type} onChange={(e) => setType(e.target.value as EntityType)} className={INPUT_CLASS}>
                {(Object.keys(TYPE_LABEL) as EntityType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ent-parent" className={LABEL_CLASS}>Entidad padre</label>
            <select id="ent-parent" value={parentId} onChange={(e) => setParentId(e.target.value)} className={INPUT_CLASS}>
              <option value="">Sin entidad padre (raíz)</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>{e.acronym} — {e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ent-budget" className={LABEL_CLASS}>Presupuesto asignado (GTQ)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Q</span>
              <input id="ent-budget" type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)}
                className={`${INPUT_CLASS} pl-7`} placeholder="25000000" />
            </div>
            {errors.budget && <p className="mt-1 text-xs text-red-600">{errors.budget}</p>}
          </div>

          <div>
            <label htmlFor="ent-chain" className={LABEL_CLASS}>Cadena de aprobación</label>
            <input id="ent-chain" value={chain} onChange={(e) => setChain(e.target.value)} className={INPUT_CLASS} />
            <p className="mt-1 text-xs text-slate-400">Separe los roles con comas, en orden de aprobación.</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-md"
              style={{ background: 'linear-gradient(to right, #1434CB, #6366f1)' }}
            >
              <Check size={14} /> Registrar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Página ──────────────────────────────────────────────────────────────── */

export default function EntidadesPage() {
  const { entities, childEntities, entityStats, getEntity, updateApprovalChain } = useMissions();
  const [selectedId, setSelectedId] = useState('ent-minex');
  const [modalOpen, setModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('');

  const roots = useMemo(() => childEntities(undefined), [childEntities]);
  const entity = getEntity(selectedId);
  const stats = entityStats(selectedId);

  if (!features.entityHierarchy) return null;

  function moveRole(index: number, dir: -1 | 1) {
    if (!entity) return;
    const chain = [...entity.approvalChain];
    const target = index + dir;
    if (target < 0 || target >= chain.length) return;
    [chain[index], chain[target]] = [chain[target], chain[index]];
    updateApprovalChain(entity.id, chain);
  }

  function removeRole(index: number) {
    if (!entity) return;
    updateApprovalChain(entity.id, entity.approvalChain.filter((_, i) => i !== index));
    toast.success('Rol eliminado de la cadena');
  }

  function addRole() {
    if (!entity || !newRole.trim()) return;
    updateApprovalChain(entity.id, [...entity.approvalChain, newRole.trim()]);
    setNewRole('');
    toast.success('Rol agregado a la cadena');
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <TciToaster />

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1434CB,#6366f1)' }}>
            <Building2 size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Entidades</h1>
            <p className="text-sm text-slate-500">Jerarquía institucional, presupuesto y cadenas de aprobación</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-md"
          style={{ background: 'linear-gradient(to right, #1434CB, #6366f1)' }}
        >
          <Plus size={14} />
          Registrar Entidad
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* ── Árbol ── */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.06)] border border-slate-200 p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
            Jerarquía · {entities.length} entidades
          </p>
          <div className="space-y-0.5">
            {roots.map((root) => (
              <TreeNode key={root.id} entity={root} depth={0} selectedId={selectedId} onSelect={setSelectedId} />
            ))}
          </div>
        </div>

        {/* ── Detalle ── */}
        <div className="lg:col-span-2 space-y-4">
          {!entity ? (
            <div className={CARD_PANEL}>
              <p className="text-sm text-slate-400">Seleccione una entidad del árbol.</p>
            </div>
          ) : (
            <>
              {/* Tarjeta de entidad */}
              <div className={CARD_PANEL}>
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">{entity.acronym}</h2>
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {TYPE_LABEL[entity.type]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{entity.name}</p>
                    {entity.parentId && (
                      <p className="text-xs text-slate-400 mt-1">
                        Depende de {getEntity(entity.parentId)?.name ?? '—'}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <div className="rounded-xl bg-blue-50 px-4 py-3 min-w-[110px]">
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={12} className="text-[#1434CB]" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tarjetas</p>
                      </div>
                      <p className="text-xl font-black text-[#1434CB]">{stats.activeCards}</p>
                    </div>
                    <div className="rounded-xl bg-indigo-50 px-4 py-3 min-w-[110px]">
                      <div className="flex items-center gap-1.5">
                        <Plane size={12} className="text-indigo-500" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Misiones</p>
                      </div>
                      <p className="text-xl font-black text-indigo-500">{stats.activeMissions}</p>
                    </div>
                  </div>
                </div>

                {/* Presupuesto */}
                <div className="mt-6">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-semibold text-slate-600">Presupuesto asignado vs. ejecutado</span>
                    <span className="text-xs text-slate-500">
                      <span className="font-bold text-[#1434CB]">{formatGTQ(stats.executedGTQ)}</span>
                      {' de '}{formatGTQ(entity.budgetGTQ)}
                    </span>
                  </div>
                  <MiniProgress value={stats.executedGTQ} max={entity.budgetGTQ} />
                  <div className="flex justify-between mt-2 text-[11px] text-slate-400">
                    <span>{stats.executedPct}% ejecutado</span>
                    <span>
                      Comprometido en misiones activas:{' '}
                      <span className="font-semibold text-slate-600">{formatGTQCompact(stats.committedGTQ)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Cadena de aprobación */}
              <div className={CARD_PANEL}>
                <h2 className="text-sm font-semibold text-slate-700 mb-1">Cadena de aprobación</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Se aplica automáticamente a cada nueva misión de esta entidad.
                </p>

                <div className="space-y-2">
                  {entity.approvalChain.map((role, i) => (
                    <motion.div
                      key={`${role}-${i}`}
                      layout
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF1FD] text-[10px] font-bold text-[#1434CB]">
                        {i + 1}
                      </div>
                      <span className="flex-1 text-sm text-slate-700">{role}</span>
                      <button type="button" onClick={() => moveRole(i, -1)} disabled={i === 0}
                        className="p-1 text-slate-300 hover:text-[#1434CB] disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
                        aria-label={`Subir ${role}`}>
                        <ArrowUp size={13} />
                      </button>
                      <button type="button" onClick={() => moveRole(i, 1)} disabled={i === entity.approvalChain.length - 1}
                        className="p-1 text-slate-300 hover:text-[#1434CB] disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
                        aria-label={`Bajar ${role}`}>
                        <ArrowDown size={13} />
                      </button>
                      <button type="button" onClick={() => removeRole(i)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors" aria-label={`Quitar ${role}`}>
                        <X size={13} />
                      </button>
                    </motion.div>
                  ))}

                  {entity.approvalChain.length === 0 && (
                    <p className="text-xs text-slate-400">Sin roles configurados.</p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <input
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRole(); } }}
                    placeholder="Agregar rol aprobador…"
                    aria-label="Nuevo rol aprobador"
                    className={INPUT_CLASS}
                  />
                  <button
                    type="button"
                    onClick={addRole}
                    className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Misiones de la entidad */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Misiones de {entity.acronym}</span>
                  <span className="text-[10px] text-slate-400">{stats.missions.length} registro(s)</span>
                </div>

                {stats.missions.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm font-semibold text-slate-600 mb-1">Sin misiones registradas</p>
                    <p className="text-xs text-slate-400">Esta entidad todavía no ha solicitado viáticos.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          {['ID', 'Viajero', 'Destino', 'Fechas', 'Gastado', 'Estado'].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.missions.map((m) => (
                          <tr key={m.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                            <td className="px-4 py-3">
                              <Link href={`/misiones/${m.id}`} className="text-xs font-bold text-[#1434CB] font-mono hover:underline">
                                {m.id}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-700">{m.traveler.name}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">
                              <span className="mr-1.5" aria-hidden>{flagEmoji(m.destination.countryCode)}</span>
                              {m.destination.city}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {formatDateRangeES(m.dates.start, m.dates.end)}
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">
                              {formatGTQ(m.spentGTQ)}
                            </td>
                            <td className="px-4 py-3"><MissionStatusBadge status={m.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <RegisterEntityModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </motion.div>
  );
}
