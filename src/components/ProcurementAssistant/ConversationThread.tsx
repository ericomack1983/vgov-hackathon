'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Message } from './types';
import { MessageBubble } from './MessageBubble';
import s from './styles.module.css';

const MAX_VISIBLE = 50;

interface ConversationThreadProps {
  messages: Message[];
  onConfirm: (msgId: string) => void;
  onCancel: (msgId: string) => void;
}

export function ConversationThread({ messages, onConfirm, onCancel }: ConversationThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showFrom, setShowFrom] = useState(0);

  const visible = messages.slice(showFrom, showFrom + MAX_VISIBLE);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // When messages exceed max, show earlier button
  useEffect(() => {
    if (messages.length > MAX_VISIBLE) {
      setShowFrom(messages.length - MAX_VISIBLE);
    }
  }, [messages.length]);

  return (
    <div className={s.thread} role="log" aria-live="polite" aria-label="Conversation">
      {showFrom > 0 && (
        <button
          type="button"
          className={s.showEarlierBtn}
          onClick={() => setShowFrom(Math.max(0, showFrom - MAX_VISIBLE))}
        >
          Show earlier messages
        </button>
      )}

      <AnimatePresence initial={false}>
        {visible.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        ))}
      </AnimatePresence>

      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
