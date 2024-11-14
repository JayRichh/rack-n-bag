'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tournament, Team, BracketPosition } from '../types/tournament';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  User,
  ChevronDown,
  CheckCircle2,
  Trophy,
  Target,
  Info,
  Shield,
  XCircle,
  GitBranch,
  Calculator
} from 'lucide-react';

interface ParticipantSelectorProps {
  tournament: Tournament;
  onSelect: (playerId: string) => void;
  variant?: 'default' | 'compact';
}

export function ParticipantSelector({ tournament, onSelect, variant = 'default' }: ParticipantSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Team | null>(null);
  const isPointBased = tournament.pointsConfig.type === 'POINTS';
  const isElimination = tournament.phase === 'SINGLE_ELIMINATION';
  const isSwissSystem = tournament.phase === 'SWISS_SYSTEM';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPlayerId = localStorage.getItem(`tournament_${tournament.id}_selected_player`);
      if (storedPlayerId) {
        const player = tournament.teams.find(t => t.id === storedPlayerId);
        if (player) {
          setSelectedPlayer(player);
          onSelect(player.id);
        }
      }
    }
  }, [tournament.id, tournament.teams, onSelect]);

  const playerStats = useMemo(() => {
    return tournament.teams.map(player => {
      const matches = tournament.fixtures.filter(
        f => f.played && (f.homeTeamId === player.id || f.awayTeamId === player.id)
      );

      const stats = {
        played: matches.length,
        wins: 0,
        draws: 0,
        losses: 0,
        points: player.points || 0,
        buchholzScore: player.buchholzScore,
        form: [] as ('W' | 'L' | 'D')[],
        bracket: player.bracket,
        eliminated: player.status === 'ELIMINATED'
      };

      matches.forEach(match => {
        if (isPointBased) {
          const isHome = match.homeTeamId === player.id;
          const playerScore = isHome ? match.homeScore! : match.awayScore!;
          const opponentScore = isHome ? match.awayScore! : match.homeScore!;

          if (playerScore > opponentScore) {
            stats.wins++;
            stats.form.push('W');
          } else if (playerScore < opponentScore) {
            stats.losses++;
            stats.form.push('L');
          } else {
            stats.draws++;
            stats.form.push('D');
          }
        } else {
          if (match.winner === player.id) {
            stats.wins++;
            stats.form.push('W');
          } else {
            stats.losses++;
            stats.form.push('L');
          }
        }
      });

      stats.form = stats.form.slice(-3);

      return {
        player,
        ...stats
      };
    }).sort((a, b) => {
      if (isElimination) {
        // Sort by bracket first, then by elimination status
        if (a.bracket !== b.bracket) {
          if (a.bracket === 'WINNERS') return -1;
          if (b.bracket === 'WINNERS') return 1;
        }
        if (a.eliminated !== b.eliminated) {
          return a.eliminated ? 1 : -1;
        }
      }

      if (isSwissSystem && a.buchholzScore !== b.buchholzScore) {
        return (b.buchholzScore || 0) - (a.buchholzScore || 0);
      }

      return b.points - a.points || b.wins - a.wins || a.player.name.localeCompare(b.player.name);
    });
  }, [tournament, isPointBased, isElimination, isSwissSystem]);

  const handleSelect = (player: Team) => {
    setSelectedPlayer(player);
    onSelect(player.id);
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`tournament_${tournament.id}_selected_player`, player.id);
    }
  };

  const getBracketIcon = (bracket?: BracketPosition, eliminated?: boolean) => {
    if (eliminated) return <XCircle className="w-4 h-4 text-red-500" />;
    if (bracket === 'WINNERS') return <Trophy className="w-4 h-4 text-amber-500" />;
    if (bracket === 'CONSOLATION') return <Shield className="w-4 h-4 text-blue-500" />;
    return null;
  };

  const FormBadge = ({ result }: { result: 'W' | 'L' | 'D' }) => {
    const colors = {
      W: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
      L: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
      D: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    };

    return (
      <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-medium ${colors[result]}`}>
        {result}
      </span>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Participant Focus
        </span>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button className="inline-flex items-center justify-center rounded-full p-0.5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
              <Info className="h-4 w-4" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="z-50 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg max-w-[250px] text-sm"
              sideOffset={5}
            >
              Select a participant to highlight their results and performance
              <Tooltip.Arrow className="fill-white dark:fill-gray-800" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>

      <Tooltip.Provider delayDuration={200}>
        <div className="relative">
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              w-full flex items-center justify-between
              px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-800 shadow-sm
              ${variant === 'compact' ? 'text-sm' : 'text-base'}
              hover:border-gray-300 dark:hover:border-gray-600
              transition-colors
            `}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {selectedPlayer ? selectedPlayer.name : 'Select Participant'}
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
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 w-full mt-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
              >
                <div className="max-h-[280px] overflow-y-auto">
                  {playerStats.map(({ player, wins, draws, losses, points, buchholzScore, form, bracket, eliminated }) => (
                    <Tooltip.Root key={player.id}>
                      <Tooltip.Trigger asChild>
                        <motion.button
                          className={`
                            w-full flex items-center justify-between px-3 py-2.5
                            ${eliminated ? 'opacity-50' : ''}
                            ${player.id === selectedPlayer?.id ? 'bg-accent/5 text-accent' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                            ${variant === 'compact' ? 'text-sm' : 'text-base'}
                            transition-colors
                          `}
                          onClick={() => handleSelect(player)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {player.id === selectedPlayer?.id ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                            ) : (
                              getBracketIcon(bracket, eliminated)
                            )}
                            <span className="font-medium truncate">{player.name}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {form.length > 0 && (
                              <div className="flex items-center gap-1">
                                {form.map((result, i) => (
                                  <FormBadge key={i} result={result} />
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="z-50 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg max-w-[200px]"
                          sideOffset={5}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-accent" />
                              <span className="text-sm font-medium">
                                {wins} {wins === 1 ? 'Win' : 'Wins'}
                              </span>
                            </div>
                            {isPointBased && draws > 0 && (
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">
                                  {draws} {draws === 1 ? 'Draw' : 'Draws'}
                                </span>
                              </div>
                            )}
                            {isSwissSystem && buchholzScore !== undefined && (
                              <div className="flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">
                                  Buchholz: {buchholzScore}
                                </span>
                              </div>
                            )}
                            {isElimination && bracket && (
                              <div className="flex items-center gap-2">
                                <GitBranch className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">
                                  {bracket === 'WINNERS' ? 'Winners Bracket' : 'Consolation Bracket'}
                                </span>
                              </div>
                            )}
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {form.length > 0 ? 'Last 3 matches shown' : 'No matches played'}
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
    </div>
  );
}
