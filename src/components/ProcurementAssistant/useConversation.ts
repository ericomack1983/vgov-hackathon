'use client';

import { useState, useCallback } from 'react';
import { Message, ConfirmationData } from './types';

let _idCounter = 0;
function nextId() { return `msg-${++_idCounter}-${Date.now()}`; }

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      role: 'assistant',
      content: 'Hello! I\'m your AI Procurement Assistant. I can help you verify suppliers, evaluate bids, manage payment controls, and issue virtual cards on the Visa network. What would you like to do?',
      timestamp: new Date(),
    },
  ]);

  const addUserMessage = useCallback((content: string): string => {
    const id = nextId();
    setMessages(prev => [...prev, { id, role: 'user', content, timestamp: new Date() }]);
    return id;
  }, []);

  const addLoadingMessage = useCallback((toolName?: string): string => {
    const id = nextId();
    setMessages(prev => [
      ...prev,
      { id, role: 'assistant', content: '', timestamp: new Date(), isLoading: true, toolName },
    ]);
    return id;
  }, []);

  const resolveLoadingMessage = useCallback((
    id: string,
    update: Partial<Message>,
  ) => {
    setMessages(prev =>
      prev.map(m => m.id === id ? { ...m, isLoading: false, ...update } : m),
    );
  }, []);

  const addAssistantMessage = useCallback((content: string, extra?: Partial<Message>): string => {
    const id = nextId();
    setMessages(prev => [...prev, { id, role: 'assistant', content, timestamp: new Date(), ...extra }]);
    return id;
  }, []);

  const addConfirmationMessage = useCallback((data: ConfirmationData): string => {
    const id = nextId();
    setMessages(prev => [
      ...prev,
      {
        id,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        confirmation: data,
        confirmationState: 'pending',
      },
    ]);
    return id;
  }, []);

  const setConfirmationState = useCallback((
    msgId: string,
    state: 'confirmed' | 'cancelled',
  ) => {
    setMessages(prev =>
      prev.map(m => m.id === msgId ? { ...m, confirmationState: state } : m),
    );
  }, []);

  const addToolResultMessage = useCallback((
    content: string,
    toolName: string,
    toolResult: Record<string, unknown>,
  ): string => {
    const id = nextId();
    setMessages(prev => [
      ...prev,
      { id, role: 'tool', content, toolName, toolResult, timestamp: new Date() },
    ]);
    return id;
  }, []);

  return {
    messages,
    addUserMessage,
    addLoadingMessage,
    resolveLoadingMessage,
    addAssistantMessage,
    addConfirmationMessage,
    setConfirmationState,
    addToolResultMessage,
  };
}
