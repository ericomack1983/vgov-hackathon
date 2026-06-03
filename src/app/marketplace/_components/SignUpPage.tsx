'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Check, DollarSign, CreditCard, Trophy,
  ShieldCheck, Store, Info, Loader2,
} from 'lucide-react';
import { VisaLogo } from '@visa/nova-react';
import type { Supplier } from '@/lib/mock-data/types';
import { useLang } from '../i18n';

interface Props { onComplete: () => void; onBack: () => void }

const CERTIFICACIONES = ['MYPE', 'Empresa Femenina', 'Empresa Indígena', 'Empresa Afropanameña', 'Empresa de Veterano', 'Empresa con Discapacidad'];
const PROVINCIAS = ['Panamá','Colón','Chiriquí','Herrera','Los Santos','Bocas del Toro','Veraguas','Darién','Coclé','Guna Yala','Ngäbe-Buglé','Emberá-Wounaan'];
const NUM_PASOS = 4;

const DEMO: Record<string, string> = {
  razonSocial: 'Suministros Tech Istmo S.A.',
  ruc:         '235891047-2-2020',
  ciudad:      'Ciudad de Panamá',
  prodNombre:  'Laptop Corporativa HP EliteBook 840 G9',
  prodDesc:    'Laptop empresarial 14" Core i7-1255U, 16 GB RAM, 512 GB SSD NVMe',
  prodPrecio:  '1,250.00',
  prodEntrega: '10',
  prodUnspsc:  '43211507',
  mcc:         '5045 — Computadoras, Periféricos y Software',
  nombreC:     'Carlos Rodríguez',
  correo:      'c.rodriguez@techistmo.pa',
  telefono:    '(507) 6700-8834',
  clave:       'Demo2024!',
  claveC:      'Demo2024!',
};

function autoFill<T extends string>(val: T, setter: (v: T) => void, key: string) {
  if (!val) setter(DEMO[key] as T);
}

function PanamaShield() {
  return (
    <svg width="22" height="26" viewBox="0 0 52 61" fill="none" aria-hidden>
      <path d="M26 2 L50 10 L50 36 Q50 56 26 62 Q2 56 2 36 L2 10 Z" fill="#0a1540" stroke="rgba(20,52,203,0.6)" strokeWidth="1.5" />
      <clipPath id="suc"><path d="M26 2 L50 10 L50 36 Q50 56 26 62 Q2 56 2 36 L2 10 Z" /></clipPath>
      <g clipPath="url(#suc)">
        <rect x="2" y="2" width="24" height="30" fill="rgba(27,77,255,0.65)" />
        <rect x="26" y="32" width="24" height="30" fill="rgba(255,45,85,0.5)" />
      </g>
    </svg>
  );
}

const BENEFIT_ICONS = [DollarSign, CreditCard, Trophy, ShieldCheck];
const BENEFIT_COLORS = ['#2dd4bf', '#1b4dff', '#22d3ee', '#1434cb'];

/* shared field classes */
const fieldCls = 'h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-500/60 transition-colors focus:border-[#1b4dff] focus:outline-none';
const selectCls = 'h-11 w-full rounded-xl border border-white/[0.09] bg-[rgba(20,28,60,0.95)] px-3 text-sm text-white focus:border-[#1b4dff] focus:outline-none';
const labelCls = 'mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-400/70';
const nextBtnCls = 'mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#1b4dff] to-[#1434cb] text-sm font-bold text-white shadow-lg shadow-[#1b4dff]/30 transition-all hover:shadow-[#1b4dff]/50';

export function SignUpPage({ onComplete, onBack }: Props) {
  const { t } = useLang();
  const [paso, setPaso]    = useState(0);
  const [enviando, setEnv] = useState(false);

  const [razonSocial, setRazon] = useState('');
  const [ruc, setRuc]           = useState('');
  const [ciudad, setCiudad]     = useState('');
  const [provincia, setProv]    = useState('Panamá');
  const [certs, setCerts]       = useState<string[]>([]);

  const [prodNombre, setProdNombre]   = useState('');
  const [prodDesc, setProdDesc]       = useState('');
  const [prodPrecio, setProdPrecio]   = useState('');
  const [prodEntrega, setProdEntrega] = useState('');
  const [prodUnspsc, setProdUnspsc]   = useState('');

  const [mcc, setMcc]         = useState('');
  const [procesador, setProc] = useState('Banistmo / Visa Merchant');
  const [categoria, setCat]   = useState('Hardware de Cómputo y Periféricos');

  const [nombreC, setNomC]  = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTel]  = useState('');
  const [clave, setClave]   = useState('');
  const [claveC, setClaveC] = useState('');
  const [acepta, setAcepta] = useState(false);

  const toggleCert = (c: string) => setCerts((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);
  const siguiente  = () => setPaso((s) => Math.min(s + 1, NUM_PASOS - 1));
  const anterior   = () => { if (paso === 0) onBack(); else setPaso((s) => s - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnv(true);
    await new Promise((r) => setTimeout(r, 1500));
    const newSupplier: Supplier = {
      id:               `sup-new-${Date.now()}`,
      name:             razonSocial || DEMO.razonSocial,
      rating:           78,
      complianceStatus: 'Pending Review',
      certifications:   certs.length > 0 ? certs : ['ISO 9001'],
      pastPerformance:  78,
      pricingHistory:   [1200, 1250, 1100, 1300, 1250],
      walletAddress:    `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 6)}`,
      deliveryAvgDays:  parseInt(prodEntrega) || 10,
      riskScore:        18,
      vsmsScore:        78,
    };
    try {
      const existing = JSON.parse(localStorage.getItem('govpay_registered_suppliers') || '[]') as Supplier[];
      localStorage.setItem('govpay_registered_suppliers', JSON.stringify([...existing, newSupplier]));
    } catch { /* silent */ }
    onComplete();
  };

  const steps = [t('signUp.steps.0'), t('signUp.steps.1'), t('signUp.steps.2'), t('signUp.steps.3')];
  const benefits = [
    { title: t('signUp.benefits.0.title'), body: t('signUp.benefits.0.body') },
    { title: t('signUp.benefits.1.title'), body: t('signUp.benefits.1.body') },
    { title: t('signUp.benefits.2.title'), body: t('signUp.benefits.2.body') },
    { title: t('signUp.benefits.3.title'), body: t('signUp.benefits.3.body') },
  ];

  const taglineHead = t('signUp.tagline').split(' al')[0];
  const taglineGold = t('signUp.tagline').includes('panameño') ? 'Estado panameño' : 'Panamanian government';

  const stepEnter = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { duration: 0.25 } };

  return (
    <div className="flex min-h-screen w-full font-sans"
      style={{ backgroundColor: '#0a0e1a', color: '#f4f6fb', backgroundImage: 'radial-gradient(60% 60% at 18% 12%, rgba(27,77,255,0.16) 0%, transparent 70%), radial-gradient(50% 50% at 88% 8%, rgba(20,52,203,0.14) 0%, transparent 70%)' }}>

      {/* ── Left brand panel ── */}
      <aside aria-hidden
        className="relative hidden w-[40%] flex-col justify-between overflow-hidden border-r border-white/5 p-12 lg:flex">
        <svg className="absolute inset-0 h-full w-full opacity-[0.04]">
          <defs><pattern id="dots-su" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="white" />
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#dots-su)" />
        </svg>

        <div className="relative z-10">
          <div className="mb-14 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[rgba(20,52,203,0.3)] bg-[rgba(27,77,255,0.18)]">
              <PanamaShield />
            </div>
            <div>
              <div className="text-[0.9rem] font-bold leading-tight text-white">PanamaCompra</div>
              <div className="text-[0.65rem] uppercase tracking-[0.16em] text-[rgba(20,52,203,0.65)]">República de Panamá</div>
            </div>
          </div>

          <h2 className="mb-3 text-[2rem] font-bold leading-[1.12] tracking-[-0.03em] text-white">
            {taglineHead} al{' '}
            <span className="bg-gradient-to-r from-[#2f6bff] via-[#22d3ee] to-[#4f74ff] bg-clip-text text-transparent">
              {taglineGold}
            </span>{' '}
            hoy mismo.
          </h2>
          <p className="mb-10 text-sm text-slate-400/60">{t('signUp.sub')}</p>

          <div className="flex flex-col gap-4">
            {benefits.map(({ title, body }, i) => {
              const Icon = BENEFIT_ICONS[i];
              return (
                <div key={title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: `${BENEFIT_COLORS[i]}1A`, border: `1px solid ${BENEFIT_COLORS[i]}30` }}>
                    <Icon className="h-4 w-4" style={{ color: BENEFIT_COLORS[i] }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{title}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-400/60">{body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3">
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">{t('signUp.avgTime')}</span>
          </div>
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto p-6 sm:p-8">
        <div className="w-full max-w-[480px] pt-4">

          <button onClick={anterior}
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-400/70 transition-colors hover:text-slate-200">
            <ArrowLeft className="h-3.5 w-3.5" />
            {paso === 0 ? t('signUp.backSignIn') : t('signUp.backPrev')}
          </button>

          <div className="mb-6 flex items-center gap-2 opacity-70">
            <span className="text-[0.62rem] uppercase tracking-[0.1em] text-white/40">{t('nav.poweredBy')}</span>
            <VisaLogo style={{ height: 14 }} />
          </div>

          <h2 className="mb-1 text-[1.4rem] font-semibold text-white">{t('signUp.title')}</h2>
          <p className="mb-7 text-sm text-slate-400/70">{`${steps[paso] ?? 'Paso'} — ${paso + 1}/${NUM_PASOS}`}</p>

          {/* Step indicator */}
          <div className="mb-6 flex items-center">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    i <= paso ? 'bg-gradient-to-br from-[#1b4dff] to-[#1434cb] text-white' : 'border border-white/[0.08] bg-white/[0.06] text-slate-500'
                  }`}>
                    {i < paso ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={`hidden whitespace-nowrap text-[0.62rem] sm:block ${i <= paso ? 'text-blue-300/85' : 'text-slate-600'}`}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="mx-1.5 -mt-3.5 h-px flex-1"
                    style={{ background: i < paso ? 'linear-gradient(90deg,#1b4dff,#1434cb)' : 'rgba(255,255,255,0.07)' }} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── Step 1: Company ── */}
            {paso === 0 && (
              <motion.div key="p1" {...stepEnter}>
                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="su-razon" className={labelCls}>{t('signUp.step1.razonSocial')}</label>
                    <input id="su-razon" className={fieldCls} placeholder={DEMO.razonSocial} value={razonSocial} required
                      onChange={(e) => setRazon(e.target.value)} onFocus={() => autoFill(razonSocial, setRazon, 'razonSocial')} />
                  </div>
                  <div>
                    <label htmlFor="su-ruc" className={labelCls}>{t('signUp.step1.ruc')}</label>
                    <input id="su-ruc" className={fieldCls} placeholder={DEMO.ruc} value={ruc} required
                      onChange={(e) => setRuc(e.target.value)} onFocus={() => autoFill(ruc, setRuc, 'ruc')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="su-ciudad" className={labelCls}>{t('signUp.step1.ciudad')}</label>
                      <input id="su-ciudad" className={fieldCls} placeholder={DEMO.ciudad} value={ciudad} required
                        onChange={(e) => setCiudad(e.target.value)} onFocus={() => autoFill(ciudad, setCiudad, 'ciudad')} />
                    </div>
                    <div>
                      <label htmlFor="su-prov" className={labelCls}>{t('signUp.step1.provincia')}</label>
                      <select id="su-prov" className={selectCls} value={provincia} onChange={(e) => setProv(e.target.value)}>
                        {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <span className={labelCls}>{t('signUp.step1.certs')}</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {CERTIFICACIONES.map((c) => (
                        <button key={c} type="button" onClick={() => toggleCert(c)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                            certs.includes(c)
                              ? 'border border-blue-500/40 bg-blue-500/20 text-blue-300'
                              : 'border border-white/[0.08] bg-white/[0.04] text-slate-500 hover:text-slate-300'
                          }`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button type="button" onClick={siguiente} className={nextBtnCls}>
                  {t('signUp.next')} <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Product ── */}
            {paso === 1 && (
              <motion.div key="p2" {...stepEnter}>
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-[rgba(20,52,203,0.2)] bg-[rgba(20,52,203,0.07)] p-3.5">
                  <Store className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(20,52,203,0.8)]" />
                  <p className="text-xs leading-relaxed text-slate-300/80">{t('signUp.step2.info')}</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="su-pn" className={labelCls}>{t('signUp.step2.nombre')}</label>
                    <input id="su-pn" className={fieldCls} placeholder={DEMO.prodNombre} value={prodNombre} required
                      onChange={(e) => setProdNombre(e.target.value)} onFocus={() => autoFill(prodNombre, setProdNombre, 'prodNombre')} />
                  </div>
                  <div>
                    <label htmlFor="su-pd" className={labelCls}>{t('signUp.step2.desc')}</label>
                    <input id="su-pd" className={fieldCls} placeholder={DEMO.prodDesc} value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)} onFocus={() => autoFill(prodDesc, setProdDesc, 'prodDesc')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="su-precio" className={labelCls}>{t('signUp.step2.precio')}</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm text-slate-400/50">B/.</span>
                        <input id="su-precio" className={`${fieldCls} pl-9`} placeholder={DEMO.prodPrecio} value={prodPrecio}
                          onChange={(e) => setProdPrecio(e.target.value)} onFocus={() => autoFill(prodPrecio, setProdPrecio, 'prodPrecio')} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="su-entrega" className={labelCls}>{t('signUp.step2.entrega')}</label>
                      <input id="su-entrega" className={fieldCls} placeholder={DEMO.prodEntrega} value={prodEntrega}
                        onChange={(e) => setProdEntrega(e.target.value)} onFocus={() => autoFill(prodEntrega, setProdEntrega, 'prodEntrega')} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="su-unspsc" className={labelCls}>{t('signUp.step2.unspsc')}</label>
                    <input id="su-unspsc" className={fieldCls} placeholder={DEMO.prodUnspsc} value={prodUnspsc}
                      onChange={(e) => setProdUnspsc(e.target.value)} onFocus={() => autoFill(prodUnspsc, setProdUnspsc, 'prodUnspsc')} />
                  </div>
                </div>
                <button type="button" onClick={siguiente} className={nextBtnCls}>
                  {t('signUp.next')} <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* ── Step 3: Card payment ── */}
            {paso === 2 && (
              <motion.div key="p3" {...stepEnter}>
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-[#1b4dff]/20 bg-[#1b4dff]/[0.07] p-3.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-300/80" />
                  <p className="text-xs leading-relaxed text-slate-300/80">{t('signUp.step3.info')}</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="su-mcc" className={labelCls}>{t('signUp.step3.mcc')}</label>
                    <input id="su-mcc" className={fieldCls} placeholder={DEMO.mcc} value={mcc} required
                      onChange={(e) => setMcc(e.target.value)} onFocus={() => autoFill(mcc, setMcc, 'mcc')} />
                  </div>
                  <div>
                    <label htmlFor="su-proc" className={labelCls}>{t('signUp.step3.procesador')}</label>
                    <select id="su-proc" className={selectCls} value={procesador} onChange={(e) => setProc(e.target.value)} required>
                      <option>Banistmo / Visa Merchant</option>
                      <option>Banco General</option>
                      <option>BAC Credomatic</option>
                      <option>Global Bank</option>
                      <option>Stripe Panamá</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="su-cat" className={labelCls}>{t('signUp.step3.categoria')}</label>
                    <select id="su-cat" className={selectCls} value={categoria} onChange={(e) => setCat(e.target.value)} required>
                      <option>Hardware de Cómputo y Periféricos</option>
                      <option>Servicios de TI y Software</option>
                      <option>Útiles y Mobiliario de Oficina</option>
                      <option>Servicios de Limpieza y Mantenimiento</option>
                      <option>Servicios de Seguridad</option>
                      <option>Servicios Profesionales</option>
                      <option>Otro</option>
                    </select>
                  </div>
                </div>
                <button type="button" onClick={siguiente} className={nextBtnCls}>
                  {t('signUp.next')} <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* ── Step 4: Account ── */}
            {paso === 3 && (
              <motion.form key="p4" {...stepEnter} onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="su-nom" className={labelCls}>{t('signUp.step4.nombre')}</label>
                    <input id="su-nom" type="text" className={fieldCls} placeholder={DEMO.nombreC} value={nombreC} required
                      onChange={(e) => setNomC(e.target.value)} onFocus={() => autoFill(nombreC, setNomC, 'nombreC')} />
                  </div>
                  <div>
                    <label htmlFor="su-cor" className={labelCls}>{t('signUp.step4.correo')}</label>
                    <input id="su-cor" type="email" className={fieldCls} placeholder={DEMO.correo} value={correo} required
                      onChange={(e) => setCorreo(e.target.value)} onFocus={() => autoFill(correo, setCorreo, 'correo')} />
                  </div>
                  <div>
                    <label htmlFor="su-tel" className={labelCls}>{t('signUp.step4.telefono')}</label>
                    <input id="su-tel" type="tel" className={fieldCls} placeholder={DEMO.telefono} value={telefono} required
                      onChange={(e) => setTel(e.target.value)} onFocus={() => autoFill(telefono, setTel, 'telefono')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="su-clave" className={labelCls}>{t('signUp.step4.clave')}</label>
                      <input id="su-clave" type="password" className={fieldCls} placeholder="••••••••" value={clave} required minLength={8}
                        onChange={(e) => setClave(e.target.value)} onFocus={() => autoFill(clave, setClave, 'clave')} />
                    </div>
                    <div>
                      <label htmlFor="su-clavec" className={labelCls}>{t('signUp.step4.claveC')}</label>
                      <input id="su-clavec" type="password" className={fieldCls} placeholder="••••••••" value={claveC} required
                        onChange={(e) => setClaveC(e.target.value)} onFocus={() => autoFill(claveC, setClaveC, 'claveC')} />
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" required checked={acepta} onChange={(e) => setAcepta(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#1b4dff]" />
                    <span className="text-xs leading-relaxed text-slate-400/65">{t('signUp.step4.terms')}</span>
                  </label>
                </div>

                <button type="submit" disabled={enviando} className={`${nextBtnCls} disabled:opacity-70`}>
                  {enviando
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('signUp.submitting')}</>
                    : <><Check className="h-4 w-4" /> {t('signUp.submit')}</>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
