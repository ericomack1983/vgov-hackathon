'use client';

import { motion } from 'framer-motion';
import { Ban, CheckCircle2, Paperclip, Receipt } from 'lucide-react';
import type { MissionTransaction } from '@/lib/mock-data/types';
import { formatGTQ, formatUSD, formatDateTimeES, flagEmoji } from '@/lib/tci-format';
import { MissionTxStatusBadge, TX_ACCENT } from './MissionStatusBadge';

/**
 * Fila de transacción de misión — misma anatomía que las filas de la página
 * Transactions (icono en cuadro, monto en negrita, badge de estado).
 */
export function MissionTransactionRow({
  tx,
  index,
  onAttachReceipt,
}: {
  tx: MissionTransaction;
  index: number;
  onAttachReceipt?: (id: string) => void;
}) {
  const accent = TX_ACCENT[tx.status];
  const declined = tx.status === 'rechazada';

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
      style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
    >
      {/* Comercio + MCC */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${accent}18` }}
          >
            {declined ? <Ban size={12} style={{ color: accent }} /> : <CheckCircle2 size={12} style={{ color: accent }} />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">{tx.merchant}</p>
            <p className="text-[10px] text-slate-400">
              <span className="font-mono">{tx.mcc.code}</span> · {tx.mcc.label}
            </p>
          </div>
        </div>
      </td>

      {/* Monto GTQ + USD secundario */}
      <td className="px-4 py-3">
        <p className={`text-sm font-bold ${declined ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
          {formatGTQ(tx.amountGTQ)}
        </p>
        {tx.amountUSD !== undefined && (
          <p className="text-[10px] text-slate-400">{formatUSD(tx.amountUSD)}</p>
        )}
      </td>

      {/* País */}
      <td className="px-4 py-3">
        <span className="text-sm" aria-hidden>{flagEmoji(tx.countryCode)}</span>
        <span className="ml-1.5 text-xs text-slate-500">{tx.countryCode}</span>
      </td>

      {/* Estado + motivo de rechazo */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <MissionTxStatusBadge status={tx.status} />
          {tx.declineReason && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100">
              <Ban size={9} /> {tx.declineReason}
            </span>
          )}
        </div>
      </td>

      {/* Recibo */}
      <td className="px-4 py-3">
        {tx.receiptAttached ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <Receipt size={11} /> Adjunto
          </span>
        ) : declined ? (
          <span className="text-[11px] text-slate-300">—</span>
        ) : onAttachReceipt ? (
          <button
            type="button"
            onClick={() => onAttachReceipt(tx.id)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1434CB] hover:text-[#0B1E8A] transition-colors"
          >
            <Paperclip size={11} /> Adjuntar
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
            <Paperclip size={11} /> Faltante
          </span>
        )}
      </td>

      {/* Fecha */}
      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
        {formatDateTimeES(tx.createdAt)}
      </td>
    </motion.tr>
  );
}
