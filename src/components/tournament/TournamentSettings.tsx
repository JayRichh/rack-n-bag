'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { typography } from '../../lib/design-system';
import { Tournament } from '../../types/tournament';
import { useState, useRef } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  Settings,
  Trophy,
  Calendar,
  AlertTriangle,
  Info,
  Save,
  RefreshCw,
  Download,
  Upload,
  Copy,
  ClipboardPaste,
  X
} from 'lucide-react';
import { 
  downloadTournamentFile, 
  importTournament, 
  validateTournamentFile,
  copyTournamentToClipboard,
  importFromClipboard
} from '../../utils/importExport';

interface TournamentSettingsProps {
  tournament: Tournament;
  onSave: (settings: Partial<Tournament>) => void;
  onClose: () => void;
}

export function TournamentSettings({ tournament, onSave, onClose }: TournamentSettingsProps) {
  const [pointsConfig, setPointsConfig] = useState(tournament.pointsConfig);
  const [phase, setPhase] = useState(tournament.phase);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave({ 
      pointsConfig, 
      phase 
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    setHasChanges(false);
  };

  const handlePointsChange = (type: 'win' | 'draw' | 'loss', value: number) => {
    setPointsConfig(prev => ({
      ...prev,
      [type]: value
    }));
    setHasChanges(true);
  };

  const handlePhaseChange = (newPhase: Tournament['phase']) => {
    setPhase(newPhase);
    setHasChanges(true);
  };

  const handleReset = () => {
    setPointsConfig({
      win: 3,
      draw: 1,
      loss: 0
    });
    setPhase('SINGLE');
    setHasChanges(true);
    setShowResetConfirm(false);
  };

  const handleExport = () => {
    downloadTournamentFile(tournament);
  };

  const handleCopy = async () => {
    try {
      await copyTournamentToClipboard(tournament);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      setImportError('Failed to copy tournament data to clipboard');
    }
  };

  const handlePaste = async () => {
    try {
      const importedTournament = await importFromClipboard();
      onSave(importedTournament);
      setImportError(null);
    } catch (error) {
      setImportError('Failed to paste tournament data. Please check the clipboard content and try again.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateTournamentFile(file)) {
      setImportError('Invalid file format. Please select a valid tournament file.');
      return;
    }

    try {
      const importedTournament = await importTournament(file);
      onSave(importedTournament);
      setImportError(null);
    } catch (error) {
      setImportError('Failed to import tournament. Please check the file and try again.');
    }

    // Clear the input
    event.target.value = '';
  };

  const SettingSection = ({ 
    title, 
    icon: Icon, 
    children, 
    tooltip,
    className = ''
  }: { 
    title: string; 
    icon: any; 
    children: React.ReactNode;
    tooltip?: string;
    className?: string;
  }) => (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Icon className="w-5 h-5 text-accent" />
          </div>
          <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100`}>
            {title}
          </h3>
        </div>
        {tooltip && (
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Info className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="z-[100] bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg text-sm max-w-xs border border-gray-200 dark:border-gray-700"
                  sideOffset={5}
                >
                  {tooltip}
                  <Tooltip.Arrow className="fill-white dark:fill-gray-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Settings className="w-6 h-6 text-accent" />
          </div>
          <h2 className={`${typography.h2} text-black/90 dark:text-white/90`}>
            Tournament Settings
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {(saveSuccess || copySuccess) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg"
              >
                <span className="text-sm font-medium">
                  {saveSuccess ? 'Saved!' : 'Copied!'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={() => setShowResetConfirm(true)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>

          <motion.button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              ${hasChanges 
                ? 'bg-accent text-white hover:bg-accent/90' 
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 cursor-not-allowed'
              }
              transition-colors
            `}
            whileHover={hasChanges ? { scale: 1.05 } : {}}
            whileTap={hasChanges ? { scale: 0.95 } : {}}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </motion.button>
        </div>
      </div>

      {/* Main Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Points System */}
        <SettingSection 
          title="Points System" 
          icon={Trophy}
          tooltip="Configure how points are awarded for match results"
        >
          <div className="space-y-4 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            {Object.entries(pointsConfig).map(([type, points]) => (
              <div key={type} className="flex items-center justify-between">
                <label className="text-gray-600 dark:text-gray-400 capitalize flex items-center gap-2">
                  {type === 'win' && <Trophy className="w-4 h-4" />}
                  {type === 'draw' && <span className="text-lg">•</span>}
                  {type === 'loss' && <X className="w-4 h-4" />}
                  {type} Points
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => handlePointsChange(type as keyof typeof pointsConfig, parseInt(e.target.value))}
                  className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  min="0"
                />
              </div>
            ))}
          </div>
        </SettingSection>

        {/* Tournament Format */}
        <SettingSection 
          title="Tournament Format" 
          icon={Calendar}
          tooltip="Choose between single round or home & away matches"
        >
          <div className="space-y-4 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex gap-4">
              <button
                onClick={() => handlePhaseChange('SINGLE')}
                className={`
                  flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2
                  ${phase === 'SINGLE'
                    ? 'border-accent text-accent bg-accent/5'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent/50 hover:text-accent/80'
                  }
                  transition-colors
                `}
              >
                <Trophy className="w-5 h-5" />
                <span className="font-medium">Single Round</span>
              </button>

              <button
                onClick={() => handlePhaseChange('HOME_AND_AWAY')}
                className={`
                  flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2
                  ${phase === 'HOME_AND_AWAY'
                    ? 'border-accent text-accent bg-accent/5'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent/50 hover:text-accent/80'
                  }
                  transition-colors
                `}
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Home & Away</span>
              </button>
            </div>
          </div>
        </SettingSection>
      </div>

      {/* Import/Export Section */}
      <SettingSection
        title="Share & Backup"
        icon={Save}
        tooltip="Share your tournament or create backups"
      >
        <div className="space-y-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Current Tournament Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
              Current Tournament
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Name</span>
                <span className="font-medium">{tournament.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Teams</span>
                <span className="font-medium">{tournament.teams.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Phase</span>
                <span className="font-medium capitalize">{tournament.phase.toLowerCase().replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Share Tournament Data
              </h4>
              
              <motion.button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Copy className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium group-hover:text-accent">Copy to Clipboard</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Quick share via text
                  </div>
                </div>
              </motion.button>

              <motion.button
                onClick={handleExport}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium group-hover:text-accent">Save as File</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Download as .json backup
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Import Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Load Tournament Data
              </h4>
              
              <motion.button
                onClick={handlePaste}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ClipboardPaste className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium group-hover:text-accent">Paste from Clipboard</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Load shared tournament text
                  </div>
                </div>
              </motion.button>

              <motion.button
                onClick={handleImportClick}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-colors group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Upload className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium group-hover:text-accent">Load from File</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Import from .json backup
                  </div>
                </div>
              </motion.button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Success/Error Messages */}
          <AnimatePresence>
            {importError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Import Failed</p>
                  <p className="text-sm">{importError}</p>
                </div>
                <button
                  onClick={() => setImportError(null)}
                  className="ml-auto p-1 hover:text-red-700 dark:hover:text-red-300 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SettingSection>

      {/* Reset Confirmation Dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200] backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4 mb-4 text-amber-500">
                <AlertTriangle className="w-6 h-6" />
                <h3 className={`${typography.h3}`}>Reset Settings?</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This will reset all settings to their default values. This action cannot be undone.
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Reset Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
