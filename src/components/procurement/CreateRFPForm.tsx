'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useProcurement } from '@/context/ProcurementContext';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Upload, X, FileText, FileSpreadsheet, File, RefreshCw, ChevronDown } from 'lucide-react';
import { RecurringInterval, RecurringInstallment, RecurringSchedule } from '@/lib/mock-data/types';

const INTERVAL_OPTIONS: { value: RecurringInterval; label: string; months: number }[] = [
  { value: 'monthly',   label: 'Monthly',   months: 1  },
  { value: 'quarterly', label: 'Quarterly', months: 3  },
  { value: 'biannual',  label: 'Bi-Annual', months: 6  },
  { value: 'annual',    label: 'Annual',    months: 12 },
];

const DURATION_OPTIONS = [1, 2, 3, 5];

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d;
}

const CATEGORIES = [
  'IT Infrastructure',
  'Cybersecurity',
  'Office Supplies',
  'Data & Analytics',
  'Facilities',
  'Professional Services',
  'Construction',
];

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx';

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface RecurringFormState {
  enabled: boolean;
  interval: RecurringInterval;
  contractYears: number;
  startDate: string;
}

interface FormState {
  title: string;
  description: string;
  budgetCeiling: string;
  deadline: string;
  category: string;
  recurring: RecurringFormState;
}

interface Props {
  onClose?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type === 'application/pdf') return <FileText size={16} className="text-red-500" />;
  if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet size={16} className="text-green-600" />;
  return <File size={16} className="text-blue-500" />;
}

export function CreateRFPForm({ onClose }: Props) {
  const { addRFP } = useProcurement();
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    budgetCeiling: '',
    deadline: '',
    category: '',
    recurring: {
      enabled: false,
      interval: 'quarterly',
      contractYears: 1,
      startDate: '',
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recurringPreview = useMemo(() => {
    const { enabled, interval, contractYears, startDate } = form.recurring;
    if (!enabled || !startDate || !form.budgetCeiling) return null;
    const opt = INTERVAL_OPTIONS.find(o => o.value === interval)!;
    const totalInstallments = (12 / opt.months) * contractYears;
    const installmentAmount = Number(form.budgetCeiling) / totalInstallments;
    const start = new Date(startDate + 'T00:00:00.000Z');
    const installments: Array<{ date: Date; amount: number }> = [];
    for (let i = 0; i < totalInstallments; i++) {
      installments.push({ date: addMonths(start, i * opt.months), amount: installmentAmount });
    }
    const endDate = installments[installments.length - 1].date;
    return { totalInstallments, installmentAmount, installments, endDate };
  }, [form.recurring, form.budgetCeiling]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!form.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!form.budgetCeiling || Number(form.budgetCeiling) <= 0) {
      newErrors.budgetCeiling = 'Budget must be greater than 0';
    }
    if (!form.deadline) {
      newErrors.deadline = 'Deadline must be a future date';
    } else if (new Date(form.deadline) <= new Date()) {
      newErrors.deadline = 'Deadline must be a future date';
    }
    if (!form.category) {
      newErrors.category = 'Category is required';
    }
    if (form.recurring.enabled && !form.recurring.startDate) {
      newErrors.recurringStart = 'Start date is required for recurring contracts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    let recurringSchedule: RecurringSchedule | undefined;
    if (form.recurring.enabled && recurringPreview) {
      const { interval, contractYears, startDate } = form.recurring;
      const opt = INTERVAL_OPTIONS.find(o => o.value === interval)!;
      const start = new Date(startDate + 'T00:00:00.000Z');
      const installments: RecurringInstallment[] = recurringPreview.installments.map((inst, i) => ({
        id: uuidv4(),
        dueDate: inst.date.toISOString(),
        amount: inst.amount,
        status: 'scheduled' as const,
      }));
      recurringSchedule = {
        interval,
        contractYears,
        installmentAmount: recurringPreview.installmentAmount,
        totalInstallments: recurringPreview.totalInstallments,
        startDate: start.toISOString(),
        endDate: recurringPreview.endDate.toISOString(),
        installments,
      };
    }

    const rfp = {
      id: uuidv4(),
      title: form.title.trim(),
      description: form.description.trim(),
      budgetCeiling: Number(form.budgetCeiling),
      deadline: form.recurring.enabled && recurringSchedule
        ? recurringSchedule.endDate
        : new Date(form.deadline).toISOString(),
      category: form.category,
      status: 'Draft' as const,
      createdAt: new Date().toISOString(),
      bids: [],
      ...(recurringSchedule ? { recurring: recurringSchedule } : {}),
    };

    addRFP(rfp);
    toast.success('RFP created successfully');
    onClose?.();
    router.push('/rfp/' + rfp.id);
  }

  function handleChange(field: keyof Omit<FormState, 'recurring'>, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleRecurringChange<K extends keyof RecurringFormState>(field: K, value: RecurringFormState[K]) {
    setForm(prev => ({ ...prev, recurring: { ...prev.recurring, [field]: value } }));
    if (errors['recurringStart']) {
      setErrors(prev => { const n = { ...prev }; delete n.recurringStart; return n; });
    }
  }

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const newFiles: AttachedFile[] = [];
    for (const f of Array.from(incoming)) {
      if (!ACCEPTED_TYPES.includes(f.type)) continue;
      if (files.some((a) => a.name === f.name && a.size === f.size)) continue;
      newFiles.push({ id: uuidv4(), name: f.name, size: f.size, type: f.type });
    }
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [files]); // eslint-disable-line react-hooks/exhaustive-deps

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1434CB] focus:border-[#1434CB]';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          className={inputClass}
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter RFP title"
        />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          className={inputClass}
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe the procurement requirements"
        />
        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="budgetCeiling" className="block text-sm font-semibold text-slate-700 mb-1">
            {form.recurring.enabled ? 'Total Contract Value ($)' : 'Budget Ceiling ($)'}
          </label>
          <input
            id="budgetCeiling"
            type="number"
            min="0"
            step="1000"
            className={inputClass}
            value={form.budgetCeiling}
            onChange={(e) => handleChange('budgetCeiling', e.target.value)}
            placeholder="0"
          />
          {errors.budgetCeiling && <p className="mt-1 text-xs text-red-500">{errors.budgetCeiling}</p>}
        </div>

        {!form.recurring.enabled && (
          <div>
            <label htmlFor="deadline" className="block text-sm font-semibold text-slate-700 mb-1">
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              className={inputClass}
              value={form.deadline}
              onChange={(e) => handleChange('deadline', e.target.value)}
            />
            {errors.deadline && <p className="mt-1 text-xs text-red-500">{errors.deadline}</p>}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-1">
          Category
        </label>
        <select
          id="category"
          className={inputClass}
          value={form.category}
          onChange={(e) => handleChange('category', e.target.value)}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
      </div>

      {/* Recurring Contract toggle */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => handleRecurringChange('enabled', !form.recurring.enabled)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <RefreshCw size={15} className={form.recurring.enabled ? 'text-[#1434CB]' : 'text-slate-400'} />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-700">Recurring Contract</p>
              <p className="text-xs text-slate-400">Split payments over a fixed schedule</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-9 h-5 rounded-full transition-colors relative ${form.recurring.enabled ? 'bg-[#1434CB]' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.recurring.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${form.recurring.enabled ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {form.recurring.enabled && (
          <div className="border-t border-slate-100 px-4 py-4 space-y-4 bg-slate-50/60">
            {/* Interval + duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Interval</label>
                <select
                  className={inputClass}
                  value={form.recurring.interval}
                  onChange={e => handleRecurringChange('interval', e.target.value as RecurringInterval)}
                >
                  {INTERVAL_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contract Duration</label>
                <select
                  className={inputClass}
                  value={form.recurring.contractYears}
                  onChange={e => handleRecurringChange('contractYears', Number(e.target.value))}
                >
                  {DURATION_OPTIONS.map(y => (
                    <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contract Start Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.recurring.startDate}
                onChange={e => handleRecurringChange('startDate', e.target.value)}
              />
              {errors.recurringStart && <p className="mt-1 text-xs text-red-500">{errors.recurringStart}</p>}
            </div>

            {/* Budget ceiling label override */}
            <p className="text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2">
              The <span className="font-semibold">Budget Ceiling</span> above is the <span className="font-semibold">total contract value</span>.
              Each installment will be automatically calculated.
            </p>

            {/* Preview */}
            {recurringPreview && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 space-y-2">
                <p className="text-[10px] font-bold text-[#1434CB] uppercase tracking-wider">Schedule Preview</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{recurringPreview.totalInstallments}</p>
                    <p className="text-[9px] text-slate-400">Installments</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      ${Math.round(recurringPreview.installmentAmount).toLocaleString()}
                    </p>
                    <p className="text-[9px] text-slate-400">Per payment</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {recurringPreview.endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[9px] text-slate-400">End date</p>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap pt-1">
                  {recurringPreview.installments.slice(0, 12).map((inst, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#1434CB]/20 border border-[#1434CB]/30"
                      title={inst.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    />
                  ))}
                  {recurringPreview.totalInstallments > 12 && (
                    <span className="text-[9px] text-[#1434CB]">+{recurringPreview.totalInstallments - 12}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Supporting Documents
          <span className="ml-1.5 text-xs font-normal text-slate-400">PDF, DOC, DOCX, XLS, XLSX</span>
        </label>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl px-6 py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#1434CB] bg-[#EEF1FD]'
              : 'border-slate-200 hover:border-[#6B8EE8] hover:bg-slate-50'
          }`}
        >
          <Upload size={22} className={isDragging ? 'text-[#1434CB]' : 'text-slate-400'} />
          <p className="text-sm text-slate-500 text-center">
            <span className="font-medium text-[#1434CB]">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-400">Max 10 MB per file</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                {fileIcon(f.type)}
                <span className="flex-1 text-xs text-slate-700 font-medium truncate">{f.name}</span>
                <span className="text-xs text-slate-400 shrink-0">{formatBytes(f.size)}</span>
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="bg-[#1434CB] hover:bg-[#0F27B0] text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Create RFP
        </button>
      </div>
    </form>
  );
}
