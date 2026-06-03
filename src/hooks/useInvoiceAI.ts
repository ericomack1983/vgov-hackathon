'use client';

import { useState, useCallback, useEffect } from 'react';
import type { InvoiceDecision, HealthStatus } from '@/lib/invoiceAI/connection';

// ── Exported types (also consumed by scripts/InvoiceAIPanel.tsx reference) ──

export type Decision = 'approved' | 'rejected' | 'review_required';

export interface GuardrailFlag {
  code: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

export interface PolicyMatch {
  id: string;
  title: string;
  score: number;
  category: string;
}

interface RAGDecision {
  decision: Decision;
  vendor: string;
  amount: number;
  currency: string;
  category: string;
  invoice_number?: string;
  po_reference?: string;
  suggested_budget_code?: string;
  confidence: number;
  reasoning: string;
}

interface RAGResult {
  decision: RAGDecision;
  guardrail_flags: GuardrailFlag[];
  matched_policies: PolicyMatch[];
  llm_model: string;
}

/** Shape used by the scripts/InvoiceAIPanel.tsx reference implementation */
export interface UseInvoiceAIReturn {
  step: string;
  result: RAGResult | null;
  localDecision: Decision | null;
  committed: boolean;
  error: string | null;
  durationMs: number;
  analyze(emailBody: string, emailId: string, from?: string): void;
  overrideDecision(decision: Decision): void;
  commit(emailId: string, decision: Decision): void;
}

/** Pipeline step names (array for .indexOf / .map compatibility) */
export const PIPELINE_STEPS = [
  'idle',
  'checking',
  'retrieving',
  'analyzing',
  'validating',
  'done',
  'error',
  'blocked',
] as const;

/** Human-readable labels for each pipeline step */
export const STEP_LABELS: Record<string, string> = {
  idle:       '',
  checking:   'Checking AI connection…',
  retrieving: 'Retrieving matching policies…',
  analyzing:  'DeepSeek is analyzing the invoice…',
  validating: 'Validating decision…',
  done:       'Done',
  error:      'Analysis failed',
  blocked:    'Request blocked — suspicious content detected',
};

// ── Internal hook types ────────────────────────────────────────────────────

export type AnalysisState = 'idle' | 'checking' | 'analyzing' | 'done' | 'error' | 'blocked';

interface AnalyzeParams {
  emailBody: string;
  emailId: string;
  vendorEmail: string;
}

interface HookReturn {
  analyze: (params: AnalyzeParams) => Promise<void>;
  reset: () => void;
  result: InvoiceDecision | null;
  stepName: string;
  stepLabel: string;
  status: AnalysisState;
  errorMessage: string | null;
  isLoading: boolean;
  isError: boolean;
  health: HealthStatus | null;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useInvoiceAI(): HookReturn {
  const [status, setStatus] = useState<AnalysisState>('idle');
  const [stepName, setStepName] = useState<string>('idle');
  const [result, setResult] = useState<InvoiceDecision | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  // ── Health check on mount ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const res = await fetch('/api/invoice/health');
        if (!res.ok) throw new Error('health check failed');
        const data = (await res.json()) as HealthStatus;
        if (cancelled) return;
        setHealth(data);
        if (!data.ready) {
          setErrorMessage('Invoice AI is offline. Contact your system administrator.');
        }
      } catch {
        if (cancelled) return;
        setHealth({
          ragService: 'offline',
          ollama: 'offline',
          chromadb: 'ok',
          model: 'unknown',
          ready: false,
          message: 'Invoice AI is offline. Contact your system administrator.',
        });
        setErrorMessage('Invoice AI is offline. Contact your system administrator.');
      }
    }

    void checkHealth();
    return () => { cancelled = true; };
  }, []);

  // ── Analyze ────────────────────────────────────────────────────────────
  const analyze = useCallback(async ({ emailBody, emailId, vendorEmail }: AnalyzeParams) => {
    setResult(null);
    setErrorMessage(null);
    setStepName('checking');
    setStatus('checking');

    try {
      await delay(300);
      setStepName('retrieving');
      await delay(400);

      setStepName('analyzing');
      setStatus('analyzing');

      const res = await fetch('/api/invoice/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_body: emailBody, email_id: emailId, vendor_email: vendorEmail }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        decision?: InvoiceDecision;
        error?: { code: string; message: string; recoverable: boolean };
      };

      setStepName('validating');
      await delay(200);

      if (!data.ok || !data.decision) {
        const msg = data.error?.message ?? 'An unexpected error occurred.';
        const isBlocked = data.error?.code === 'PROMPT_INJECTION';
        setErrorMessage(msg);
        setStepName(isBlocked ? 'blocked' : 'error');
        setStatus(isBlocked ? 'blocked' : 'error');
        return;
      }

      setStepName('done');
      setStatus('done');
      setResult(data.decision);
    } catch {
      setErrorMessage('Failed to reach the Invoice AI service. Please try again.');
      setStepName('error');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setStepName('idle');
    setResult(null);
    setErrorMessage(null);
  }, []);

  return {
    analyze,
    reset,
    result,
    stepName,
    stepLabel: STEP_LABELS[stepName] ?? '',
    status,
    errorMessage,
    isLoading: status === 'checking' || status === 'analyzing',
    isError: status === 'error' || status === 'blocked',
    health,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
