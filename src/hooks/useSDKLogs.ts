'use client';

import { useState, useEffect } from 'react';
import { sdkLogger, SDKLogEntry } from '@/lib/sdk-logger';

export function useSDKLogs(): { logs: SDKLogEntry[]; clear: () => void } {
  const [logs, setLogs] = useState<SDKLogEntry[]>(() => sdkLogger.getLogs());

  useEffect(() => {
    return sdkLogger.subscribe(() => setLogs([...sdkLogger.getLogs()]));
  }, []);

  return { logs, clear: () => sdkLogger.clear() };
}
