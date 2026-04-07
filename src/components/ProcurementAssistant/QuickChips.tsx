'use client';

import { motion } from 'framer-motion';
import s from './styles.module.css';

interface Chip {
  label: string;
  prompt: string;
  icon: string;
}

const CHIPS: Chip[] = [
  { label: 'Check supplier',  prompt: 'Check if [supplier name] is registered in the Visa network',      icon: '🔍' },
  { label: 'Score bids',      prompt: 'Evaluate bids for RFP [id] — budget ceiling $[amount]',           icon: '📊' },
  { label: 'Suggest rules',   prompt: 'Set up payment controls for [category], max $[amount]/month',     icon: '🔒' },
  { label: 'Issue card',      prompt: 'Issue a virtual card to [supplier], $[amount], valid [period]',   icon: '💳' },
  { label: 'Block card',      prompt: 'Emergency block account [account ID]',                            icon: '🚫' },
  { label: 'Settlement',      prompt: 'Settle payment for order [order ID], $[amount]',                  icon: '✅' },
];

interface QuickChipsProps {
  onChipClick: (prompt: string) => void;
}

export function QuickChips({ onChipClick }: QuickChipsProps) {
  return (
    <div className={s.quickChipsContainer} role="toolbar" aria-label="Quick actions">
      <div className={s.quickChipsList}>
        {CHIPS.map((chip, i) => (
          <motion.button
            key={chip.label}
            type="button"
            className={s.quickChip}
            onClick={() => onChipClick(chip.prompt)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            aria-label={`Quick action: ${chip.label}`}
          >
            <span aria-hidden="true">{chip.icon}</span>
            {chip.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
