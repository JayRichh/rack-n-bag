'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tournament, Fixture, Team } from '../types/tournament';
import { TournamentSettings as Settings, defaultTournamentSettings } from '../types/settings';
import { ResultsMatrix } from './tournament/ResultsMatrix';
import { TournamentStats } from './TournamentStats';
import { storage } from '../utils/storage';
import { TournamentHeader, ViewMode } from './tournament/TournamentHeader';
import { TournamentSettings } from './tournament/TournamentSettings';
import { TournamentPreferences } from './tournament/TournamentPreferences';
import { TournamentTable } from './tournament/TournamentTable';
import { TournamentSync } from './tournament/TournamentSync';
import { TournamentBracket } from './tournament/TournamentBracket';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { containers } from '../lib/design-system';
import { useGlobalSettings } from '../hooks/useGlobalSettings';
import { useToast } from './ToastContext';
import { ScrollToTop } from './ui/ScrollToTop';
import { useSyncContext } from './SyncContext';

interface TournamentViewProps {
  tournament: Tournament;
  onEdit: () => void;
  onBack: () => void;
}

function isValidTournament(obj: Partial<Tournament>): obj is Tournament {
  return !!(
    obj.id &&
    obj.name &&
    obj.phase &&
    Array.isArray(obj.teams) &&
    Array.isArray(obj.fixtures) &&
    obj.pointsConfig &&
    obj.dateCreated &&
    obj.dateModified
  );
}

export function TournamentView({ tournament, onEdit, onBack }: TournamentViewProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { getAnimationConfig, updateSettings: updateGlobalSettings, settings: globalSettings } = useGlobalSettings();
  const { showToast } = useToast();
  const { broadcastUpdate } = useSyncContext();

  const calculatePlayerStats = useCallback((
    teams: Team[],
    fixtures: Fixture[],
    pointsConfig: Tournament['pointsConfig']
  ): Team[] => {
    return teams.map(player => {
      const matches = fixtures.filter(f => 
        f.played && (f.homeTeamId === player.id || f.awayTeamId === player.id)
      );

      let wins = 0;
      let losses = 0;
      let points = 0;
      let buchholzScore = 0;

      matches.forEach(match => {
        const isHome = match.homeTeamId === player.id;
        
        if (pointsConfig.type === 'POINTS') {
          const playerScore = isHome ? match.homeScore! : match.awayScore!;
          const opponentScore = isHome ? match.awayScore! : match.homeScore!;

          if (playerScore > opponentScore) {
            wins++;
            points += pointsConfig.win;
          } else if (playerScore < opponentScore) {
            losses++;
            points += pointsConfig.loss;
          } else {
            points += pointsConfig.draw || 0;
          }
        } else {
          if (match.winner === player.id) {
            wins++;
            points += pointsConfig.win;
          } else {
            losses++;
            points += pointsConfig.loss;
          }
        }
      });

      if (tournament.phase === 'SWISS_SYSTEM') {
        const opponents = matches.map(m => 
          m.homeTeamId === player.id ? m.awayTeamId : m.homeTeamId
        );
        buchholzScore = opponents.reduce((score, oppId) => {
          const opponent = teams.find(t => t.id === oppId);
          return score + (opponent?.points || 0);
        }, 0);
      }

      return {
        ...player,
        played: matches.length,
        wins,
        losses,
        points,
        buchholzScore: tournament.phase === 'SWISS_SYSTEM' ? buchholzScore : undefined,
        bracket: player.bracket,
        status: player.status
      };
    });
  }, [tournament.phase]);

  const [currentTournament, setCurrentTournament] = useState<Tournament>(() => {
    const updatedPlayers = calculatePlayerStats(
      tournament.teams,
      tournament.fixtures,
      tournament.pointsConfig
    );

    return {
      ...tournament,
      teams: updatedPlayers
    };
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [settings, setSettings] = useState<Settings>(defaultTournamentSettings);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const viewMode = (searchParams.get('view') as ViewMode) || 'STATS';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    try {
      const storedPlayer = localStorage.getItem(`selected_player_${tournament.id}`);
      if (storedPlayer) {
        setSelectedPlayerId(storedPlayer);
      }

      const storedSettings = localStorage.getItem(`tournament_settings_${tournament.id}`);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(parsedSettings);
        updateGlobalSettings({
          lowMotion: parsedSettings.lowMotion
        });
      }

      setIsInitialized(true);
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
      setIsInitialized(true);
    }
  }, [tournament.id, isMounted, updateGlobalSettings]);

  useEffect(() => {
    if (!isInitialized || !isMounted) return;

    try {
      localStorage.setItem(`tournament_settings_${tournament.id}`, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }, [settings, tournament.id, isInitialized, isMounted]);

  const handleSettingChange = useCallback((key: keyof Settings) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: !prev[key]
      };

      if (key === 'lowMotion') {
        updateGlobalSettings({ lowMotion: !prev.lowMotion });
      }

      return newSettings;
    });
  }, [updateGlobalSettings]);

  useEffect(() => {
    if (!isInitialized || !isMounted) return;

    try {
      if (selectedPlayerId) {
        localStorage.setItem(`selected_player_${tournament.id}`, selectedPlayerId);
      } else {
        localStorage.removeItem(`selected_player_${tournament.id}`);
      }
    } catch (error) {
      console.warn('Failed to save selected player to localStorage:', error);
    }
  }, [selectedPlayerId, tournament.id, isInitialized, isMounted]);

  const handleFixtureUpdate = useCallback((
    fixture: Fixture, 
    homeScore: number | undefined, 
    awayScore: number | undefined, 
    winnerId?: string
  ) => {
    try {
      const isPointBased = currentTournament.pointsConfig.type === 'POINTS';
      const isElimination = currentTournament.phase === 'SINGLE_ELIMINATION';
      const isSwissSystem = currentTournament.phase === 'SWISS_SYSTEM';
      
      const updatedFixture = {
        ...fixture,
        played: true,
        datePlayed: new Date().toISOString(),
        ...(isPointBased ? {
          homeScore,
          awayScore,
          winner: undefined
        } : {
          homeScore: undefined,
          awayScore: undefined,
          winner: winnerId
        }),
        bracket: isElimination ? fixture.bracket : undefined,
        significance: isElimination ? fixture.significance : undefined
      };

      const existingFixtureIndex = currentTournament.fixtures.findIndex(f => 
        f.homeTeamId === fixture.homeTeamId && f.awayTeamId === fixture.awayTeamId
      );

      const updatedFixtures = existingFixtureIndex >= 0
        ? currentTournament.fixtures.map((f, i) => i === existingFixtureIndex ? updatedFixture : f)
        : [...currentTournament.fixtures, updatedFixture];

      let updatedTeams = currentTournament.teams;

      // Handle elimination tournament bracket movement
      if (isElimination && winnerId) {
        const loserId = winnerId === fixture.homeTeamId ? fixture.awayTeamId : fixture.homeTeamId;
        updatedTeams = updatedTeams.map(team => {
          if (team.id === loserId && fixture.bracket === 'WINNERS') {
            return {
              ...team,
              status: 'ELIMINATED',
              bracket: 'CONSOLATION'
            };
          }
          if (team.id === winnerId && fixture.bracket === 'WINNERS') {
            return {
              ...team,
              bracket: 'WINNERS',
              status: 'ACTIVE'
            };
          }
          return team;
        });
      }

      // Handle Swiss system bye points
      if (isSwissSystem) {
        const byePoints = currentTournament.pointsConfig.byePoints || currentTournament.swissConfig?.byePoints || 3;
        updatedTeams = updatedTeams.map(team => {
          const hasBye = updatedFixtures.some(f => 
            f.played && (f.homeTeamId === 'BYE' && f.awayTeamId === team.id) ||
            (f.homeTeamId === team.id && f.awayTeamId === 'BYE')
          );
          if (hasBye) {
            return {
              ...team,
              points: team.points + byePoints
            };
          }
          return team;
        });
      }

      const updatedPlayers = calculatePlayerStats(
        updatedTeams,
        updatedFixtures,
        currentTournament.pointsConfig
      );

      const updatedTournament: Tournament = {
        ...currentTournament,
        fixtures: updatedFixtures,
        teams: updatedPlayers,
        dateModified: new Date().toISOString()
      };

      // Update tournament progress
      if (isElimination) {
        const roundFixtures = updatedFixtures.filter(f => f.round === fixture.round);
        const roundComplete = roundFixtures.every(f => f.played);
        
        if (roundComplete) {
          const remainingWinners = updatedPlayers.filter(t => t.bracket === 'WINNERS' && t.status === 'ACTIVE');
          const consolationTeams = updatedPlayers.filter(t => t.bracket === 'CONSOLATION' && t.status === 'ACTIVE');
          
          updatedTournament.progress = {
            ...updatedTournament.progress,
            roundComplete,
            requiresNewPairings: remainingWinners.length > 1 || consolationTeams.length > 1
          };
        }
      } else if (isSwissSystem) {
        const roundFixtures = updatedFixtures.filter(f => f.round === fixture.round);
        const roundComplete = roundFixtures.every(f => f.played);
        
        if (roundComplete) {
          updatedTournament.progress = {
            ...updatedTournament.progress,
            roundComplete,
            requiresNewPairings: true
          };
        }
      }

      setCurrentTournament(updatedTournament);
      storage.saveTournament(updatedTournament);
      broadcastUpdate(updatedTournament);
      showToast('Match result updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update fixture:', error);
      showToast('Failed to update match result', 'error');
    }
  }, [currentTournament, showToast, calculatePlayerStats, broadcastUpdate]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('view', mode);
    router.push(`${pathname}?${current.toString()}`);
  }, [searchParams, router, pathname]);

  if (!isInitialized || !isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full">
      <div className="w-full bg-background/95 backdrop-blur-sm border-b border-border">
        <div className={`${containers.wrapper} ${containers.section}`}>
          <TournamentHeader
            tournament={currentTournament}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onSettingsToggle={() => {
              setShowSettings(!showSettings);
              setShowPreferences(false);
              setShowSync(false);
            }}
            onPreferencesToggle={() => {
              setShowPreferences(!showPreferences);
              setShowSettings(false);
              setShowSync(false);
            }}
            onSyncToggle={() => {
              setShowSync(!showSync);
              setShowSettings(false);
              setShowPreferences(false);
            }}
            showSettings={showSettings}
            showPreferences={showPreferences}
            showSync={showSync}
            onEdit={onEdit}
            onBack={onBack}
            selectedPlayerId={selectedPlayerId}
            onParticipantSelect={setSelectedPlayerId}
          />
        </div>
      </div>

      <AnimatePresence>
        {(showSettings || showPreferences || showSync) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-background/95 backdrop-blur-sm border-b border-border overflow-hidden"
          >
            <div className={`${containers.wrapper} ${containers.section}`}>
              {showSettings && (
                <TournamentSettings
                  tournament={currentTournament}
                  onSave={(updatedTournament) => {
                    try {
                      if (!isValidTournament(updatedTournament)) {
                        throw new Error('Invalid tournament data');
                      }

                      const updatedPlayers = calculatePlayerStats(
                        updatedTournament.teams,
                        updatedTournament.fixtures,
                        updatedTournament.pointsConfig
                      );

                      const finalTournament: Tournament = {
                        ...updatedTournament,
                        teams: updatedPlayers
                      };

                      setCurrentTournament(finalTournament);
                      storage.saveTournament(finalTournament);
                      broadcastUpdate(finalTournament);
                      showToast('Tournament settings saved', 'success');
                    } catch (error) {
                      console.error('Failed to save tournament settings:', error);
                      showToast('Failed to save tournament settings', 'error');
                    }
                  }}
                  onClose={() => setShowSettings(false)}
                />
              )}

              {showPreferences && (
                <TournamentPreferences
                  tournament={currentTournament}
                  settings={settings}
                  onSettingChange={handleSettingChange}
                  showSettings={showPreferences}
                  onClose={() => setShowPreferences(false)}
                />
              )}

              {showSync && <TournamentSync tournament={currentTournament} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full overflow-x-auto">
        <div className={`${containers.wrapper} py-8`}>
          <div className={containers.section}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div 
                key={viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {viewMode === 'STATS' && (
                  <TournamentStats
                    tournament={currentTournament}
                    selectedPlayerId={selectedPlayerId}
                  />
                )}

                {viewMode === 'GRID' && currentTournament.phase !== 'SINGLE_ELIMINATION' && (
                  <ResultsMatrix
                    tournament={currentTournament}
                    selectedPlayerId={settings.highlightMyMatches ? selectedPlayerId : undefined}
                    onUpdateResult={handleFixtureUpdate}
                  />
                )}

                {viewMode === 'TABLE' && currentTournament.phase !== 'SINGLE_ELIMINATION' && (
                  <TournamentTable
                    tournament={currentTournament}
                    selectedPlayerId={selectedPlayerId}
                  />
                )}

                {(viewMode === 'BRACKET' || currentTournament.phase === 'SINGLE_ELIMINATION') && (
                  <TournamentBracket
                    tournament={currentTournament}
                    onUpdateResult={handleFixtureUpdate}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <ScrollToTop threshold={300} />
        </div>
      </main>
    </div>
  );
}
