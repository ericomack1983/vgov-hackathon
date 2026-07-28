#!/usr/bin/env python3
"""
seed_chroma.py
Embeds all AP policies into ChromaDB using Ollama's nomic-embed-text model.
Run once after installation, and again whenever policies are updated.

Usage:
    python3 scripts/seed_chroma.py
    python3 scripts/seed_chroma.py --reset   # wipe and re-seed
"""

import argparse
import json
import sys
import httpx
import chromadb
from chromadb.config import Settings

# ── Config ────────────────────────────────────────────────────────────────────
CHROMA_PATH   = "./chroma_db"
COLLECTION    = "ap_policies"
OLLAMA_URL    = "http://localhost:11434"
EMBED_MODEL   = "nomic-embed-text"

# ── Policy knowledge base ─────────────────────────────────────────────────────
# Each entry becomes a searchable document in ChromaDB.
# Add, edit, or remove policies here — then re-run this script.
POLICIES = [
    {
        "id": "P-AUTO-RECURRING",
        "title": "Recurring vendor auto-approval",
        "category": "auto_approve",
        "threshold_usd": 500,
        "content": (
            "Auto-approve recurring vendor invoices under $500 USD when the vendor "
            "has 3 or more successfully paid invoices on record in the last 12 months. "
            "Assign budget code OPS-RECURRING. Invoice must include a valid PO reference."
        ),
        "keywords": ["recurring", "monthly", "regular", "repeat", "subscription", "ongoing"],
    },
    {
        "id": "P-SAAS",
        "title": "SaaS and cloud software subscriptions",
        "category": "auto_approve",
        "threshold_usd": 2000,
        "content": (
            "SaaS, cloud infrastructure, and software license invoices under $2,000 per year "
            "are auto-approved. Annual and monthly billing both qualify. "
            "Assign budget code IT-SAAS. Common vendors: AWS, Azure, GCP, Zoom, Slack, "
            "Salesforce, GitHub, Notion, Figma, Adobe, Microsoft 365."
        ),
        "keywords": ["saas", "cloud", "software", "license", "aws", "azure", "gcp", "zoom",
                     "slack", "microsoft", "adobe", "github", "annual", "subscription"],
    },
    {
        "id": "P-MEALS",
        "title": "Meals and entertainment",
        "category": "conditional_approve",
        "threshold_usd": 150,
        "content": (
            "Meals and entertainment expenses are approved up to $150 per event. "
            "The invoice or expense report must include: number of attendees, business purpose, "
            "and date of event. Assign budget code T&E-MEALS. "
            "Invoices above $150 require manager approval before payment."
        ),
        "keywords": ["meal", "lunch", "dinner", "breakfast", "food", "restaurant",
                     "catering", "entertainment", "uber eats", "doordash", "team lunch"],
    },
    {
        "id": "P-HIGH-VALUE",
        "title": "High-value invoice threshold",
        "category": "require_approval",
        "threshold_usd": 5000,
        "content": (
            "Any invoice with a total amount exceeding $5,000 USD MUST be routed to the "
            "department head for manual approval regardless of vendor history, category, or "
            "contract status. Never auto-approve. Flag as REVIEW_REQUIRED with risk level HIGH."
        ),
        "keywords": ["large", "high value", "significant", "consulting", "strategy",
                     "advisory", "project", "milestone", "professional services"],
    },
    {
        "id": "P-NEW-VENDOR",
        "title": "First-time and unknown vendor verification",
        "category": "require_review",
        "threshold_usd": 0,
        "content": (
            "Any invoice from a vendor with fewer than 3 prior paid transactions in the system "
            "must be flagged for manual verification before payment. "
            "Check vendor registration, tax ID, and bank details. "
            "Flag as REVIEW_REQUIRED with risk level MEDIUM. Do not auto-approve."
        ),
        "keywords": ["new vendor", "first invoice", "unknown", "unregistered",
                     "no history", "never paid", "first time"],
    },
    {
        "id": "P-SUPPLIES",
        "title": "Office and facility supplies",
        "category": "conditional_approve",
        "threshold_usd": 500,
        "content": (
            "Office supply and facility maintenance purchases: "
            "Under $200 — auto-approve, budget code FAC-SUPPLIES. "
            "Between $200 and $500 — approve with manager notification. "
            "Above $500 — requires manager sign-off before payment. "
            "Common vendors: Office Depot, Staples, Amazon Business, Grainger."
        ),
        "keywords": ["office", "supplies", "paper", "pen", "printer", "stationery",
                     "facility", "maintenance", "cleaning", "staples", "depot"],
    },
    {
        "id": "P-PO-REQUIRED",
        "title": "Purchase order reference requirement",
        "category": "validation",
        "threshold_usd": 500,
        "content": (
            "All invoices with a total amount over $500 USD must reference a valid, "
            "open Purchase Order (PO) number from the procurement system. "
            "If no PO reference is present or the PO number does not match an open order, "
            "REJECT the invoice with reason: MISSING_PO_REFERENCE. "
            "The supplier must resubmit with a valid PO."
        ),
        "keywords": ["po", "purchase order", "reference number", "authorization",
                     "approved order", "procurement order"],
    },
    {
        "id": "P-DUPLICATE",
        "title": "Duplicate invoice detection",
        "category": "validation",
        "threshold_usd": 0,
        "content": (
            "Invoices must be checked for duplication before processing. "
            "A duplicate is defined as: same vendor name AND same invoice number OR "
            "(same vendor + same amount + same date ±3 days). "
            "Duplicate invoices must be REJECTED with reason: DUPLICATE_INVOICE. "
            "Flag for investigation if the original was already paid."
        ),
        "keywords": ["duplicate", "already paid", "resubmit", "same invoice",
                     "double payment", "re-invoice"],
    },
    {
        "id": "P-CURRENCY",
        "title": "Foreign currency invoices",
        "category": "conditional_approve",
        "threshold_usd": 1000,
        "content": (
            "Invoices in currencies other than USD must be converted using the "
            "exchange rate on the invoice date (use ECB or Fed reference rate). "
            "If the USD equivalent exceeds $1,000, route for finance team review. "
            "Always record both original currency amount and USD equivalent in the audit log."
        ),
        "keywords": ["eur", "gbp", "cad", "foreign currency", "exchange rate",
                     "international", "overseas", "fx"],
    },
    {
        "id": "P-TRAVEL",
        "title": "Travel and accommodation",
        "category": "conditional_approve",
        "threshold_usd": 1000,
        "content": (
            "Employee travel invoices (flights, hotels, ground transport) are approved "
            "up to $1,000 per trip when pre-approved via the travel request system. "
            "Assign budget code T&E-TRAVEL. Receipts required for all items over $25. "
            "Luxury or business class upgrades require VP approval. "
            "International travel always requires department head pre-approval."
        ),
        "keywords": ["travel", "flight", "hotel", "accommodation", "airfare",
                     "airline", "car rental", "transport", "uber", "taxi", "lodging"],
    },
    {
        "id": "P-LEGAL",
        "title": "Legal and compliance services",
        "category": "require_approval",
        "threshold_usd": 2500,
        "content": (
            "Legal, compliance, and regulatory service invoices above $2,500 require "
            "General Counsel and CFO approval. Below $2,500, department head approval is sufficient. "
            "Never auto-approve legal invoices regardless of amount. "
            "Assign budget code LEGAL-OPS."
        ),
        "keywords": ["legal", "law firm", "attorney", "compliance", "regulatory",
                     "contract review", "litigation", "counsel", "solicitor"],
    },
    {
        "id": "P-GUARDRAIL-FRAUD",
        "title": "Fraud and anomaly detection guardrail",
        "category": "guardrail",
        "threshold_usd": 0,
        "content": (
            "Flag any invoice exhibiting these anomaly signals for immediate manual review: "
            "(1) Round-number amounts ($1000, $5000, $10000) from unknown vendors. "
            "(2) Invoice date on a weekend or public holiday. "
            "(3) Bank account details different from previous payments to same vendor. "
            "(4) Email domain does not match known vendor domain. "
            "(5) Invoice number format inconsistent with prior invoices from same vendor. "
            "These are GUARDRAIL flags — do not reject outright, but always escalate."
        ),
        "keywords": ["fraud", "anomaly", "suspicious", "risk", "unusual",
                     "different bank", "changed account", "weekend"],
    },
]

# ── Embedding helper ──────────────────────────────────────────────────────────

def embed(text: str) -> list[float]:
    """Call Ollama to embed text using nomic-embed-text."""
    try:
        r = httpx.post(
            f"{OLLAMA_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text},
            timeout=30.0,
        )
        r.raise_for_status()
        return r.json()["embedding"]
    except Exception as e:
        print(f"  [warn] Ollama embedding failed: {e}")
        print(f"  [warn] Falling back to keyword-only retrieval (no embeddings stored)")
        return []


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Wipe and re-seed")
    args = parser.parse_args()

    print(f"\n[seed] Connecting to ChromaDB at {CHROMA_PATH}")
    client = chromadb.PersistentClient(
        path=CHROMA_PATH,
        settings=Settings(anonymized_telemetry=False),
    )

    if args.reset:
        try:
            client.delete_collection(COLLECTION)
            print("[seed] Existing collection deleted")
        except Exception:
            pass

    collection = client.get_or_create_collection(
        name=COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )

    existing_ids = set(collection.get()["ids"])
    added = 0
    updated = 0
    skipped = 0

    for policy in POLICIES:
        doc_text = f"{policy['title']}. {policy['content']} Keywords: {', '.join(policy['keywords'])}"
        embedding = embed(doc_text)
        metadata = {
            "id":            policy["id"],
            "title":         policy["title"],
            "category":      policy["category"],
            "threshold_usd": policy["threshold_usd"],
            "keywords":      json.dumps(policy["keywords"]),
        }

        if policy["id"] in existing_ids:
            if args.reset:
                pass  # already deleted whole collection
            collection.update(
                ids=[policy["id"]],
                documents=[doc_text],
                metadatas=[metadata],
                **({"embeddings": [embedding]} if embedding else {}),
            )
            updated += 1
            print(f"  [update] {policy['id']}: {policy['title']}")
        else:
            collection.add(
                ids=[policy["id"]],
                documents=[doc_text],
                metadatas=[metadata],
                **({"embeddings": [embedding]} if embedding else {}),
            )
            added += 1
            print(f"  [add]    {policy['id']}: {policy['title']}")

    total = collection.count()
    print(f"\n[seed] Done — {added} added, {updated} updated, {skipped} skipped")
    print(f"[seed] Collection '{COLLECTION}' now has {total} documents\n")


if __name__ == "__main__":
    main()
