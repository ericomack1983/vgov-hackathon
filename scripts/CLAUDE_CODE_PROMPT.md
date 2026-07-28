# ============================================================
# CLAUDE CODE PROMPT
# Invoice LLM Integration for Procurement System
# ============================================================
# HOW TO USE:
#   1. Open your terminal in the project root
#   2. Run: claude
#   3. Paste this entire prompt and press Enter
#   4. Claude Code will read your codebase and implement everything
# ============================================================

You are working inside an existing Next.js procurement system.
Your job is to connect it to a local Invoice AI service (RAG + DeepSeek-R1
running on http://localhost:8001) that auto-approves supplier invoices.

DO NOT break any existing functionality.
DO NOT modify any existing pages, routes, or components.
Only ADD new files and APPEND to existing ones where strictly necessary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 1 — READ THE CODEBASE FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before writing any code:
1. Read the directory structure
2. Find the email/notification inbox component
3. Find the existing API routes
4. Find the .env.local file (or .env)
5. Check package.json for the current scripts and dependencies
6. Understand the existing state management pattern (useState, Redux, Zustand, etc.)

Tell me what you found before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 2 — CREATE THE CONNECTION SERVICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create the file: src/lib/invoiceAI/connection.ts

This file must:

A) Export a typed client that connects to the RAG service at
   process.env.RAG_SERVICE_URL (default: http://localhost:8001)

B) Implement these exact failure scenarios with clear error messages:

   CONNECTION ERRORS:
   - RAG service is offline (port 8001 not responding)
     → message: "Invoice AI service is offline. Start it with: cd scripts && python3 rag_service.py"

   - Ollama is offline (DeepSeek model not running)
     → message: "DeepSeek model is not running. Start Ollama with: ollama serve"

   - ChromaDB has no policies loaded
     → message: "Policy database is empty. Run: python3 scripts/seed_chroma.py"

   - Request timeout (model taking too long)
     → message: "DeepSeek is thinking... analysis timed out after 90s. Try again."

   - Invalid response from LLM (parse failure)
     → message: "AI returned an unexpected response. Invoice routed to manual review."

   BUSINESS LOGIC ERRORS:
   - Prompt injection detected in invoice
     → message: "Invoice blocked: suspicious content detected. Flagged for security review."

   - Confidence too low (< 50%)
     → message: "AI confidence too low to decide automatically. Routed to manual review."

C) Export these TypeScript types:
   - InvoiceDecision (decision, confidence, vendor, amount, reasoning, etc.)
   - ConnectionStatus (connected | offline | degraded)
   - AIError (code, message, recoverable: boolean)

D) Export a checkHealth() function that returns:
   {
     ragService: "ok" | "offline",
     ollama: "ok" | "offline",
     chromadb: "ok" | "empty",
     model: string,
     ready: boolean,
     message: string   ← human-readable status for the UI
   }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 3 — CREATE THE API ROUTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create the file: src/app/api/invoice/analyze/route.ts
(if it already exists, check if it needs updating — do not overwrite)

This route must:
- Accept POST with { email_body, email_id, vendor_email }
- Forward the request to the RAG service at http://localhost:8001/analyze
- Handle ALL failure cases from Task 2 and return structured error responses
- Never return a 500 with a raw stack trace — always return a clean JSON error
- Return 200 even for business logic failures (parse error, low confidence)
  so the UI can display a meaningful message instead of crashing
- Add a timeout of 95 seconds (slightly longer than the LLM timeout)

Also create: src/app/api/invoice/health/route.ts
- GET endpoint that calls checkHealth() from the connection service
- Used by the UI to show the "AI engine active/offline" indicator
- Returns connection status every time the inbox loads

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 4 — CREATE THE REACT HOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create the file: src/hooks/useInvoiceAI.ts

This hook must:
- Call /api/invoice/analyze when given an email body
- Track these states: idle | checking | analyzing | done | error | blocked
- Expose the pipeline steps visually:
    step 1: "Checking AI connection..."
    step 2: "Retrieving matching policies..."
    step 3: "DeepSeek is analyzing the invoice..."
    step 4: "Validating decision..."
    step 5: "Done"
- On ANY error, set a human-readable errorMessage string (never raw errors)
- Expose: analyze(), reset(), result, step, errorMessage, isLoading, isError
- Call /api/invoice/health on mount to check if the service is up
- If health check fails, set errorMessage immediately without waiting
  for the user to try analyzing:
  "Invoice AI is offline. Contact your system administrator."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 5 — CREATE THE UI PANEL COMPONENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create the file: src/components/invoice/InvoiceAIPanel.tsx

This component must:
- Use the existing design system / styling already in the project
  (detect whether it uses Tailwind, CSS modules, styled-components, etc.
   and match that pattern exactly)
- Show a clear status indicator:
    Green dot  = AI online and ready
    Yellow dot = AI degraded (connected but slow)
    Red dot    = AI offline
- When offline, show a banner:
    ┌─────────────────────────────────────────────────────┐
    │ ⚠ Invoice AI is offline                             │
    │ Start the service: cd scripts && python3            │
    │ rag_service.py                                      │
    │                              [ Retry connection ]   │
    └─────────────────────────────────────────────────────┘
- When analyzing, show a progress indicator with the current step label
- When done, show:
    - Extracted fields (vendor, amount, category, PO reference)
    - Matched policy IDs from ChromaDB
    - LLM reasoning text
    - Decision badge (approved / rejected / review required)
    - Confidence bar
    - Override and Commit buttons
- When errored, show a clear error card with:
    - The human-readable error message
    - Whether it is recoverable (show retry button) or not (show escalate button)
    - Never show raw error objects or stack traces to the user

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 6 — WIRE IT INTO THE EXISTING EMAIL DETAIL VIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Find the existing email/notification detail component.
Add <InvoiceAIPanel> below the existing email body content.

Rules:
- Do NOT restructure the existing component
- Do NOT change existing props or state
- Only add the import and the component tag at the bottom
- Wrap it in a try/catch error boundary so if the AI panel crashes,
  the existing email view still works perfectly
- If you cannot safely identify where to add it, create a clear
  comment block instead:

  // TODO: Add <InvoiceAIPanel> here
  // Import: import { InvoiceAIPanel } from "@/components/invoice/InvoiceAIPanel"
  // Usage:  <InvoiceAIPanel emailId={email.id} emailBody={email.body} from={email.from} />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 7 — ADD ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check if .env.local exists. If it does, APPEND these lines (do not replace):

# Invoice AI — added by Claude Code
RAG_SERVICE_URL=http://localhost:8001
NEXT_PUBLIC_INVOICE_AI_ENABLED=true

If .env.local does not exist, create it with only those two lines.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 8 — VERIFY NOTHING IS BROKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After all changes:
1. Run: npm run build
2. If there are TypeScript errors, fix them
3. If there are import errors, fix them
4. Do NOT change any pre-existing files to fix errors —
   only fix errors in the NEW files you created
5. Report a summary of exactly what was created/modified:
   - Files created: [list]
   - Files modified: [list]
   - Files read but not changed: [list]
   - Anything you could not do safely: [list with explanation]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ERROR HANDLING REFERENCE — implement ALL of these
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every error must have:
  code:        machine-readable string  (e.g. "RAG_OFFLINE")
  message:     human-readable string    (e.g. "Invoice AI is offline...")
  recoverable: boolean                  (true = show Retry, false = show Escalate)
  action:      what the user should do  (e.g. "Start the RAG service")

Full error code table:

  RAG_OFFLINE          → RAG service not reachable on port 8001          recoverable: true
  OLLAMA_OFFLINE       → Ollama not running on port 11434                recoverable: true
  CHROMA_EMPTY         → ChromaDB has 0 policy documents                 recoverable: true
  MODEL_NOT_FOUND      → DeepSeek model not pulled yet                   recoverable: true
  LLM_TIMEOUT          → Model took longer than 90s to respond           recoverable: true
  PARSE_FAILURE        → LLM returned invalid JSON                       recoverable: false
  PROMPT_INJECTION     → Guardrail blocked the invoice content           recoverable: false
  LOW_CONFIDENCE       → Confidence score below 50%                      recoverable: false
  NETWORK_ERROR        → General network/fetch failure                   recoverable: true
  UNKNOWN_ERROR        → Catch-all for unexpected errors                 recoverable: false

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSTRAINTS — read these carefully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Match the existing code style exactly (spacing, quotes, semicolons)
2. Match the existing import style (named vs default, path aliases)
3. Use TypeScript throughout — no "any" types
4. Do not install new npm packages unless absolutely necessary
   If you must install something, ask first and explain why
5. The existing procurement system must still work perfectly
   if the Invoice AI service is offline — graceful degradation only
6. Never expose internal service URLs, stack traces, or Python
   error messages directly in the UI
7. All user-facing error messages must be in plain English,
   actionable, and friendly — not technical jargon
