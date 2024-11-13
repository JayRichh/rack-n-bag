'use client';

import { motion } from 'framer-motion';
import { typography } from '../lib/design-system';
import { Tournament, Team, Fixture } from '../types/tournament';
import { useMemo, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  CheckCircle2,
  XCircle,
  CircleDot,
  Clock
} from 'lucide-react';
import { ResultsEntryModal } from './tournament/ResultsEntryModal';

interface ResultsMatrixProps {
  tournament: Tournament;
  participantTeamId?: string;
  onUpdateResult?: (fixture: Fixture, homeScore: number, awayScore: number) => void;
}

type MatchResult = 'WIN' | 'LOSS' | 'DRAW' | 'PENDING';

function getMatchResult(homeScore: number, awayScore: number): MatchResult {
  if (homeScore > awayScore) return 'WIN';
  if (homeScore < awayScore) return 'LOSS';
  return 'DRAW';
}

function getResultColor(result: MatchResult, isDark: boolean = false) {
  switch (result) {
    case 'WIN':
      return isDark ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
    case 'LOSS':
      return isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700';
    case 'DRAW':
      return isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700';
    default:
      return isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-500';
  }
}

function getResultIcon(result: MatchResult) {
  switch (result) {
    case 'WIN':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'LOSS':
      return <XCircle className="w-4 h-4" />;
    case 'DRAW':
      return <CircleDot className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

function getTeamStreak(fixtures: Tournament['fixtures'], teamId: string): { type: MatchResult; count: number } | null {
  const teamFixtures = fixtures
    .filter(f => f.played && (f.homeTeamId === teamId || f.awayTeamId === teamId))
    .sort((a, b) => new Date(b.datePlayed!).getTime() - new Date(a.datePlayed!).getTime());

  if (teamFixtures.length === 0) return null;

  let streakType: MatchResult | null = null;
  let streakCount = 0;

  for (const fixture of teamFixtures) {
    const isHome = fixture.homeTeamId === teamId;
    const result = getMatchResult(
      isHome ? fixture.homeScore! : fixture.awayScore!,
      isHome ? fixture.awayScore! : fixture.homeScore!
    );

    if (streakType === null) {
      streakType = result;
      streakCount = 1;
    } else if (result === streakType) {
      streakCount++;
    } else {
      break;
    }
  }

  return streakType ? { type: streakType, count: streakCount } : null;
}

export function ResultsMatrix({ tournament, participantTeamId, onUpdateResult }: ResultsMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [selectedFixture, setSelectedFixture] = useState<{
    fixture?: Fixture;
    homeTeam: Team;
    awayTeam: Team;
  } | null>(null);

  const teamStats = useMemo(() => {
    return tournament.teams.map(team => {
      const streak = getTeamStreak(tournament.fixtures, team.id);
      return {
        ...team,
        streak
      };
    });
  }, [tournament]);

  const getFixture = (homeTeamId: string, awayTeamId: string) => {
    return tournament.fixtures.find(
      f => f.homeTeamId === homeTeamId && f.awayTeamId === awayTeamId
    );
  };

  const handleCellClick = (homeTeam: Team, awayTeam: Team) => {
    if (!onUpdateResult) return;
    
    const fixture = getFixture(homeTeam.id, awayTeam.id);
    setSelectedFixture({ fixture, homeTeam, awayTeam });
  };

  const handleSaveResult = (homeScore: number, awayScore: number) => {
    if (!selectedFixture || !onUpdateResult) return;

    const { fixture, homeTeam, awayTeam } = selectedFixture;
    const updatedFixture: Fixture = fixture || {
      id: `f${Math.random().toString(36).slice(2, 6)}`,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      played: true,
      phase: 'HOME',
      datePlayed: new Date().toISOString()
    };

    onUpdateResult(updatedFixture, homeScore, awayScore);
  };

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="flex flex-col h-full">
        <div className="flex-none space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`${typography.h2} text-black/90 dark:text-white/90 mb-2`}>
                Results Grid
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                View and update match results
              </p>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${getResultColor('WIN')}`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-gray-600 dark:text-gray-400">Win</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${getResultColor('LOSS')}`}>
                  <XCircle className="w-4 h-4" />
                </div>
                <span className="text-gray-600 dark:text-gray-400">Loss</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${getResultColor('DRAW')}`}>
                  <CircleDot className="w-4 h-4" />
                </div>
                <span className="text-gray-600 dark:text-gray-400">Draw</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex-1 overflow-auto">
          <div className="absolute inset-0">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 text-left">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Teams
                    </div>
                  </th>
                  {teamStats.map(team => (
                    <th 
                      key={team.id}
                      className="px-6 py-4"
                    >
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <div className={`
                            flex flex-col items-center gap-2 
                            ${team.id === participantTeamId ? 'text-accent' : 'text-gray-900 dark:text-gray-100'}
                          `}>
                            <span className="text-xs font-medium whitespace-nowrap">
                              {team.name}
                            </span>
                            {team.streak && (
                              <div className={`
                                px-2 py-1 rounded-full text-xs font-medium
                                ${getResultColor(team.streak.type)}
                              `}>
                                {team.streak.count} {team.streak.type.charAt(0)}
                              </div>
                            )}
                          </div>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content 
                            className="z-50 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg"
                            sideOffset={5}
                          >
                            <div className="text-sm">
                              {team.streak 
                                ? `${team.streak.count} match ${team.streak.type.toLowerCase()} streak`
                                : 'No current streak'
                              }
                            </div>
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamStats.map(homeTeam => (
                  <tr key={homeTeam.id}>
                    <th 
                      className={`
                        sticky left-0 z-10 bg-white dark:bg-gray-900
                        px-6 py-4 text-sm font-medium whitespace-nowrap
                        ${homeTeam.id === participantTeamId ? 'text-accent' : 'text-gray-900 dark:text-gray-100'}
                      `}
                    >
                      {homeTeam.name}
                    </th>
                    {teamStats.map(awayTeam => {
                      const fixture = getFixture(homeTeam.id, awayTeam.id);
                      const cellId = `${homeTeam.id}-${awayTeam.id}`;
                      
                      if (homeTeam.id === awayTeam.id) {
                        return (
                          <td 
                            key={cellId}
                            className="px-4 py-3 text-center bg-gray-50 dark:bg-gray-800/50"
                          >
                            -
                          </td>
                        );
                      }

                      let result: MatchResult = 'PENDING';
                      if (fixture?.played) {
                        result = getMatchResult(fixture.homeScore!, fixture.awayScore!);
                      }

                      return (
                        <td 
                          key={cellId}
                          className="relative p-0"
                          onMouseEnter={() => setHoveredCell(cellId)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <motion.div
                                className={`
                                  flex items-center justify-center gap-2 p-3
                                  ${getResultColor(result)}
                                  ${hoveredCell === cellId && onUpdateResult ? 'ring-2 ring-primary ring-opacity-50' : ''}
                                  ${onUpdateResult ? 'cursor-pointer' : ''}
                                  transform-gpu
                                `}
                                onClick={() => handleCellClick(homeTeam, awayTeam)}
                                whileHover={{ scale: onUpdateResult ? 1.02 : 1 }}
                                transition={{ duration: 0.2 }}
                              >
                                {fixture?.played ? (
                                  <>
                                    <span className="font-medium">
                                      {fixture.homeScore} - {fixture.awayScore}
                                    </span>
                                    {getResultIcon(result)}
                                  </>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500">vs</span>
                                )}
                              </motion.div>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content 
                                className="z-50 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg"
                                sideOffset={5}
                              >
                                {fixture?.played ? (
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {homeTeam.name} vs {awayTeam.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {new Date(fixture.datePlayed!).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm font-medium">
                                      Final Score: {fixture.homeScore} - {fixture.awayScore}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {onUpdateResult ? 'Click to enter result' : 'Match not played yet'}
                                  </div>
                                )}
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedFixture && (
          <ResultsEntryModal
            isOpen={true}
            onClose={() => setSelectedFixture(null)}
            onSave={handleSaveResult}
            homeTeam={selectedFixture.homeTeam}
            awayTeam={selectedFixture.awayTeam}
            fixture={selectedFixture.fixture}
            tournament={tournament} 
          />
        )}
      </div>
    </Tooltip.Provider>
  );
}
