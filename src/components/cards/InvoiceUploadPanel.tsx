'use client';

/**
 * Drop an invoice PDF here and the issuance form fills itself in.
 *
 * The document goes to /api/cards/extract-invoice, which returns the parsed
 * fields. Anything the invoice does not state comes back null, so the form keeps
 * whatever the operator already typed rather than being filled with a guess.
 */

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, Loader2, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

export type { ExtractedInvoiceFields } from '@/lib/invoice/extractionFixture';
import type { ExtractedInvoiceFields } from '@/lib/invoice/extractionFixture';

type Phase =
  | { kind: 'idle' }
  | { kind: 'reading'; filename: string }
  | { kind: 'done'; filename: string; applied: string[]; confidence: number; notes: string | null }
  | { kind: 'error'; reason: string };

/** Reading a PDF takes a few seconds — say what is happening while it does. */
const STEPS = ['Uploading document…', 'Running OCR on 1 page…', 'Extracting Level II / III fields…', 'Matching to form…'];

/** Paced so all four steps play out across the read rather than jumping. */
const STEP_MS = 900;

export function InvoiceUploadPanel({
  onExtract,
}: {
  /** Applies the fields and returns the labels of the ones it actually used. */
  onExtract: (fields: ExtractedInvoiceFields) => string[];
}) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type && file.type !== 'application/pdf') {
      setPhase({ kind: 'error', reason: 'That is not a PDF — upload the invoice as a PDF.' });
      return;
    }

    setPhase({ kind: 'reading', filename: file.name });
    setStep(0);
    stepTimer.current = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS);

    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/cards/extract-invoice', { method: 'POST', body });
      const json = await res.json();

      if (!json.ok) {
        setPhase({ kind: 'error', reason: json.reason ?? 'Could not read that invoice.' });
        return;
      }

      const fields = json.fields as ExtractedInvoiceFields;
      const applied = onExtract(fields);
      setPhase({
        kind: 'done',
        filename: file.name,
        applied,
        confidence: fields.confidence ?? 0,
        notes: fields.notes,
      });
    } catch {
      setPhase({ kind: 'error', reason: 'Upload failed — check the connection and try again.' });
    } finally {
      if (stepTimer.current) clearInterval(stepTimer.current);
      stepTimer.current = null;
    }
  }, [onExtract]);

  const reset = () => {
    setPhase({ kind: 'idle' });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="mt-5">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />

      <AnimatePresence mode="wait">
        {/* ── Idle: the drop target ── */}
        {phase.kind === 'idle' && (
          <motion.button
            key="idle"
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFile(f);
            }}
            className={`w-full rounded-2xl border border-dashed px-5 py-6 text-left transition-all group ${
              dragging
                ? 'border-[#1434CB] bg-[#EEF1FD] scale-[1.01]'
                : 'border-slate-300 bg-white hover:border-[#1434CB] hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                dragging ? 'bg-[#1434CB]' : 'bg-slate-100 group-hover:bg-[#1434CB]'
              }`}>
                <FileUp size={19} className={dragging ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  Upload invoice
                  <Sparkles size={12} className="text-[#1434CB]" />
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  Drop a PDF to read it and fill the form automatically.
                </p>
              </div>
            </div>
          </motion.button>
        )}

        {/* ── Reading ── */}
        {phase.kind === 'reading' && (
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="w-full rounded-2xl border border-[#1434CB]/30 bg-[#EEF1FD] px-5 py-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#1434CB] flex items-center justify-center shrink-0">
                <Loader2 size={19} className="text-white animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{phase.filename}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={step}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="text-xs text-[#1434CB] mt-0.5 font-mono"
                  >
                    {STEPS[step]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            <div className="mt-4 h-1 rounded-full bg-white/70 overflow-hidden">
              <motion.div
                className="h-full bg-[#1434CB]"
                initial={{ width: '8%' }}
                animate={{ width: `${((step + 1) / STEPS.length) * 92}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}

        {/* ── Done ── */}
        {phase.kind === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-emerald-900">
                  {phase.applied.length > 0
                    ? `${phase.applied.length} field${phase.applied.length === 1 ? '' : 's'} populated`
                    : 'Nothing to fill from this invoice'}
                </p>
                <p className="text-[11px] text-emerald-700/80 truncate mt-0.5">{phase.filename}</p>

                {phase.applied.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {phase.applied.map((label) => (
                      <motion.span
                        key={label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-200"
                      >
                        {label}
                      </motion.span>
                    ))}
                  </div>
                )}

                {phase.notes && (
                  <p className="text-[10px] text-emerald-700/70 mt-2 leading-snug">{phase.notes}</p>
                )}
                <p className="text-[10px] text-emerald-700/60 mt-2 font-mono">
                  confidence {(phase.confidence * 100).toFixed(0)}% · review before issuing
                </p>
              </div>
              <button type="button" onClick={reset} className="text-emerald-600/60 hover:text-emerald-800 shrink-0">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Error ── */}
        {phase.kind === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-red-900">Could not read the invoice</p>
                <p className="text-[11px] text-red-700/80 mt-0.5 leading-snug">{phase.reason}</p>
              </div>
              <button type="button" onClick={reset} className="text-xs font-semibold text-red-600 hover:text-red-800 shrink-0">
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
