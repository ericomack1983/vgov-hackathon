'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useProcurement } from '@/context/ProcurementContext';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

interface BidFormModalProps {
  rfpId: string;
  rfpTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BidFormModal({ rfpId, rfpTitle, isOpen, onClose }: BidFormModalProps) {
  const { addBid } = useProcurement();
  const [amount, setAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!amount || Number(amount) <= 0) {
      newErrors.amount = 'Bid amount must be greater than 0';
    }
    if (!deliveryDays || Number(deliveryDays) <= 0) {
      newErrors.deliveryDays = 'Delivery days must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const bid = {
      id: uuidv4(),
      rfpId,
      supplierId: 'sup-demo',
      supplierName: 'Demo Supplier',
      amount: Number(amount),
      deliveryDays: Number(deliveryDays),
      notes,
      submittedAt: new Date().toISOString(),
    };

    addBid(rfpId, bid);
    toast.success('Bid submitted successfully');
    setAmount('');
    setDeliveryDays('');
    setNotes('');
    setErrors({});
    handleClose();
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">Submit Bid</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-1">Bidding on: {rfpTitle}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="bid-amount" className="block text-sm font-semibold text-slate-700 mb-1">
              Bid Amount ($)
            </label>
            <input
              ref={firstInputRef}
              id="bid-amount"
              type="number"
              min="0"
              step="100"
              className={inputClass}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) {
                  setErrors((prev) => { const n = { ...prev }; delete n.amount; return n; });
                }
              }}
              placeholder="0"
            />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
          </div>

          <div>
            <label htmlFor="bid-delivery" className="block text-sm font-semibold text-slate-700 mb-1">
              Delivery Days
            </label>
            <input
              id="bid-delivery"
              type="number"
              min="1"
              className={inputClass}
              value={deliveryDays}
              onChange={(e) => {
                setDeliveryDays(e.target.value);
                if (errors.deliveryDays) {
                  setErrors((prev) => { const n = { ...prev }; delete n.deliveryDays; return n; });
                }
              }}
              placeholder="1"
            />
            {errors.deliveryDays && <p className="mt-1 text-xs text-red-500">{errors.deliveryDays}</p>}
          </div>

          <div>
            <label htmlFor="bid-notes" className="block text-sm font-semibold text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              id="bid-notes"
              rows={3}
              className={inputClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about your bid"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-600 hover:text-slate-800 px-4 py-2 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Submit Bid
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
