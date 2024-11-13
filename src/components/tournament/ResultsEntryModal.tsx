'use client';

import { useState } from 'react';
import { Modal } from '../Modal';
import { Team, Fixture } from '../../types/tournament';

interface ResultsEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (homeScore: number, awayScore: number) => void;
  homeTeam: Team;
  awayTeam: Team;
  fixture?: Fixture;
}

export function ResultsEntryModal({
  isOpen,
  onClose,
  onSave,
  homeTeam,
  awayTeam,
  fixture
}: ResultsEntryModalProps) {
  const [homeScore, setHomeScore] = useState<number>(fixture?.homeScore || 0);
  const [awayScore, setAwayScore] = useState<number>(fixture?.awayScore || 0);

  const handleSave = () => {
    onSave(homeScore, awayScore);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enter Match Result"
    >
      <div className="space-y-6">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Enter the final scores for this match
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="text-center">
            <div className="font-medium mb-2">{homeTeam.name}</div>
            <input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
              className="w-20 text-center px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="text-center text-2xl font-bold text-gray-400">
            vs
          </div>

          <div className="text-center">
            <div className="font-medium mb-2">{awayTeam.name}</div>
            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
              className="w-20 text-center px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Save Result
          </button>
        </div>
      </div>
    </Modal>
  );
}
