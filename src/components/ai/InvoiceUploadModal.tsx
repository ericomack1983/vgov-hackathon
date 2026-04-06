'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, CheckCircle2, Zap, ChevronDown, Sparkles, Link2 } from 'lucide-react';
import { MOCK_SUPPLIERS } from '@/lib/mock-data/suppliers';
import { MOCK_RFPS } from '@/lib/mock-data/rfps';
import type { Supplier } from '@/lib/mock-data/types';

// ── Filename → supplier matching ──────────────────────────────────────────

function wordsFromString(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);
}

function matchSupplierFromFilename(fileName: string): Supplier | undefined {
  const fileWords = wordsFromString(fileName);
  if (fileWords.length === 0) return undefined;

  let best: Supplier | undefined;
  let bestScore = 0;

  for (const supplier of MOCK_SUPPLIERS) {
    const supplierWords = wordsFromString(supplier.name);
    const hits = supplierWords.filter((sw) =>
      fileWords.some((fw) => fw.includes(sw) || sw.includes(fw)),
    ).length;
    if (hits > bestScore) {
      bestScore = hits;
      best = supplier;
    }
  }

  return bestScore > 0 ? best : undefined;
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface UploadedInvoice {
  supplierId: string;
  rfpId: string;
  amount: number;
  description: string;
  fileName: string;
  autoMatched: boolean;       // filename matched a supplier
  matchedSupplierName?: string;
}

interface Props {
  onClose: () => void;
  onAnalyze: (invoice: UploadedInvoice) => void;
}

type Stage = 'drop' | 'parsing' | 'ready';

// ── Parse steps (last one is the supplier-match step) ────────────────────

const BASE_STEPS = [
  'Reading file headers…',
  'Extracting invoice number…',
  'Parsing line items…',
  'Validating amounts…',
  'Matching supplier identity…',
];

export function InvoiceUploadModal({ onClose, onAnalyze }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage]         = useState<Stage>('drop');
  const [dragging, setDragging]   = useState(false);
  const [parseStep, setParseStep] = useState(0);
  const [fileName, setFileName]   = useState('');
  const [matchedSupplier, setMatchedSupplier] = useState<Supplier | undefined>();

  // Form fields
  const [supplierId, setSupplierId] = useState(MOCK_SUPPLIERS[0].id);
  const [rfpId, setRfpId]           = useState(MOCK_RFPS[0].id);
  const [amount, setAmount]         = useState('');
  const [description, setDescription] = useState('');

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);

    // Amount from filename digits (e.g. "invoice_702.jpg" → 702)
    const numMatch = file.name.match(/(\d[\d,.]+)/);
    const guessedAmount = numMatch ? numMatch[1].replace(/[,]/g, '') : '420000';

    // Supplier match
    const matched = matchSupplierFromFilename(file.name);

    setStage('parsing');
    let step = 0;

    const interval = setInterval(() => {
      step += 1;
      setParseStep(step);

      if (step >= BASE_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => {
          // Apply match results
          if (matched) {
            setSupplierId(matched.id);
            setMatchedSupplier(matched);
            setDescription(`Invoice from ${matched.name}`);
          } else {
            setDescription(`Invoice from ${MOCK_SUPPLIERS.find((s) => s.id === supplierId)?.name ?? 'Supplier'}`);
          }
          setAmount(guessedAmount);
          setStage('ready');
        }, 300);
      }
    }, 340);
  }, [supplierId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = () => {
    const amt = parseFloat(String(amount).replace(/,/g, ''));
    if (!amt || amt <= 0) return;
    onAnalyze({
      supplierId,
      rfpId,
      amount: amt,
      description,
      fileName,
      autoMatched: !!matchedSupplier,
      matchedSupplierName: matchedSupplier?.name,
    });
  };

  const isMatchStep = (i: number) => i === BASE_STEPS.length - 1; // last step

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(170deg,#05091a 0%,#080f25 55%,#060c1e 100%)',
          border: '1px solid rgba(14,165,233,0.2)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(14,165,233,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(14,165,233,0.03) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <button onClick={onClose}
          className="absolute top-4 right-4 z-20 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <X size={14} className="text-slate-400" />
        </button>

        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
              <Upload size={15} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-sky-300/60 uppercase tracking-widest">Invoice Submission</p>
              <h2 className="text-sm font-bold text-white">Upload Supplier Invoice</h2>
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* ── Drop zone ── */}
            {stage === 'drop' && (
              <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center py-10 gap-3 transition-all duration-200"
                  style={{
                    borderColor: dragging ? 'rgba(14,165,233,0.6)' : 'rgba(255,255,255,0.1)',
                    background: dragging ? 'rgba(14,165,233,0.06)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <motion.div
                    animate={dragging ? { scale: 1.15 } : { scale: 1 }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)' }}
                  >
                    <Upload size={20} className="text-sky-400" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white/80">Drop invoice file here</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">PDF, PNG, JPG — or click to browse</p>
                    <p className="text-[10px] text-indigo-400/50 mt-2">
                      Filename hint: <span className="font-mono">invoice_apex_federal.pdf</span>
                    </p>
                  </div>
                </div>
                <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={onInputChange} />
              </motion.div>
            )}

            {/* ── Parsing ── */}
            {stage === 'parsing' && (
              <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <FileText size={16} className="text-sky-400 shrink-0" />
                  <p className="text-[11px] text-white/70 font-medium truncate">{fileName}</p>
                </div>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Parsing file…</p>

                {BASE_STEPS.map((step, i) => {
                  const active = i === parseStep - 1;
                  const done   = i < parseStep - 1;
                  const isMatch = isMatchStep(i);

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={i < parseStep ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-2.5 text-[11px]"
                    >
                      {done
                        ? <CheckCircle2 size={12} className={`shrink-0 ${isMatch && matchedSupplier ? 'text-emerald-400' : 'text-emerald-400'}`} />
                        : active
                          ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                              <Zap size={12} className="text-sky-400 shrink-0" />
                            </motion.div>
                          : <div className="w-3 h-3 shrink-0" />
                      }
                      <span style={{ color: i < parseStep ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>
                        {step}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ── Ready / form ── */}
            {stage === 'ready' && (
              <motion.div key="ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }} className="space-y-4">

                {/* File badge */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                  <p className="text-[11px] text-emerald-300 font-medium truncate">{fileName}</p>
                  <span className="ml-auto text-[9px] font-bold text-emerald-500 uppercase">Parsed</span>
                </div>

                {/* ── Supplier match banner ── */}
                {matchedSupplier ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-xl px-4 py-3"
                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Link2 size={12} className="text-indigo-400 shrink-0" />
                      <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                        Supplier Matched from Filename
                      </p>
                      <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <Sparkles size={8} />
                        98% confidence
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">
                      {matchedSupplier.name}
                    </p>
                    <p className="text-[10px] text-indigo-400/60 mt-0.5">
                      Auto-approval will be triggered · no manual review required
                    </p>
                  </motion.div>
                ) : (
                  <div className="rounded-xl px-3 py-2.5 text-[11px] text-amber-400/70"
                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    No supplier match found in filename — select manually below
                  </div>
                )}

                {/* Supplier selector (pre-locked when matched) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Supplier {matchedSupplier && <span className="text-indigo-400 normal-case ml-1">(auto-selected)</span>}
                  </label>
                  <div className="relative">
                    <select
                      value={supplierId}
                      onChange={(e) => { setSupplierId(e.target.value); setMatchedSupplier(undefined); }}
                      className="w-full appearance-none rounded-xl px-3 py-2.5 text-xs font-medium text-white pr-8"
                      style={{
                        background: matchedSupplier ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.06)',
                        border: matchedSupplier ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      {MOCK_SUPPLIERS.map((s) => (
                        <option key={s.id} value={s.id} style={{ background: '#0f172a' }}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* RFP */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Related RFP
                  </label>
                  <div className="relative">
                    <select
                      value={rfpId}
                      onChange={(e) => setRfpId(e.target.value)}
                      className="w-full appearance-none rounded-xl px-3 py-2.5 text-xs font-medium text-white pr-8"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      {MOCK_RFPS.map((r) => (
                        <option key={r.id} value={r.id} style={{ background: '#0f172a' }}>
                          {r.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Invoice Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl pl-6 pr-3 py-2.5 text-xs font-medium text-white placeholder-slate-600 outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Service description…"
                    className="w-full rounded-xl px-3 py-2.5 text-xs font-medium text-white placeholder-slate-600 outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                </div>

                {/* Submit */}
                <motion.button
                  onClick={handleSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!amount || parseFloat(String(amount)) <= 0}
                  className="w-full relative overflow-hidden rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-white disabled:opacity-40"
                  style={{
                    background: matchedSupplier
                      ? 'linear-gradient(135deg,#059669,#10b981)'
                      : 'linear-gradient(135deg,#0ea5e9,#6366f1)',
                  }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', transform: 'skewX(-20deg)' }}
                    animate={{ x: ['-120%', '220%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
                  />
                  {matchedSupplier
                    ? <><Sparkles size={14} className="relative z-10" /><span className="relative z-10">Auto-Analyze &amp; Approve</span></>
                    : <><Zap size={14} className="relative z-10" /><span className="relative z-10">Analyze Invoice</span></>
                  }
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
