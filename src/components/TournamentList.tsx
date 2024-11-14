'use client';

import React, { forwardRef, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Tournament } from '../types/tournament';
import { storage } from '../utils/storage';
import { typography, containers, interactive, status } from '../lib/design-system';
import { Trash2, RotateCcw, PlusCircle, Upload, Share2, Download, FileUp, Clipboard } from 'lucide-react';
import { clearAllStoredData } from '../utils/clear-storage';
import { useTournamentImportExport } from '../hooks/useTournamentImportExport';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFile: () => void;
  onImportClipboard: () => void;
  isLoading?: boolean;
}

function ImportModal({ isOpen, onClose, onImportFile, onImportClipboard, isLoading }: ImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        role="dialog"
        aria-labelledby="import-title"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`${containers.card} max-w-md w-full mx-4`}
      >
        <h3 id="import-title" className={`${typography.h3} mb-4`}>Import Tournament</h3>
        <div className="space-y-4">
          <button
            onClick={onImportFile}
            className={`${interactive.button.ghost} w-full justify-start`}
            disabled={isLoading}
          >
            <FileUp className="w-4 h-4 mr-2" />
            Import from File
            <span className="text-xs text-muted-foreground ml-auto">.json</span>
          </button>
          <button
            onClick={onImportClipboard}
            className={`${interactive.button.ghost} w-full justify-start`}
            disabled={isLoading}
          >
            <Clipboard className="w-4 h-4 mr-2" />
            Import from Share Code
            <span className="text-xs text-muted-foreground ml-auto">From clipboard</span>
          </button>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className={interactive.button.ghost} disabled={isLoading}>
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onExportFile: () => void;
  onExportShareCode: () => void;
  isLoading?: boolean;
}

function ExportModal({ isOpen, onClose, tournament, onExportFile, onExportShareCode, isLoading }: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        role="dialog"
        aria-labelledby="export-title"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`${containers.card} max-w-md w-full mx-4`}
      >
        <h3 id="export-title" className={`${typography.h3} mb-4`}>Share Tournament</h3>
        <div className="space-y-4">
          <button
            onClick={onExportFile}
            className={`${interactive.button.ghost} w-full justify-start`}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Download as File
            <span className="text-xs text-muted-foreground ml-auto">.json</span>
          </button>
          <button
            onClick={onExportShareCode}
            className={`${interactive.button.ghost} w-full justify-start`}
            disabled={isLoading}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Copy Share Code
            <span className="text-xs text-muted-foreground ml-auto">To clipboard</span>
          </button>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className={interactive.button.ghost} disabled={isLoading}>
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`${containers.card} max-w-md w-full mx-4`}
      >
        <h3 id="modal-title" className={`${typography.h3} mb-4`}>{title}</h3>
        <p id="modal-description" className="text-muted-foreground mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className={interactive.button.ghost}>
            Cancel
          </button>
          <button onClick={onConfirm} className={interactive.button.accent}>
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const TournamentCard = forwardRef<HTMLDivElement, { tournament: Tournament; onDelete: (id: string) => void; onShare: (tournament: Tournament) => void }>(
  ({ tournament, onDelete, onShare }, ref) => {
    const router = useRouter();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const completedMatches = tournament.fixtures.filter(f => f.played).length;
    const totalMatches = tournament.fixtures.length;
    const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteConfirm(true);
    };

    const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation();
      onShare(tournament);
    };

    const handleConfirmDelete = () => {
      onDelete(tournament.id);
      setShowDeleteConfirm(false);
    };

    return (
      <>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          className={`${containers.card} cursor-pointer group flex flex-col justify-between min-h-[200px]`}
          onClick={() => router.push(`/tournament/${tournament.id}?view=STATS`)}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <h3 className={`${typography.h3} group-hover:text-accent transition-colors duration-200 truncate flex-1`} title={tournament.name}>
                {tournament.name}
              </h3>
              <div className={`${status.info.bg} ${status.info.text} px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap`}>
                {tournament.teams.length} Teams
              </div>
            </div>

            <div className={`${status.success.bg} ${status.success.text} w-fit px-3 py-1 rounded-full text-xs font-medium`}>
              {tournament.phase === 'SINGLE' ? 'Single Round' : 'Home & Away'}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="relative h-2 bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-accent transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
            <p className={typography.tiny}>
              Last modified: {new Date(tournament.dateModified).toLocaleDateString()}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className={`${interactive.button.ghost} p-2 rounded-full hover:bg-accent/20 transition-colors`}
                aria-label="Share Tournament"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className={`${status.error.bg} ${status.error.text} p-2 rounded-full hover:bg-accent/20 transition-colors`}
                aria-label="Delete Tournament"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Tournament"
          message={`Are you sure you want to delete "${tournament.name}"? This action cannot be undone.`}
        />
      </>
    );
  }
);

TournamentCard.displayName = 'TournamentCard';

function EmptyState() {
  const router = useRouter();

  return (
    <div className={`${containers.card} col-span-full flex flex-col items-center justify-center text-center py-12`}>
      <div className="space-y-4">
        <h3 className={typography.h3}>No Tournaments Yet</h3>
        <p className={typography.body}>
          Create your first tournament to get started tracking scores and standings.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => router.push('/tournament/new')}
            className={interactive.button.accent}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Tournament
          </button>
        </div>
      </div>
    </div>
  );
}

export function TournamentList() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState(storage.getTournaments());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    importFromFile,
    importFromShareCode,
    exportToFile,
    exportToShareCode,
    isImporting,
    isExporting
  } = useTournamentImportExport();

  const handleDelete = (id: string) => {
    storage.deleteTournament(id);
    setTournaments(storage.getTournaments());
  };

  const handleReset = () => {
    clearAllStoredData();
    window.location.reload();
  };

  const handleShare = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setShowExportModal(true);
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
    setShowImportModal(false);
  };

  const handleImportClipboard = async () => {
    try {
      const tournaments = await importFromShareCode();
      setTournaments(tournaments);
      setShowImportModal(false);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const tournaments = await importFromFile(file);
      setTournaments(tournaments);
    } catch (error) {
      console.error('Import failed:', error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportFile = async () => {
    if (!selectedTournament) return;
    
    try {
      await exportToFile(selectedTournament);
      setShowExportModal(false);
      setSelectedTournament(null);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportShareCode = async () => {
    if (!selectedTournament) return;
    
    try {
      await exportToShareCode(selectedTournament);
      setShowExportModal(false);
      setSelectedTournament(null);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className={typography.h2}>Your Tournaments</h2>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-muted-foreground hover:text-accent transition-colors flex items-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
            aria-label="Import Tournament"
          />
          <button
            onClick={() => setShowImportModal(true)}
            className={interactive.button.ghost}
            title="Import an existing tournament"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Existing
          </button>
          <button
            onClick={() => router.push('/tournament/new')}
            className={interactive.button.accent}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Create New Tournament
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {tournaments.length === 0 ? (
            <EmptyState />
          ) : (
            tournaments.map(tournament => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onDelete={handleDelete}
                onShare={handleShare}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <DeleteConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="Reset All Data"
        message="Are you sure you want to reset all data? This will clear all tournaments and settings. This action cannot be undone."
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportFile={handleImportFile}
        onImportClipboard={handleImportClipboard}
        isLoading={isImporting}
      />

      {selectedTournament && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => {
            setShowExportModal(false);
            setSelectedTournament(null);
          }}
          tournament={selectedTournament}
          onExportFile={handleExportFile}
          onExportShareCode={handleExportShareCode}
          isLoading={isExporting}
        />
      )}
    </div>
  );
}
