export type MessageRole = 'user' | 'assistant' | 'tool';

export interface ConfirmationField {
  label: string;
  value: string;
}

export interface ConfirmationData {
  tool: string;
  params: Record<string, unknown>;
  phase1Result?: Record<string, unknown>;
  summary: {
    title: string;
    fields: ConfirmationField[];
  };
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  toolName?: string;
  toolResult?: Record<string, unknown>;
  isLoading?: boolean;
  confirmation?: ConfirmationData;
  confirmationState?: 'pending' | 'confirmed' | 'cancelled';
}

export interface MCPCallResult {
  ok: boolean;
  tool: string;
  data?: Record<string, unknown>;
  needsConfirmation?: boolean;
  confirmationData?: ConfirmationData;
  error?: string;
}

export const TWO_PHASE_TOOLS = new Set([
  'vcn_issue_virtual_card',
  'bip_initiate_payment',
  'sip_approve_payment',
]);
