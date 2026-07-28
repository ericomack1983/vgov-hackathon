"use client";
/**
 * useInvoiceAI — React hook
 *
 * Connects your existing EmailDetailView to the full RAG pipeline.
 * Tracks pipeline step status, guardrail flags, matched policies,
 * and the final LLM decision — all in one hook.
 *
 * DROP-IN USAGE (no other changes to your component):
 *
 *   import { useInvoiceAI } from "@/hooks/useInvoiceAI";
 *
 *   function EmailDetailView({ email }) {
 *     const ai = useInvoiceAI();
 *     useEffect(() => {
 *       ai.analyze(email.body, email.id, email.from);
 *     }, [email.id]);
 *     return (
 *       <>
 *         <YourExistingEmailUI email={email} />
 *         <InvoiceAIPanel ai={ai} emailId={email.id} />
 *       </>
 *     );
 *   }
 */

import { useState, useCallback, useRef } from "react";

// ── Types (mirror the Python Pydantic models) ────────────────────────────────

export type Decision = "approved" | "rejected" | "review_required";

export interface PolicyMatch {
  id:            string;
  title:         string;
  category:      string;
  threshold_usd: number;
  content:       string;
  score:         number;
}

export interface GuardrailFlag {
  code:     string;
  message:  string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface InvoiceDecision {
  decision:              Decision;
  confidence:            number;
  vendor:                string;
  amount:                string;
  currency:              string;
  invoice_number:        string | null;
  po_reference:          string | null;
  category:              string;
  matched_policies:      string[];
  reasoning:             string;
  risk_flags:            string[];
  suggested_budget_code: string | null;
}

export interface AnalyzeResponse {
  success:          boolean;
  decision:         InvoiceDecision | null;
  matched_policies: PolicyMatch[];
  guardrail_flags:  GuardrailFlag[];
  llm_model:        string;
  duration_ms:      number;
  error?:           string;
}

export type PipelineStep =
  | "idle"
  | "guardrail_check"
  | "rag_retrieval"
  | "llm_inference"
  | "validating"
  | "done"
  | "error"
  | "blocked";

export const PIPELINE_STEPS: PipelineStep[] = [
  "guardrail_check",
  "rag_retrieval",
  "llm_inference",
  "validating",
  "done",
];

export const STEP_LABELS: Record<PipelineStep, string> = {
  idle:           "Waiting…",
  guardrail_check:"Guardrail check",
  rag_retrieval:  "RAG policy retrieval",
  llm_inference:  "DeepSeek inference",
  validating:     "Validating decision",
  done:           "Analysis complete",
  error:          "Error",
  blocked:        "Blocked by guardrail",
};

const STEP_DURATIONS_MS: Partial<Record<PipelineStep, number>> = {
  guardrail_check: 280,
  rag_retrieval:   420,
  validating:      300,
};

export interface UseInvoiceAIReturn {
  analyze:         (emailBody: string, emailId?: string, vendorEmail?: string) => Promise<void>;
  commit:          (emailId: string, decision: Decision) => void;
  overrideDecision:(decision: Decision) => void;
  reset:           () => void;

  step:            PipelineStep;
  result:          AnalyzeResponse | null;
  localDecision:   Decision | null;
  committed:       boolean;
  error:           string | null;
  durationMs:      number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useInvoiceAI(): UseInvoiceAIReturn {
  const [step, setStep]                   = useState<PipelineStep>("idle");
  const [result, setResult]               = useState<AnalyzeResponse | null>(null);
  const [localDecision, setLocalDecision] = useState<Decision | null>(null);
  const [committed, setCommitted]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [durationMs, setDurationMs]       = useState(0);
  const abortRef                          = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStep("idle");
    setResult(null);
    setLocalDecision(null);
    setCommitted(false);
    setError(null);
    setDurationMs(0);
  }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const analyze = useCallback(
    async (emailBody: string, emailId?: string, vendorEmail?: string) => {
      reset();
      abortRef.current = new AbortController();

      // Animate through pre-API steps
      for (const s of ["guardrail_check", "rag_retrieval"] as PipelineStep[]) {
        setStep(s);
        await sleep(STEP_DURATIONS_MS[s] ?? 300);
      }

      setStep("llm_inference");

      try {
        const res = await fetch("/api/invoice/analyze", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email_body: emailBody, email_id: emailId, vendor_email: vendorEmail }),
          signal:  abortRef.current.signal,
        });

        setStep("validating");
        await sleep(STEP_DURATIONS_MS.validating ?? 300);

        const data: AnalyzeResponse = await res.json();
        setDurationMs(data.duration_ms ?? 0);

        if (!data.success) {
          // Check if blocked by guardrail
          if (data.error?.includes("PROMPT_INJECTION")) {
            setStep("blocked");
          } else {
            setStep("error");
            setError(data.error ?? "Analysis failed");
          }
          setResult(data);
          return;
        }

        setResult(data);
        setStep("done");
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") return;
        setStep("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [reset]
  );

  const overrideDecision = useCallback((decision: Decision) => {
    setLocalDecision(decision);
    // Post override to audit log (fire and forget)
    if (result?.decision) {
      fetch("/api/invoice/override", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ humanDecision: decision }),
      }).catch(() => {});
    }
  }, [result]);

  const commit = useCallback((emailId: string, decision: Decision) => {
    setCommitted(true);
    // Record in audit log
    fetch("/api/invoice/override", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ emailId, humanDecision: decision, committed: true }),
    }).catch(() => {});
  }, []);

  return {
    analyze, commit, overrideDecision, reset,
    step, result, localDecision, committed, error, durationMs,
  };
}
