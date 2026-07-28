"use client";
/**
 * InvoiceAIPanel — drop-in React component
 *
 * Renders the full AI analysis panel inside your existing email detail view.
 * Shows: pipeline progress, guardrail flags, matched policies, LLM reasoning,
 * confidence score, and decision with override + commit controls.
 *
 * Nothing in your existing system changes except adding this component
 * below your existing <EmailBody /> in EmailDetailView.
 */

import { useEffect } from "react";
import type { UseInvoiceAIReturn, Decision, GuardrailFlag, PolicyMatch } from "@/hooks/useInvoiceAI";
import { PIPELINE_STEPS, STEP_LABELS } from "@/hooks/useInvoiceAI";

interface Props {
  ai:        UseInvoiceAIReturn;
  emailId:   string;
  emailBody: string;
  from?:     string;
  onCommit?: (decision: Decision) => void;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PipelineTrack({ step }: { step: string }) {
  const idx = PIPELINE_STEPS.indexOf(step as any);
  return (
    <div style={{ display: "flex", gap: "3px", marginBottom: "12px" }}>
      {PIPELINE_STEPS.map((s, i) => (
        <div
          key={s}
          title={STEP_LABELS[s]}
          style={{
            flex: 1, height: "3px", borderRadius: "99px",
            background: i < idx ? "#639922" : i === idx ? "#378ADD" : "var(--color-border-tertiary)",
            transition: "background 0.4s",
          }}
        />
      ))}
    </div>
  );
}

function StepLabel({ step }: { step: string }) {
  const isRunning = !["idle", "done", "error", "blocked"].includes(step);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      {isRunning && (
        <span style={{
          width: "10px", height: "10px", borderRadius: "50%",
          border: "1.5px solid var(--color-border-secondary)",
          borderTopColor: "#378ADD",
          animation: "spin 0.7s linear infinite",
          display: "inline-block",
          flexShrink: 0,
        }} />
      )}
      <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
        {STEP_LABELS[step as keyof typeof STEP_LABELS] ?? step}
      </span>
    </div>
  );
}

function GuardrailBadge({ flag }: { flag: GuardrailFlag }) {
  const colors: Record<string, { bg: string; text: string }> = {
    HIGH:   { bg: "#FCEBEB", text: "#A32D2D" },
    MEDIUM: { bg: "#FAEEDA", text: "#854F0B" },
    LOW:    { bg: "#E6F1FB", text: "#185FA5" },
  };
  const c = colors[flag.severity] ?? colors.LOW;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "8px",
      padding: "6px 10px", borderRadius: "var(--border-radius-md)",
      background: c.bg, marginBottom: "4px",
    }}>
      <span style={{ fontSize: "11px", fontWeight: 500, color: c.text, flexShrink: 0 }}>
        {flag.severity}
      </span>
      <span style={{ fontSize: "12px", color: c.text, lineHeight: 1.5 }}>
        {flag.message}
      </span>
    </div>
  );
}

function PolicyTag({ policy }: { policy: PolicyMatch }) {
  const catColors: Record<string, string> = {
    auto_approve:      "#EAF3DE",
    conditional_approve: "#FAEEDA",
    require_approval:  "#FCEBEB",
    require_review:    "#FAEEDA",
    guardrail:         "#E6F1FB",
    validation:        "#F1EFE8",
  };
  return (
    <div style={{
      background: catColors[policy.category] ?? "var(--color-background-secondary)",
      borderRadius: "var(--border-radius-md)",
      padding: "5px 10px", fontSize: "11px",
      color: "var(--color-text-secondary)",
    }}>
      <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{policy.id}</span>
      {" · "}
      {policy.title}
      <span style={{ marginLeft: "6px", opacity: 0.6 }}>
        {Math.round(policy.score * 100)}%
      </span>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: Decision }) {
  const map: Record<Decision, { bg: string; color: string; label: string }> = {
    approved:        { bg: "#EAF3DE", color: "#3B6D11", label: "Auto-approved" },
    rejected:        { bg: "#FCEBEB", color: "#A32D2D", label: "Rejected" },
    review_required: { bg: "#FAEEDA", color: "#854F0B", label: "Review required" },
  };
  const s = map[decision];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "4px 12px", borderRadius: "99px",
      fontSize: "13px", fontWeight: 500,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function InvoiceAIPanel({ ai, emailId, emailBody, from, onCommit }: Props) {
  const { step, result, localDecision, committed, error, durationMs } = ai;

  // Auto-run analysis when component mounts / email changes
  useEffect(() => {
    if (emailBody && step === "idle") {
      ai.analyze(emailBody, emailId, from);
    }
  }, [emailId]); // eslint-disable-line

  if (step === "idle") return null;

  const dec  = result?.decision;
  const active: Decision = localDecision ?? dec?.decision ?? "review_required";
  const guardrails = result?.guardrail_flags ?? [];
  const policies   = result?.matched_policies ?? [];
  const hasHigh    = guardrails.some(f => f.severity === "HIGH");

  return (
    <div style={{
      borderTop: "0.5px solid var(--color-border-tertiary)",
      background: "var(--color-background-secondary)",
      padding: "14px 16px",
    }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: step === "done" ? "#639922" : step === "error" || step === "blocked" ? "#E24B4A" : "#378ADD",
          animation: !["done","error","blocked","idle"].includes(step) ? "pulse 2s infinite" : "none",
          flexShrink: 0,
        }} />
        <span style={{ fontSize: "12px", fontWeight: 500, color: "#185FA5" }}>
          AI invoice reconciliation · DeepSeek-R1 + ChromaDB
        </span>
        <span style={{ marginLeft: "auto" }}>
          <StepLabel step={step} />
        </span>
      </div>

      {/* ── Pipeline track ── */}
      <PipelineTrack step={step} />

      {/* ── Guardrail flags ── */}
      {guardrails.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>
            Guardrail checks
          </div>
          {guardrails.map(f => <GuardrailBadge key={f.code} flag={f} />)}
        </div>
      )}

      {/* ── Blocked state ── */}
      {step === "blocked" && (
        <div style={{ fontSize: "13px", color: "#A32D2D", padding: "10px", background: "#FCEBEB", borderRadius: "var(--border-radius-md)" }}>
          Request blocked: prompt injection detected in invoice content. Forwarding to security review.
        </div>
      )}

      {/* ── Error state ── */}
      {step === "error" && error && (
        <div style={{ fontSize: "12px", color: "var(--color-text-danger)", padding: "8px 10px", background: "var(--color-background-danger)", borderRadius: "var(--border-radius-md)", marginBottom: "10px" }}>
          {error}
        </div>
      )}

      {/* ── Extracted fields ── */}
      {dec && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "5px", marginBottom: "10px" }}>
          {[
            ["Vendor", dec.vendor],
            ["Amount", `${dec.amount} ${dec.currency}`],
            ["Category", dec.category],
            ["Invoice #", dec.invoice_number ?? "—"],
            ["PO ref", dec.po_reference ?? "—"],
            ["Budget code", dec.suggested_budget_code ?? "—"],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "6px 9px" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>{label}</div>
              <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Matched policies ── */}
      {policies.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>
            Matched policies from ChromaDB
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {policies.map(p => <PolicyTag key={p.id} policy={p} />)}
          </div>
        </div>
      )}

      {/* ── LLM reasoning ── */}
      {dec?.reasoning && (
        <div style={{ borderLeft: "2px solid #378ADD", borderRadius: "0 var(--border-radius-md) var(--border-radius-md) 0", padding: "8px 11px", fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.65, marginBottom: "12px", background: "var(--color-background-primary)" }}>
          {dec.reasoning}
          {durationMs > 0 && (
            <span style={{ display: "block", marginTop: "4px", fontSize: "10px", color: "var(--color-text-tertiary)" }}>
              {(durationMs / 1000).toFixed(1)}s · {result?.llm_model}
            </span>
          )}
        </div>
      )}

      {/* ── Decision row ── */}
      {dec && !committed && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <DecisionBadge decision={active} />

          {/* Confidence bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: "80px" }}>
            <div style={{ flex: 1, height: "4px", background: "var(--color-border-tertiary)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "99px",
                width: `${dec.confidence}%`,
                background: dec.confidence >= 75 ? "#639922" : dec.confidence >= 50 ? "#BA7517" : "#E24B4A",
                transition: "width 0.7s ease",
              }} />
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", minWidth: "28px" }}>
              {dec.confidence}%
            </span>
          </div>

          {/* Override */}
          {!hasHigh && (
            <button
              onClick={() => ai.overrideDecision(active === "approved" ? "review_required" : "approved")}
              style={{ padding: "5px 10px", fontSize: "12px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", cursor: "pointer" }}
            >
              {active === "approved" ? "Flag review" : "Override: approve"}
            </button>
          )}

          {/* Commit */}
          <button
            onClick={() => { ai.commit(emailId, active); onCommit?.(active); }}
            style={{ padding: "5px 10px", fontSize: "12px", borderRadius: "var(--border-radius-md)", border: "none", background: "var(--color-text-primary)", color: "var(--color-background-primary)", cursor: "pointer" }}
          >
            Commit →
          </button>
        </div>
      )}

      {/* ── Committed state ── */}
      {committed && (
        <div style={{ fontSize: "12px", color: "#3B6D11", fontWeight: 500 }}>
          Decision committed · audit log updated
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
      `}</style>
    </div>
  );
}
