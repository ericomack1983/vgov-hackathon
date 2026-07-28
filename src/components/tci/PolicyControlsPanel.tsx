'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ShieldCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUI } from '@/context/UIContext';
import { useProcurement } from '@/context/ProcurementContext';
import { COUNTRY_CATALOG, MCC_CATALOG } from '@/lib/mock-data/policy-profiles';
import { formatGTQ, flagEmoji } from '@/lib/tci-format';
import type { ATMPolicy, MCCCategory, PolicyProfile } from '@/lib/mock-data/types';

const SECTION_LABEL = 'text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3';
const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1434CB] focus:border-[#1434CB] disabled:bg-slate-50 disabled:text-slate-400';

interface PolicyControlsPanelProps {
  profile: PolicyProfile;
  onChange?: (profile: PolicyProfile) => void;
  /** sólo lectura — usado en la vista de detalle de misión activa */
  readOnly?: boolean;
  /** muestra los botones "Guardar política" / "Aplicar a tarjeta" */
  showFooter?: boolean;
  onSave?: (profile: PolicyProfile) => void;
  onApplyToCard?: (profile: PolicyProfile) => void;
  /** sin contenedor blanco — para embeber dentro de otro panel */
  bare?: boolean;
}

/* ── Toggle ──────────────────────────────────────────────────────────────── */

function Switch({ checked, onChange, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-[#1434CB]' : 'bg-slate-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}

/* ── Chip de categoría MCC ───────────────────────────────────────────────── */

function MccChip({ mcc, tone, onRemove }: {
  mcc: MCCCategory; tone: 'allow' | 'block'; onRemove?: () => void;
}) {
  const cls = tone === 'allow'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-red-50 text-red-600 border-red-100';

  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cls}`}
    >
      <span className="font-mono opacity-70">{mcc.code}</span>
      {mcc.label}
      {onRemove && (
        <button type="button" onClick={onRemove} className="opacity-50 hover:opacity-100 transition-opacity" aria-label={`Quitar ${mcc.label}`}>
          <X size={11} />
        </button>
      )}
    </motion.span>
  );
}

/* ── Selector para agregar un MCC ────────────────────────────────────────── */

function AddMccButton({ used, tone, onAdd }: {
  used: string[]; tone: 'allow' | 'block'; onAdd: (mcc: MCCCategory) => void;
}) {
  const [open, setOpen] = useState(false);
  const available = MCC_CATALOG.filter((m) => !used.includes(m.code));
  if (available.length === 0) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-dashed transition-colors ${
          tone === 'allow'
            ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            : 'border-red-200 text-red-500 hover:bg-red-50'
        }`}
      >
        <Plus size={11} /> Agregar
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-40 mt-1 w-64 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
            >
              {available.map((m) => (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => { onAdd(m); setOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50"
                >
                  <span className="font-mono text-[10px] text-slate-400">{m.code}</span>
                  {m.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────────── */

export function PolicyControlsPanel({
  profile,
  onChange,
  readOnly = false,
  showFooter = false,
  onSave,
  onApplyToCard,
  bare = false,
}: PolicyControlsPanelProps) {
  const { role } = useUI();
  const { suppliers } = useProcurement();

  /* La vigencia sólo la edita Tesorería */
  const isTesoreria = role === 'gov';
  const locked = readOnly;

  const patch = (p: Partial<PolicyProfile>) => onChange?.({ ...profile, ...p });

  const toggleCountry = (code: string) => {
    if (locked) return;
    const next = profile.allowedCountries.includes(code)
      ? profile.allowedCountries.filter((c) => c !== code)
      : [...profile.allowedCountries, code];
    patch({ allowedCountries: next });
  };

  const toggleSupplier = (id: string) => {
    if (locked) return;
    const current = profile.supplierWhitelistIds ?? [];
    patch({
      supplierWhitelistIds: current.includes(id)
        ? current.filter((s) => s !== id)
        : [...current, id],
    });
  };

  const body = (
    <div className="space-y-6">
      {/* ── Límites ─────────────────────────────────────────────────────── */}
      <section>
        <p className={SECTION_LABEL}>Límites</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pol-txn-limit" className="block text-xs font-semibold text-slate-600 mb-1">
              Por transacción (GTQ)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Q</span>
              <input
                id="pol-txn-limit"
                type="number"
                min={0}
                disabled={locked}
                value={profile.txnLimitGTQ}
                onChange={(e) => patch({ txnLimitGTQ: Number(e.target.value) })}
                className={`${INPUT_CLASS} pl-7`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="pol-daily-limit" className="block text-xs font-semibold text-slate-600 mb-1">
              Límite diario (GTQ)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Q</span>
              <input
                id="pol-daily-limit"
                type="number"
                min={0}
                disabled={locked}
                value={profile.dailyLimitGTQ}
                onChange={(e) => patch({ dailyLimitGTQ: Number(e.target.value) })}
                className={`${INPUT_CLASS} pl-7`}
              />
            </div>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Autorizaciones por encima de {formatGTQ(profile.txnLimitGTQ)} se rechazan en el punto de venta.
        </p>
      </section>

      {/* ── Geografía ───────────────────────────────────────────────────── */}
      <section>
        <p className={SECTION_LABEL}>Geografía</p>
        <div className="flex flex-wrap gap-1.5">
          {COUNTRY_CATALOG.map((c) => {
            const on = profile.allowedCountries.includes(c.code);
            return (
              <button
                key={c.code}
                type="button"
                disabled={locked}
                onClick={() => toggleCountry(c.code)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  on
                    ? 'bg-[#EEF1FD] text-[#1434CB] border-[#A5B8F3]'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                } ${locked ? 'cursor-default' : ''}`}
              >
                <span aria-hidden>{flagEmoji(c.code)}</span>
                {c.name}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Los países no seleccionados quedan <span className="font-semibold text-slate-500">bloqueados</span>.
        </p>
      </section>

      {/* ── Categorías (MCC) ────────────────────────────────────────────── */}
      <section>
        <p className={SECTION_LABEL}>Categorías (MCC)</p>

        <p className="text-xs font-semibold text-slate-600 mb-2">Permitidas</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <AnimatePresence initial={false}>
            {profile.allowedMCCs.map((m) => (
              <MccChip
                key={m.code}
                mcc={m}
                tone="allow"
                onRemove={locked ? undefined : () => patch({ allowedMCCs: profile.allowedMCCs.filter((x) => x.code !== m.code) })}
              />
            ))}
          </AnimatePresence>
          {!locked && (
            <AddMccButton
              tone="allow"
              used={[...profile.allowedMCCs, ...profile.blockedMCCs].map((m) => m.code)}
              onAdd={(m) => patch({ allowedMCCs: [...profile.allowedMCCs, m] })}
            />
          )}
        </div>

        <p className="text-xs font-semibold text-slate-600 mb-2">Bloqueadas</p>
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence initial={false}>
            {profile.blockedMCCs.map((m) => (
              <MccChip
                key={m.code}
                mcc={m}
                tone="block"
                onRemove={locked ? undefined : () => patch({ blockedMCCs: profile.blockedMCCs.filter((x) => x.code !== m.code) })}
              />
            ))}
          </AnimatePresence>
          {!locked && (
            <AddMccButton
              tone="block"
              used={[...profile.allowedMCCs, ...profile.blockedMCCs].map((m) => m.code)}
              onAdd={(m) => patch({ blockedMCCs: [...profile.blockedMCCs, m] })}
            />
          )}
        </div>
      </section>

      {/* ── Efectivo ────────────────────────────────────────────────────── */}
      <section>
        <p className={SECTION_LABEL}>Efectivo</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'bloqueado', label: 'Bloqueado', sub: 'Sin retiros ATM' },
            { value: 'limitado',  label: 'Limitado',  sub: 'Con tope diario' },
            { value: 'permitido', label: 'Permitido', sub: 'Sin restricción' },
          ] as { value: ATMPolicy; label: string; sub: string }[]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={locked}
              onClick={() => patch({
                atmWithdrawal: opt.value,
                atmDailyCapGTQ: opt.value === 'limitado' ? (profile.atmDailyCapGTQ ?? 500) : undefined,
              })}
              className={`py-2 px-3 rounded-xl text-left border transition-all ${
                profile.atmWithdrawal === opt.value
                  ? 'bg-[#1434CB] text-white border-transparent shadow'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              } ${locked ? 'cursor-default' : ''}`}
            >
              <span className="block text-xs font-semibold">{opt.label}</span>
              <span className={`block text-[10px] ${profile.atmWithdrawal === opt.value ? 'text-white/70' : 'text-slate-400'}`}>
                {opt.sub}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {profile.atmWithdrawal === 'limitado' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <label htmlFor="pol-atm-cap" className="block text-xs font-semibold text-slate-600 mb-1">
                  Tope diario de retiro (GTQ)
                </label>
                <div className="relative max-w-[220px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Q</span>
                  <input
                    id="pol-atm-cap"
                    type="number"
                    min={0}
                    disabled={locked}
                    value={profile.atmDailyCapGTQ ?? 0}
                    onChange={(e) => patch({ atmDailyCapGTQ: Number(e.target.value) })}
                    className={`${INPUT_CLASS} pl-7`}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Vigencia ────────────────────────────────────────────────────── */}
      <section>
        <p className={SECTION_LABEL}>Vigencia</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pol-valid-start" className="block text-xs font-semibold text-slate-600 mb-1">Desde</label>
            <input
              id="pol-valid-start"
              type="date"
              disabled={locked || !isTesoreria}
              value={profile.validity.start}
              onChange={(e) => patch({ validity: { ...profile.validity, start: e.target.value } })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="pol-valid-end" className="block text-xs font-semibold text-slate-600 mb-1">Hasta</label>
            <input
              id="pol-valid-end"
              type="date"
              disabled={locked || !isTesoreria}
              value={profile.validity.end}
              onChange={(e) => patch({ validity: { ...profile.validity, end: e.target.value } })}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        {!isTesoreria && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lock size={10} /> La vigencia sólo puede modificarla Tesorería Nacional.
          </p>
        )}
      </section>

      {/* ── Saldo no utilizado ──────────────────────────────────────────── */}
      <section>
        <p className={SECTION_LABEL}>Saldo no utilizado</p>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="pr-4">
            <p className="text-xs font-semibold text-slate-700">Liberación automática al cierre</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              El saldo no ejecutado regresa a Tesorería Nacional cuando la misión se cierra.
            </p>
          </div>
          <Switch
            checked={profile.autoReleaseUnused}
            disabled={locked}
            onChange={(v) => patch({ autoReleaseUnused: v })}
          />
        </div>

        <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="pr-4">
            <p className="text-xs font-semibold text-slate-700">Anulación de emergencia</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Permite a Tesorería autorizar un cargo fuera de política dejando registro en la bitácora.
            </p>
          </div>
          <Switch
            checked={profile.emergencyOverride}
            disabled={locked}
            onChange={(v) => patch({ emergencyOverride: v })}
          />
        </div>
      </section>

      {/* ── Proveedores ─────────────────────────────────────────────────── */}
      <section>
        <p className={SECTION_LABEL}>Proveedores (lista blanca opcional)</p>
        <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
          {suppliers.map((s) => {
            const on = (profile.supplierWhitelistIds ?? []).includes(s.id);
            return (
              <label
                key={s.id}
                className={`flex items-center gap-3 px-3 py-2 text-xs ${locked ? '' : 'cursor-pointer hover:bg-slate-50'}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  disabled={locked}
                  onChange={() => toggleSupplier(s.id)}
                  className="h-3.5 w-3.5 rounded border-slate-300 accent-[#1434CB]"
                />
                <span className="flex-1 text-slate-700">{s.name}</span>
                <span className="text-[10px] text-slate-400">{s.complianceStatus}</span>
              </label>
            );
          })}
        </div>
        {(profile.supplierWhitelistIds?.length ?? 0) === 0 && (
          <p className="mt-1.5 text-[11px] text-slate-400">
            Sin lista blanca — se aceptan todos los comercios que cumplan las reglas anteriores.
          </p>
        )}
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      {showFooter && !locked && (
        <div className="flex gap-3 pt-1 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={() => { onSave?.(profile); toast.success('Política guardada'); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-md mt-4"
            style={{ background: 'linear-gradient(to right, #1434CB, #6366f1)' }}
          >
            <ShieldCheck size={14} />
            Guardar política
          </button>
          <button
            type="button"
            onClick={() => { onApplyToCard?.(profile); toast.success('Política aplicada a la tarjeta'); }}
            className="px-5 py-2.5 mt-4 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Aplicar a tarjeta
          </button>
        </div>
      )}
    </div>
  );

  if (bare) return body;

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.06)] border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Controles de política</h2>
          <p className="text-xs text-slate-400 mt-0.5">{profile.name}</p>
        </div>
        {locked && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
            <Lock size={9} /> Sólo lectura
          </span>
        )}
      </div>
      {body}
    </div>
  );
}
