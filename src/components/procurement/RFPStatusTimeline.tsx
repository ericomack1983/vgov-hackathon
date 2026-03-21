'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { RFPStatus } from '@/lib/mock-data/types';

const steps: RFPStatus[] = ['Draft', 'Open', 'Evaluating', 'Awarded', 'Paid'];

interface RFPStatusTimelineProps {
  currentStatus: RFPStatus;
}

export function RFPStatusTimeline({ currentStatus }: RFPStatusTimelineProps) {
  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                  isCompleted && 'bg-emerald-500 text-white',
                  isActive && 'bg-indigo-600 text-white',
                  isFuture && 'bg-slate-200 text-slate-400'
                )}
              >
                {isCompleted ? <Check size={16} /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-xs mt-1',
                  isCompleted && 'text-emerald-600',
                  isActive && 'text-indigo-600 font-semibold',
                  isFuture && 'text-slate-400'
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2',
                  index < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
