'use client';

import { motion } from 'framer-motion';
import { typography } from '../lib/design-system';
import { Tournament } from '../types/tournament';
import { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Trophy, 
  Target, 
  Percent,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus as MinusIcon,
  BarChart3,
  Calendar,
  Users
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface TournamentStatsProps {
  tournament: Tournament;
  participantTeamId?: string;
}

export function TournamentStats({ tournament, participantTeamId }: TournamentStatsProps) {
  const stats = useMemo(() => {
    const team = tournament.teams.find(t => t.id === participantTeamId);
    if (!team) return null;

    const teamFixtures = tournament.fixtures.filter(
      f => f.homeTeamId === team.id || f.awayTeamId === team.id
    );

    const playedFixtures = teamFixtures.filter(f => f.played);
    const totalFixtures = teamFixtures.length;
    const wins = playedFixtures.filter(f => {
      const isHome = f.homeTeamId === team.id;
      const teamScore = isHome ? f.homeScore! : f.awayScore!;
      const opponentScore = isHome ? f.awayScore! : f.homeScore!;
      return teamScore > opponentScore;
    }).length;

    const pointsScored = playedFixtures.reduce((sum, f) => {
      const isHome = f.homeTeamId === team.id;
      return sum + (isHome ? f.homeScore! : f.awayScore!);
    }, 0);

    const pointsConceded = playedFixtures.reduce((sum, f) => {
      const isHome = f.homeTeamId === team.id;
      return sum + (isHome ? f.awayScore! : f.homeScore!);
    }, 0);

    const position = tournament.teams
      .sort((a, b) => b.points - a.points)
      .findIndex(t => t.id === team.id) + 1;

    const winRate = playedFixtures.length > 0 
      ? (wins / playedFixtures.length) * 100 
      : 0;

    const recentForm = playedFixtures
      .slice(-5)
      .map(f => {
        const isHome = f.homeTeamId === team.id;
        const teamScore = isHome ? f.homeScore! : f.awayScore!;
        const opponentScore = isHome ? f.awayScore! : f.homeScore!;
        if (teamScore > opponentScore) return 'W';
        if (teamScore < opponentScore) return 'L';
        return 'D';
      });

    const matchesRemaining = totalFixtures - playedFixtures.length;
    const nextMatch = teamFixtures.find(f => !f.played);
    const nextOpponent = nextMatch 
      ? tournament.teams.find(t => 
          t.id === (nextMatch.homeTeamId === team.id 
            ? nextMatch.awayTeamId 
            : nextMatch.homeTeamId)
        )
      : null;

    return {
      position,
      totalPlayers: tournament.teams.length,
      tournamentPoints: team.points,
      winRate,
      pointsDifference: pointsScored - pointsConceded,
      form: recentForm,
      matchesPlayed: playedFixtures.length,
      matchesRemaining,
      nextOpponent,
      pointsScored,
      pointsConceded
    };
  }, [tournament, participantTeamId]);

  if (!stats) return null;

  const StatCard = ({ 
    label, 
    value, 
    icon: Icon, 
    trend, 
    tooltip 
  }: { 
    label: string; 
    value: string | number; 
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
    tooltip?: string;
  }) => (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            {trend && (
              <div className={`flex items-center gap-1 text-sm font-medium
                ${trend === 'up' ? 'text-emerald-500' : 
                  trend === 'down' ? 'text-red-500' : 
                  'text-gray-400'}`}
              >
                {trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                 trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
                 <MinusIcon className="w-4 h-4" />}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {label}
            </div>
          </div>
        </motion.div>
      </Tooltip.Trigger>
      {tooltip && (
        <Tooltip.Portal>
          <Tooltip.Content 
            className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm"
            sideOffset={5}
          >
            {tooltip}
          </Tooltip.Content>
        </Tooltip.Portal>
      )}
    </Tooltip.Root>
  );

  const FormBadge = ({ result }: { result: string }) => {
    const colors = {
      W: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
      L: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
      D: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    };

    return (
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${colors[result as keyof typeof colors]}`}>
        {result}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className={`${typography.h2} text-black/90 dark:text-white/90 mb-2`}>
          Tournament Statistics
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Track your performance and tournament progress
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Position" 
          value={`${stats.position}/${stats.totalPlayers}`}
          icon={Trophy}
          trend={stats.position === 1 ? 'up' : stats.position === stats.totalPlayers ? 'down' : 'neutral'}
          tooltip="Current tournament position"
        />
        <StatCard 
          label="Tournament Points" 
          value={stats.tournamentPoints}
          icon={Target}
          tooltip="Total tournament points earned"
        />
        <StatCard 
          label="Win Rate" 
          value={`${Math.round(stats.winRate)}%`}
          icon={Percent}
          trend={stats.winRate > 50 ? 'up' : stats.winRate < 50 ? 'down' : 'neutral'}
          tooltip="Percentage of matches won"
        />
        <StatCard 
          label="Points Difference" 
          value={stats.pointsDifference}
          icon={Award}
          trend={stats.pointsDifference > 0 ? 'up' : stats.pointsDifference < 0 ? 'down' : 'neutral'}
          tooltip="Points scored minus points conceded"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Form */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100`}>Recent Form</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex gap-2">
            {stats.form.map((result, i) => (
              <FormBadge key={i} result={result} />
            ))}
          </div>
        </motion.div>

        {/* Matches Overview */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100`}>Matches</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Played</span>
              <span className="font-medium">{stats.matchesPlayed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Remaining</span>
              <span className="font-medium">{stats.matchesRemaining}</span>
            </div>
          </div>
        </motion.div>

        {/* Next Match */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100`}>Next Match</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          {stats.nextOpponent ? (
            <div className="text-gray-600 dark:text-gray-400">
              vs <span className="font-medium text-gray-900 dark:text-gray-100">{stats.nextOpponent.name}</span>
            </div>
          ) : (
            <div className="text-gray-600 dark:text-gray-400">
              No upcoming matches
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
