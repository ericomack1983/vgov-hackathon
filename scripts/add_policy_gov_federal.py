#!/usr/bin/env python3
"""
add_policy_gov_federal.py
Injects P-GOV-FEDERAL into ChromaDB without touching existing policies.

Run from project root:
    source .venv-invoice-ai/bin/activate
    python3 scripts/add_policy_gov_federal.py
"""

import json
import httpx
import chromadb
from chromadb.config import Settings

CHROMA_PATH = "./chroma_db"
COLLECTION  = "ap_policies"
OLLAMA_URL  = "http://localhost:11434"
EMBED_MODEL = "nomic-embed-text"

POLICY = {
    "id": "P-GOV-FEDERAL",
    "title": "Federal government vendor — large contract approval",
    "category": "auto_approve",
    "threshold_usd": 500000,
    "content": (
        "Invoices from verified federal government contractors and solution providers "
        "are approved when the amount is under $500,000 USD and a valid purchase "
        "transaction reference is present. Vendor must appear on the approved federal "
        "contractor list with at least 1 prior paid transaction on record. "
        "No fraud signals, round-number anomalies, or unknown vendor flags may be active. "
        "Confidence must be medium or higher (>=60) to auto-approve. "
        "Assign budget code GOV-CONTRACT-FEDERAL. "
        "Applies to vendors such as Apex Federal Solutions and similar "
        "government-affiliated technology and solutions providers."
    ),
    "keywords": [
        "federal", "government", "apex", "federal solutions", "contractor",
        "purchase transaction", "government contract", "saas", "cloud",
        "solutions provider", "approved vendor", "large contract",
        "under 500000", "verified vendor"
    ],
}


def embed(text: str) -> list[float]:
    """Get vector embedding from Ollama."""
    try:
        r = httpx.post(
            f"{OLLAMA_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text},
            timeout=20.0,
        )
        r.raise_for_status()
        print("  [ok] Embedding generated from nomic-embed-text")
        return r.json()["embedding"]
    except Exception as e:
        print(f"  [warn] Embedding failed: {e}")
        print("  [warn] Policy will be stored with keyword-only retrieval")
        return []


def main():
    print("\n========================================")
    print("  Injecting P-GOV-FEDERAL into ChromaDB")
    print("========================================\n")

    # Connect to ChromaDB
    client = chromadb.PersistentClient(
        path=CHROMA_PATH,
        settings=Settings(anonymized_telemetry=False),
    )
    col = client.get_or_create_collection(
        name=COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )

    print(f"[1/4] Connected to ChromaDB")
    print(f"      Current policies in collection: {col.count()}")

    # Build document text (what gets embedded and searched)
    doc_text = (
        f"{POLICY['title']}. "
        f"{POLICY['content']} "
        f"Keywords: {', '.join(POLICY['keywords'])}"
    )

    print(f"\n[2/4] Generating embedding for policy text...")
    embedding = embed(doc_text)

    metadata = {
        "id":            POLICY["id"],
        "title":         POLICY["title"],
        "category":      POLICY["category"],
        "threshold_usd": POLICY["threshold_usd"],
        "keywords":      json.dumps(POLICY["keywords"]),
    }

    print(f"\n[3/4] Writing policy to ChromaDB...")

    # Check if policy already exists — update instead of duplicate
    existing = col.get(ids=[POLICY["id"]])
    if existing["ids"]:
        col.update(
            ids=[POLICY["id"]],
            documents=[doc_text],
            metadatas=[metadata],
            **({"embeddings": [embedding]} if embedding else {}),
        )
        print(f"      [updated] {POLICY['id']} — {POLICY['title']}")
    else:
        col.add(
            ids=[POLICY["id"]],
            documents=[doc_text],
            metadatas=[metadata],
            **({"embeddings": [embedding]} if embedding else {}),
        )
        print(f"      [added]   {POLICY['id']} — {POLICY['title']}")

    print(f"\n[4/4] Verifying...")
    print(f"      Total policies now: {col.count()}")

    # Confirm it's retrievable
    check = col.get(ids=[POLICY["id"]])
    if check["ids"]:
        print(f"      [ok] P-GOV-FEDERAL is in ChromaDB and retrievable")
    else:
        print(f"      [error] Policy was not found after insertion!")
        return

    print("\n========================================")
    print("  Done! Next steps:")
    print("  1. Restart RAG service:")
    print("     cd scripts && python3 rag_service.py")
    print("  2. Test with the Apex Federal invoice:")
    print("     See test JSON in step 3 of the guide")
    print("========================================\n")


if __name__ == "__main__":
    main()
