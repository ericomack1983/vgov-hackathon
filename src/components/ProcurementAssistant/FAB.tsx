'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import s from './styles.module.css';

interface FABProps {
  isOpen: boolean;
  onClick: () => void;
}

function SparkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M11 2 L12.8 8.2 L19 11 L12.8 13.8 L11 20 L9.2 13.8 L3 11 L9.2 8.2 Z"
        fill="currentColor"
        stroke="none"
      />
      <path
        d="M17 2 L17.6 4.4 L20 5 L17.6 5.6 L17 8 L16.4 5.6 L14 5 L16.4 4.4 Z"
        fill="currentColor"
        opacity="0.6"
        stroke="none"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M2 2 L16 16 M16 2 L2 16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FAB({ isOpen, onClick }: FABProps) {
  const pulseRef = useRef<HTMLSpanElement>(null);

  // Reset animation every 8s
  useEffect(() => {
    if (isOpen) return;
    const el = pulseRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      el.style.animation = 'none';
      void el.offsetHeight; // reflow
      el.style.animation = '';
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <button
      className={`${s.widgetRoot} ${s.fab}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close AI Procurement Assistant' : 'Open AI Procurement Assistant'}
      aria-expanded={isOpen}
    >
      {!isOpen && <span ref={pulseRef} className={s.pulseRing} />}

      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          <motion.span
            key="close"
            className={s.fabIcon}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CloseIcon />
          </motion.span>
        ) : (
          <motion.span
            key="spark"
            className={s.fabIcon}
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SparkIcon />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
