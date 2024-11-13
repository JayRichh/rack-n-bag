'use client';

import { useState } from 'react';
import { Modal } from '../Modal';
import { Team, Fixture, Tournament } from '../../types/tournament';
import { Info } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ResultsEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (homeScore: number, awayScore: number) => void;
  homeTeam: Team;
  awayTeam: Team;
  fixture?: Fixture;
  tournament: Tournament;
}

const MAX_POINTS = 21; // Maximum points per game

export function ResultsEntryModal({
  isOpen,
  onClose,
  onSave,
  homeTeam,
  awayTeam,
  fixture,
  tournament
}: ResultsEntryModalProps) {
  const [homePoints, setHomePoints] = useState<number>(fixture?.homeScore || 0);
  const [awayPoints, setAwayPoints] = useState<number>(fixture?.awayScore || 0);
  const [error, setError] = useState<string>('');

  const validatePoints = (value: number): boolean => {
    if (value < 0) return false;
    if (value > MAX_POINTS) return false;
    return true;
  };

  const handlePointsChange = (value: number, isHome: boolean) => {
    setError('');
    
    if (!validatePoints(value)) {
      setError(`Points must be between 0 and ${MAX_POINTS}`);
      return;
    }

    if (isHome) {
      setHomePoints(value);
    } else {
      setAwayPoints(value);
    }
  };

  const handleSave = () => {
    if (!validatePoints(homePoints) || !validatePoints(awayPoints)) {
      setError(`Points must be between 0 and ${MAX_POINTS}`);
      return;
    }

    // Ensure at least one player has reached the winning score
    if (homePoints < MAX_POINTS && awayPoints < MAX_POINTS) {
      setError(`One player must reach ${MAX_POINTS} points to win`);
      return;
    }

    // Ensure winning margin is at least 2 points
    const pointsDiff = Math.abs(homePoints - awayPoints);
    if (pointsDiff < 2) {
      setError('Winning margin must be at least 2 points');
      return;
    }

    onSave(homePoints, awayPoints);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enter Match Result"
    >
      <div className="space-y-6">
        {/* Info Panel */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm space-y-2">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
            <Info className="w-4 h-4" />
            Point System Rules
          </div>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
            <li>Games are played to {MAX_POINTS} points</li>
            <li>Must win by 2 points</li>
            <li>Winner gets {tournament.pointsConfig.win} tournament points</li>
            {tournament.pointsConfig.draw !== undefined && (
              <li>Draw awards {tournament.pointsConfig.draw} tournament points</li>
            )}
            <li>Loser gets {tournament.pointsConfig.loss} tournament points</li>
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="text-center">
            <div className="font-medium mb-2">{homeTeam.name}</div>
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <input
                    type="number"
                    min="0"
                    max={MAX_POINTS}
                    value={homePoints}
                    onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0, true)}
                    className={`w-20 text-center px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary
                      ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
                    `}
                    placeholder="0"
                  />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm"
                    sideOffset={5}
                  >
                    Enter points scored (0-{MAX_POINTS})
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>

          <div className="text-center text-2xl font-bold text-gray-400">
            vs
          </div>

          <div className="text-center">
            <div className="font-medium mb-2">{awayTeam.name}</div>
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <input
                    type="number"
                    min="0"
                    max={MAX_POINTS}
                    value={awayPoints}
                    onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0, false)}
                    className={`w-20 text-center px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary
                      ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
                    `}
                    placeholder="0"
                  />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm"
                    sideOffset={5}
                  >
                    Enter points scored (0-{MAX_POINTS})
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!error}
          >
            Save Result
          </button>
        </div>
      </div>
    </Modal>
  );
}
