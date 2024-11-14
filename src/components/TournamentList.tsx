'use client';

import React, { Suspense, forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Tournament } from '../types/tournament';
import { storage } from '../utils/storage';
import { typography, containers } from '../lib/design-system';
import { Trash2, RotateCcw } from 'lucide-react';
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <h3 className={`${typography.h3} mb-4`}>{title}</h3>
        <p className="text-muted-foreground mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded hover:bg-accent/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
          >
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
          className={`${containers.card} cursor-pointer hover:shadow-lg group aspect-[16/9] flex flex-col bg-white/50 dark:bg-black/50 relative`}
          onClick={() => router.push(`/tournament/${tournament.id}?view=STATS`)}
        >
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-[calc(100vw*0.01)]">
              <div className="flex justify-between items-start">
                <h3 className={`${typography.h3} text-black/90 dark:text-white/90 group-hover:text-accent transition-colors duration-200 font-medium tracking-wide [text-shadow:_0_1px_1px_rgba(0,0,0,0.05)]`}>
                  {tournament.name}
                </h3>
                <div className="bg-accent/10 dark:bg-accent/20 text-accent px-2 py-1 rounded-full text-sm font-medium tracking-wide">
                  {tournament.teams.length} Players on Team
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="badge badge-secondary font-medium tracking-wide">
                  {tournament.phase === 'SINGLE' ? 'Single Round' : 'Home & Away'}
                </span>
              </div>
            </div>

            <div className="space-y-[calc(100vw*0.01)]">
              <div className="flex justify-between text-sm font-medium text-black/70 dark:text-white/70">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-muted/20 dark:bg-muted/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-auto">
              <p className="text-sm font-medium text-black/60 dark:text-white/60">
                Last modified: {new Date(tournament.dateModified).toLocaleDateString()}
              </p>
              <button
                onClick={handleDelete}
                className="p-2 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors z-10"
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
    <div className={`${containers.card} col-span-full flex flex-col items-center justify-center text-center aspect-[21/9] bg-white/50 dark:bg-black/50`}>
      <div className="space-y-[calc(100vw*0.01)]">
        <h3 className={`${typography.h3} text-black/90 dark:text-white/90 font-medium tracking-wide [text-shadow:_0_1px_1px_rgba(0,0,0,0.05)]`}>
          No Tournaments Yet
        </h3>
        <p className="text-black/70 dark:text-white/70 max-w-md font-medium">
          Create your first tournament to get started tracking scores and standings.
        </p>
        <button
          onClick={() => router.push('/tournament/new')}
          className="btn btn-accent font-medium tracking-wide hover:scale-[1.02] hover:-translate-y-[2px] active:scale-[0.98] transition-transform"
        >
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
    <div className="space-y-[calc(100vw*0.02)]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className={`${typography.h2} text-black/95 dark:text-white/95 font-bold tracking-tight [text-shadow:_0_1px_1px_rgba(0,0,0,0.05)]`}>
            Your Tournaments
          </h2>
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
          className="btn btn-accent font-medium tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.02] hover:-translate-y-[2px] active:scale-[0.98] transition-transform"
        >
          Create New Tournament
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[calc(100vw*0.02)]">
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
        message="Are you sure you want to reset all data? This will clear all tournaments and settings, and reload with fresh test data. This action cannot be undone."
      />
    </div>
  );
}
