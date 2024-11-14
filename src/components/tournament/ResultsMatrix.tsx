'use client';

import { motion } from 'framer-motion';
import { typography } from '../../lib/design-system';
import { Tournament, Team, Fixture, BracketPosition } from '../../types/tournament';
import { useMemo, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  CheckCircle2,
  XCircle,
  CircleDot,
  Clock,
  AlertTriangle,
  Trophy,
  Shield
} from 'lucide-react';
import { ResultsEntryModal } from './ResultsEntryModal';

interface ResultsMatrixProps {
  tournament: Tournament;
  selectedPlayerId?: string;
  onUpdateResult?: (fixture: Fixture, homeScore: number | undefined, awayScore: number | undefined, winnerId?: string) => void;
}

type MatchResult = 'WIN' | 'LOSS' | 'DRAW' | 'PENDING' | 'ERROR';

function getMatchResult(fixture: Fixture, teamId: string, isPointBased: boolean): MatchResult {
  if (!fixture.played) return 'PENDING';
  
  if (isPointBased) {
    if (fixture.homeScore === undefined || fixture.awayScore === undefined) return 'ERROR';
    
    const isHome = fixture.homeTeamId === teamId;
    const teamScore = isHome ? fixture.homeScore : fixture.awayScore;
    const opponentScore = isHome ? fixture.awayScore : fixture.homeScore;
    
    if (teamScore > opponentScore) return 'WIN';
    if (teamScore < opponentScore) return 'LOSS';
    return 'DRAW';
  } else {
    // WIN_LOSS scoring
    if (!fixture.winner) return 'ERROR';
    return fixture.winner === teamId ? 'WIN' : 'LOSS';
  }
}

function getResultColor(result: MatchResult, isDark: boolean = false) {
  switch (result) {
    case 'WIN':
      return isDark ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
    case 'LOSS':
      return isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700';
    case 'DRAW':
      return isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700';
    case 'ERROR':
      return isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700';
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
    case 'ERROR':
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

function getBracketIcon(bracket?: BracketPosition) {
  switch (bracket) {
    case 'WINNERS':
      return <Trophy className="w-4 h-4 text-amber-500" />;
    case 'CONSOLATION':
      return <Shield className="w-4 h-4 text-blue-500" />;
    default:
      return null;
  }
}

function getTeamStreak(fixtures: Tournament['fixtures'], teamId: string, isPointBased: boolean): { type: MatchResult; count: number } | null {
  const teamFixtures = fixtures
    .filter(f => f.played && (f.homeTeamId === teamId || f.awayTeamId === teamId))
    .sort((a, b) => new Date(b.datePlayed!).getTime() - new Date(a.datePlayed!).getTime());

  if (teamFixtures.length === 0) return null;

  let streakType: MatchResult | null = null;
  let streakCount = 0;

  for (const fixture of teamFixtures) {
    const result = getMatchResult(fixture, teamId, isPointBased);
    if (result === 'ERROR' || result === 'PENDING') continue;

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

export function ResultsMatrix({ tournament, selectedPlayerId, onUpdateResult }: ResultsMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [selectedFixture, setSelectedFixture] = useState<{
    fixture?: Fixture;
    homeTeam: Team;
    awayTeam: Team;
  } | null>(null);

  const isPointBased = tournament.pointsConfig.type === 'POINTS';
  const isSwissSystem = tournament.phase === 'SWISS_SYSTEM';
  const isElimination = tournament.phase === 'SINGLE_ELIMINATION';
  const currentRound = tournament.progress?.currentRound || 1;

  // Validate tournament data
  if (!tournament?.teams?.length || !tournament?.fixtures) {
    return (
      <motion.div layout className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-full">
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
        </div>
        <div>
          <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-2`}>
            Invalid Tournament Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            The tournament data appears to be incomplete or malformed. Please ensure all required data is present.
          </p>
        </div>
      </motion.div>
    );
  }

  const playerStats = useMemo(() => {
    return tournament.teams.map(player => {
      const streak = getTeamStreak(tournament.fixtures, player.id, isPointBased);
      return {
        ...player,
        streak
      };
    });
  }, [tournament, isPointBased]);

  const getFixture = (homeTeamId: string, awayTeamId: string) => {
    return tournament.fixtures.find(
      f => f.homeTeamId === homeTeamId && f.awayTeamId === awayTeamId
    );
  };

  const isFixtureInCurrentRound = (fixture?: Fixture) => {
    if (!fixture) return false;
    if (!isSwissSystem && !isElimination) return true;
    return fixture.round === currentRound;
  };

  const handleCellClick = (homeTeam: Team, awayTeam: Team) => {
    if (!onUpdateResult) return;
    
    const fixture = getFixture(homeTeam.id, awayTeam.id);
    if (!isFixtureInCurrentRound(fixture)) return;
    
    setSelectedFixture({ fixture, homeTeam, awayTeam });
  };

  const handleSaveResult = (homeScore: number | undefined, awayScore: number | undefined, winnerId?: string) => {
    if (!selectedFixture || !onUpdateResult) return;

    const { fixture, homeTeam, awayTeam } = selectedFixture;
    const updatedFixture: Fixture = fixture || {
      id: `f${Math.random().toString(36).slice(2, 6)}`,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      played: true,
      round: currentRound,
      bracket: isElimination ? 'WINNERS' : undefined,
      datePlayed: new Date().toISOString()
    };

    onUpdateResult(updatedFixture, homeScore, awayScore, winnerId);
    setSelectedFixture(null);
  };

  return (
    <motion.div layout className="flex flex-col h-full min-h-[600px] max-w-[100vw]">
      <div className="flex-none space-y-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className={`${typography.h2} text-black/90 dark:text-white/90 mb-2`}>
              Results Grid
              {isSwissSystem && (
                <span className="ml-2 text-sm text-gray-500">
                  Round {currentRound}
                </span>
              )}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isSwissSystem 
                ? 'View and update matches for the current round'
                : 'View and update match results'
              }
            </p>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 text-sm flex-wrap">
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
            {isPointBased && (
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${getResultColor('DRAW')}`}>
                  <CircleDot className="w-4 h-4" />
                </div>
                <span className="text-gray-600 dark:text-gray-400">Draw</span>
              </div>
            )}
            {isElimination && (
              <>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-gray-600 dark:text-gray-400">Winners</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">Consolation</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Tooltip.Provider delayDuration={300}>
        <motion.div layout className="flex-1 relative overflow-x-auto rounded-xl border border-border shadow-sm">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-4 py-3 text-left border-b border-r border-border">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Players
                    </div>
                  </th>
                  {playerStats.map(player => (
                    <th 
                      key={player.id}
                      className="px-4 py-3 border-b border-r border-border"
                    >
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <div className={`
                            flex flex-col items-center gap-2 
                            ${player.id === selectedPlayerId ? 'text-accent' : 'text-gray-900 dark:text-gray-100'}
                            ${player.status === 'ELIMINATED' ? 'opacity-50' : ''}
                          `}>
                            <span className="text-xs font-medium whitespace-nowrap">
                              {player.name}
                            </span>
                            {isElimination && player.bracket && (
                              <div className="flex items-center gap-1">
                                {getBracketIcon(player.bracket)}
                              </div>
                            )}
                            {player.streak && (
                              <div className={`
                                px-2 py-1 rounded-full text-xs font-medium
                                ${getResultColor(player.streak.type)}
                              `}>
                                {player.streak.count} {player.streak.type.charAt(0)}
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
                              {player.streak 
                                ? `${player.streak.count} match ${player.streak.type.toLowerCase()} streak`
                                : 'No current streak'
                              }
                              {isElimination && player.bracket && (
                                <div className="mt-1 text-xs">
                                  {player.bracket === 'WINNERS' ? 'Winners Bracket' : 'Consolation Bracket'}
                                </div>
                              )}
                            </div>
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {playerStats.map(homePlayer => (
                  <tr key={homePlayer.id}>
                    <th 
                      className={`
                        sticky left-0 z-10 bg-white dark:bg-gray-900
                        px-4 py-3 text-sm font-medium whitespace-nowrap
                        border-b border-r border-border
                        ${homePlayer.id === selectedPlayerId ? 'text-accent' : 'text-gray-900 dark:text-gray-100'}
                        ${homePlayer.status === 'ELIMINATED' ? 'opacity-50' : ''}
                      `}
                    >
                      {homePlayer.name}
                    </th>
                    {playerStats.map(awayPlayer => {
                      const fixture = getFixture(homePlayer.id, awayPlayer.id);
                      const cellId = `${homePlayer.id}-${awayPlayer.id}`;
                      const isCurrentRound = isFixtureInCurrentRound(fixture);
                      
                      if (homePlayer.id === awayPlayer.id) {
                        return (
                          <td 
                            key={cellId}
                            className="px-4 py-3 text-center bg-gray-50 dark:bg-gray-800/50 border-b border-r border-border"
                          >
                            -
                          </td>
                        );
                      }

                      const result = fixture ? getMatchResult(fixture, homePlayer.id, isPointBased) : 'PENDING';

                      return (
                        <td 
                          key={cellId}
                          className="p-0 border-b border-r border-border"
                          onMouseEnter={() => setHoveredCell(cellId)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <motion.div
                                className={`
                                  flex items-center justify-center gap-2 px-4 py-3
                                  ${getResultColor(result)}
                                  ${hoveredCell === cellId && onUpdateResult && isCurrentRound ? 'ring-1 ring-inset ring-primary' : ''}
                                  ${onUpdateResult && isCurrentRound ? 'cursor-pointer' : ''}
                                  ${!isCurrentRound ? 'opacity-50' : ''}
                                  transition-colors duration-200
                                `}
                                onClick={() => handleCellClick(homePlayer, awayPlayer)}
                              >
                                {fixture?.played ? (
                                  <>
                                    {result !== 'ERROR' && isPointBased ? (
                                      <span className="font-medium">
                                        {fixture.homeScore} - {fixture.awayScore}
                                      </span>
                                    ) : result !== 'ERROR' ? (
                                      <span className="font-medium">
                                        {result === 'WIN' ? 'W' : 'L'}
                                      </span>
                                    ) : (
                                      <span className="font-medium">ERR</span>
                                    )}
                                    {getResultIcon(result)}
                                    {isElimination && fixture.bracket && (
                                      <div className="ml-1">
                                        {getBracketIcon(fixture.bracket)}
                                      </div>
                                    )}
                                  </>
                                ) : isCurrentRound ? (
                                  <span className="text-gray-400 dark:text-gray-500">vs</span>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500">-</span>
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
                                      {homePlayer.name} vs {awayPlayer.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {new Date(fixture.datePlayed!).toLocaleDateString()}
                                    </div>
                                    {result !== 'ERROR' ? (
                                      isPointBased ? (
                                        <div className="text-sm font-medium">
                                          Final Score: {fixture.homeScore} - {fixture.awayScore}
                                        </div>
                                      ) : (
                                        <div className="text-sm font-medium">
                                          Winner: {fixture.winner === homePlayer.id ? homePlayer.name : awayPlayer.name}
                                        </div>
                                      )
                                    ) : (
                                      <div className="text-sm text-yellow-500">
                                        Invalid match data
                                      </div>
                                    )}
                                    {isElimination && fixture.bracket && (
                                      <div className="text-sm text-gray-500">
                                        {fixture.bracket === 'WINNERS' ? 'Winners Bracket' : 'Consolation Bracket'}
                                      </div>
                                    )}
                                    {(isSwissSystem || isElimination) && (
                                      <div className="text-sm text-gray-500">
                                        Round {fixture.round}
                                      </div>
                                    )}
                                  </div>
                                ) : isCurrentRound ? (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {onUpdateResult ? 'Click to enter result' : 'Match not played yet'}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    No match scheduled
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
        </motion.div>
      </Tooltip.Provider>

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
    </motion.div>
  );
}
