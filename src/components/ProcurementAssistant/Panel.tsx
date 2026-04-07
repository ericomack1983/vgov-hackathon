'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ConversationThread } from './ConversationThread';
import { QuickChips } from './QuickChips';
import { InputBar } from './InputBar';
import { useMCPClient } from './useMCPClient';
import { useConversation } from './useConversation';
import { ConfirmationData } from './types';
import s from './styles.module.css';

interface PanelProps {
  onClose: () => void;
  inputRef?: React.RefObject<HTMLElement>;
}

function SparkSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1L8.2 5.2 L12 7 L8.2 8.8 L7 13 L5.8 8.8 L2 7 L5.8 5.2 Z" fill="currentColor"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

const PANEL_SPRING = {
  initial: { opacity: 0, y: 16, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit:    { opacity: 0, y: 12, scale: 0.95 },
};

const PANEL_TRANSITION = {
  enter: { duration: 0.32, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
  exit:  { duration: 0.2, ease: 'easeIn' as const },
};

export function Panel({ onClose }: PanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const conv = useConversation();
  const { processMessage, confirmAction } = useMCPClient();

  // Focus input on mount
  useEffect(() => {
    const ta = document.querySelector<HTMLTextAreaElement>('[aria-label="Ask the AI Procurement Assistant"]');
    ta?.focus();
  }, []);

  // Escape key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const panel = document.getElementById('pa-panel');
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    panel.addEventListener('keydown', trapFocus);
    return () => panel.removeEventListener('keydown', trapFocus);
  }, []);

  const startTimer = () => {
    setElapsedSecs(0);
    timerRef.current = setInterval(() => setElapsedSecs(s => s + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setElapsedSecs(0);
  };

  const handleFallback = useCallback(async (text: string) => {
    const loadId = conv.addLoadingMessage();
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'ai_chat', params: { message: text } }),
      });
      const json = await res.json() as { data?: { reply?: string }; error?: string };
      conv.resolveLoadingMessage(loadId, {
        content: json.data?.reply ?? json.error ?? 'I\'m not sure how to help with that. Try one of the quick actions below.',
      });
    } catch {
      conv.resolveLoadingMessage(loadId, { content: 'Could not reach the procurement API. Check your MCP server connection.' });
    }
  }, [conv]);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    setError(null);
    conv.addUserMessage(text);
    setIsLoading(true);
    startTimer();

    await processMessage(
      text,
      (toolName) => {
        conv.addLoadingMessage(toolName);
      },
      (toolName, result) => {
        stopTimer();
        setIsLoading(false);
        if (!result.ok) {
          setError(result.error ?? 'Something went wrong');
          conv.addAssistantMessage(`Could not complete ${toolName}: ${result.error ?? 'Unknown error'}`);
          return;
        }
        // Notify other pages about card block
        if (toolName === 'vpc_block_account' && result.data?.accountId) {
          window.dispatchEvent(new CustomEvent('vgov:card-blocked', { detail: { accountId: result.data.accountId } }));
        }
        if (toolName === 'vpc_unblock_account' && result.data?.accountId) {
          window.dispatchEvent(new CustomEvent('vgov:card-unblocked', { detail: { accountId: result.data.accountId } }));
        }
        const summary = buildToolSummary(toolName, result.data ?? {});
        conv.addToolResultMessage(summary, toolName, result.data ?? {});
      },
      (confirmData) => {
        stopTimer();
        setIsLoading(false);
        conv.addAssistantMessage(
          `I\'ll ${confirmData.tool.replace(/_/g, ' ')} for you. Please review the details below.`
        );
        conv.addConfirmationMessage(confirmData);
      },
      handleFallback,
    );

    if (isLoading) { stopTimer(); setIsLoading(false); }
  }, [input, isLoading, conv, processMessage, handleFallback]);

  const handleConfirm = useCallback(async (msgId: string) => {
    const msg = conv.messages.find(m => m.id === msgId);
    if (!msg?.confirmation) return;
    conv.setConfirmationState(msgId, 'confirmed');
    setIsLoading(true);
    startTimer();

    const confirmationParams = msg.confirmation.params;

    await confirmAction(
      msg.confirmation as ConfirmationData,
      (toolName) => conv.addLoadingMessage(toolName),
      (toolName, result) => {
        stopTimer();
        setIsLoading(false);
        if (!result.ok) {
          conv.addAssistantMessage(`Action failed: ${result.error ?? 'Unknown error'}`);
          return;
        }
        // Notify cards page when a VCN is issued via chat
        if (toolName === 'vcn_issue_virtual_card' && result.data?.accounts) {
          window.dispatchEvent(new CustomEvent('vgov:card-issued', {
            detail: { data: result.data, params: confirmationParams },
          }));
        }
        const summary = buildToolSummary(toolName, result.data ?? {});
        conv.addToolResultMessage(summary, toolName, result.data ?? {});
      },
    );
  }, [conv, confirmAction]);

  const handleCancel = useCallback((msgId: string) => {
    conv.setConfirmationState(msgId, 'cancelled');
    conv.addAssistantMessage('Action cancelled.');
  }, [conv]);

  const handleChipClick = useCallback((prompt: string) => {
    setInput(prompt);
    const ta = document.querySelector<HTMLTextAreaElement>('[aria-label="Ask the AI Procurement Assistant"]');
    ta?.focus();
  }, []);

  return (
    <motion.div
      id="pa-panel"
      className={`${s.widgetRoot} ${s.panel}`}
      role="dialog"
      aria-modal="true"
      aria-label="AI Procurement Assistant"
      {...PANEL_SPRING}
      transition={PANEL_TRANSITION.enter}
    >
      {/* Header */}
      <div className={s.panelHeader}>
        <div className={s.panelHeaderIcon}>
          <SparkSmallIcon />
        </div>
        <span className={s.panelHeaderTitle}>AI Procurement Assistant</span>
        <span className={s.panelHeaderBadge}>
          <span className={s.panelHeaderBadgeDot} />
          Visa AI
        </span>
        <button
          ref={closeRef}
          type="button"
          className={s.panelCloseBtn}
          onClick={onClose}
          aria-label="Close panel"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Conversation */}
      <ConversationThread
        messages={conv.messages}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Elapsed progress for slow calls */}
      {isLoading && elapsedSecs >= 8 && (
        <div className={s.elapsedMsg}>
          Calling Visa network… ({elapsedSecs}s)
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className={s.errorBanner}>
          <span>Could not reach the procurement API. {error}</span>
          <button
            type="button"
            className={s.errorRetryBtn}
            onClick={() => { setError(null); }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick chips */}
      <QuickChips onChipClick={handleChipClick} />

      {/* Input bar */}
      <InputBar
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        disabled={isLoading}
      />
    </motion.div>
  );
}

/* ── Human-readable summary for tool results ──────────────────── */
function buildToolSummary(tool: string, data: Record<string, unknown>): string {
  switch (tool) {
    case 'sms_check_supplier':
      return `Supplier verification complete for ${data.supplierName ?? ''}.`;
    case 'sms_bulk_check_suppliers':
      return `Bulk verification complete for ${(data.results as unknown[])?.length ?? 0} suppliers.`;
    case 'ai_evaluate_bids':
      return `Evaluated ${(data.ranked as unknown[])?.length ?? 0} bids. Top ranked supplier shown below.`;
    case 'vpc_suggest_rules':
      return 'Payment control rules generated. Review and apply below.';
    case 'vpc_apply_rules':
      return `Rules applied to account ${data.accountId ?? ''}.`;
    case 'vpc_block_account':
      return `Account ${data.accountId ?? ''} has been blocked (HOT status).`;
    case 'vpc_get_transaction_history':
      return `Retrieved ${(data.transactions as unknown[])?.length ?? 0} transaction records.`;
    case 'vcn_issue_virtual_card':
      return 'Virtual card issued successfully on the Visa network.';
    case 'bip_initiate_payment':
      return `BIP payment ${data.paymentId ?? ''} initiated (status: ${data.status ?? ''}).`;
    case 'sip_approve_payment':
      return `SIP payment approved: $${Number(data.approvedAmount ?? 0).toLocaleString()}.`;
    case 'settlement_initiate':
      return `Settlement initiated for order ${data.orderId ?? ''}.`;
    default:
      return `${tool.replace(/_/g, ' ')} completed.`;
  }
}
