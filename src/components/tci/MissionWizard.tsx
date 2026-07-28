'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMissions } from '@/context/MissionsContext';
import { COUNTRY_CATALOG, countryName } from '@/lib/mock-data/policy-profiles';
import { formatGTQ, formatDateRangeES, flagEmoji, todayISO } from '@/lib/tci-format';
import type { PolicyProfile } from '@/lib/mock-data/types';
import { PolicyControlsPanel } from './PolicyControlsPanel';

const STEPS = ['Datos de la misión', 'Perfil de política', 'Ruta de aprobación', 'Resumen'] as const;

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1434CB] focus:border-[#1434CB]';
const LABEL_CLASS = 'block text-sm font-semibold text-slate-700 mb-1';
const SECTION_LABEL = 'text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3';

interface MissionWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MissionWizard({ isOpen, onClose }: MissionWizardProps) {
  const router = useRouter();
  const { entities, policyProfiles, getProfile, createMission } = useMissions();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* paso 1 */
  const [ministry, setMinistry] = useState('ent-minex');
  const [travelerName, setTravelerName] = useState('');
  const [travelerRole, setTravelerRole] = useState('');
  const [travelerEmail, setTravelerEmail] = useState('');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [purpose, setPurpose] = useState('');
  const [budget, setBudget] = useState('');

  /* paso 2 — `override` sólo existe cuando el usuario ajusta la política */
  const [profileId, setProfileId] = useState('pol-intl-us');
  const [override, setOverride] = useState<PolicyProfile | null>(null);

  const entity = entities.find((e) => e.id === ministry);
  const approvalChain = entity?.approvalChain ?? [];

  /* El perfil mostrado se deriva del seleccionado + la vigencia de la misión */
  const baseProfile = getProfile(profileId);
  const draftProfile: PolicyProfile | null = override ?? (
    baseProfile
      ? {
          ...baseProfile,
          validity: {
            start: start || baseProfile.validity.start,
            end: end || baseProfile.validity.end,
          },
        }
      : null
  );
  const customised = override !== null;

  /* Cambiar el perfil o las fechas descarta el ajuste manual */
  function selectProfile(id: string) {
    setProfileId(id);
    setOverride(null);
  }
  function changeStart(value: string) {
    setStart(value);
    setOverride(null);
  }
  function changeEnd(value: string) {
    setEnd(value);
    setOverride(null);
  }

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const budgetNumber = Number(budget) || 0;

  function validateStep1(): boolean {
    const next: Record<string, string> = {};
    if (!travelerName.trim()) next.travelerName = 'Ingrese el nombre del viajero';
    if (!travelerRole.trim()) next.travelerRole = 'Ingrese el cargo';
    if (!travelerEmail.trim() || !travelerEmail.includes('@')) next.travelerEmail = 'Correo institucional inválido';
    if (!city.trim()) next.city = 'Ingrese la ciudad de destino';
    if (!start) next.start = 'Seleccione la fecha de inicio';
    if (!end) next.end = 'Seleccione la fecha de fin';
    if (start && end && new Date(end) < new Date(start)) next.end = 'La fecha de fin debe ser posterior al inicio';
    if (!purpose.trim()) next.purpose = 'Describa el propósito de la misión';
    if (budgetNumber <= 0) next.budget = 'El presupuesto debe ser mayor a cero';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleNext() {
    if (step === 0 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function reset() {
    setStep(0);
    setErrors({});
    setTravelerName(''); setTravelerRole(''); setTravelerEmail('');
    setCity(''); setCountryCode('US'); setStart(''); setEnd('');
    setPurpose(''); setBudget('');
    setMinistry('ent-minex'); setProfileId('pol-intl-us');
    setOverride(null);
  }

  function handleSubmit() {
    /* El id y el nombre de la política propia los asigna createMission */
    const custom = customised && draftProfile ? draftProfile : undefined;

    const mission = createMission({
      ministry,
      traveler: { name: travelerName.trim(), role: travelerRole.trim(), email: travelerEmail.trim() },
      destination: { city: city.trim(), country: countryName(countryCode), countryCode },
      dates: { start, end },
      purpose: purpose.trim(),
      budgetGTQ: budgetNumber,
      policyProfileId: profileId,
      customProfile: custom,
    });

    toast.success(`Misión ${mission.id} creada — pendiente de aprobación`);
    reset();
    onClose();
    router.push(`/misiones/${mission.id}`);
  }

  const summaryRows = [
      { label: 'Ministerio / entidad', value: entity ? `${entity.name} (${entity.acronym})` : '—' },
      { label: 'Viajero', value: travelerName ? `${travelerName} · ${travelerRole}` : '—' },
      { label: 'Correo', value: travelerEmail || '—' },
      { label: 'Destino', value: city ? `${flagEmoji(countryCode)} ${city}, ${countryName(countryCode)}` : '—' },
      { label: 'Fechas', value: start && end ? formatDateRangeES(start, end) : '—' },
      { label: 'Presupuesto', value: formatGTQ(budgetNumber) },
      { label: 'Perfil de política', value: draftProfile?.name ?? '—' },
      { label: 'Ruta de aprobación', value: approvalChain.join(' → ') || '—' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Encabezado ── */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Nueva Misión</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Paso {step + 1} de {STEPS.length} — {STEPS[step]}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Indicador de pasos */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                    i < step ? 'bg-emerald-500 text-white'
                      : i === step ? 'bg-[#1434CB] text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full ${i < step ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Cuerpo ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              {/* ── Paso 1 ── */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="mis-ministry" className={LABEL_CLASS}>Ministerio / entidad</label>
                    <select
                      id="mis-ministry"
                      value={ministry}
                      onChange={(e) => setMinistry(e.target.value)}
                      className={INPUT_CLASS}
                    >
                      {entities.map((e) => (
                        <option key={e.id} value={e.id}>{e.name} ({e.acronym})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className={SECTION_LABEL}>Viajero</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="mis-traveler" className={LABEL_CLASS}>Nombre completo</label>
                        <input
                          id="mis-traveler"
                          value={travelerName}
                          onChange={(e) => setTravelerName(e.target.value)}
                          className={INPUT_CLASS}
                          placeholder="Juan Pérez"
                        />
                        {errors.travelerName && <p className="mt-1 text-xs text-red-600">{errors.travelerName}</p>}
                      </div>
                      <div>
                        <label htmlFor="mis-role" className={LABEL_CLASS}>Cargo</label>
                        <input
                          id="mis-role"
                          value={travelerRole}
                          onChange={(e) => setTravelerRole(e.target.value)}
                          className={INPUT_CLASS}
                          placeholder="Director de Cooperación"
                        />
                        {errors.travelerRole && <p className="mt-1 text-xs text-red-600">{errors.travelerRole}</p>}
                      </div>
                    </div>
                    <div className="mt-3">
                      <label htmlFor="mis-email" className={LABEL_CLASS}>Correo institucional</label>
                      <input
                        id="mis-email"
                        type="email"
                        value={travelerEmail}
                        onChange={(e) => setTravelerEmail(e.target.value)}
                        className={INPUT_CLASS}
                        placeholder="nombre@minex.gob.gt"
                      />
                      {errors.travelerEmail && <p className="mt-1 text-xs text-red-600">{errors.travelerEmail}</p>}
                    </div>
                  </div>

                  <div>
                    <p className={SECTION_LABEL}>Destino y fechas</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="mis-city" className={LABEL_CLASS}>Ciudad</label>
                        <input
                          id="mis-city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className={INPUT_CLASS}
                          placeholder="Washington D.C."
                        />
                        {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
                      </div>
                      <div>
                        <label htmlFor="mis-country" className={LABEL_CLASS}>País</label>
                        <select
                          id="mis-country"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className={INPUT_CLASS}
                        >
                          {COUNTRY_CATALOG.map((c) => (
                            <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="mis-start" className={LABEL_CLASS}>Fecha de inicio</label>
                        <input
                          id="mis-start"
                          type="date"
                          min={todayISO()}
                          value={start}
                          onChange={(e) => changeStart(e.target.value)}
                          className={INPUT_CLASS}
                        />
                        {errors.start && <p className="mt-1 text-xs text-red-600">{errors.start}</p>}
                      </div>
                      <div>
                        <label htmlFor="mis-end" className={LABEL_CLASS}>Fecha de fin</label>
                        <input
                          id="mis-end"
                          type="date"
                          min={start || todayISO()}
                          value={end}
                          onChange={(e) => changeEnd(e.target.value)}
                          className={INPUT_CLASS}
                        />
                        {errors.end && <p className="mt-1 text-xs text-red-600">{errors.end}</p>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mis-purpose" className={LABEL_CLASS}>Propósito</label>
                    <textarea
                      id="mis-purpose"
                      rows={3}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Reunión bilateral de cooperación…"
                    />
                    {errors.purpose && <p className="mt-1 text-xs text-red-600">{errors.purpose}</p>}
                  </div>

                  <div>
                    <label htmlFor="mis-budget" className={LABEL_CLASS}>Presupuesto (GTQ)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Q</span>
                      <input
                        id="mis-budget"
                        type="number"
                        min={0}
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className={`${INPUT_CLASS} pl-7`}
                        placeholder="18000"
                      />
                    </div>
                    {errors.budget
                      ? <p className="mt-1 text-xs text-red-600">{errors.budget}</p>
                      : <p className="mt-1 text-xs text-slate-400">{formatGTQ(budgetNumber)}</p>}
                  </div>
                </div>
              )}

              {/* ── Paso 2 ── */}
              {step === 1 && draftProfile && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="mis-profile" className={LABEL_CLASS}>Perfil de política</label>
                    <select
                      id="mis-profile"
                      value={profileId}
                      onChange={(e) => selectProfile(e.target.value)}
                      className={INPUT_CLASS}
                    >
                      {policyProfiles.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-400">
                      Puede ajustar cualquier control abajo; los cambios se guardan como una política propia de esta misión.
                    </p>
                  </div>

                  {customised && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5">
                      <p className="text-xs font-semibold text-amber-700">Política personalizada</p>
                      <p className="text-[11px] text-amber-600 mt-0.5">
                        Se creará «{draftProfile.name} (ajustada)» y se aplicará únicamente a esta misión.
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 p-5">
                    <PolicyControlsPanel
                      bare
                      profile={draftProfile}
                      onChange={setOverride}
                    />
                  </div>
                </div>
              )}

              {/* ── Paso 3 ── */}
              {step === 2 && (
                <div>
                  <p className={SECTION_LABEL}>Ruta de aprobación — {entity?.acronym}</p>
                  <p className="text-sm text-slate-500 mb-5">
                    Se toma automáticamente de la cadena de aprobación configurada para la entidad.
                  </p>

                  <div className="relative pl-2">
                    {approvalChain.map((role, i) => (
                      <div key={role} className="relative flex gap-4 pb-6 last:pb-0">
                        {i < approvalChain.length - 1 && (
                          <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200" />
                        )}
                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF1FD] text-xs font-bold text-[#1434CB] border-2 border-white shadow-sm">
                          {i + 1}
                        </div>
                        <div className="pt-1">
                          <p className="text-sm font-semibold text-slate-800">{role}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {i === approvalChain.length - 1
                              ? 'Aprobación final — emite la tarjeta virtual con la política aplicada'
                              : 'Revisión y visto bueno'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {approvalChain.length === 0 && (
                    <p className="text-sm text-slate-400">
                      Esta entidad no tiene cadena de aprobación configurada. Defínala en Entidades.
                    </p>
                  )}
                </div>
              )}

              {/* ── Paso 4 ── */}
              {step === 3 && (
                <div>
                  <p className={SECTION_LABEL}>Resumen</p>
                  <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {summaryRows.map((row) => (
                      <div key={row.label} className="flex items-start justify-between gap-6 px-4 py-3">
                        <span className="text-xs text-slate-400 shrink-0">{row.label}</span>
                        <span className="text-xs font-semibold text-slate-800 text-right">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl p-4 border border-slate-100 bg-gradient-to-r from-[#EEF1FD] to-[#f0f4ff]">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Al enviar, la misión quedará en estado{' '}
                      <span className="font-semibold text-[#1434CB]">Pendiente de aprobación</span>. La tarjeta virtual se
                      emite únicamente cuando Tesorería Nacional aprueba la solicitud.
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-slate-500 leading-relaxed">{purpose}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Pie ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            {step === 0 ? 'Cancelar' : <><ArrowLeft size={14} /> Atrás</>}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-md"
              style={{ background: 'linear-gradient(to right, #1434CB, #6366f1)' }}
            >
              Continuar <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-md"
              style={{ background: 'linear-gradient(to right, #1434CB, #6366f1)' }}
            >
              <Check size={14} /> Enviar a aprobación
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
