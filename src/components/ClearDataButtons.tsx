'use client';

import React, { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { containers, typography, interactive } from '../lib/design-system';
import { clearAllStoredData, clearAbsolutelyAllData } from '../utils/clear-storage';

interface ClearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetToDefaults: () => void;
  onClearAll: () => void;
}

function ClearModal({ isOpen, onClose, onResetToDefaults, onClearAll }: ClearModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        role="dialog"
        aria-labelledby="clear-title"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`${containers.card} max-w-md w-full mx-4`}
      >
        <h3 id="clear-title" className={`${typography.h3} mb-4`}>Clear Data Options</h3>
        <div className="space-y-4">
          <button
            onClick={onResetToDefaults}
            className={`${interactive.button.ghost} w-full justify-start`}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
            <span className="text-xs text-muted-foreground ml-auto">Keeps settings</span>
          </button>
          <button
            onClick={onClearAll}
            className={`${interactive.button.ghost} w-full justify-start text-red-500`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Everything
            <span className="text-xs text-muted-foreground ml-auto">Complete reset</span>
          </button>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className={interactive.button.ghost}>
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ClearDataButtons() {
  const [showClearModal, setShowClearModal] = useState(false);

  const handleResetToDefaults = () => {
    clearAllStoredData();
    window.location.reload();
  };

  const handleClearAll = () => {
    clearAbsolutelyAllData();
    window.location.reload();
  };

  return (
    <>
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={() => setShowClearModal(true)}
          className={`${interactive.button.ghost} text-muted-foreground hover:text-accent`}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear Data
        </button>
      </div>

      <ClearModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onResetToDefaults={handleResetToDefaults}
        onClearAll={handleClearAll}
      />
    </>
  );
}
