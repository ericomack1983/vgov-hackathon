import { NextRequest, NextResponse } from 'next/server';
import { analyzeInvoice, AI_ERRORS, type AIError } from '@/lib/invoiceAI/connection';

const ROUTE_TIMEOUT_MS = 185_000;

function errorResponse(err: AIError, status = 200): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        recoverable: err.recoverable,
        action: err.action,
      },
    },
    { status },
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body', recoverable: false, action: 'Check the request body' } },
      { status: 400 },
    );
  }

  const { email_body, email_id, vendor_email } = (body ?? {}) as Record<string, unknown>;

  if (typeof email_body !== 'string' || !email_body.trim()) {
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'Missing required field: email_body', recoverable: false, action: 'Provide the invoice email body' } },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);

  try {
    const decision = await analyzeInvoice(
      email_body,
      typeof email_id === 'string' ? email_id : '',
      typeof vendor_email === 'string' ? vendor_email : '',
    );
    clearTimeout(timer);
    return NextResponse.json({ ok: true, decision }, { status: 200 });
  } catch (err) {
    clearTimeout(timer);

    // Named AI errors thrown by connection.ts
    if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
      return errorResponse(err as AIError);
    }

    // Abort from the route-level timeout
    if (err instanceof Error && err.name === 'AbortError') {
      return errorResponse(AI_ERRORS.LLM_TIMEOUT);
    }

    return errorResponse(AI_ERRORS.UNKNOWN_ERROR);
  }
}
