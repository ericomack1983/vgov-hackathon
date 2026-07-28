import { cn } from '@/lib/utils';
import type { MissionStatus, MissionTxStatus } from '@/lib/mock-data/types';

/* Mismos tokens de color que los badges existentes (StatusBadge) */
const MISSION_CLASSES: Record<MissionStatus, string> = {
  borrador:             'bg-slate-100 text-slate-600',
  pendiente_aprobacion: 'bg-amber-50 text-amber-600',
  aprobada:             'bg-sky-50 text-sky-700',
  activa:               'bg-[#EEF1FD] text-[#1434CB]',
  en_conciliacion:      'bg-violet-50 text-violet-600',
  cerrada:              'bg-emerald-50 text-emerald-600',
};

export const MISSION_STATUS_LABEL: Record<MissionStatus, string> = {
  borrador:             'Borrador',
  pendiente_aprobacion: 'Pendiente',
  aprobada:             'Aprobada',
  activa:               'Activa',
  en_conciliacion:      'En conciliación',
  cerrada:              'Cerrada',
};

export function MissionStatusBadge({ status, className }: { status: MissionStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
        MISSION_CLASSES[status],
        className,
      )}
    >
      {MISSION_STATUS_LABEL[status]}
    </span>
  );
}

/* ── Transacciones de misión ─────────────────────────────────────────────── */

const TX_CLASSES: Record<MissionTxStatus, string> = {
  aprobada:         'bg-emerald-50 text-emerald-600',
  rechazada:        'bg-red-50 text-red-600',
  pendiente_recibo: 'bg-amber-50 text-amber-600',
  conciliada:       'bg-[#EEF1FD] text-[#1434CB]',
};

export const TX_STATUS_LABEL: Record<MissionTxStatus, string> = {
  aprobada:         'Aprobada',
  rechazada:        'Rechazada',
  pendiente_recibo: 'Pendiente de recibo',
  conciliada:       'Conciliada',
};

/** Color de acento por estado — para barras laterales, puntos y anillos */
export const TX_ACCENT: Record<MissionTxStatus, string> = {
  aprobada:         '#10b981',
  rechazada:        '#ef4444',
  pendiente_recibo: '#f59e0b',
  conciliada:       '#1434CB',
};

export function MissionTxStatusBadge({ status, className }: { status: MissionTxStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
        TX_CLASSES[status],
        className,
      )}
    >
      {TX_STATUS_LABEL[status]}
    </span>
  );
}
