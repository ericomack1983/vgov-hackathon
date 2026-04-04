/**
 * sdk-logger.ts
 *
 * Module-level singleton that records every @visa-gov/sdk call.
 * Runs client-side only — methods are no-ops during SSR.
 * React hook useSDKLogs() subscribes to live updates.
 */

import { v4 as uuid } from 'uuid';

export type SDKService = 'VCN' | 'VPA' | 'B2B-BIP' | 'B2B-SIP' | 'VPC' | 'IPC';

export type SDKLogStatus = 'success' | 'error';

export interface SDKLogEntry {
  id: string;
  timestamp: string;
  service: SDKService;
  method: string;
  endpoint: string;
  status: SDKLogStatus;
  durationMs: number;
  payload?: unknown;
  response?: unknown;
  error?: string;
}

type Listener = () => void;

const MAX_ENTRIES = 500;

class SDKLogger {
  private _logs: SDKLogEntry[] = [];
  private _listeners = new Set<Listener>();

  log(entry: Omit<SDKLogEntry, 'id' | 'timestamp'>): void {
    if (typeof window === 'undefined') return; // SSR guard
    const full: SDKLogEntry = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this._logs.unshift(full);
    if (this._logs.length > MAX_ENTRIES) this._logs.length = MAX_ENTRIES;
    this._notify();
  }

  getLogs(): SDKLogEntry[] {
    return this._logs;
  }

  clear(): void {
    this._logs = [];
    this._notify();
  }

  subscribe(fn: Listener): () => void {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  private _notify(): void {
    this._listeners.forEach((fn) => fn());
  }
}

export const sdkLogger = new SDKLogger();

/**
 * withLog — wraps an async SDK call, records timing + result.
 */
export async function withLog<T>(
  meta: {
    service: SDKService;
    method: string;
    endpoint: string;
    payload?: unknown;
  },
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    sdkLogger.log({
      ...meta,
      status: 'success',
      durationMs: Date.now() - start,
      response: result as Record<string, unknown>,
    });
    return result;
  } catch (err) {
    sdkLogger.log({
      ...meta,
      status: 'error',
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
