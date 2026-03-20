'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { Role } from '@/lib/mock-data/types';

const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  gov: 'Gov Officer',
  supplier: 'Supplier',
  auditor: 'Auditor',
};

const ROLES: Role[] = ['gov', 'supplier', 'auditor'];

export function RoleSwitcher() {
  const { role, setRole } = useUI();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-800 text-slate-200 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
      >
        <span className="sr-only">Switch Role</span>
        {ROLE_DISPLAY_NAMES[role]}
        <ChevronDown className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden min-w-[160px]"
          >
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-slate-700 hover:text-white transition-colors ${
                  r === role
                    ? 'text-indigo-400 font-semibold'
                    : 'text-slate-300'
                }`}
              >
                {r === role && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
                {ROLE_DISPLAY_NAMES[r]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
