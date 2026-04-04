'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Trash2, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useSDKLogs } from '@/hooks/useSDKLogs';
import type { SDKLogEntry, SDKService } from '@/lib/sdk-logger';

// ── Service badge config ──────────────────────────────────────────────────────
const SERVICE_STYLE: Record<SDKService, { color: string; bg: string; border: string }> = {
  'VCN':     { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  'VPA':     { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)'  },
  'B2B-BIP': { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)'  },
  'B2B-SIP': { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.3)'  },
  'VPC':     { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)'  },
  'IPC':     { color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)' },
};

const ALL_SERVICES: SDKService[] = ['VCN', 'VPA', 'B2B-BIP', 'B2B-SIP', 'VPC', 'IPC'];

// ── Single log row ────────────────────────────────────────────────────────────
function LogRow({ entry }: { entry: SDKLogEntry }) {
  const [open, setOpen] = useState(false);
  const style = SERVICE_STYLE[entry.service];
  const ts = new Date(entry.timestamp);
  const timeStr = ts.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const msStr = String(ts.getMilliseconds()).padStart(3, '0');

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="border-b border-white/5 last:border-0"
    >
      {/* Summary row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/4 transition-colors group font-mono"
      >
        {/* Timestamp */}
        <span className="text-[10px] text-white/30 shrink-0 w-24">
          {timeStr}<span className="text-white/15">.{msStr}</span>
        </span>

        {/* Status dot */}
        {entry.status === 'success'
          ? <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
          : <XCircle      size={11} className="text-red-400 shrink-0" />
        }

        {/* Service badge */}
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
          {entry.service}
        </span>

        {/* Method */}
        <span className="text-[11px] text-[#93bbff] truncate flex-1">{entry.method}</span>

        {/* Endpoint */}
        <span className="text-[10px] text-white/25 truncate hidden lg:block max-w-[280px]">{entry.endpoint}</span>

        {/* Duration */}
        <span className="text-[10px] text-white/30 shrink-0 flex items-center gap-1 ml-2">
          <Clock size={9} />
          {entry.durationMs}ms
        </span>

        {/* Expand toggle */}
        <span className="shrink-0 text-white/20 group-hover:text-white/50 transition-colors">
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-3 rounded-lg overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {!!entry.payload && (
                <div className="border-b border-white/5">
                  <p className="px-3 pt-2 pb-1 text-[9px] font-bold text-white/30 uppercase tracking-widest">Request Payload</p>
                  <pre className="px-3 pb-3 text-[10px] text-[#93c5fd] leading-relaxed overflow-x-auto">
                    {JSON.stringify(entry.payload as Record<string, unknown>, null, 2)}
                  </pre>
                </div>
              )}
              {!!entry.response && (
                <div>
                  <p className="px-3 pt-2 pb-1 text-[9px] font-bold text-white/30 uppercase tracking-widest">Response</p>
                  <pre className="px-3 pb-3 text-[10px] text-emerald-300 leading-relaxed overflow-x-auto">
                    {JSON.stringify(entry.response as Record<string, unknown>, null, 2)}
                  </pre>
                </div>
              )}
              {entry.error && (
                <div className="px-3 py-2">
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Error</p>
                  <p className="text-[10px] text-red-400">{entry.error}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SDKLogsPage() {
  const { logs, clear } = useSDKLogs();
  const [filter, setFilter] = useState<SDKService | 'ALL'>('ALL');

  const filtered = filter === 'ALL' ? logs : logs.filter((l) => l.service === filter);

  const counts = ALL_SERVICES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = logs.filter((l) => l.service === s).length;
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1434CB] flex items-center justify-center">
            <Terminal size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">SDK Logs</h1>
            <p className="text-xs text-slate-400 mt-0.5">Live @visa-gov/sdk · Visa Developer API calls</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{logs.length} entries</span>
          {logs.length > 0 && (
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Service filter pills */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            filter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          All <span className="ml-1 opacity-60">{logs.length}</span>
        </button>
        {ALL_SERVICES.map((s) => {
          const style = SERVICE_STYLE[s];
          const active = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all"
              style={active
                ? { color: style.color, background: style.bg, border: `1px solid ${style.border}` }
                : { color: '#94a3b8', background: '#f1f5f9', border: '1px solid transparent' }
              }
            >
              {s} {counts[s] > 0 && <span className="ml-1 opacity-60">{counts[s]}</span>}
            </button>
          );
        })}
      </div>

      {/* Log terminal */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #07102e 0%, #0d1b3e 60%, #0a1628 100%)',
          boxShadow: '0 0 0 1px rgba(99,130,255,0.15), 0 16px 48px rgba(0,0,0,0.4)',
        }}
      >
        {/* Terminal header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[11px] text-white/30 font-mono">visa-gov/sdk · sandbox · api.visa.com</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Entries */}
        <div className="divide-y divide-white/0 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Terminal size={32} className="text-white/10" />
              <p className="text-sm text-white/20 font-mono">
                {logs.length === 0 ? 'No SDK calls recorded yet.' : `No ${filter} calls recorded.`}
              </p>
              <p className="text-xs text-white/10 font-mono">
                {logs.length === 0 ? 'Issue a card or execute a payment to see logs.' : ''}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((entry) => (
                <LogRow key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}
