import { NextResponse } from 'next/server';
import { checkHealth } from '@/lib/invoiceAI/connection';

export async function GET(): Promise<NextResponse> {
  try {
    const status = await checkHealth();
    return NextResponse.json(status, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        ragService: 'offline',
        ollama: 'offline',
        chromadb: 'ok',
        model: 'unknown',
        ready: false,
        message: 'Invoice AI service is offline. Start it with: cd scripts && python3 rag_service.py',
      },
      { status: 200 },
    );
  }
}
