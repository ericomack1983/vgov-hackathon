'use client';

import { useState } from 'react';
import { useProcurement } from '@/context/ProcurementContext';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'IT Infrastructure',
  'Cybersecurity',
  'Office Supplies',
  'Data & Analytics',
  'Facilities',
  'Professional Services',
  'Construction',
];

interface FormState {
  title: string;
  description: string;
  budgetCeiling: string;
  deadline: string;
  category: string;
}

export function CreateRFPForm() {
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

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
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
          rows={4}
          className={inputClass}
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe the procurement requirements"
        />
        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
      </div>

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

      <div className="pt-2">
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
