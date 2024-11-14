'use client';

import { useState } from 'react';
import { Modal } from '../Modal';
import { Team, Fixture, Tournament, BracketPosition } from '../../types/tournament';
import { Info, Trophy, Shield } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ResultsEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (homeScore: number | undefined, awayScore: number | undefined, winnerId?: string) => void;
  homeTeam: Team;
  awayTeam: Team;
  fixture?: Fixture;
  tournament: Tournament;
}

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
  const [winner, setWinner] = useState<string | undefined>(fixture?.winner);
  const [error, setError] = useState<string>('');

  const isPointBased = tournament.pointsConfig.type === 'POINTS';
  const isSwissSystem = tournament.phase === 'SWISS_SYSTEM';
  const isElimination = tournament.phase === 'SINGLE_ELIMINATION';
  const currentRound = tournament.progress?.currentRound || 1;
  const bracket = fixture?.bracket || (isElimination ? 'WINNERS' as BracketPosition : undefined);

  const getBracketIcon = (bracket?: BracketPosition) => {
    switch (bracket) {
      case 'WINNERS':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'CONSOLATION':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const handlePointsChange = (value: number, isHome: boolean) => {
    setError('');
    if (value < 0) {
      setError('Points cannot be negative');
      return;
    }
    
    if (isHome) {
      setHomePoints(value);
    } else {
      setAwayPoints(value);
    }
  };

  const handleWinnerSelect = (teamId: string) => {
    setWinner(teamId);
    setError('');
  };

  const handleSave = () => {
    if (isPointBased) {
      onSave(homePoints, awayPoints);
    } else {
      if (!winner) {
        setError('Please select a winner');
        return;
      }
      onSave(undefined, undefined, winner);
    }
    onClose();
  };

  const modalTitle = (
    <div className="flex items-center gap-3">
      <span>Enter Match Result</span>
      {isElimination && bracket && (
        <div className="flex items-center gap-1 text-sm">
          {getBracketIcon(bracket)}
          <span className={bracket === 'WINNERS' ? 'text-amber-500' : 'text-blue-500'}>
            {bracket === 'WINNERS' ? 'Winners' : 'Consolation'}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
    >
      <div className="space-y-6 w-full">
        {/* Info Panel */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm space-y-2">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">Match Information</span>
          </div>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
            {(isSwissSystem || isElimination) && (
              <li>Round {currentRound}</li>
            )}
            <li>Winner gets {tournament.pointsConfig.win} tournament points</li>
            {tournament.pointsConfig.draw !== undefined && (
              <li>Draw awards {tournament.pointsConfig.draw} tournament points</li>
            )}
            <li>Loser gets {tournament.pointsConfig.loss} tournament points</li>
            {isSwissSystem && tournament.pointsConfig.byePoints !== undefined && (
              <li>Bye awards {tournament.pointsConfig.byePoints} tournament points</li>
            )}
          </ul>
        </div>

        {isPointBased ? (
          // Points-based scoring UI
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="text-center">
              <div className="font-medium mb-2 truncate">{homeTeam.name}</div>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <input
                      type="number"
                      min="0"
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
                      className="z-[100] bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm"
                      sideOffset={5}
                    >
                      Enter points scored
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>

            <div className="text-center text-2xl font-bold text-gray-400">
              vs
            </div>

            <div className="text-center">
              <div className="font-medium mb-2 truncate">{awayTeam.name}</div>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <input
                      type="number"
                      min="0"
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
                      className="z-[100] bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm"
                      sideOffset={5}
                    >
                      Enter points scored
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
          </div>
        ) : (
          // Win/Loss scoring UI
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleWinnerSelect(homeTeam.id)}
              className={`p-4 rounded-lg border-2 text-center transition-colors
                ${winner === homeTeam.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                }
              `}
            >
              <div className="font-medium truncate">{homeTeam.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Winner</div>
            </button>

            <button
              type="button"
              onClick={() => handleWinnerSelect(awayTeam.id)}
              className={`p-4 rounded-lg border-2 text-center transition-colors
                ${winner === awayTeam.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                }
              `}
            >
              <div className="font-medium truncate">{awayTeam.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Winner</div>
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-center text-sm text-red-500 min-h-[1.25rem]">
            {error}
          </div>
        )}

        {/* Tournament Phase Info */}
        {(isSwissSystem || isElimination) && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {isSwissSystem && (
              <div>
                Matches are paired based on current standings
              </div>
            )}
            {isElimination && (
              <div>
                Winner advances in the {bracket?.toLowerCase()} bracket
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!error || (!isPointBased && !winner)}
          >
            Save Result
          </button>
        </div>
      </div>
    </Modal>
  );
}
