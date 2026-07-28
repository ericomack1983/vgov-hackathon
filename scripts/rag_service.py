#!/usr/bin/env python3
"""
rag_service.py  —  Invoice AI RAG microservice

Exposes a FastAPI HTTP server that your Next.js app calls.
Handles:
  - ChromaDB policy retrieval (vector similarity search)
  - Guardrail validation before and after LLM inference
  - DeepSeek-R1 inference via Ollama
  - Structured JSON response validation

Start: python3 scripts/rag_service.py
       (or: npm run rag:start)

Endpoints:
  POST /analyze          — full pipeline: retrieve → guardrail → LLM → validate
  GET  /health           — service + Ollama + ChromaDB status
  GET  /policies         — list all policy documents
  POST /policies/search  — manual policy search
"""

import json
import re
import sys
import time
import logging
from datetime import datetime
from typing import Optional

import httpx
import chromadb
from chromadb.config import Settings
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Config ────────────────────────────────────────────────────────────────────
CHROMA_PATH   = "../chroma_db"
COLLECTION    = "ap_policies"
OLLAMA_URL    = "http://localhost:11434"
LLM_MODEL     = "deepseek-r1:1.5b"
EMBED_MODEL   = "nomic-embed-text"
TOP_K_POLICIES = 5
LLM_TIMEOUT    = 180  # seconds

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("rag_service")

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="Invoice AI RAG Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ChromaDB client (lazy init) ───────────────────────────────────────────────
_chroma_client = None
_collection    = None

def get_collection():
    global _chroma_client, _collection
    if _collection is None:
        _chroma_client = chromadb.PersistentClient(
            path=CHROMA_PATH,
            settings=Settings(anonymized_telemetry=False),
        )
        _collection = _chroma_client.get_or_create_collection(
            name=COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection

# ── Pydantic models ───────────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    email_body:   str = Field(..., min_length=10)
    email_id:     Optional[str] = None
    vendor_email: Optional[str] = None

class PolicyMatch(BaseModel):
    id:            str
    title:         str
    category:      str
    threshold_usd: float
    content:       str
    score:         float

class GuardrailFlag(BaseModel):
    code:     str
    message:  str
    severity: str  # LOW | MEDIUM | HIGH

class InvoiceDecision(BaseModel):
    decision:             str   # approved | rejected | review_required
    confidence:           int
    vendor:               str
    amount:               str
    currency:             str
    invoice_number:       Optional[str]
    po_reference:         Optional[str]
    category:             str
    matched_policies:     list[str]
    reasoning:            str
    risk_flags:           list[str]
    suggested_budget_code: Optional[str]

class AnalyzeResponse(BaseModel):
    success:         bool
    decision:        Optional[InvoiceDecision]
    matched_policies: list[PolicyMatch]
    guardrail_flags: list[GuardrailFlag]
    llm_model:       str
    duration_ms:     int
    error:           Optional[str] = None

# ── Embedding ─────────────────────────────────────────────────────────────────
def embed_text(text: str) -> list[float]:
    try:
        r = httpx.post(
            f"{OLLAMA_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text},
            timeout=20.0,
        )
        r.raise_for_status()
        return r.json()["embedding"]
    except Exception as e:
        log.warning(f"Embedding failed: {e} — using keyword fallback")
        return []

# ── ChromaDB policy retrieval ─────────────────────────────────────────────────
def retrieve_policies(invoice_text: str, top_k: int = TOP_K_POLICIES) -> list[PolicyMatch]:
    col = get_collection()
    embedding = embed_text(invoice_text)

    # Always include guardrail and validation policies
    always_include = {"P-GUARDRAIL-FRAUD", "P-PO-REQUIRED", "P-DUPLICATE", "P-HIGH-VALUE"}

    results: list[PolicyMatch] = []

    if embedding:
        r = col.query(
            query_embeddings=[embedding],
            n_results=max(1, top_k),
            include=["documents", "metadatas", "distances"],
        )
        for doc, meta, dist in zip(
            r["documents"][0], r["metadatas"][0], r["distances"][0]
        ):
            results.append(PolicyMatch(
                id=meta["id"],
                title=meta["title"],
                category=meta["category"],
                threshold_usd=float(meta["threshold_usd"]),
                content=doc.split("Keywords:")[0].strip(),
                score=round(1 - dist, 4),
            ))
    else:
        # Keyword fallback when Ollama embeddings are unavailable
        lower = invoice_text.lower()
        all_docs = col.get(include=["documents", "metadatas"])
        for doc, meta in zip(all_docs["documents"], all_docs["metadatas"]):
            kws = json.loads(meta.get("keywords", "[]"))
            hits = sum(1 for k in kws if k in lower)
            if hits > 0 or meta["id"] in always_include:
                results.append(PolicyMatch(
                    id=meta["id"],
                    title=meta["title"],
                    category=meta["category"],
                    threshold_usd=float(meta["threshold_usd"]),
                    content=doc.split("Keywords:")[0].strip(),
                    score=round(hits / max(len(kws), 1), 4),
                ))
        results.sort(key=lambda x: x.score, reverse=True)
        results = results[:top_k]

    # Inject always-include policies if not already present
    existing_ids = {p.id for p in results}
    if len(results) < top_k:
        for pid in always_include - existing_ids:
            try:
                r = col.get(ids=[pid], include=["documents", "metadatas"])
                if r["documents"]:
                    meta = r["metadatas"][0]
                    results.append(PolicyMatch(
                        id=meta["id"],
                        title=meta["title"],
                        category=meta["category"],
                        threshold_usd=float(meta["threshold_usd"]),
                        content=r["documents"][0].split("Keywords:")[0].strip(),
                        score=1.0,
                    ))
            except Exception:
                pass

    return results

# ── Pre-LLM guardrails ────────────────────────────────────────────────────────
def run_guardrails(invoice_text: str) -> list[GuardrailFlag]:
    flags: list[GuardrailFlag] = []
    lower = invoice_text.lower()

    # G1: Prompt injection detection
    injection_patterns = [
        r"ignore (previous|above|prior|all) instructions",
        r"disregard (your|the) (system|prompt|instructions)",
        r"you are now",
        r"act as (?!an invoice)",
        r"jailbreak",
        r"forget everything",
        r"new instructions:",
    ]
    for pat in injection_patterns:
        if re.search(pat, lower):
            flags.append(GuardrailFlag(
                code="PROMPT_INJECTION",
                message="Possible prompt injection attempt detected in invoice content",
                severity="HIGH",
            ))
            break

    # G2: Suspiciously round amounts
    round_amounts = re.findall(r'\$\s*(\d+(?:,\d{3})*(?:\.00)?)\b', invoice_text)
    for amt in round_amounts:
        val = float(amt.replace(",", "").replace(".00", ""))
        if val in {1000, 2000, 5000, 10000, 25000, 50000, 100000} and val > 0:
            flags.append(GuardrailFlag(
                code="ROUND_AMOUNT_ANOMALY",
                message=f"Round-number amount ${amt} detected — verify with vendor",
                severity="LOW",
            ))
            break

    # G3: No vendor name
    vendor_signals = ["vendor:", "from:", "invoice from", "bill from", "seller:", "supplier:"]
    if not any(sig in lower for sig in vendor_signals) and len(invoice_text) > 50:
        flags.append(GuardrailFlag(
            code="MISSING_VENDOR_INFO",
            message="Could not identify a vendor name in the invoice content",
            severity="MEDIUM",
        ))

    # G4: No amount found
    if not re.search(r'\$[\d,]+\.?\d*|\d+\.?\d*\s*(usd|eur|gbp)', lower):
        flags.append(GuardrailFlag(
            code="MISSING_AMOUNT",
            message="No monetary amount detected in invoice — likely incomplete",
            severity="HIGH",
        ))

    # G5: Excessive length (possible document stuffing)
    if len(invoice_text) > 8000:
        flags.append(GuardrailFlag(
            code="EXCESSIVE_CONTENT",
            message="Invoice content is unusually long — truncated for safety",
            severity="LOW",
        ))

    return flags

# ── LLM inference ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT_TEMPLATE = """You are an AI accounts payable reconciliation engine integrated into a procurement system.
A supplier has submitted an invoice via email after winning a competitive bid.
Analyze the invoice and output a structured approval decision.

══════════════════════════════════════
RETRIEVED POLICY RULES (via RAG)
══════════════════════════════════════
{policy_block}

══════════════════════════════════════
DECISION RULES
══════════════════════════════════════
- "approved"         → invoice satisfies a policy, low risk, payment can proceed automatically
- "rejected"         → invoice violates a rule (missing PO, duplicate, wrong amount, fraud signal)
- "review_required"  → ambiguous, high-value, new vendor, guardrail triggered, or policy conflict

CONFIDENCE SCORING:
- 90-100: Policy match is unambiguous, all fields present and validated
- 70-89:  Good match with minor uncertainty (e.g. cannot verify vendor history)
- 50-69:  Multiple policies apply or data is incomplete
- Below 50: Significant uncertainty — always output "review_required"

══════════════════════════════════════
OUTPUT FORMAT — STRICTLY JSON ONLY
══════════════════════════════════════
Return ONLY a valid JSON object. No preamble, no explanation outside JSON, no markdown.

{{
  "decision":              "approved" | "rejected" | "review_required",
  "confidence":            <integer 0-100>,
  "vendor":                "<extracted vendor name>",
  "amount":                "<extracted amount, e.g. '$247.50'>",
  "currency":              "<ISO 4217 code>",
  "invoice_number":        "<invoice number or null>",
  "po_reference":          "<PO number or null>",
  "category":              "<spend category>",
  "matched_policies":      ["<policy id>", ...],
  "reasoning":             "<2-4 sentences, reference policy IDs, explain decision>",
  "risk_flags":            ["<concern>", ...],
  "suggested_budget_code": "<budget code or null>"
}}"""

def build_prompt(policies: list[PolicyMatch]) -> str:
    policy_lines = []
    for p in policies:
        policy_lines.append(
            f"[{p.id}] {p.title} (category: {p.category}, threshold: ${p.threshold_usd:,.0f})\n"
            f"  {p.content}"
        )
    policy_block = "\n\n".join(policy_lines)
    return SYSTEM_PROMPT_TEMPLATE.format(policy_block=policy_block)

def call_llm(system: str, user: str) -> str:
    r = httpx.post(
        f"{OLLAMA_URL}/v1/chat/completions",
        json={
            "model":       LLM_MODEL,
            "temperature": 0.1,
            "stream":      False,
            "format":      "json",
            "messages": [
                {"role": "system",  "content": system},
                {"role": "user",    "content": user},
            ],
        },
        timeout=LLM_TIMEOUT,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]

# ── Response parsing + post-LLM guardrail ────────────────────────────────────
VALID_DECISIONS = {"approved", "rejected", "review_required"}

def parse_and_validate(raw: str, guardrail_flags: list[GuardrailFlag]) -> InvoiceDecision:
    # Strip DeepSeek-R1 <think>...</think> chain-of-thought
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", raw, flags=re.IGNORECASE).strip()
    # Strip markdown fences
    cleaned = re.sub(r"```(?:json)?\s*", "", cleaned).replace("```", "").strip()
    # Extract first JSON object
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start != -1 and end > start:
        cleaned = cleaned[start:end + 1]

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return InvoiceDecision(
            decision="review_required", confidence=0,
            vendor="Unknown", amount="—", currency="USD",
            invoice_number=None, po_reference=None,
            category="Unclassified", matched_policies=[],
            reasoning="LLM response could not be parsed. Routed to manual review.",
            risk_flags=["parse_failure"], suggested_budget_code=None,
        )

    decision = data.get("decision", "review_required")
    if decision not in VALID_DECISIONS:
        decision = "review_required"

    # Post-LLM guardrail: escalate if high-severity flags exist
    high_flags = [f for f in guardrail_flags if f.severity == "HIGH"]
    if high_flags and decision == "approved":
        decision = "review_required"
        existing_flags = data.get("risk_flags", [])
        existing_flags.append("guardrail_escalation")
        data["risk_flags"] = existing_flags
        data["reasoning"] = (
            f"Decision escalated from 'approved' to 'review_required' by guardrail: "
            f"{high_flags[0].code}. " + data.get("reasoning", "")
        )

    confidence = max(0, min(100, int(data.get("confidence", 50))))

    return InvoiceDecision(
        decision=decision,
        confidence=confidence,
        vendor=str(data.get("vendor", "Unknown"))[:200],
        amount=str(data.get("amount", "—"))[:50],
        currency=str(data.get("currency", "USD"))[:3],
        invoice_number=str(data["invoice_number"])[:100] if data.get("invoice_number") else None,
        po_reference=str(data["po_reference"])[:100] if data.get("po_reference") else None,
        category=str(data.get("category", "Unclassified"))[:100],
        matched_policies=[str(p) for p in data.get("matched_policies", [])][:10],
        reasoning=str(data.get("reasoning", ""))[:1000],
        risk_flags=[str(f) for f in data.get("risk_flags", [])][:20],
        suggested_budget_code=str(data["suggested_budget_code"])[:50] if data.get("suggested_budget_code") else None,
    )

# ── Audit log ─────────────────────────────────────────────────────────────────
def audit_log(email_id: str, email_body: str, decision: InvoiceDecision,
               policies: list[PolicyMatch], flags: list[GuardrailFlag], duration_ms: int):
    record = {
        "ts":            datetime.utcnow().isoformat(),
        "email_id":      email_id,
        "decision":      decision.dict(),
        "matched_policy_ids": [p.id for p in policies],
        "guardrail_flags": [f.dict() for f in flags],
        "duration_ms":   duration_ms,
        # Store email body (truncated) for fine-tuning dataset
        "email_body_preview": email_body[:500],
    }
    with open("audit.jsonl", "a") as f:
        f.write(json.dumps(record) + "\n")

# ── API routes ────────────────────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    t0 = time.monotonic()
    guardrail_flags: list[GuardrailFlag] = []
    decision: Optional[InvoiceDecision] = None

    try:
        # 1. Pre-LLM guardrails
        guardrail_flags = run_guardrails(req.email_body)
        critical = [f for f in guardrail_flags if f.code == "PROMPT_INJECTION"]
        if critical:
            return AnalyzeResponse(
                success=False,
                decision=None,
                matched_policies=[],
                guardrail_flags=guardrail_flags,
                llm_model=LLM_MODEL,
                duration_ms=int((time.monotonic() - t0) * 1000),
                error="Request blocked by guardrail: PROMPT_INJECTION",
            )

        # 2. RAG retrieval from ChromaDB
        invoice_truncated = req.email_body[:4000]  # context window safety
        policies = retrieve_policies(invoice_truncated)
        log.info(f"Retrieved {len(policies)} policies for email_id={req.email_id}")

        # 3. Build prompt + call LLM
        system = build_prompt(policies)
        user   = f"Analyze this supplier invoice email:\n\n{invoice_truncated}"
        raw    = call_llm(system, user)

        # 4. Parse + post-LLM guardrail
        decision = parse_and_validate(raw, guardrail_flags)

        # 5. Audit
        audit_log(
            email_id=req.email_id or "unknown",
            email_body=req.email_body,
            decision=decision,
            policies=policies,
            flags=guardrail_flags,
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

        return AnalyzeResponse(
            success=True,
            decision=decision,
            matched_policies=policies,
            guardrail_flags=guardrail_flags,
            llm_model=LLM_MODEL,
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    except httpx.TimeoutException:
        return AnalyzeResponse(
            success=False, decision=None, matched_policies=[],
            guardrail_flags=guardrail_flags, llm_model=LLM_MODEL,
            duration_ms=int((time.monotonic() - t0) * 1000),
            error=f"LLM timed out after {LLM_TIMEOUT}s. Model may still be loading.",
        )
    except Exception as e:
        log.exception(f"Analyze failed: {e}")
        return AnalyzeResponse(
            success=False, decision=None, matched_policies=[],
            guardrail_flags=guardrail_flags, llm_model=LLM_MODEL,
            duration_ms=int((time.monotonic() - t0) * 1000),
            error=str(e),
        )


@app.get("/health")
async def health():
    status = {"service": "ok", "chroma": "unknown", "ollama": "unknown", "model": LLM_MODEL}
    try:
        col = get_collection()
        status["chroma"] = f"ok ({col.count()} policies)"
    except Exception as e:
        status["chroma"] = f"error: {e}"
    try:
        r = httpx.get(f"{OLLAMA_URL}/api/tags", timeout=3.0)
        models = [m["name"] for m in r.json().get("models", [])]
        status["ollama"] = "ok"
        status["available_models"] = models
        status["model_ready"] = any(LLM_MODEL.split(":")[0] in m for m in models)
    except Exception as e:
        status["ollama"] = f"error: {e}"
        status["model_ready"] = False
    return status


@app.get("/policies")
async def list_policies():
    col = get_collection()
    r = col.get(include=["documents", "metadatas"])
    return [
        {"id": m["id"], "title": m["title"], "category": m["category"]}
        for m in r["metadatas"]
    ]


@app.post("/policies/search")
async def search_policies(body: dict):
    query = body.get("query", "")
    if not query:
        raise HTTPException(400, "query is required")
    return retrieve_policies(query, top_k=body.get("top_k", 5))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("rag_service:app", host="0.0.0.0", port=8001, reload=False)
