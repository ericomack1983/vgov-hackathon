'use client';

import { useState } from 'react';
import { ConfirmationData } from './types';
import s from './styles.module.css';

interface ConfirmationCardProps {
  data: ConfirmationData;
  state: 'pending' | 'confirmed' | 'cancelled';
  onConfirm: () => void;
  onCancel: () => void;
}

function WarnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 6v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function ConfirmationCard({ data, state, onConfirm, onCancel }: ConfirmationCardProps) {
  const [loading, setLoading] = useState(false);

  if (state === 'cancelled') {
    return (
      <div className={s.cancelledChip}>
        <XIcon />
        Cancelled
      </div>
    );
  }

  if (state === 'confirmed') return null;

  const handleConfirm = async () => {
    setLoading(true);
    onConfirm();
  };

  return (
    <div className={s.confirmCard} role="alertdialog" aria-label="Confirmation required">
      <div className={s.confirmCardHeader}>
        <WarnIcon />
        {data.summary.title}
      </div>
      <div className={s.confirmCardFields}>
        {data.summary.fields.map(f => (
          <div key={f.label} className={s.confirmCardFieldRow}>
            <span className={s.confirmCardFieldLabel}>{f.label}</span>
            <span className={s.confirmCardFieldValue}>{f.value}</span>
          </div>
        ))}
      </div>
      <div className={s.confirmCardActions}>
        <button
          type="button"
          className={s.confirmCancelBtn}
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className={s.confirmProceedBtn}
          onClick={handleConfirm}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Processing…' : <>Yes, proceed <ArrowIcon /></>}
        </button>
      </div>
    </div>
  );
}
