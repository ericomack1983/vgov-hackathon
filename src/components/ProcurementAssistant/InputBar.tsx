'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import s from './styles.module.css';

interface InputBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

function AttachIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14 7.5L7.5 14A4.5 4.5 0 0 1 1.5 8L8 1.5a3 3 0 0 1 4.24 4.24L6 12a1.5 1.5 0 0 1-2.12-2.12l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function WebSearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 1.5C8 1.5 6 4.5 6 8S8 14.5 8 14.5M8 1.5C8 1.5 10 4.5 10 8S8 14.5 8 14.5M1.5 8h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.2 3.2l.85.85M11.95 11.95l.85.85M3.2 12.8l.85-.85M11.95 4.05l.85-.85" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 4L1 8l4 4M11 4l4 4-4 4M9.5 2.5l-3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2.5 8.5A5.5 5.5 0 0 0 8 14a5.5 5.5 0 0 0 5.5-5.5M8 14v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 2l12 6-12 6V9.5l8-1.5-8-1.5V2z" fill="currentColor"/>
    </svg>
  );
}

export function InputBar({ value, onChange, onSubmit, disabled }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px';
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasText && !disabled) onSubmit();
    }
  };

  return (
    <div className={s.inputBarWrapper}>
      <div className={s.inputPill}>
        <div className={s.inputIconRow}>
          <button type="button" className={s.inputIconBtn} aria-label="Attach file" tabIndex={0}>
            <AttachIcon />
          </button>
          <button type="button" className={s.inputIconBtn} aria-label="Web search" tabIndex={0}>
            <WebSearchIcon />
          </button>
          <button type="button" className={s.inputIconBtn} aria-label="Settings" tabIndex={0}>
            <SettingsIcon />
          </button>
          <div className={s.inputDivider} />
          <button type="button" className={s.inputIconBtn} aria-label="Code mode" tabIndex={0}>
            <CodeIcon />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className={s.inputTextarea}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about suppliers, bids, payments..."
          rows={1}
          aria-label="Ask the AI Procurement Assistant"
          role="combobox"
          aria-expanded="false"
          aria-autocomplete="none"
          disabled={disabled}
        />

        <button
          type="button"
          className={hasText ? s.inputSendBtn : s.inputMicBtn}
          onClick={hasText ? onSubmit : undefined}
          disabled={disabled && hasText}
          aria-label={hasText ? 'Send message' : 'Voice input'}
          tabIndex={0}
        >
          {hasText ? <SendIcon /> : <MicIcon />}
        </button>
      </div>
    </div>
  );
}
