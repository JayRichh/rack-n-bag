'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: () => void;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, disabled = false }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onCheckedChange}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full 
        transition-colors duration-200 ease-in-out focus-visible:outline-none 
        focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
        ${checked ? 'bg-accent' : 'bg-gray-200 dark:bg-gray-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <motion.span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg
          ring-0 transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0.5'}
        `}
        animate={{
          x: checked ? 24 : 2,
          scale: checked ? 1 : 0.9
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      />
    </button>
  );
}
