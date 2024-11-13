'use client';

import { motion } from 'framer-motion';
import { typography } from '../../lib/design-system';
import { Tournament, Team, Fixture } from '../../types/tournament';
import { useMemo, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  CheckCircle2,
  XCircle,
  CircleDot,
  Clock,
  Info
} from 'lucide-react';
import { ResultsEntryModal } from './ResultsEntryModal';

interface ResultsMatrixProps {
  tournament: Tournament;
  participantTeamId?: string;
  onUpdateResult?: (fixture: Fixture, homeScore: number, awayScore: number) => void;
}

type GameResult = 'WIN' | 'LOSS' | 'DRAW' | 'PENDING';

function getGameResult(homeScore: number, awayScore: number): GameResult {
  if (homeScore > awayScore) return 'WIN';
  if (homeScore < awayScore) return 'LOSS';
  return 'DRAW';
}

function getResultColor(result: GameResult, isDark: boolean = false) {
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

function getResultIcon(result: GameResult) {
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

function getPlayerStreak(fixtures: Tournament['fixtures'], teamId: string): { type: GameResult; count: number } | null {
  const teamFixtures = fixtures
    .filter(f => f.played && (f.homeTeamId === teamId || f.awayTeamId === teamId))
    .sort((a, b) => new Date(b.datePlayed!).getTime() - new Date(a.datePlayed!).getTime());

  if (teamFixtures.length === 0) return null;

  let streakType: GameResult | null = null;
  let streakCount = 0;

  for (const fixture of teamFixtures) {
    const isHome = fixture.homeTeamId === teamId;
    const result = getGameResult(
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

  const playerStats = useMemo(() => {
    return tournament.teams.map(team => {
      const streak = getPlayerStreak(tournament.fixtures, team.id);
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

    updatedFixture.homeScore = homeScore;
    updatedFixture.awayScore = awayScore;
    updatedFixture.played = true;
    updatedFixture.datePlayed = new Date().toISOString();

    onUpdateResult(updatedFixture, homeScore, awayScore);
    setSelectedFixture(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`${typography.h2} text-black/90 dark:text-white/90 mb-2`}>
              Results Grid
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-gray-600 dark:text-gray-400">
                {onUpdateResult ? 'View and update game results' : 'View game results'}
              </p>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Info className="w-4 h-4" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs"
                      sideOffset={5}
                    >
                      <div className="space-y-2">
                        <p>Click on any cell to enter game points.</p>
                        <p>Winner gets {tournament.pointsConfig.win} tournament points</p>
                        {tournament.pointsConfig.draw !== undefined && (
                          <p>Draw awards {tournament.pointsConfig.draw} tournament points</p>
                        )}
                        <p>Loser gets {tournament.pointsConfig.loss} tournament points</p>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
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

      <div className="relative mt-6 min-h-[400px] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="absolute inset-0 overflow-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 text-left border-b border-gray-200 dark:border-gray-800">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Players
                  </div>
                </th>
                {playerStats.map(team => (
                  <th 
                    key={team.id}
                    className="px-6 py-4 border-b border-gray-200 dark:border-gray-800"
                  >
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
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {playerStats.map(homeTeam => (
                <tr key={homeTeam.id}>
                  <th 
                    className={`
                      sticky left-0 z-10 bg-white dark:bg-gray-900
                      px-6 py-4 text-sm font-medium whitespace-nowrap border-b border-gray-200 dark:border-gray-800
                      ${homeTeam.id === participantTeamId ? 'text-accent' : 'text-gray-900 dark:text-gray-100'}
                    `}
                  >
                    {homeTeam.name}
                  </th>
                  {playerStats.map(awayTeam => {
                    const fixture = getFixture(homeTeam.id, awayTeam.id);
                    const cellId = `${homeTeam.id}-${awayTeam.id}`;
                    
                    if (homeTeam.id === awayTeam.id) {
                      return (
                        <td 
                          key={cellId}
                          className="px-4 py-3 text-center bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800"
                        >
                          -
                        </td>
                      );
                    }

                    let result: GameResult = 'PENDING';
                    if (fixture?.played) {
                      result = getGameResult(fixture.homeScore!, fixture.awayScore!);
                    }

                    return (
                      <td 
                        key={cellId}
                        className="relative p-0 border-b border-gray-200 dark:border-gray-800"
                      >
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <div 
                                className="overflow-hidden"
                                onMouseEnter={() => setHoveredCell(cellId)}
                                onMouseLeave={() => setHoveredCell(null)}
                              >
                                <motion.div
                                  className={`
                                    flex items-center justify-center gap-2 p-3
                                    ${getResultColor(result)}
                                    ${hoveredCell === cellId && onUpdateResult ? 'ring-1 ring-inset ring-primary ring-opacity-50' : ''}
                                    ${onUpdateResult ? 'cursor-pointer' : ''}
                                    transform-gpu
                                  `}
                                  onClick={() => handleCellClick(homeTeam, awayTeam)}
                                  whileHover={onUpdateResult ? { scale: 1.02 } : undefined}
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
                              </div>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm"
                                sideOffset={5}
                              >
                                {fixture?.played ? (
                                  <>
                                    {homeTeam.name} {fixture.homeScore} - {fixture.awayScore} {awayTeam.name}
                                    <br />
                                    {onUpdateResult && 'Click to update points'}
                                  </>
                                ) : (
                                  onUpdateResult ? 'Click to enter points' : 'Game not played'
                                )}
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </Tooltip.Provider>
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
  );
}
