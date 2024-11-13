'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tournament, Team } from '../types/tournament';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  Users,
  User,
  ChevronDown,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  CheckCircle2
} from 'lucide-react';

interface ParticipantSelectorProps {
  tournament: Tournament;
  onSelect: (teamId: string) => void;
  variant?: 'default' | 'compact';
}

export function ParticipantSelector({ tournament, onSelect, variant = 'default' }: ParticipantSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);

  const playerStats = useMemo(() => {
    return tournament.teams.map(team => {
      const teamFixtures = tournament.fixtures.filter(
        f => f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id)
      );

      const stats = {
        played: teamFixtures.length,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        form: [] as ('W' | 'L' | 'D')[]
      };

      teamFixtures.forEach(fixture => {
        const isHome = fixture.homeTeamId === team.id;
        const teamScore = isHome ? fixture.homeScore! : fixture.awayScore!;
        const opponentScore = isHome ? fixture.awayScore! : fixture.homeScore!;

        if (teamScore > opponentScore) {
          stats.wins++;
          stats.form.push('W');
        } else if (teamScore < opponentScore) {
          stats.losses++;
          stats.form.push('L');
        } else {
          stats.draws++;
          stats.form.push('D');
        }

        stats.goalsFor += teamScore;
        stats.goalsAgainst += opponentScore;
      });

      // Keep only last 5 matches for form
      stats.form = stats.form.slice(-5);

      return {
        team,
        ...stats,
        goalDifference: stats.goalsFor - stats.goalsAgainst,
        winRate: stats.played > 0 ? (stats.wins / stats.played) * 100 : 0
      };
    });
  }, [tournament]);

  const handleSelect = (team: Team) => {
    setSelectedTeam(team);
    onSelect(team.id);
    setIsOpen(false);
  };

  const FormBadge = ({ result }: { result: 'W' | 'L' | 'D' }) => {
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
  };

  return (
    <Tooltip.Provider>
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between
            px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
            bg-white dark:bg-gray-800
            ${variant === 'compact' ? 'text-sm' : 'text-base'}
            hover:border-gray-300 dark:hover:border-gray-600
            transition-colors  overflow-hidden
          `}
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 dark:text-gray-100">
              {selectedTeam ? selectedTeam.name : 'Select Your Player'}
            </span>
          </div>
          <ChevronDown className={`
            w-4 h-4 text-gray-400
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `} />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
              style={{ overflowX: 'hidden' }}
            >
              <div className="max-h-64 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                {playerStats.map(({ team, wins, draws, losses, form }) => (
                  <Tooltip.Root key={team.id}>
                    <Tooltip.Trigger asChild>
                      <motion.button
                        className={`
                          w-full flex items-center justify-between px-4 py-2
                          ${team.id === selectedTeam?.id ? 'bg-accent/5 text-accent' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                          ${variant === 'compact' ? 'text-sm' : 'text-base'}
                          transition-colors
                        `}
                        onClick={() => handleSelect(team)}
                        onMouseEnter={() => setHoveredTeamId(team.id)}
                        onMouseLeave={() => setHoveredTeamId(null)}
                        whileHover={{ x: 4 }}
                        style={{ maxWidth: '100%' }}
                      >
                        <div className="flex items-center gap-2">
                          {team.id === selectedTeam?.id && (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span className="font-medium">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {form.map((result, i) => (
                            <FormBadge key={i} result={result} />
                          ))}
                        </div>
                      </motion.button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs"
                        sideOffset={5}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Record</span>
                            <span className="font-medium">
                              {wins}W - {draws}D - {losses}L
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Recent Form</span>
                            <div className="flex gap-1">
                              {form.map((result, i) => (
                                <FormBadge key={i} result={result} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Tooltip.Provider>
  );
}
