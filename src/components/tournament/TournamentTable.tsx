'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { typography, containers } from '../../lib/design-system';
import { Tournament, Team, ScoringType } from '../../types/tournament';
import { useMemo, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info, TrendingDown, TrendingUp, Minus, ChevronUp, ChevronDown } from 'lucide-react';

interface PlayerStats extends Team {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  pointsScored: number;
  pointsConceded: number;
  pointsDifference: number;
  tournamentPoints: number;
  form: ('W' | 'L' | 'D')[];
  previousPosition?: number;
}

interface TournamentTableProps {
  tournament: Tournament;
  participantTeamId?: string;
}

const columnDefinitions = {
  position: { label: 'Position', tooltip: 'Current tournament position' },
  player: { label: 'Player', tooltip: 'Player name' },
  p: { label: 'P', tooltip: 'Games Played' },
  w: { label: 'W', tooltip: 'Wins' },
  d: { label: 'D', tooltip: 'Draws' },
  l: { label: 'L', tooltip: 'Losses' },
  pf: { label: 'PF', tooltip: 'Points For' },
  pa: { label: 'PA', tooltip: 'Points Against' },
  pd: { label: 'PD', tooltip: 'Points Difference' },
  pts: { label: 'PTS', tooltip: 'Tournament Points' }
};

type SortField = 'tournamentPoints' | 'pointsDifference' | 'pointsScored' | 'wins' | 'draws' | 'losses';
type SortDirection = 'asc' | 'desc';

function FormBadge({ result }: { result: 'W' | 'L' | 'D' }) {
  const colors = {
    W: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    L: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    D: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  };

  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${colors[result]}`}>
      {result}
    </span>
  );
}

function PositionIndicator({ current, previous }: { current: number; previous?: number }) {
  if (!previous || current === previous) {
    return <Minus className="w-4 h-4 text-gray-400" />;
  }

  if (current < previous) {
    return <TrendingUp className="w-4 h-4 text-emerald-500" />;
  }

  return <TrendingDown className="w-4 h-4 text-red-500" />;
}

export function TournamentTable({ tournament, participantTeamId }: TournamentTableProps) {
  const [sortField, setSortField] = useState<SortField>('tournamentPoints');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const isPointBased = tournament.pointsConfig.type === 'POINTS';

  const playerStats = useMemo<PlayerStats[]>(() => {
    return tournament.teams.map(team => {
      const teamFixtures = tournament.fixtures.filter(
        f => f.homeTeamId === team.id || f.awayTeamId === team.id
      );

      const stats = {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsScored: 0,
        pointsConceded: 0,
        tournamentPoints: 0,
        form: [] as ('W' | 'L' | 'D')[]
      };

      // Process fixtures in chronological order for form
      const playedFixtures = teamFixtures
        .filter(f => f.played)
        .sort((a, b) => new Date(a.datePlayed!).getTime() - new Date(b.datePlayed!).getTime());

      playedFixtures.forEach(fixture => {
        const isHome = fixture.homeTeamId === team.id;
        stats.gamesPlayed++;

        if (isPointBased) {
          const teamScore = isHome ? fixture.homeScore! : fixture.awayScore!;
          const opponentScore = isHome ? fixture.awayScore! : fixture.homeScore!;
          stats.pointsScored += teamScore;
          stats.pointsConceded += opponentScore;

          if (teamScore > opponentScore) {
            stats.wins++;
            stats.tournamentPoints += tournament.pointsConfig.win;
            stats.form.push('W');
          } else if (teamScore < opponentScore) {
            stats.losses++;
            stats.tournamentPoints += tournament.pointsConfig.loss;
            stats.form.push('L');
          } else {
            stats.draws++;
            stats.tournamentPoints += tournament.pointsConfig.draw ?? 0;
            stats.form.push('D');
          }
        } else {
          // WIN_LOSS scoring
          const winner = fixture.winner;
          if (winner === team.id) {
            stats.wins++;
            stats.tournamentPoints += tournament.pointsConfig.win;
            stats.form.push('W');
          } else {
            stats.losses++;
            stats.tournamentPoints += tournament.pointsConfig.loss;
            stats.form.push('L');
          }
        }
      });

      // Keep only last 5 matches for form
      stats.form = stats.form.slice(-5);

      return {
        ...team,
        ...stats,
        pointsDifference: stats.pointsScored - stats.pointsConceded,
      };
    }).sort((a, b) => {
      const getValue = (player: PlayerStats) => player[sortField];
      const modifier = sortDirection === 'desc' ? -1 : 1;
      
      const diff = (getValue(a) - getValue(b)) * modifier;
      if (diff !== 0) return diff;
      
      // Secondary sorting
      if (isPointBased) {
        if (sortField !== 'pointsDifference') {
          const pdDiff = (b.pointsDifference - a.pointsDifference) * modifier;
          if (pdDiff !== 0) return pdDiff;
        }
        
        if (sortField !== 'pointsScored') {
          return (b.pointsScored - a.pointsScored) * modifier;
        }
      } else {
        // For WIN_LOSS, secondary sort by wins
        return (b.wins - a.wins) * modifier;
      }
      
      return 0;
    });
  }, [tournament, sortField, sortDirection, isPointBased]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'desc' ? 
      <ChevronDown className="w-4 h-4" /> : 
      <ChevronUp className="w-4 h-4" />;
  };

  // Get visible columns based on scoring type
  const visibleColumns = Object.entries(columnDefinitions).filter(([key]) => {
    if (!isPointBased) {
      // Hide points-related columns for WIN_LOSS scoring
      return !['pf', 'pa', 'pd', 'd'].includes(key);
    }
    return true;
  });

  return (
    <motion.div layout className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h2 
          className={`${typography.h2} text-black/90 dark:text-white/90 font-bold tracking-tight [text-shadow:_0_1px_1px_rgba(0,0,0,0.05)]`}
          layout
        >
          Player Rankings
        </motion.h2>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-600 dark:text-gray-400">Position gained</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-gray-600 dark:text-gray-400">Position lost</span>
          </div>
        </div>
      </div>

      <Tooltip.Provider delayDuration={300}>
        <motion.div className="overflow-x-auto rounded-xl border border-border shadow-sm" layout>
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/5">
              <tr>
                {visibleColumns.map(([key, { label, tooltip }]) => (
                  <th 
                    key={key}
                    className={`
                      px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider
                      ${['position', 'player'].includes(key) ? 'text-left' : 'text-center cursor-pointer hover:bg-muted/10'}
                    `}
                    onClick={() => !['position', 'player'].includes(key) && handleSort(key as SortField)}
                  >
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <div className={`flex items-center gap-1 ${!['position', 'player'].includes(key) ? 'justify-center' : ''}`}>
                          {label}
                          <Info className="w-4 h-4" />
                          {!['position', 'player'].includes(key) && getSortIcon(key as SortField)}
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg text-sm">
                          {tooltip}
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </th>
                ))}
                <th className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Form
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {playerStats.map((player, index) => (
                  <motion.tr 
                    key={player.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`
                      group transition-colors duration-150
                      ${player.id === participantTeamId ? 'bg-accent/5' : 'hover:bg-muted/5'}
                      ${expandedTeamId === player.id ? 'bg-muted/10' : ''}
                    `}
                    onClick={() => setExpandedTeamId(expandedTeamId === player.id ? null : player.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 w-12">
                      <div className="flex items-center gap-2">
                        {index + 1}
                        <PositionIndicator 
                          current={index + 1}
                          previous={player.previousPosition}
                        />
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium
                      ${player.id === participantTeamId
                        ? 'text-accent font-bold'
                        : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {player.name}
                      {player.id === participantTeamId && (
                        <span className="ml-2 text-xs text-accent/80">(You)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{player.gamesPlayed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{player.wins}</td>
                    {isPointBased && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{player.draws}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{player.losses}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{player.pointsScored}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{player.pointsConceded}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{player.pointsDifference}</td>
                      </>
                    )}
                    {!isPointBased && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{player.losses}</td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900 dark:text-gray-100">{player.tournamentPoints}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex justify-center gap-1">
                        {player.form.map((result, i) => (
                          <FormBadge key={i} result={result} />
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      </Tooltip.Provider>

      {/* Mobile View - Stacked Cards */}
      <div className="md:hidden space-y-4">
        {playerStats.map((player, index) => (
          <motion.div
            key={player.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`${containers.card} ${
              player.id === participantTeamId ? 'bg-accent/5' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold">{index + 1}</span>
                  <PositionIndicator 
                    current={index + 1}
                    previous={player.previousPosition}
                  />
                </div>
                <h3 className={`text-lg font-medium ${
                  player.id === participantTeamId ? 'text-accent' : ''
                }`}>
                  {player.name}
                  {player.id === participantTeamId && (
                    <span className="ml-2 text-xs text-accent/80">(You)</span>
                  )}
                </h3>
              </div>
              <div className="text-2xl font-bold">{player.tournamentPoints}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Played</div>
                <div className="text-lg">{player.gamesPlayed}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Won</div>
                <div className="text-lg">{player.wins}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Lost</div>
                <div className="text-lg">{player.losses}</div>
              </div>
            </div>

            {isPointBased && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Points For</div>
                  <div className="text-lg">{player.pointsScored}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Points Against</div>
                  <div className="text-lg">{player.pointsConceded}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">Form</div>
              <div className="flex gap-1">
                {player.form.map((result, i) => (
                  <FormBadge key={i} result={result} />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
