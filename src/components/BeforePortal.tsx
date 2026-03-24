'use client';

import { useEffect, useState } from 'react';
import { Clock, FileText, CheckCircle2, AlertCircle, Mail, RotateCcw, Ban } from 'lucide-react';

interface Props {
  onInstall: () => void;
}

// ── Workflow steps ─────────────────────────────────────────────────────────
type StepStatus = 'done' | 'blocked' | 'waiting' | 'pending';

interface Step {
  label: string;
  sublabel?: string;
  status: StepStatus;
  day: number;
  blocker?: string;
}

const STEPS: Step[] = [
  { label: 'Request Submitted',           status: 'done',    day: 1  },
  { label: 'Department Head Notified',    status: 'done',    day: 1  },
  { label: 'Budget Officer Review',       status: 'blocked', day: 4,  blocker: 'Out of office until Mar 18' },
  { label: 'Procurement Committee',       status: 'waiting', day: 9,  blocker: 'Meeting rescheduled ×2' },
  { label: 'Legal & Compliance Review',   status: 'waiting', day: 14, blocker: 'Awaiting legal counsel' },
  { label: 'CFO Sign-off',               status: 'pending', day: 21 },
  { label: 'Invoice Generation',          status: 'pending', day: 24 },
  { label: 'Finance Processing',          status: 'pending', day: 27 },
  { label: 'Payment Issued',             status: 'pending', day: 30 },
];

// ── Activity feed ──────────────────────────────────────────────────────────
const ACTIVITY = [
  { day: 1,  icon: 'mail',    text: 'Approval request sent to R. Thompson (Budget)' },
  { day: 3,  icon: 'reply',   text: 'Auto-reply: "Out of office until Mar 18"' },
  { day: 4,  icon: 'mail',    text: 'Escalation email sent to deputy officer' },
  { day: 6,  icon: 'block',   text: 'Committee meeting cancelled — no quorum' },
  { day: 8,  icon: 'mail',    text: 'Reminder #3 sent to procurement committee' },
  { day: 11, icon: 'reply',   text: '"Please resubmit with updated cost breakdown"' },
  { day: 13, icon: 'mail',    text: 'Revised request resubmitted' },
  { day: 16, icon: 'block',   text: 'Legal review: missing vendor compliance docs' },
];

export function BeforePortal({ onInstall }: Props) {
  const [day, setDay] = useState(1);
  const [visibleSteps, setVisibleSteps] = useState(1);
  const [visibleActivity, setVisibleActivity] = useState(0);
  const [pulse, setPulse] = useState(false);

  // Slowly reveal steps
  useEffect(() => {
    if (visibleSteps >= STEPS.length) return;
    const t = setTimeout(() => setVisibleSteps((n) => n + 1), 600);
    return () => clearTimeout(t);
  }, [visibleSteps]);

  // Day counter — ticks up once all steps are visible
  useEffect(() => {
    if (visibleSteps < STEPS.length) return;
    if (day >= 18) return;
    const t = setTimeout(() => setDay((d) => d + 1), 180);
    return () => clearTimeout(t);
  }, [visibleSteps, day]);

  // Feed items appear as days pass
  useEffect(() => {
    const next = ACTIVITY[visibleActivity];
    if (!next) return;
    if (day >= next.day) setVisibleActivity((n) => n + 1);
  }, [day, visibleActivity]);

  // Pulse the CTA button
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 1800);
    return () => clearInterval(t);
  }, []);

  const activeStep = STEPS.findIndex((s) => s.status === 'blocked' || s.status === 'waiting');

  return (
    <div className="min-h-screen bg-[#eef0f3] flex flex-col items-center justify-center p-6 font-sans">

      {/* System bar */}
      <div className="w-full max-w-3xl mb-2 flex items-center justify-between text-[11px] text-gray-400 px-1">
        <span className="font-mono">GOV PROCUREMENT SYSTEM v2.3.1</span>
        <span>Session: USR-4892 &nbsp;|&nbsp; Dept: Health Services &nbsp;|&nbsp; FY2024</span>
      </div>

      {/* Window chrome */}
      <div className="w-full max-w-3xl bg-white border border-gray-300 shadow-md rounded-sm overflow-hidden">

        {/* Title bar */}
        <div className="bg-[#d8dce2] border-b border-gray-300 px-4 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#b0b5bc]" />
          <div className="w-3 h-3 rounded-full bg-[#b0b5bc]" />
          <div className="w-3 h-3 rounded-full bg-[#b0b5bc]" />
          <span className="ml-3 text-xs font-semibold text-gray-500 tracking-widest uppercase">
            Government Procurement Portal
          </span>
          <div className="ml-auto flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
            <Clock size={11} className="text-red-400" />
            <span className="text-[11px] font-semibold text-red-500">Day {day} of 30</span>
          </div>
        </div>

        <div className="flex divide-x divide-gray-200">

          {/* Left — Main content */}
          <div className="flex-1 p-6 space-y-5 min-w-0">

            {/* Request header */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 rounded-sm">
                <FileText size={15} className="text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Purchase Request #PR-2024-0847</p>
                <p className="text-sm font-bold text-gray-800 leading-tight">Purchase 10 Infusion Pumps</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Submitted 03/10/2024 · J. Martinez · $48,500</p>
              </div>
              <span className="ml-auto shrink-0 px-2 py-0.5 bg-yellow-50 border border-yellow-300 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded-sm">
                Blocked
              </span>
            </div>

            <hr className="border-gray-200" />

            {/* Workflow steps */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                Approval Workflow — {STEPS.filter(s => s.status === 'done').length}/{STEPS.length} complete
              </p>
              <div className="space-y-1.5">
                {STEPS.map((s, i) => {
                  const visible = i < visibleSteps;
                  const isActive = i === activeStep;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 px-3 py-2 border rounded-sm text-sm
                        transition-all duration-500
                        ${!visible ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}
                        ${s.status === 'done'    ? 'bg-gray-50 border-gray-200' : ''}
                        ${s.status === 'blocked' ? 'bg-red-50 border-red-200' : ''}
                        ${s.status === 'waiting' ? 'bg-yellow-50 border-yellow-200' : ''}
                        ${s.status === 'pending' ? 'bg-white border-gray-200' : ''}
                      `}
                    >
                      {/* Icon */}
                      {s.status === 'done'    && <CheckCircle2 size={14} className="text-green-500 shrink-0" />}
                      {s.status === 'blocked' && <Ban size={14} className="text-red-400 shrink-0" />}
                      {s.status === 'waiting' && <AlertCircle size={14} className="text-yellow-500 shrink-0" />}
                      {s.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />}

                      {/* Label */}
                      <span className={`text-xs font-medium
                        ${s.status === 'done'    ? 'text-gray-400 line-through' : ''}
                        ${s.status === 'blocked' ? 'text-red-600' : ''}
                        ${s.status === 'waiting' ? 'text-yellow-700' : ''}
                        ${s.status === 'pending' ? 'text-gray-400' : ''}
                      `}>
                        {s.label}
                      </span>

                      {/* Day badge */}
                      <span className="ml-auto text-[10px] text-gray-400 font-mono shrink-0">Day {s.day}</span>

                      {/* Blocker */}
                      {s.blocker && visible && (
                        <span className={`text-[10px] font-medium shrink-0 ml-1
                          ${s.status === 'blocked' ? 'text-red-500' : 'text-yellow-600'}
                        `}>
                          · {s.blocker}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment warning */}
            <div className="flex items-center gap-2.5 bg-orange-50 border border-orange-200 px-4 py-2.5 rounded-sm">
              <Clock size={13} className="text-orange-400 shrink-0" />
              <p className="text-xs text-orange-700">
                <span className="font-bold">Estimated completion:</span> 14–30 business days &nbsp;·&nbsp; Supplier may charge late fees after Day 21
              </p>
            </div>
          </div>

          {/* Right — Activity feed */}
          <div className="w-56 shrink-0 p-4 bg-gray-50 flex flex-col gap-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Activity Log</p>
            <div className="space-y-2.5 overflow-hidden">
              {ACTIVITY.slice(0, visibleActivity).map((a, i) => (
                <div
                  key={i}
                  className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-300"
                >
                  <div className="mt-0.5 shrink-0">
                    {a.icon === 'mail'  && <Mail size={11} className="text-blue-400" />}
                    {a.icon === 'reply' && <RotateCcw size={11} className="text-gray-400" />}
                    {a.icon === 'block' && <Ban size={11} className="text-red-400" />}
                  </div>
                  <div>
                    <p className="text-[10px] leading-snug text-gray-500">{a.text}</p>
                    <p className="text-[9px] text-gray-400 font-mono mt-0.5">Day {a.day}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Days lost counter */}
            <div className="mt-auto pt-3 border-t border-gray-200">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Time lost in approvals</p>
              <p className="text-2xl font-black text-red-400 tabular-nums font-mono">{day - 1}<span className="text-sm font-semibold"> days</span></p>
              <p className="text-[10px] text-gray-400 mt-0.5">and counting...</p>
            </div>
          </div>

        </div>

        {/* CTA footer */}
        <div className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 px-6 py-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-700">There's a better way.</p>
            <p className="text-[11px] text-gray-400">Instant payments, automated approvals, real-time compliance.</p>
          </div>
          <button
            onClick={onInstall}
            className={`shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold tracking-wide rounded-sm cursor-pointer transition-all
              ${pulse ? 'shadow-lg shadow-indigo-300 scale-[1.02]' : 'shadow-md shadow-indigo-200'}`}
          >
            Install GovPay SDK 🚀
          </button>
        </div>

      </div>
    </div>
  );
}
