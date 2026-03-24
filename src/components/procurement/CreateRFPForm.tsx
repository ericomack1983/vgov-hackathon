'use client';

import { useState, useRef, useCallback } from 'react';
import { useProcurement } from '@/context/ProcurementContext';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Upload, X, FileText, FileSpreadsheet, File } from 'lucide-react';

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

interface FormState {
  title: string;
  description: string;
  budgetCeiling: string;
  deadline: string;
  category: string;
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const rfp = {
      id: uuidv4(),
      title: form.title.trim(),
      description: form.description.trim(),
      budgetCeiling: Number(form.budgetCeiling),
      deadline: new Date(form.deadline).toISOString(),
      category: form.category,
      status: 'Draft' as const,
      createdAt: new Date().toISOString(),
      bids: [],
    };

    addRFP(rfp);
    toast.success('RFP created successfully');
    onClose?.();
    router.push('/rfp/' + rfp.id);
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
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
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

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
            Budget Ceiling ($)
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
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
          }`}
        >
          <Upload size={22} className={isDragging ? 'text-indigo-500' : 'text-slate-400'} />
          <p className="text-sm text-slate-500 text-center">
            <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
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
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Create RFP
        </button>
      </div>
    </form>
  );
}
