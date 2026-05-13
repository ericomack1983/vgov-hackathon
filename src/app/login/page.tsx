'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Shield, Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, loading } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Already authenticated → go to dashboard
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setSubmitting(false);
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#1434CB] p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Decorative circles */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />

        {/* Top — seal + wordmark */}
        <div className="relative z-10">
          <div className="mb-12">
            <svg viewBox="0 0 71 23" aria-label="Visa" className="h-9 w-auto" fill="none">
              <path fill="white" fillRule="evenodd" clipRule="evenodd" d="M50.6986 15.3377C50.7123 11.8369 47.8134 10.3152 45.4937 9.09755C43.9358 8.27981 42.6393 7.59921 42.6617 6.54843C42.6781 5.75329 43.4371 4.90557 45.0931 4.692C47.0325 4.5045 48.9864 4.8451 50.7479 5.67771L51.7566 0.985714C50.0419 0.341244 48.2261 0.00745647 46.3943 0C40.7429 0 36.7376 3.013 36.7014 7.33043C36.6653 10.5143 39.5501 12.3017 41.7286 13.363C43.9629 14.4473 44.7153 15.1439 44.7054 16.1164C44.7054 17.6049 42.9213 18.2587 41.2751 18.285C38.4794 18.3296 36.8224 17.5564 35.5085 16.9434L35.3839 16.8853L34.3357 21.7416C35.6763 22.3593 38.1504 22.8949 40.7166 22.9211C46.7393 22.9211 50.6821 19.9443 50.7019 15.3377H50.6986ZM26.9429 0.404143L17.6541 22.5729H11.592L7.02157 4.88257C6.74229 3.79171 6.50243 3.39414 5.658 2.93414C4.27143 2.18829 2.00429 1.48514 0 1.04814L0.138 0.391H9.89329C11.2059 0.396383 12.3201 1.35458 12.5219 2.65157L14.9369 15.4823L20.9234 0.404143H26.9429ZM70.9714 22.5663H65.6683L64.975 19.2641H57.6183L56.4223 22.5729H50.4029L59.0016 2.03057C59.409 1.04254 60.3741 0.399575 61.4429 0.404143H66.3419L70.9714 22.5663ZM59.2677 14.72L62.2873 6.394L64.0254 14.72H59.2677ZM30.3994 22.5729L35.1571 0.404143H29.4071L24.6626 22.5729H30.3994Z"/>
            </svg>
          </div>

          <h1 className="text-white text-4xl font-bold leading-tight tracking-tight max-w-xs">
            Gov Procurement<br />Platform
          </h1>
          <p className="text-white/60 mt-4 text-sm leading-relaxed max-w-xs">
            AI-powered procurement, settlement, and supplier management for government operations.
          </p>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 space-y-3">
          {[
            { icon: Shield,    label: 'Visa-secured card payments' },
            { icon: Lock,      label: 'End-to-end encrypted transactions' },
            { icon: Building2, label: 'Government-grade compliance' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
              <Icon size={15} className="text-white/70 shrink-0" />
              <span className="text-white/80 text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-full bg-[#1434CB] flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">VGov Procurement</span>
          </div>

          <div className="mb-8">
            <h2 className="text-white text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="text-slate-400 text-sm mt-1">Authorized personnel only. Credentials are verified via secure identity provider.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="you@agency.gov"
                  className="w-full bg-slate-900 border border-slate-700 text-white placeholder:text-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1434CB] focus:border-[#1434CB] transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 text-white placeholder:text-slate-600 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1434CB] focus:border-[#1434CB] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 bg-red-950/60 border border-red-800/60 rounded-xl px-4 py-3"
                >
                  <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full py-3 rounded-xl bg-[#1434CB] hover:bg-[#1434CB] text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <Shield size={15} />
                  Sign In Securely
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-slate-600 text-[11px] text-center mt-8 leading-relaxed">
            This system is for authorized government use only.<br />
            Unauthorized access is prohibited and subject to prosecution.
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-4">
            <Shield size={11} className="text-emerald-500" />
            <span className="text-emerald-500 text-[11px] font-semibold">Protected by Supabase Auth · TLS 1.3</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
