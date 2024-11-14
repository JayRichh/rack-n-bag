'use client';

import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Tournament } from '../types/tournament';
import { storage } from '../utils/storage';
import { typography, containers, interactive, status } from '../lib/design-system';
import { Trash2, RotateCcw, PlusCircle } from 'lucide-react';
import { clearAllStoredData } from '../utils/clear-storage';

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

const TournamentCard = forwardRef<HTMLDivElement, { tournament: Tournament; onDelete: (id: string) => void }>(
  ({ tournament, onDelete }, ref) => {
    const router = useRouter();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const completedMatches = tournament.fixtures.filter(f => f.played).length;
    const totalMatches = tournament.fixtures.length;
    const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteConfirm(true);
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
            <button
              onClick={handleDelete}
              className={`${status.error.bg} ${status.error.text} p-2 rounded-full hover:bg-accent/20 transition-colors`}
              aria-label="Delete Tournament"
            >
              <Trash2 className="w-4 h-4" />
            </button>
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
        <button
          onClick={() => router.push('/tournament/new')}
          className={interactive.button.accent}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Tournament
        </button>
      </div>
    </div>
  );
}

export function TournamentList() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState(storage.getTournaments());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleDelete = (id: string) => {
    storage.deleteTournament(id);
    setTournaments(storage.getTournaments());
  };

  const handleReset = () => {
    clearAllStoredData();
    window.location.reload();
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
        <button
          onClick={() => router.push('/tournament/new')}
          className={interactive.button.accent}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create New Tournament
        </button>
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
    </div>
  );
}
