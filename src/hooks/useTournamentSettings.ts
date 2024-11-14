'use client';

import { useState, useCallback } from 'react';
import { Tournament, SwissSystemConfig, TournamentPhase } from '../types/tournament';

export const useTournamentSettings = (initialTournament: Tournament) => {
  const [tournament, setTournament] = useState(initialTournament);

  const updateSwissConfig = useCallback((updates: Partial<SwissSystemConfig>) => {
    setTournament(prev => ({
      ...prev,
      swissConfig: prev.swissConfig ? {
        ...prev.swissConfig,
        ...updates
      } : {
        maxRounds: Math.ceil(Math.log2(prev.teams.length)),
        byeHandling: 'RANDOM',
        tiebreakers: ['BUCHHOLZ', 'HEAD_TO_HEAD', 'WINS'],
        byePoints: 3,
        ...updates
      }
    }));
  }, []);

  const updatePhase = useCallback((phase: TournamentPhase) => {
    setTournament(prev => {
      const base = {
        ...prev,
        phase,
        progress: {
          ...prev.progress,
          phase,
          currentRound: 1,
          roundComplete: false,
          requiresNewPairings: false
        }
      };

      switch (phase) {
        case 'SWISS_SYSTEM':
          return {
            ...base,
            swissConfig: {
              maxRounds: Math.ceil(Math.log2(prev.teams.length)),
              byeHandling: 'RANDOM',
              tiebreakers: ['BUCHHOLZ', 'HEAD_TO_HEAD', 'WINS'],
              byePoints: prev.pointsConfig.byePoints || 3
            }
          };
        case 'SINGLE_ELIMINATION':
          return {
            ...base,
            teams: prev.teams.map(team => ({
              ...team,
              bracket: 'WINNERS',
              status: 'ACTIVE'
            }))
          };
        default:
          return base;
      }
    });
  }, []);

  const updatePointsConfig = useCallback((updates: Partial<Tournament['pointsConfig']>) => {
    setTournament(prev => ({
      ...prev,
      pointsConfig: {
        ...prev.pointsConfig,
        ...updates
      }
    }));
  }, []);

  const updateSeedMethod = useCallback((method: Tournament['seedMethod']) => {
    setTournament(prev => ({
      ...prev,
      seedMethod: method
    }));
  }, []);

  return {
    tournament,
    updateSwissConfig,
    updatePhase,
    updatePointsConfig,
    updateSeedMethod
  };
};
