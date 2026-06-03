'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck, Check, CreditCard,
  ArrowLeft, Building2, Loader2, AlertCircle,
} from 'lucide-react';
import { VisaLogo } from '@visa/nova-react';
import { useLang } from '../i18n';

interface Props {
  onSignedIn: () => void;
  onSignUp:   () => void;
  onBack:     () => void;
}

type Rol = 'proveedor' | 'entidad';

function PanamaShield() {
  return (
    <svg width="22" height="26" viewBox="0 0 52 61" fill="none" aria-hidden>
      <path d="M26 2 L50 10 L50 36 Q50 56 26 62 Q2 56 2 36 L2 10 Z"
        fill="url(#sgi)" stroke="rgba(20,52,203,0.6)" strokeWidth="1.5" />
      <defs>
        <linearGradient id="sgi" x1="0" y1="0" x2="52" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1b4dff" />
          <stop offset="100%" stopColor="#0a1540" />
        </linearGradient>
      </defs>
      <clipPath id="sic"><path d="M26 2 L50 10 L50 36 Q50 56 26 62 Q2 56 2 36 L2 10 Z" /></clipPath>
      <g clipPath="url(#sic)">
        <rect x="2" y="2" width="24" height="30" fill="rgba(27,77,255,0.65)" />
        <rect x="26" y="32" width="24" height="30" fill="rgba(255,45,85,0.5)" />
        <polygon points="14,8 15.2,11.6 19,11.6 16,13.8 17.2,17.4 14,15.2 10.8,17.4 12,13.8 9,11.6 12.8,11.6"
          fill="#22d3ee" opacity="0.95" />
      </g>
    </svg>
  );
}

export function SignInPage({ onSignedIn, onSignUp, onBack }: Props) {
  const { t } = useLang();
  const [rol, setRol]           = useState<Rol>('proveedor');
  const [correo, setCorreo]     = useState('');
  const [clave, setClave]       = useState('');
  const [verClave, setVerClave] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rol === 'entidad') { window.location.href = '/login'; return; }
    setError(null);
    setCargando(true);
    await new Promise((r) => setTimeout(r, 1200));
    if (!correo.includes('@') || clave.length < 6) {
      setError(t('signIn.error'));
      setCargando(false);
      return;
    }
    onSignedIn();
  };

  const trustItems = [t('signIn.trust.0'), t('signIn.trust.1'), t('signIn.trust.2')];
  const trustIcons = [ShieldCheck, Check, CreditCard];
  const taglineParts = t('signIn.tagline').split(' y ');

  return (
    <div className="flex min-h-screen w-full font-sans"
      style={{ backgroundColor: '#0a0e1a', color: '#f4f6fb', backgroundImage: 'radial-gradient(60% 60% at 18% 12%, rgba(27,77,255,0.16) 0%, transparent 70%), radial-gradient(50% 50% at 88% 8%, rgba(20,52,203,0.14) 0%, transparent 70%)' }}>

      {/* ── Left brand panel ── */}
      <aside
        aria-hidden
        className="relative hidden w-[42%] flex-col justify-between overflow-hidden border-r border-white/5 p-12 lg:flex">
        <svg className="absolute inset-0 h-full w-full opacity-[0.04]">
          <defs><pattern id="dots-si" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="white" />
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#dots-si)" />
        </svg>
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(27,77,255,0.22) 0%, transparent 70%)' }} />

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

          <h2 className="mb-4 max-w-md text-[2.4rem] font-bold leading-[1.1] tracking-[-0.03em] text-white">
            {taglineParts[0]} y{' '}
            <span className="bg-gradient-to-r from-[#2f6bff] via-[#22d3ee] to-[#4f74ff] bg-clip-text text-transparent">
              {taglineParts[1] || 'la empresa se encuentran.'}
            </span>
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-white/45">{t('signIn.sub')}</p>
        </div>

        <div className="relative z-10 flex flex-col gap-3">
          {trustItems.map((label, i) => {
            const Icon = trustIcons[i];
            return (
              <div key={label}
                className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] px-4 py-3">
                <Icon className="h-3.5 w-3.5 shrink-0 text-blue-300/80" />
                <span className="text-sm text-slate-300/80">{label}</span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-[420px]">

          <button onClick={onBack}
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-400/70 transition-colors hover:text-slate-200">
            <ArrowLeft className="h-3.5 w-3.5" /> {t('signIn.back')}
          </button>

          {/* Visa lockup on the form side too */}
          <div className="mb-6 flex items-center gap-2 opacity-70">
            <span className="text-[0.62rem] uppercase tracking-[0.1em] text-white/40">{t('nav.poweredBy')}</span>
            <VisaLogo style={{ height: 14 }} />
          </div>

          <h2 className="mb-1 text-[1.4rem] font-semibold text-white">{t('signIn.title')}</h2>
          <p className="mb-6 text-sm text-slate-400/70">{t('signIn.formSub')}</p>

          {/* Role toggle */}
          <div className="mb-6 flex rounded-xl border border-white/[0.07] bg-white/[0.04] p-1">
            {(['proveedor', 'entidad'] as Rol[]).map((r) => (
              <button key={r} type="button"
                onClick={() => { setRol(r); setError(null); }}
                className={`flex-1 rounded-[9px] py-2 text-sm font-medium transition-all ${
                  rol === r
                    ? 'bg-gradient-to-br from-[#1b4dff] to-[#1434cb] text-white shadow-lg shadow-[#1b4dff]/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}>
                {r === 'proveedor' ? t('signIn.roleSupplier') : t('signIn.roleEntity')}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {rol === 'entidad' ? (
              <motion.div key="entidad"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-xl border border-[#1b4dff]/20 bg-[#1b4dff]/[0.07] p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-300/80" />
                  <div>
                    <p className="mb-1 text-sm font-semibold text-blue-300/90">{t('signIn.entityInfoTitle')}</p>
                    <p className="mb-3 text-xs leading-relaxed text-slate-400/70">{t('signIn.entityInfoDesc')}</p>
                    <button type="button"
                      onClick={() => { window.location.href = '/login'; }}
                      className="text-sm font-semibold text-blue-300/90 hover:text-blue-200">
                      {t('signIn.entityLink')}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form key="proveedor"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleSubmit}>

                <div className="mb-4 flex flex-col gap-4">
                  {/* email */}
                  <div>
                    <label htmlFor="si-email" className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-400/70">
                      {t('signIn.email')}
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500/70" />
                      <input
                        id="si-email" type="email" required autoComplete="email"
                        value={correo} onChange={(e) => { setCorreo(e.target.value); setError(null); }}
                        placeholder={t('signIn.emailPlaceholder')}
                        className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.05] pl-9 pr-3 text-sm text-white placeholder:text-slate-500/60 transition-colors focus:border-[#1b4dff] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* password */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="si-pass" className="block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-400/70">
                        {t('signIn.password')}
                      </label>
                      <button type="button" className="text-xs text-blue-300/75 hover:text-blue-200">
                        {t('signIn.forgotPassword')}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500/70" />
                      <input
                        id="si-pass" type={verClave ? 'text' : 'password'} required autoComplete="current-password"
                        value={clave} onChange={(e) => { setClave(e.target.value); setError(null); }}
                        placeholder={t('signIn.passwordPlaceholder')}
                        className="h-11 w-full rounded-xl border border-white/[0.09] bg-white/[0.05] pl-9 pr-10 text-sm text-white placeholder:text-slate-500/60 transition-colors focus:border-[#1b4dff] focus:outline-none"
                      />
                      <button type="button" onClick={() => setVerClave(!verClave)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500/70 hover:text-slate-300">
                        {verClave ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <label className="mb-5 flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)}
                    className="h-4 w-4 shrink-0 accent-[#1b4dff]" />
                  <span className="text-sm text-slate-400/65">{t('signIn.remember')}</span>
                </label>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                      <span className="text-sm text-red-300">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={cargando}
                  className="mb-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#1b4dff] to-[#1434cb] text-sm font-bold text-white shadow-lg shadow-[#1b4dff]/30 transition-all hover:shadow-[#1b4dff]/50 disabled:opacity-70">
                  {cargando
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('signIn.submitting')}</>
                    : <><ShieldCheck className="h-4 w-4" /> {t('signIn.submit')}</>}
                </button>

                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.07]" />
                  <span className="text-[0.7rem] uppercase text-slate-500/60">o</span>
                  <div className="h-px flex-1 bg-white/[0.07]" />
                </div>

                <button type="button"
                  className="mb-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.09] text-sm text-slate-400/70 transition-colors hover:bg-white/5">
                  <ShieldCheck className="h-4 w-4 text-slate-500/50" />
                  {t('signIn.sso')}
                </button>

                <p className="text-center text-sm text-slate-500/70">
                  {t('signIn.noAccount')}{' '}
                  <button type="button" onClick={onSignUp}
                    className="font-medium text-blue-300/85 hover:text-blue-200">
                    {t('signIn.register')}
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
