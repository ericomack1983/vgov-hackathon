// ── Types ──────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connected' | 'offline' | 'degraded';

export interface AIError {
  code: string;
  message: string;
  recoverable: boolean;
  action: string;
}

export interface PolicyMatch {
  id: string;
  title: string;
  category: string;
  score: number; // 0–1 float from RAG
}

export interface InvoiceDecision {
  decision: 'approved' | 'rejected' | 'review_required';
  confidence: number;
  vendor: string;
  amount: number;
  currency?: string;
  category?: string;
  poReference?: string;
  invoiceNumber?: string;
  suggestedBudgetCode?: string;
  reasoning: string;
  matchedPolicies: PolicyMatch[];
  riskFlags: string[];
  llmModel?: string;
  durationMs?: number;
}

export interface HealthStatus {
  ragService: 'ok' | 'offline';
  ollama: 'ok' | 'offline';
  chromadb: 'ok' | 'empty';
  model: string;
  ready: boolean;
  message: string;
}

// ── Error catalogue ────────────────────────────────────────────────────────

export const AI_ERRORS: Record<string, AIError> = {
  RAG_OFFLINE: {
    code: 'RAG_OFFLINE',
    message: 'Invoice AI service is offline. Start it with: cd scripts && python3 rag_service.py',
    recoverable: true,
    action: 'Start the RAG service',
  },
  OLLAMA_OFFLINE: {
    code: 'OLLAMA_OFFLINE',
    message: 'DeepSeek model is not running. Start Ollama with: ollama serve',
    recoverable: true,
    action: 'Start Ollama',
  },
  CHROMA_EMPTY: {
    code: 'CHROMA_EMPTY',
    message: 'Policy database is empty. Run: python3 scripts/seed_chroma.py',
    recoverable: true,
    action: 'Seed the policy database',
  },
  MODEL_NOT_FOUND: {
    code: 'MODEL_NOT_FOUND',
    message: 'DeepSeek model is not pulled yet. Run: ollama pull deepseek-r1',
    recoverable: true,
    action: 'Pull the DeepSeek model',
  },
  LLM_TIMEOUT: {
    code: 'LLM_TIMEOUT',
    message: 'DeepSeek is thinking… analysis timed out after 90s. Try again.',
    recoverable: true,
    action: 'Retry the analysis',
  },
  PARSE_FAILURE: {
    code: 'PARSE_FAILURE',
    message: 'AI returned an unexpected response. Invoice routed to manual review.',
    recoverable: false,
    action: 'Route to manual review',
  },
  PROMPT_INJECTION: {
    code: 'PROMPT_INJECTION',
    message: 'Invoice blocked: suspicious content detected. Flagged for security review.',
    recoverable: false,
    action: 'Escalate to security team',
  },
  LOW_CONFIDENCE: {
    code: 'LOW_CONFIDENCE',
    message: 'AI confidence too low to decide automatically. Routed to manual review.',
    recoverable: false,
    action: 'Route to manual review',
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network error while contacting Invoice AI service. Please try again.',
    recoverable: true,
    action: 'Retry the request',
  },
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Invoice routed to manual review.',
    recoverable: false,
    action: 'Contact your system administrator',
  },
};

// ── Prompt-injection guard ─────────────────────────────────────────────────

const INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /disregard all prior/i,
  /you are now/i,
  /system prompt/i,
  /\bDAN\b/,
  /jailbreak/i,
  /act as (an? )?ai/i,
];

function detectPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

// ── RAG service client ─────────────────────────────────────────────────────

const RAG_TIMEOUT_MS = 180_000;

function getServiceUrl(): string {
  return process.env.RAG_SERVICE_URL ?? 'http://localhost:8001';
}

export async function analyzeInvoice(
  emailBody: string,
  emailId: string,
  vendorEmail: string,
): Promise<InvoiceDecision> {
  if (detectPromptInjection(emailBody)) {
    throw AI_ERRORS.PROMPT_INJECTION;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RAG_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${getServiceUrl()}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_body: emailBody, email_id: emailId, vendor_email: vendorEmail }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw AI_ERRORS.LLM_TIMEOUT;
    }
    // Connection refused → service offline
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw AI_ERRORS.RAG_OFFLINE;
    }
    throw AI_ERRORS.NETWORK_ERROR;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    if (response.status === 503 || text.includes('ollama')) {
      throw AI_ERRORS.OLLAMA_OFFLINE;
    }
    if (text.includes('chroma') || text.includes('no documents')) {
      throw AI_ERRORS.CHROMA_EMPTY;
    }
    throw AI_ERRORS.NETWORK_ERROR;
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw AI_ERRORS.PARSE_FAILURE;
  }

  const parsed = parseDecision(data);
  if (parsed.confidence < 0.5) {
    throw AI_ERRORS.LOW_CONFIDENCE;
  }
  return parsed;
}

function parseDecision(raw: unknown): InvoiceDecision {
  if (!raw || typeof raw !== 'object') throw AI_ERRORS.PARSE_FAILURE;

  const envelope = raw as Record<string, unknown>;

  // The RAG service wraps the decision in an AnalyzeResponse envelope:
  // { success, decision: { decision, confidence, ... }, matched_policies: [{id, title, score}] }
  // Support both the wrapped envelope and a flat InvoiceDecision.
  const isEnvelope =
    envelope['decision'] !== null &&
    typeof envelope['decision'] === 'object' &&
    !Array.isArray(envelope['decision']);

  const r = isEnvelope
    ? (envelope['decision'] as Record<string, unknown>)
    : envelope;

  const decision = r['decision'] as string | undefined;
  if (decision !== 'approved' && decision !== 'rejected' && decision !== 'review_required') {
    throw AI_ERRORS.PARSE_FAILURE;
  }

  const confidence = typeof r['confidence'] === 'number' ? r['confidence'] : 0;
  const vendor = typeof r['vendor'] === 'string' ? r['vendor'] : '';
  const amount = typeof r['amount'] === 'number' ? r['amount'] : 0;
  const reasoning = typeof r['reasoning'] === 'string' ? r['reasoning'] : '';

  // Top-level matched_policies in the envelope are PolicyMatch objects with title + score.
  // Fall back to the decision-level list (string IDs only) when no envelope.
  const rawPolicies = isEnvelope && Array.isArray(envelope['matched_policies'])
    ? envelope['matched_policies']
    : Array.isArray(r['matched_policies'])
      ? r['matched_policies']
      : [];

  const matchedPolicies: PolicyMatch[] = (rawPolicies as unknown[]).map((p) => {
    if (p !== null && typeof p === 'object') {
      const pm = p as Record<string, unknown>;
      return {
        id:       typeof pm['id']       === 'string' ? pm['id']       : '',
        title:    typeof pm['title']    === 'string' ? pm['title']    : '',
        category: typeof pm['category'] === 'string' ? pm['category'] : '',
        score:    typeof pm['score']    === 'number' ? pm['score']    : 0,
      };
    }
    // String fallback (flat policy ID list)
    return { id: String(p), title: String(p), category: '', score: 1 };
  });

  const riskFlags = Array.isArray(r['risk_flags'])
    ? (r['risk_flags'] as unknown[]).filter((f): f is string => typeof f === 'string')
    : Array.isArray(r['flags'])
      ? (r['flags'] as unknown[]).filter((f): f is string => typeof f === 'string')
      : [];

  return {
    decision,
    confidence,
    vendor,
    amount,
    currency: typeof r['currency'] === 'string' ? r['currency'] : undefined,
    category: typeof r['category'] === 'string' ? r['category'] : undefined,
    poReference: typeof r['po_reference'] === 'string' ? r['po_reference'] : undefined,
    invoiceNumber: typeof r['invoice_number'] === 'string' ? r['invoice_number'] : undefined,
    suggestedBudgetCode: typeof r['suggested_budget_code'] === 'string' ? r['suggested_budget_code'] : undefined,
    reasoning,
    matchedPolicies,
    riskFlags,
    llmModel: typeof (isEnvelope ? envelope : r)['llm_model'] === 'string'
      ? String((isEnvelope ? envelope : r)['llm_model'])
      : undefined,
    durationMs: typeof (isEnvelope ? envelope : r)['duration_ms'] === 'number'
      ? Number((isEnvelope ? envelope : r)['duration_ms'])
      : undefined,
  };
}

// ── Health check ───────────────────────────────────────────────────────────

export async function checkHealth(): Promise<HealthStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  let response: Response;
  try {
    response = await fetch(`${getServiceUrl()}/health`, {
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    return {
      ragService: 'offline',
      ollama: 'offline',
      chromadb: 'ok',
      model: 'unknown',
      ready: false,
      message: 'Invoice AI service is offline. Start it with: cd scripts && python3 rag_service.py',
    };
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    return {
      ragService: 'offline',
      ollama: 'offline',
      chromadb: 'ok',
      model: 'unknown',
      ready: false,
      message: 'Invoice AI service returned an error. Check the service logs.',
    };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return {
      ragService: 'offline',
      ollama: 'offline',
      chromadb: 'ok',
      model: 'unknown',
      ready: false,
      message: 'Invoice AI service returned an invalid response.',
    };
  }

  const d = (data ?? {}) as Record<string, unknown>;

  const ragService: 'ok' | 'offline' = d['rag_service'] === 'ok' ? 'ok' : 'offline';
  const ollama: 'ok' | 'offline' = d['ollama'] === 'ok' ? 'ok' : 'offline';
  const chromadb: 'ok' | 'empty' = d['chromadb'] === 'empty' ? 'empty' : 'ok';
  const model = typeof d['model'] === 'string' ? d['model'] : 'deepseek-r1';

  const ready = ragService === 'ok' && ollama === 'ok' && chromadb === 'ok';

  let message = 'Invoice AI is ready.';
  if (!ready) {
    if (ragService === 'offline') {
      message = 'Invoice AI service is offline. Start it with: cd scripts && python3 rag_service.py';
    } else if (ollama === 'offline') {
      message = 'DeepSeek model is not running. Start Ollama with: ollama serve';
    } else if (chromadb === 'empty') {
      message = 'Policy database is empty. Run: python3 scripts/seed_chroma.py';
    }
  }

  return { ragService, ollama, chromadb, model, ready, message };
}
