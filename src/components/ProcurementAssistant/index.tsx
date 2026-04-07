'use client';

import { useState, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FAB } from './FAB';
import { Panel } from './Panel';

export function ProcurementAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    // Return focus to FAB
    setTimeout(() => {
      document.querySelector<HTMLButtonElement>('[aria-label="Open AI Procurement Assistant"]')?.focus();
    }, 220);
  }, []);

  return (
    <>
      <FAB isOpen={isOpen} onClick={isOpen ? close : open} />
      <AnimatePresence>
        {isOpen && <Panel onClose={close} />}
      </AnimatePresence>
    </>
  );
}
