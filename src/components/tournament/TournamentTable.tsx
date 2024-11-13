'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { typography, containers } from '../../lib/design-system';
import { Tournament, Team } from '../../types/tournament';
import { useMemo, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info, TrendingDown, TrendingUp, Minus, ChevronUp, ChevronDown } from 'lucide-react';

interface TeamStats extends Team {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'L' | 'D')[];
  previousPosition?: number;
}

interface TournamentTableProps {
  tournament: Tournament;
  participantTeamId?: string;
}

const columnDefinitions = {
  position: { label: 'Position', tooltip: 'Current league position' },
  team: { label: 'Team', tooltip: 'Team name' },
  p: { label: 'P', tooltip: 'Games Played' },
  w: { label: 'W', tooltip: 'Wins' },
  d: { label: 'D', tooltip: 'Draws' },
  l: { label: 'L', tooltip: 'Losses' },
  gf: { label: 'GF', tooltip: 'Goals For' },
  ga: { label: 'GA', tooltip: 'Goals Against' },
  gd: { label: 'GD', tooltip: 'Goal Difference' },
  pts: { label: 'PTS', tooltip: 'Points' }
};

type SortField = 'points' | 'goalDifference' | 'goalsFor' | 'wins' | 'draws' | 'losses';
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
  const [sortField, setSortField] = useState<SortField>('points');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const teamStats = useMemo<TeamStats[]>(() => {
    return tournament.teams.map(team => {
      const teamFixtures = tournament.fixtures.filter(
        f => f.homeTeamId === team.id || f.awayTeamId === team.id
      );

      const stats = {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        form: [] as ('W' | 'L' | 'D')[]
      };

      // Process fixtures in chronological order for form
      const playedFixtures = teamFixtures
        .filter(f => f.played)
        .sort((a, b) => new Date(a.datePlayed!).getTime() - new Date(b.datePlayed!).getTime());

      playedFixtures.forEach(fixture => {
        const isHome = fixture.homeTeamId === team.id;
        const teamScore = isHome ? fixture.homeScore! : fixture.awayScore!;
        const opponentScore = isHome ? fixture.awayScore! : fixture.homeScore!;

        stats.gamesPlayed++;
        stats.goalsFor += teamScore;
        stats.goalsAgainst += opponentScore;

        if (teamScore > opponentScore) {
          stats.wins++;
          stats.points += tournament.pointsConfig.win;
          stats.form.push('W');
        } else if (teamScore < opponentScore) {
          stats.losses++;
          stats.points += tournament.pointsConfig.loss;
          stats.form.push('L');
        } else {
          stats.draws++;
          stats.points += tournament.pointsConfig.draw ?? 0;
          stats.form.push('D');
        }
      });

      // Keep only last 5 matches for form
      stats.form = stats.form.slice(-5);

      return {
        ...team,
        ...stats,
        goalDifference: stats.goalsFor - stats.goalsAgainst,
      };
    }).sort((a, b) => {
      const getValue = (team: TeamStats) => team[sortField];
      const modifier = sortDirection === 'desc' ? -1 : 1;
      
      const diff = (getValue(a) - getValue(b)) * modifier;
      if (diff !== 0) return diff;
      
      // Secondary sorting
      if (sortField !== 'goalDifference') {
        const gdDiff = (b.goalDifference - a.goalDifference) * modifier;
        if (gdDiff !== 0) return gdDiff;
      }
      
      if (sortField !== 'goalsFor') {
        return (b.goalsFor - a.goalsFor) * modifier;
      }
      
      return 0;
    });
  }, [tournament, sortField, sortDirection]);

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

  return (
    <motion.div layout className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h2 
          className={`${typography.h2} text-black/90 dark:text-white/90 font-bold tracking-tight [text-shadow:_0_1px_1px_rgba(0,0,0,0.05)]`}
          layout
        >
          Tournament Table
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
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div className="flex items-center gap-1">
                        {columnDefinitions.position.label}
                        <Info className="w-4 h-4" />
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg text-sm">
                        {columnDefinitions.position.tooltip}
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div className="flex items-center gap-1">
                        {columnDefinitions.team.label}
                        <Info className="w-4 h-4" />
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg text-sm">
                        {columnDefinitions.team.tooltip}
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </th>
                {Object.entries(columnDefinitions)
                  .filter(([key]) => !['position', 'team'].includes(key))
                  .map(([key, { label, tooltip }]) => (
                    <th 
                      key={key}
                      className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/10"
                      onClick={() => handleSort(key as SortField)}
                    >
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <div className="flex items-center justify-center gap-1">
                            {label}
                            <Info className="w-4 h-4" />
                            {getSortIcon(key as SortField)}
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
                {teamStats.map((team, index) => (
                  <motion.tr 
                    key={team.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`
                      group transition-colors duration-150
                      ${team.id === participantTeamId ? 'bg-accent/5' : 'hover:bg-muted/5'}
                      ${expandedTeamId === team.id ? 'bg-muted/10' : ''}
                    `}
                    onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 w-12">
                      <div className="flex items-center gap-2">
                        {index + 1}
                        <PositionIndicator 
                          current={index + 1}
                          previous={team.previousPosition}
                        />
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium
                      ${team.id === participantTeamId
                        ? 'text-accent font-bold'
                        : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {team.name}
                      {team.id === participantTeamId && (
                        <span className="ml-2 text-xs text-accent/80">(Your Team)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{team.gamesPlayed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{team.wins}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{team.draws}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{team.losses}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{team.goalsFor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{team.goalsAgainst}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-300">{team.goalDifference}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900 dark:text-gray-100">{team.points}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex justify-center gap-1">
                        {team.form.map((result, i) => (
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
        {teamStats.map((team, index) => (
          <motion.div
            key={team.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`${containers.card} ${
              team.id === participantTeamId ? 'bg-accent/5' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold">{index + 1}</span>
                  <PositionIndicator 
                    current={index + 1}
                    previous={team.previousPosition}
                  />
                </div>
                <h3 className={`text-lg font-medium ${
                  team.id === participantTeamId ? 'text-accent' : ''
                }`}>
                  {team.name}
                  {team.id === participantTeamId && (
                    <span className="ml-2 text-xs text-accent/80">(Your Team)</span>
                  )}
                </h3>
              </div>
              <div className="text-2xl font-bold">{team.points}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Played</div>
                <div className="text-lg">{team.gamesPlayed}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Won</div>
                <div className="text-lg">{team.wins}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Lost</div>
                <div className="text-lg">{team.losses}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">Form</div>
              <div className="flex gap-1">
                {team.form.map((result, i) => (
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
