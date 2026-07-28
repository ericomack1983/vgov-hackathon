#!/usr/bin/env python3
"""
add_policy_gov_micro.py
Adds the P-GOV-MICRO policy to your existing ChromaDB collection
without wiping the other 12 policies.

Run from project root:
    source .venv-invoice-ai/bin/activate
    python3 scripts/add_policy_gov_micro.py
"""

import httpx
import chromadb
from chromadb.config import Settings

CHROMA_PATH  = "./chroma_db"
COLLECTION   = "ap_policies"
OLLAMA_URL   = "http://localhost:11434"
EMBED_MODEL  = "nomic-embed-text"

NEW_POLICY = {
    "id": "P-GOV-MICRO",
    "title": "Government contractor micro-invoice review",
    "category": "require_review",
    "threshold_usd": 50,
    "content": (
        "Invoices from vendors with 'Federal', 'Government', 'Defense', or "
        "'Public Sector' in their name where the amount is under $50 USD "
        "and no PO reference or service description is present must be flagged "
        "as review_required. These invoices carry compliance and audit obligations "
        "regardless of the low amount. Required before approval: valid PO reference, "
        "contract or RFP number, SAM.gov vendor verification, and description of "
        "services. Assign budget code GOV-CONTRACT-MISC only after human review. "
        "Risk flags: GOVERNMENT_CONTRACTOR_UNVERIFIED, MISSING_CONTRACT_REFERENCE, "
        "INCOMPLETE_INVOICE, MICRO_AMOUNT_NEW_VENDOR."
    ),
    "keywords": [
        "federal", "government", "defense", "public sector", "contractor",
        "rfp", "contract", "sam.gov", "micro invoice", "nominal fee",
        "apex", "federal solutions", "compliance", "regulatory",
    ],
}


def embed(text: str) -> list[float]:
    try:
        r = httpx.post(
            f"{OLLAMA_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text},
            timeout=20.0,
        )
        r.raise_for_status()
        return r.json()["embedding"]
    except Exception as e:
        print(f"  [warn] Embedding failed: {e} — storing without vector")
        return []


def main():
    import json

    client = chromadb.PersistentClient(
        path=CHROMA_PATH,
        settings=Settings(anonymized_telemetry=False),
    )
    col = client.get_or_create_collection(
        name=COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )

    print(f"Current policy count: {col.count()}")

    doc_text = (
        f"{NEW_POLICY['title']}. {NEW_POLICY['content']} "
        f"Keywords: {', '.join(NEW_POLICY['keywords'])}"
    )
    embedding = embed(doc_text)
    metadata  = {
        "id":            NEW_POLICY["id"],
        "title":         NEW_POLICY["title"],
        "category":      NEW_POLICY["category"],
        "threshold_usd": NEW_POLICY["threshold_usd"],
        "keywords":      json.dumps(NEW_POLICY["keywords"]),
    }

    existing = col.get(ids=[NEW_POLICY["id"]])
    if existing["ids"]:
        col.update(
            ids=[NEW_POLICY["id"]],
            documents=[doc_text],
            metadatas=[metadata],
            **({"embeddings": [embedding]} if embedding else {}),
        )
        print(f"  [update] {NEW_POLICY['id']}: {NEW_POLICY['title']}")
    else:
        col.add(
            ids=[NEW_POLICY["id"]],
            documents=[doc_text],
            metadatas=[metadata],
            **({"embeddings": [embedding]} if embedding else {}),
        )
        print(f"  [add]    {NEW_POLICY['id']}: {NEW_POLICY['title']}")

    print(f"Policy count after update: {col.count()}")
    print("\nDone. Restart the RAG service to pick up the new policy:")
    print("  cd scripts && python3 rag_service.py")


if __name__ == "__main__":
    main()
