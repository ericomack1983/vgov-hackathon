'use client';

import { AuditEvent, getEventIcon, getEventColor } from '@/lib/audit-utils';
import { format } from 'date-fns';
import {
  FileText,
  Send,
  FileInput,
  Bot,
  Award,
  AlertTriangle,
  CreditCard,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  FileText,
  Send,
  FileInput,
  Bot,
  Award,
  AlertTriangle,
  CreditCard,
  CheckCircle,
};

export function AuditEventRow({ event }: { event: AuditEvent }) {
  const iconName = getEventIcon(event.type);
  const colorClass = getEventColor(event.type);
  const Icon = iconMap[iconName] ?? FileText;

  return (
    <div className="flex items-start gap-4 py-3 border-b border-slate-100 last:border-b-0">
      {/* Icon */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 shrink-0">
        <Icon size={16} className={colorClass} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900">{event.description}</p>
        <p className="text-xs text-slate-500 mt-0.5">{event.actor}</p>
        {event.metadata?.txHash && event.metadata.txHash !== '' && (
          <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">
            tx: {event.metadata.txHash}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
        {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
      </span>
    </div>
  );
}
