import { useState, useCallback } from 'react';
import { Tournament, Fixture, Team } from '../types/tournament';
import { storage } from '../utils/storage';
import { 
  updateTournamentProgress, 
  advanceToNextRound, 
  calculateBuchholzScore,
  moveToConsolationBracket
} from '../utils/tournament-systems';
import { useToast } from '../components/ToastContext';

export function useTournamentProgress(tournament: Tournament) {
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateFixture = useCallback(async (
    fixture: Fixture,
    homeScore: number | undefined,
    awayScore: number | undefined,
    winnerId?: string
  ) => {
    setIsUpdating(true);
    try {
      const updatedFixture = {
        ...fixture,
        played: true,
        datePlayed: new Date().toISOString(),
        homeScore,
        awayScore,
        winner: winnerId
      };

      const existingFixtureIndex = tournament.fixtures.findIndex(f => 
        f.homeTeamId === fixture.homeTeamId && f.awayTeamId === fixture.awayTeamId
      );

      const updatedFixtures = existingFixtureIndex >= 0
        ? tournament.fixtures.map((f, i) => i === existingFixtureIndex ? updatedFixture : f)
        : [...tournament.fixtures, updatedFixture];

      // Update team stats
      const updatedTeams = tournament.teams.map(team => {
        const teamFixtures = updatedFixtures.filter(f => 
          f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id)
        );

        let wins = 0;
        let losses = 0;
        let points = 0;
        let buchholzScore = 0;

        teamFixtures.forEach(f => {
          const isHome = f.homeTeamId === team.id;
          
          if (f.homeTeamId === 'BYE' || f.awayTeamId === 'BYE') {
            // Handle bye matches
            points += tournament.pointsConfig.byePoints || tournament.swissConfig?.byePoints || 3;
            wins++;
            return;
          }

          if (tournament.pointsConfig.type === 'POINTS') {
            const teamScore = isHome ? f.homeScore! : f.awayScore!;
            const opponentScore = isHome ? f.awayScore! : f.homeScore!;

            if (teamScore > opponentScore) {
              wins++;
              points += tournament.pointsConfig.win;
            } else if (teamScore < opponentScore) {
              losses++;
              points += tournament.pointsConfig.loss;
            } else {
              points += tournament.pointsConfig.draw || 0;
            }
          } else {
            if (f.winner === team.id) {
              wins++;
              points += tournament.pointsConfig.win;
            } else {
              losses++;
              points += tournament.pointsConfig.loss;
            }
          }
        });

        // Calculate Buchholz score for Swiss system
        if (tournament.phase === 'SWISS_SYSTEM') {
          buchholzScore = calculateBuchholzScore(team, tournament.teams, updatedFixtures);
        }

        // Handle elimination status
        let status = team.status;
        let bracket = team.bracket;
        if (tournament.phase === 'SINGLE_ELIMINATION' && updatedFixture.bracket === 'WINNERS') {
          if (updatedFixture.winner && 
              (updatedFixture.homeTeamId === team.id || updatedFixture.awayTeamId === team.id) && 
              updatedFixture.winner !== team.id) {
            status = 'ELIMINATED';
            bracket = 'CONSOLATION';
          }
        }

        return {
          ...team,
          played: teamFixtures.length,
          wins,
          losses,
          points,
          buchholzScore,
          status,
          bracket
        };
      });

      const updatedTournament: Tournament = {
        ...tournament,
        teams: updatedTeams,
        fixtures: updatedFixtures,
        dateModified: new Date().toISOString()
      };

      // Update tournament progress
      updateTournamentProgress(updatedTournament);

      // Handle elimination bracket movement
      if (tournament.phase === 'SINGLE_ELIMINATION' && 
          updatedFixture.bracket === 'WINNERS' && 
          updatedFixture.winner) {
        const loserId = updatedFixture.winner === updatedFixture.homeTeamId 
          ? updatedFixture.awayTeamId 
          : updatedFixture.homeTeamId;
        moveToConsolationBracket(updatedTournament, loserId);
      }

      // Check if round is complete and advance if needed
      if (updatedTournament.progress.roundComplete) {
        advanceToNextRound(updatedTournament);
      }

      storage.saveTournament(updatedTournament);
      showToast('Match result updated successfully', 'success');

      return updatedTournament;
    } catch (error) {
      console.error('Failed to update match result:', error);
      showToast('Failed to update match result', 'error');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [tournament, showToast]);

  const getCurrentRoundFixtures = useCallback(() => {
    const currentRound = tournament.progress?.currentRound || 1;
    return tournament.fixtures.filter(f => f.round === currentRound);
  }, [tournament]);

  const getRoundStatus = useCallback(() => {
    const currentRound = tournament.progress?.currentRound || 1;
    const totalRounds = tournament.progress?.totalRounds || 1;
    const roundFixtures = getCurrentRoundFixtures();
    const roundComplete = roundFixtures.every(f => f.played);
    const roundProgress = roundFixtures.filter(f => f.played).length / roundFixtures.length;

    return {
      currentRound,
      totalRounds,
      roundComplete,
      roundProgress,
      requiresNewPairings: roundComplete && tournament.phase === 'SWISS_SYSTEM',
      bracketStage: tournament.progress?.bracketStage
    };
  }, [tournament, getCurrentRoundFixtures]);

  const getPlayerStatus = useCallback((teamId: string) => {
    const team = tournament.teams.find(t => t.id === teamId);
    if (!team) return null;

    const currentRoundFixtures = getCurrentRoundFixtures();
    const currentMatch = currentRoundFixtures.find(f => 
      f.homeTeamId === teamId || f.awayTeamId === teamId
    );

    return {
      played: team.played,
      wins: team.wins,
      losses: team.losses,
      points: team.points,
      buchholzScore: team.buchholzScore,
      bracket: team.bracket,
      eliminated: team.status === 'ELIMINATED',
      currentMatch: currentMatch ? {
        isHome: currentMatch.homeTeamId === teamId,
        opponent: currentMatch.homeTeamId === teamId ? currentMatch.awayTeamId : currentMatch.homeTeamId,
        played: currentMatch.played,
        significance: currentMatch.significance
      } : null
    };
  }, [tournament, getCurrentRoundFixtures]);

  return {
    updateFixture,
    getCurrentRoundFixtures,
    getRoundStatus,
    getPlayerStatus,
    isUpdating
  };
}
