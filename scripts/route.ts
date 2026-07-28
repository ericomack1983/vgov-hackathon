/**
 * POST /api/invoice/analyze
 *
 * Thin Next.js proxy to the Python RAG service (FastAPI on port 8001).
 * Your existing procurement system only talks to this route —
 * it never calls Ollama or ChromaDB directly.
 *
 * Architecture:
 *   Browser → Next.js (this file) → Python RAG service → ChromaDB + DeepSeek
 *
 * This file is the ONLY change you make to your Next.js app.
 * Everything else (inbox UI, email list, routing) stays untouched.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const RAG_SERVICE_URL =
  process.env.RAG_SERVICE_URL ?? "http://localhost:8001";

// ── Request validation ────────────────────────────────────────────────────────
interface AnalyzeRequestBody {
  email_body: string;
  email_id?: string;
  vendor_email?: string;
}

function validateBody(body: unknown): AnalyzeRequestBody {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object");
  }
  const b = body as Record<string, unknown>;
  if (typeof b.email_body !== "string" || b.email_body.trim().length < 10) {
    throw new Error("email_body must be a non-empty string (min 10 chars)");
  }
  return {
    email_body:   b.email_body.trim().slice(0, 8000), // safety truncation
    email_id:     typeof b.email_id === "string" ? b.email_id : undefined,
    vendor_email: typeof b.vendor_email === "string" ? b.vendor_email : undefined,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const body = validateBody(rawBody);

    // Forward to Python RAG service
    const upstream = await fetch(`${RAG_SERVICE_URL}/analyze`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(95_000), // slightly longer than LLM timeout
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data.detail ?? "RAG service error" },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    const isTimeout = message.includes("timed out") || message.includes("abort");

    console.error("[/api/invoice/analyze]", message);

    return NextResponse.json(
      {
        error:   isTimeout ? "Analysis timed out — model may still be loading" : message,
        success: false,
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}

// ── Health proxy ──────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const r = await fetch(`${RAG_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { service: "error", error: "RAG service unreachable" },
      { status: 503 }
    );
  }
}
