'use client';

import { motion } from 'framer-motion';
import { Message } from './types';
import { ConfirmationCard } from './ConfirmationCard';
import s from './styles.module.css';

interface MessageBubbleProps {
  message: Message;
  onConfirm?: (msgId: string) => void;
  onCancel?: (msgId: string) => void;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ── Shimmer skeleton for loading state ─────────────────────────── */
function LoadingCard() {
  return (
    <div className={s.resultCard}>
      <div className={`${s.shimmer} ${s.shimmerLine} ${s.shimmerLineMed}`} />
      <div className={`${s.shimmer} ${s.shimmerLine} ${s.shimmerLineLong}`} />
      <div className={`${s.shimmer} ${s.shimmerLine} ${s.shimmerLineShort}`} />
      <div className={`${s.shimmer} ${s.shimmerLine} ${s.shimmerLineLong}`} />
    </div>
  );
}

/* ── Typing dots ────────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className={s.typingDots} aria-label="Assistant is typing">
      <span className={s.typingDot} />
      <span className={s.typingDot} />
      <span className={s.typingDot} />
    </div>
  );
}

/* ── Supplier check result card ─────────────────────────────────── */
function SupplierCard({ data }: { data: Record<string, unknown> }) {
  const score = typeof data.score === 'number' ? data.score : 0;
  const status = data.registeredInVisaNetwork ? 'Registered' : 'Not Found';
  const isRegistered = Boolean(data.registeredInVisaNetwork);

  return (
    <div className={s.resultCard}>
      <div className={s.resultCardTitle}>Supplier Verification</div>
      <div className={s.resultCardName}>{String(data.supplierName ?? '')}</div>
      <div className={s.scoreBar}>
        <div className={s.scoreBarFill} style={{ width: `${score}%` }} />
      </div>
      <div className={s.resultCardRow}>
        <span>Match score</span>
        <span className={s.resultCardValue}>{score}/100</span>
      </div>
      {data.mcc != null && (
        <div className={s.resultCardRow}>
          <span>MCC</span>
          <span className={s.resultCardValue}>{String(data.mcc)}</span>
        </div>
      )}
      <div className={s.resultCardRow}>
        <span>Visa status</span>
        <span className={`${s.statusBadge} ${isRegistered ? s.statusBadgeSuccess : s.statusBadgeError}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

/* ── Bid evaluation result card ─────────────────────────────────── */
function BidEvalCard({ data }: { data: Record<string, unknown> }) {
  const ranked = Array.isArray(data.ranked) ? data.ranked : [];
  return (
    <div className={s.resultCard}>
      <div className={s.resultCardTitle}>Bid Evaluation — {ranked.length} bids scored</div>
      <table className={s.bidTable}>
        <tbody>
          {ranked.slice(0, 5).map((b: Record<string, unknown>, i: number) => {
            const isWinner = i === 0;
            return (
              <tr key={i} className={s.bidTableRow}>
                <td className={`${s.bidTableCell} ${isWinner ? s.bidTableCellWinner : ''}`}>
                  #{i + 1}
                </td>
                <td className={`${s.bidTableCell} ${isWinner ? s.bidTableCellWinner : ''}`}>
                  {String(b.supplierName ?? '')}
                </td>
                <td className={s.bidTableCell} style={{ width: '80px' }}>
                  <div className={s.scoreBar}>
                    <div
                      className={`${s.scoreBarFill} ${isWinner ? s.scoreBarFillGold : ''}`}
                      style={{ width: `${b.composite ?? 0}%` }}
                    />
                  </div>
                </td>
                <td className={`${s.bidTableCell} ${isWinner ? s.bidTableCellWinner : ''}`}>
                  {String(b.composite ?? 0)}/100
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.narrative != null && (
        <div className={s.resultCardRow} style={{ marginTop: '8px', display: 'block' }}>
          <span style={{ fontSize: '0.7rem', lineHeight: '1.5', color: 'var(--pa-text-muted)' }}>
            {String(data.narrative)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── VPC rules suggestion card ──────────────────────────────────── */
function RulesCard({ data }: { data: Record<string, unknown> }) {
  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
  const top = suggestions[0] as Record<string, unknown> | undefined;
  if (!top) return null;
  const rules = Array.isArray(top.rules) ? top.rules : [];

  return (
    <div className={s.resultCard}>
      <div className={s.resultCardTitle}>Payment Control Rules</div>
      <div className={s.resultCardRow}>
        <span>Confidence</span>
        <span className={s.resultCardValue}>{String(top.confidence ?? 0)}%</span>
      </div>
      <div className={s.scoreBar}>
        <div className={s.scoreBarFillSuccess} style={{ width: `${top.confidence ?? 0}%` }} />
      </div>
      {rules.map((r: Record<string, unknown>, i: number) => (
        <div key={i} className={s.resultCardRow}>
          <span>{String(r.ruleCode ?? '')}</span>
          <span className={s.resultCardValue} style={{ fontFamily: 'var(--pa-font-mono)', fontSize: '0.7rem' }}>
            {r.spendVelocity
              ? `$${(r.spendVelocity as Record<string, unknown>).limitAmount}/${(r.spendVelocity as Record<string, unknown>).periodType}`
              : r.mcc
              ? `MCC: ${((r.mcc as Record<string, unknown>).allowedMCCs as string[] | undefined)?.join(', ') ?? ''}`
              : r.channel
              ? Object.entries(r.channel as Record<string, boolean>).filter(([,v]) => v).map(([k]) => k.replace('allow','')).join(', ')
              : '—'}
          </span>
        </div>
      ))}
      {top.rationale != null && (
        <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--pa-text-muted)', lineHeight: '1.5' }}>
          {String(top.rationale)}
        </div>
      )}
    </div>
  );
}

/* ── Virtual card result card ───────────────────────────────────── */
function VirtualCardCard({ data }: { data: Record<string, unknown> }) {
  const accounts = Array.isArray(data.accounts) ? data.accounts : [];
  const card = accounts[0] as Record<string, unknown> | undefined;
  if (!card) return null;
  const pan = String(card.accountNumber ?? '');
  const masked = `**** **** **** ${pan.slice(-4)}`;

  return (
    <div className={s.resultCard}>
      <div className={s.resultCardTitle}>
        <span className={`${s.statusBadge} ${s.statusBadgeSuccess}`} style={{ marginBottom: '6px', display: 'inline-flex' }}>
          ✓ Virtual card issued
        </span>
      </div>
      <div className={s.cardNumber}>{masked}</div>
      <div className={s.resultCardRow}>
        <span>Expiry</span>
        <span className={s.resultCardValue}>{String(card.expiryDate ?? '')}</span>
      </div>
      <div className={s.resultCardRow}>
        <span>Status</span>
        <span className={`${s.statusBadge} ${s.statusBadgeSuccess}`}>{String(card.status ?? 'active')}</span>
      </div>
      {data.responseCode === '00' && (
        <div style={{ marginTop: '6px', fontSize: '0.7rem', color: 'var(--pa-text-muted)' }}>
          Rules active on Visa network
        </div>
      )}
    </div>
  );
}

/* ── Settlement card ────────────────────────────────────────────── */
function SettlementCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className={s.resultCard}>
      <div className={s.resultCardTitle}>Settlement Initiated</div>
      {data.orderId != null && (
        <div className={s.resultCardRow}>
          <span>Order ID</span>
          <span className={s.resultCardValue} style={{ fontFamily: 'var(--pa-font-mono)', fontSize: '0.7rem' }}>
            {String(data.orderId)}
          </span>
        </div>
      )}
      {data.amount != null && (
        <div className={s.resultCardRow}>
          <span>Amount</span>
          <span className={s.resultCardValue}>${Number(data.amount).toLocaleString()}</span>
        </div>
      )}
      <div className={s.resultCardRow}>
        <span>Status</span>
        <span className={`${s.statusBadge} ${s.statusBadgeSuccess}`}>
          {String(data.status ?? 'processing')}
        </span>
      </div>
    </div>
  );
}

/* ── Generic tool result card ───────────────────────────────────── */
function GenericToolCard({ toolName, data }: { toolName: string; data: Record<string, unknown> }) {
  return (
    <div className={s.resultCard}>
      <div className={s.resultCardTitle}>{toolName.replace(/_/g, ' ')}</div>
      {Object.entries(data).slice(0, 6).map(([k, v]) => (
        <div key={k} className={s.resultCardRow}>
          <span>{k}</span>
          <span className={s.resultCardValue} style={{ fontFamily: 'var(--pa-font-mono)', fontSize: '0.68rem', maxWidth: '55%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Route tool result to the right card component ─────────────── */
function ToolResultCard({ toolName, data }: { toolName: string; data: Record<string, unknown> }) {
  if (toolName === 'sms_check_supplier') return <SupplierCard data={data} />;
  if (toolName === 'ai_evaluate_bids') return <BidEvalCard data={data} />;
  if (toolName === 'vpc_suggest_rules' || toolName === 'vpc_apply_rules') return <RulesCard data={data} />;
  if (toolName === 'vcn_issue_virtual_card') return <VirtualCardCard data={data} />;
  if (toolName === 'settlement_initiate') return <SettlementCard data={data} />;
  return <GenericToolCard toolName={toolName} data={data} />;
}

/* ── Main export ────────────────────────────────────────────────── */
export function MessageBubble({ message, onConfirm, onCancel }: MessageBubbleProps) {
  const { role, content, toolName, toolResult, isLoading, confirmation, confirmationState } = message;

  const xDir = role === 'user' ? 20 : -20;

  return (
    <motion.div
      className={`${s.msgRow} ${role === 'user' ? s.msgRowUser : role === 'tool' ? s.msgRowTool : s.msgRowAssistant}`}
      initial={{ opacity: 0, x: xDir }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {isLoading ? (
        toolName ? <LoadingCard /> : <TypingIndicator />
      ) : (
        <>
          {content && (
            <div className={`${s.bubble} ${
              role === 'user' ? s.bubbleUser :
              role === 'tool' ? s.bubbleTool :
              s.bubbleAssistant
            }`}>
              {role === 'tool' && toolName && (
                <span style={{ opacity: 0.6, marginRight: '6px' }}>⚡ {toolName}</span>
              )}
              {content}
            </div>
          )}

          {toolResult && toolName && (
            <div style={{ width: '100%', marginTop: content ? '6px' : '0' }}>
              <ToolResultCard toolName={toolName} data={toolResult} />
            </div>
          )}

          {confirmation && onConfirm && onCancel && (
            <div style={{ width: '100%', marginTop: '6px' }}>
              <ConfirmationCard
                data={confirmation}
                state={confirmationState ?? 'pending'}
                onConfirm={() => onConfirm(message.id)}
                onCancel={() => onCancel(message.id)}
              />
            </div>
          )}

          {!isLoading && (
            <span className={s.bubbleTimestamp}>
              {formatTime(message.timestamp)}
            </span>
          )}
        </>
      )}
    </motion.div>
  );
}
