'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tournament } from '../types/tournament';
import { typography, status } from '../lib/design-system';
import { AlertTriangle, Trophy, Shield, Circle, Clock, X } from 'lucide-react';

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
    const isSwissSystem = tournament.phase === 'SWISS_SYSTEM';
    const isElimination = tournament.phase === 'SINGLE_ELIMINATION';

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let byeMatches = 0;

    playedFixtures.forEach(f => {
      if (f.homeTeamId === 'BYE' || f.awayTeamId === 'BYE') {
        byeMatches++;
        wins++; // Count byes as wins for display
        return;
      }

      if (isPointBased) {
        if (f.homeScore === undefined || f.awayScore === undefined) return;
        const isHome = f.homeTeamId === player.id;
        const playerScore = isHome ? f.homeScore : f.awayScore;
        const opponentScore = isHome ? f.awayScore : f.homeScore;
        if (playerScore > opponentScore) wins++;
        else if (playerScore < opponentScore) losses++;
        else draws++;
      } else {
        if (f.winner === player.id) wins++;
        else losses++;
      }
    });

    const goalsScored = playedFixtures.reduce((sum, f) => {
      if (f.homeScore === undefined || f.awayScore === undefined) return sum;
      if (f.homeTeamId === 'BYE' || f.awayTeamId === 'BYE') return sum;
      const isHome = f.homeTeamId === player.id;
      return sum + (isHome ? f.homeScore : f.awayScore);
    }, 0);

    const goalsConceded = playedFixtures.reduce((sum, f) => {
      if (f.homeScore === undefined || f.awayScore === undefined) return sum;
      if (f.homeTeamId === 'BYE' || f.awayTeamId === 'BYE') return sum;
      const isHome = f.homeTeamId === player.id;
      return sum + (isHome ? f.awayScore : f.homeScore);
    }, 0);

    const winRate = (playedFixtures.length - byeMatches) > 0
      ? (wins - byeMatches) / (playedFixtures.length - byeMatches) * 100
      : 0;

    // Sort teams based on format-specific criteria
    const sortedTeams = [...tournament.teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      
      if (isSwissSystem) {
        // Use Buchholz score for Swiss system
        return (b.buchholzScore || 0) - (a.buchholzScore || 0);
      }
      
      if (isElimination) {
        // Sort by bracket first
        if (a.bracket !== b.bracket) {
          if (a.bracket === 'WINNERS') return -1;
          if (b.bracket === 'WINNERS') return 1;
        }
        if (a.status !== b.status) {
          return a.status === 'ELIMINATED' ? 1 : -1;
        }
      }
      
      return b.wins - a.wins;
    });

    const position = sortedTeams.findIndex(t => t.id === player.id) + 1;

    const form = playedFixtures
      .slice(-5)
      .map(f => {
        if (f.homeTeamId === 'BYE' || f.awayTeamId === 'BYE') return 'B';
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
      draws,
      losses,
      byeMatches,
      goalsScored,
      goalsConceded,
      goalDifference: goalsScored - goalsConceded,
      winRate,
      form,
      position,
      totalPlayers: tournament.teams.length,
      matchesRemaining,
      nextOpponent,
      tournamentPoints: player.points,
      buchholzScore: player.buchholzScore,
      bracket: player.bracket,
      eliminated: player.status === 'ELIMINATED',
      currentRound: tournament.progress?.currentRound || 1,
      totalRounds: tournament.progress?.totalRounds || 1,
      isSwissSystem,
      isElimination,
      isPointBased
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
      {/* Tournament Progress */}
      <div>
        <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-4`}>
          Tournament Progress
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`${statBox} ${status.info.text} ${status.info.bg} ${status.info.border}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Round</div>
            <div className="text-2xl font-bold">
              {stats.currentRound}<span className="text-sm font-normal">/{stats.totalRounds}</span>
            </div>
          </div>
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
          {stats.isSwissSystem && stats.buchholzScore !== undefined && (
            <div className={`${statBox} ${status.info.text} ${status.info.bg} ${status.info.border}`}>
              <div className="text-sm text-gray-600 dark:text-gray-400">Buchholz Score</div>
              <div className="text-2xl font-bold">{stats.buchholzScore}</div>
            </div>
          )}
          {stats.isElimination && (
            <div className={`${statBox} ${
              stats.eliminated ? status.error.text : 
              stats.bracket === 'WINNERS' ? status.success.text : status.info.text
            } ${
              stats.eliminated ? status.error.bg :
              stats.bracket === 'WINNERS' ? status.success.bg : status.info.bg
            } ${
              stats.eliminated ? status.error.border :
              stats.bracket === 'WINNERS' ? status.success.border : status.info.border
            }`}>
              <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
              <div className="text-lg font-bold flex items-center gap-2">
                {stats.eliminated ? (
                  'Eliminated'
                ) : stats.bracket === 'WINNERS' ? (
                  <>
                    <Trophy className="w-4 h-4" />
                    Winners
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Consolation
                  </>
                )}
              </div>
            </div>
          )}
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
            <div className="text-2xl font-bold">
              {stats.played}
              {stats.byeMatches > 0 && (
                <span className="text-sm font-normal ml-1">({stats.byeMatches} bye)</span>
              )}
            </div>
          </div>
          <div className={`${statBox} ${status.success.text} ${status.success.bg} ${status.success.border}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Wins</div>
            <div className="text-2xl font-bold">
              {stats.wins}
              {stats.byeMatches > 0 && (
                <span className="text-sm font-normal ml-1">({stats.byeMatches} bye)</span>
              )}
            </div>
          </div>
          {stats.isPointBased && (
            <div className={`${statBox} ${status.warning.text} ${status.warning.bg} ${status.warning.border}`}>
              <div className="text-sm text-gray-600 dark:text-gray-400">Draws</div>
              <div className="text-2xl font-bold">{stats.draws}</div>
            </div>
          )}
          <div className={`${statBox} ${status.error.text} ${status.error.bg} ${status.error.border}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Losses</div>
            <div className="text-2xl font-bold">{stats.losses}</div>
          </div>
          <div className={`${statBox} ${status.info.text} ${status.info.bg} ${status.info.border}`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
            <div className="text-2xl font-bold">{Math.round(stats.winRate)}%</div>
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
              let style = status.info;
              let icon = null;

              switch (result) {
                case 'W':
                  style = status.success;
                  icon = <Trophy className="w-4 h-4" />;
                  break;
                case 'L':
                  style = status.error;
                  icon = <X className="w-4 h-4" />;
                  break;
                case 'D':
                  style = status.warning;
                  icon = <Circle className="w-4 h-4" />;
                  break;
                case 'B':
                  style = status.info;
                  icon = <Clock className="w-4 h-4" />;
                  break;
              }

              return (
                <div key={i} className={`
                  inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold
                  ${style.text} ${style.bg} ${style.border}
                `}>
                  {icon || result}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next Match */}
      {stats.nextOpponent && !stats.eliminated && (
        <div>
          <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100 mb-4`}>
            Next Match
          </h3>
          <div className={`${statBox} ${status.info.text} ${status.info.bg} ${status.info.border}`}>
            <div className="text-lg font-medium">
              {stats.nextOpponent.id === 'BYE' ? 'Bye Round' : `vs ${stats.nextOpponent.name}`}
            </div>
            {stats.isElimination && (
              <div className="text-sm text-gray-500">
                {stats.bracket === 'WINNERS' ? 'Winners Bracket' : 'Consolation Bracket'}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
