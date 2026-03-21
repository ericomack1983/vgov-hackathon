'use client';

import { useState } from 'react';
import { ScoredBid } from '@/lib/mock-data/types';
import { AlertTriangle } from 'lucide-react';

interface OverrideFormProps {
  scoredBids: ScoredBid[];
  currentWinnerId: string;
  onOverride: (winnerId: string, justification: string) => void;
}

export function OverrideForm({ scoredBids, currentWinnerId, onOverride }: OverrideFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [justification, setJustification] = useState('');

  const nonWinnerBids = scoredBids.filter((sb) => sb.supplier.id !== currentWinnerId);

  function handleConfirm() {
    if (!selectedSupplierId || justification.length < 20) return;
    onOverride(selectedSupplierId, justification);
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 font-medium transition-colors"
      >
        <AlertTriangle size={16} />
        Override Recommendation
      </button>

      {isExpanded && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-4">
          <p className="text-sm text-amber-800 mb-4">
            You are overriding the AI&apos;s best-value recommendation. This action will be logged
            for audit.
          </p>

          <div className="mb-4">
            <label
              htmlFor="override-supplier"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Select Supplier
            </label>
            <select
              id="override-supplier"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Choose a supplier...</option>
              {nonWinnerBids.map((sb) => (
                <option key={sb.supplier.id} value={sb.supplier.id}>
                  {sb.supplier.name} (Score: {sb.composite}/100)
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="override-justification"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Justification
            </label>
            <textarea
              id="override-justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              required
              minLength={20}
              placeholder="Provide a written justification for this override (minimum 20 characters)..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
            />
            <p className="mt-1 text-xs text-slate-400">
              {justification.length}/20 minimum
            </p>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedSupplierId || justification.length < 20}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Override
          </button>
        </div>
      )}
    </div>
  );
}
