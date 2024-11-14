'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tournament } from '../types/tournament';
import { typography, status } from '../lib/design-system';
import { AlertTriangle } from 'lucide-react';

interface TournamentStatsProps {
  tournament: Tournament;
  selectedPlayerId?: string;
}

export function TournamentStats({ tournament, selectedPlayerId }: TournamentStatsProps) {
  const stats = useMemo(() => {
    const player = tournament.teams.find(t => t.id === selectedPlayerId);
    if (!player) return null;

    const matches = tournament.fixtures.filter(
      f => f.homeTeamId === player.id || f.awayTeamId === player.id
    );

    const playedFixtures = matches.filter(f => f.played);
    const totalFixtures = matches.length;
    const isPointBased = tournament.pointsConfig.type === 'POINTS';

    const wins = playedFixtures.filter(f => {
      if (isPointBased) {
        if (f.homeScore === undefined || f.awayScore === undefined) return false;
        const isHome = f.homeTeamId === player.id;
        const playerScore = isHome ? f.homeScore : f.awayScore;
        const opponentScore = isHome ? f.awayScore : f.homeScore;
        return playerScore > opponentScore;
      } else {
        return f.winner === player.id;
      }
    }).length;

    const goalsScored = playedFixtures.reduce((sum, f) => {
      if (f.homeScore === undefined || f.awayScore === undefined) return sum;
      const isHome = f.homeTeamId === player.id;
      return sum + (isHome ? f.homeScore : f.awayScore);
    }, 0);

    const goalsConceded = playedFixtures.reduce((sum, f) => {
      if (f.homeScore === undefined || f.awayScore === undefined) return sum;
      const isHome = f.homeTeamId === player.id;
      return sum + (isHome ? f.awayScore : f.homeScore);
    }, 0);

    const winRate = playedFixtures.length > 0
      ? (wins / playedFixtures.length) * 100
      : 0;

    const position = tournament.teams
      .sort((a, b) => b.points - a.points)
      .findIndex(t => t.id === player.id) + 1;

    const form = playedFixtures
      .slice(-5)
      .map(f => {
        if (isPointBased) {
          if (f.homeScore === undefined || f.awayScore === undefined) return 'E';
          const isHome = f.homeTeamId === player.id;
          const playerScore = isHome ? f.homeScore : f.awayScore;
          const opponentScore = isHome ? f.awayScore : f.homeScore;
          if (playerScore > opponentScore) return 'W';
          if (playerScore < opponentScore) return 'L';
          return 'D';
        } else {
          return f.winner === player.id ? 'W' : 'L';
        }
      })
      .reverse();

    const matchesRemaining = totalFixtures - playedFixtures.length;
    const nextMatch = matches.find(f => !f.played);
    const nextOpponent = nextMatch
      ? tournament.teams.find(t =>
          t.id === (nextMatch.homeTeamId === player.id
            ? nextMatch.awayTeamId
            : nextMatch.homeTeamId)
        )
      : null;

    return {
      played: playedFixtures.length,
      wins,
      losses: playedFixtures.length - wins,
      goalsScored,
      goalsConceded,
      goalDifference: goalsScored - goalsConceded,
      winRate,
      form,
      position,
      totalPlayers: tournament.teams.length,
      matchesRemaining,
      nextOpponent,
      tournamentPoints: player.points
    };
  }, [tournament, selectedPlayerId]);

  if (!selectedPlayerId) {
    return (
      <motion.div layout className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-full">
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
        </div>
        <div>
          <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-2`}>
            Select Your Player
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Choose your player from the dropdown menu above to view detailed statistics and track your tournament progress
          </p>
        </div>
      </motion.div>
    );
  }

  if (!stats) {
    return (
      <motion.div layout className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-full">
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
        </div>
        <div>
          <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-2`}>
            Invalid Player
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            The selected player could not be found in this tournament
          </p>
        </div>
      </motion.div>
    );
  }

  const statBox = `p-4 rounded-lg space-y-1 border`;

  return (
    <motion.div layout className="space-y-8">
      {/* Overview */}
      <div>
        <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-4`}>
          Tournament Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`${statBox} ${status.info.text} ${status.info.bg} ${status.info.border}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Position</div>
            <div className="text-2xl font-bold">
              {stats.position}<span className="text-sm font-normal">/{stats.totalPlayers}</span>
            </div>
          </div>
          <div className={`${statBox} ${status.info.text} ${status.info.bg} ${status.info.border}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Points</div>
            <div className="text-2xl font-bold">{stats.tournamentPoints}</div>
          </div>
          <div className={`${statBox} ${status.info.text} ${status.info.bg} ${status.info.border}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
            <div className="text-2xl font-bold">{Math.round(stats.winRate)}%</div>
          </div>
          <div className={`${statBox} ${status.info.text} ${status.info.bg} ${status.info.border}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Matches Remaining</div>
            <div className="text-2xl font-bold">{stats.matchesRemaining}</div>
          </div>
        </div>
      </div>

      {/* Match Stats */}
      <div>
        <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-4`}>
          Match Statistics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`${statBox} ${status.info.text} ${status.info.bg} ${status.info.border}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Matches Played</div>
            <div className="text-2xl font-bold">{stats.played}</div>
          </div>
          <div className={`${statBox} ${status.success.text} ${status.success.bg} ${status.success.border}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Wins</div>
            <div className="text-2xl font-bold">{stats.wins}</div>
          </div>
          <div className={`${statBox} ${status.error.text} ${status.error.bg} ${status.error.border}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Losses</div>
            <div className="text-2xl font-bold">{stats.losses}</div>
          </div>
          <div className={`${statBox} ${status.info.text} ${status.info.bg} ${status.info.border}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Goal Difference</div>
            <div className="text-2xl font-bold">{stats.goalDifference >= 0 ? '+' : ''}{stats.goalDifference}</div>
          </div>
        </div>
      </div>

      {/* Recent Form */}
      {stats.form.length > 0 && (
        <div>
          <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-4`}>
            Recent Form
          </h3>
          <div className="flex gap-2">
            {stats.form.map((result, i) => {
              const style = result === 'W' ? status.success : result === 'L' ? status.error : status.info;
              return (
                <div key={i} className={`
                  inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold
                  ${style.text} ${style.bg} ${style.border}
                `}>
                  {result}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next Match */}
      {stats.nextOpponent && (
        <div>
          <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-4`}>
            Next Match
          </h3>
          <div className={`${statBox} ${status.info.text} ${status.info.bg} ${status.info.border}`}>
            <div className="text-lg font-medium">vs {stats.nextOpponent.name}</div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
