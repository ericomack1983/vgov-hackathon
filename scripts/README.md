# Invoice AI — Procurement System Add-on
## DeepSeek-R1 + ChromaDB RAG + Guardrails

A **fully isolated** AI module that adds invoice auto-approval to your
existing Next.js procurement system. Nothing in your current codebase
is modified — the AI runs as a separate Python sidecar service.

---

## Architecture

```
Your Existing Procurement System (Next.js)
│
│  EmailDetailView.tsx          ← unchanged
│    └── <InvoiceAIPanel />     ← NEW: add this one component
│
│  /api/invoice/analyze         ← NEW: one API route (proxy)
│
└──── HTTP ──────────────────────────────────────────────────┐
                                                             │
     Python RAG Service  (rag_service.py, port 8001)        │
     ┌─────────────────────────────────────────────┐        │
     │  1. Guardrail check (pre-LLM)               │◄───────┘
     │  2. ChromaDB query (top-K policy retrieval) │
     │  3. Prompt assembly (system + policies)     │
     │  4. DeepSeek-R1 via Ollama                  │
     │  5. Response parse + post-LLM guardrail     │
     │  6. Audit log (audit.jsonl)                 │
     └─────────────────────────────────────────────┘
              │                    │
         ChromaDB              Ollama
         (chroma_db/)      (deepseek-r1:8b)
         12 AP policies    Local inference
```

---

## File structure (new files only)

```
procurement-ai/
├── scripts/
│   ├── install.sh          ← one-command installer
│   ├── seed_chroma.py      ← embed policies into ChromaDB
│   └── rag_service.py      ← FastAPI RAG + inference service
├── src/
│   ├── app/api/invoice/
│   │   └── analyze/route.ts    ← Next.js proxy route (only new route)
│   ├── hooks/
│   │   └── useInvoiceAI.ts     ← React hook for the UI
│   └── components/invoice/
│       └── InvoiceAIPanel.tsx  ← Drop-in UI component
├── config/
│   ├── master_prompt.py        ← canonical LLM prompt (reference)
│   └── package_additions.json  ← scripts to add to package.json
├── .env.local.additions        ← env vars to add to .env.local
└── README.md
```

---

## Quick start (5 steps)

### Step 1 — Run the installer

```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

This automatically:
- Installs Ollama (if missing)
- Pulls `deepseek-r1:8b` (~5GB, first run only)
- Pulls `nomic-embed-text` for embeddings
- Creates a Python virtualenv (`.venv-invoice-ai/`)
- Installs ChromaDB, FastAPI, uvicorn, PyMuPDF
- Seeds ChromaDB with 12 AP policy documents

### Step 2 — Add env vars

Append `.env.local.additions` to your existing `.env.local`:

```bash
cat .env.local.additions >> .env.local
```

### Step 3 — Add scripts to package.json

Copy the `scripts_to_add` block from `config/package_additions.json`
into your existing `package.json`:

```json
"rag:start": "python3 scripts/rag_service.py",
"dev:full":  "concurrently \"npm run dev\" \"npm run rag:start\""
```

```bash
npm install concurrently
```

### Step 4 — Add the component to your email detail view

```tsx
// In your existing EmailDetailView (or equivalent)
import { InvoiceAIPanel } from "@/components/invoice/InvoiceAIPanel";
import { useInvoiceAI } from "@/hooks/useInvoiceAI";

export function EmailDetailView({ email }) {
  const ai = useInvoiceAI();

  return (
    <div>
      {/* All your existing UI — completely unchanged */}
      <EmailHeader email={email} />
      <EmailBody email={email} />

      {/* Add this below your existing content */}
      <InvoiceAIPanel
        ai={ai}
        emailId={email.id}
        emailBody={email.body}
        from={email.from}
        onCommit={(decision) => {
          // Call your existing state update here
          // e.g. markEmailProcessed(email.id, decision)
        }}
      />
    </div>
  );
}
```

### Step 5 — Start everything

```bash
npm run dev:full
```

Verify the connection:
```bash
curl http://localhost:3000/api/invoice/analyze   # → 405 (correct, it's POST-only)
curl http://localhost:8001/health                 # → {"service":"ok","chroma":"ok (12 policies)",...}
```

---

## Predefined policies (12 total in ChromaDB)

| Policy ID           | Rule                                              | Threshold  |
|---------------------|---------------------------------------------------|------------|
| P-AUTO-RECURRING    | Known recurring vendors                           | < $500     |
| P-SAAS              | SaaS / cloud subscriptions                        | < $2,000   |
| P-MEALS             | Meals & entertainment                             | < $150     |
| P-HIGH-VALUE        | Large invoices → always escalate                  | > $5,000   |
| P-NEW-VENDOR        | First-time vendors → verify first                 | any        |
| P-SUPPLIES          | Office supplies tiered approval                   | < $500     |
| P-PO-REQUIRED       | PO reference mandatory above $500                 | > $500     |
| P-DUPLICATE         | Duplicate invoice detection                       | any        |
| P-CURRENCY          | Foreign currency → finance review                 | > $1,000   |
| P-TRAVEL            | Travel & accommodation                            | < $1,000   |
| P-LEGAL             | Legal / compliance services                       | any        |
| P-GUARDRAIL-FRAUD   | Fraud signal detection                            | any        |

To add or modify policies, edit `scripts/seed_chroma.py` and run:
```bash
npm run rag:reseed
```

---

## Guardrails (6 pre-LLM checks)

| Code                  | Trigger                                       | Action          |
|-----------------------|-----------------------------------------------|-----------------|
| PROMPT_INJECTION      | Jailbreak / instruction override in email     | Block entirely  |
| ROUND_AMOUNT_ANOMALY  | Suspiciously round dollar amounts             | Flag + escalate |
| MISSING_VENDOR_INFO   | No vendor identifiable                        | Review required |
| MISSING_AMOUNT        | No monetary amount found                      | Review required |
| EXCESSIVE_CONTENT     | Email body > 8,000 chars                      | Truncate + flag |

---

## Switching models

Edit `.env.local` (or `rag_service.py`):

```bash
# Faster, less RAM:
OLLAMA_MODEL=llama3.2:3b

# Higher accuracy:
OLLAMA_MODEL=deepseek-r1:14b

# Multilingual suppliers:
OLLAMA_MODEL=qwen2.5:7b
```

Then restart: `npm run rag:start`

---

## Building your fine-tuning dataset

Every AI decision is appended to `audit.jsonl` automatically.
After ~200 decisions (especially ones with human overrides), you have
a labeled training dataset ready for LoRA fine-tuning.

```bash
# View recent decisions
tail -20 audit.jsonl | python3 -m json.tool

# Count decisions by outcome
grep -o '"decision":"[^"]*"' audit.jsonl | sort | uniq -c
```

---

## What does NOT change in your system

- Your existing Next.js pages, routes, and components
- Your database schema and data models
- Your existing API routes
- Your email ingestion / inbox logic
- Your authentication and session handling
- Your procurement workflow (bids, POs, supplier management)

The AI module is additive-only. Removing it is as simple as
removing the one component and one API route.
