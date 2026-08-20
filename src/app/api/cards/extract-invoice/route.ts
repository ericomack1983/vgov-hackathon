/**
 * Invoice reader for the card issuance form.
 *
 * DEMO BEHAVIOUR: no model is called. The upload is accepted and validated like
 * a real endpoint — wrong file types and oversized files are rejected — then the
 * canned extraction for INV-RFP-001-2026 is returned after a short delay, so the
 * request has the shape and latency of a document-understanding call without
 * depending on a key or a network round trip to a provider.
 *
 * The fields live in src/lib/invoice/extractionFixture.ts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CLOUD_INVOICE_EXTRACTION, SIMULATED_READ_MS } from '@/lib/invoice/extractionFixture';

export const runtime = 'nodejs';

/** Matches what a browser will realistically hand us for a scanned invoice. */
const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let file: File | null = null;
  try {
    const form = await req.formData();
    const candidate = form.get('file');
    if (candidate instanceof File) file = candidate;
  } catch {
    return NextResponse.json({ ok: false, reason: 'Expected a multipart form upload' }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ ok: false, reason: 'No file received' }, { status: 400 });
  }
  if (file.type && file.type !== 'application/pdf') {
    return NextResponse.json({ ok: false, reason: 'Only PDF invoices are supported' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, reason: 'That PDF is empty' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, reason: `PDF is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 12 MB` },
      { status: 400 },
    );
  }

  // Stand-in for page rasterisation, OCR and field extraction.
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_READ_MS));

  return NextResponse.json({
    ok: true,
    fields: CLOUD_INVOICE_EXTRACTION,
    filename: file.name,
    pages: 1,
    engine: 'document-ai · invoice-v2',
  });
}
