'use client';

import { Toaster } from 'react-hot-toast';

/**
 * Toaster con el estilo de la app. Se monta sólo dentro de los módulos TCI 2.0
 * para no alterar el comportamiento de las pantallas existentes.
 */
export function TciToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3800,
        style: {
          background: '#ffffff',
          color: '#0f172a',
          fontSize: 13,
          fontWeight: 500,
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.12)',
          padding: '12px 14px',
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
      }}
    />
  );
}
