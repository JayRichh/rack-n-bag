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
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { containers } from '../lib/design-system';
import { useGlobalSettings } from '../hooks/useGlobalSettings';
import { useToast } from './ToastContext';
import { ScrollToTop } from './ui/ScrollToTop';

interface TournamentViewProps {
  tournament: Tournament;
  onEdit: () => void;
  onBack: () => void;
}

// Type guard to ensure all required tournament properties are present
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

  const calculatePlayerStats = useCallback((
    teams: Team[],
    fixtures: Fixture[],
    pointsConfig: Tournament['pointsConfig']
  ): Team[] => {
    return teams.map(player => {
      const matches = fixtures.filter(f => 
        f.played && (f.homeTeamId === player.id || f.awayTeamId === player.id)
      );

      let won = 0;
      let lost = 0;
      let points = 0;

      matches.forEach(match => {
        const isHome = match.homeTeamId === player.id;
        
        if (pointsConfig.type === 'POINTS') {
          const playerScore = isHome ? match.homeScore! : match.awayScore!;
          const opponentScore = isHome ? match.awayScore! : match.homeScore!;

          if (playerScore > opponentScore) {
            won++;
            points += pointsConfig.win;
          } else if (playerScore < opponentScore) {
            lost++;
            points += pointsConfig.loss;
          } else {
            points += pointsConfig.draw || 0;
          }
        } else {
          // WIN_LOSS scoring
          if (match.winner === player.id) {
            won++;
            points += pointsConfig.win;
          } else {
            lost++;
            points += pointsConfig.loss;
          }
        }
      });

      return {
        ...player,
        played: matches.length,
        won,
        lost,
        points
      };
    });
  }, []);

  const [currentTournament, setCurrentTournament] = useState<Tournament>(() => {
    // Initialize tournament with calculated stats
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
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [settings, setSettings] = useState<Settings>(defaultTournamentSettings);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Get view mode from URL or default to 'STATS'
  const viewMode = (searchParams.get('view') as ViewMode) || 'STATS';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize settings and participant from localStorage
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
        
        // Initialize global settings
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

  // Save settings to localStorage
  useEffect(() => {
    if (!isInitialized || !isMounted) return;

    try {
      localStorage.setItem(`tournament_settings_${tournament.id}`, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }, [settings, tournament.id, isInitialized, isMounted]);

  // Handle setting changes
  const handleSettingChange = useCallback((key: keyof Settings) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: !prev[key]
      };

      // Only update global settings for motion
      if (key === 'lowMotion') {
        updateGlobalSettings({ lowMotion: !prev.lowMotion });
      }

      return newSettings;
    });
  }, [updateGlobalSettings]);

  // Save selected player to localStorage
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
      
      const updatedFixture = {
        ...fixture,
        played: true,
        datePlayed: new Date().toISOString(),
        // For points-based scoring, include scores
        ...(isPointBased ? {
          homeScore,
          awayScore,
          winner: undefined
        } : {
          // For win/loss scoring, include winner and clear scores
          homeScore: undefined,
          awayScore: undefined,
          winner: winnerId
        })
      };

      const existingFixtureIndex = currentTournament.fixtures.findIndex(f => 
        f.homeTeamId === fixture.homeTeamId && f.awayTeamId === fixture.awayTeamId
      );

      const updatedFixtures = existingFixtureIndex >= 0
        ? currentTournament.fixtures.map((f, i) => i === existingFixtureIndex ? updatedFixture : f)
        : [...currentTournament.fixtures, updatedFixture];

      // Calculate updated player stats
      const updatedPlayers = calculatePlayerStats(
        currentTournament.teams,
        updatedFixtures,
        currentTournament.pointsConfig
      );

      const updatedTournament: Tournament = {
        ...currentTournament,
        fixtures: updatedFixtures,
        teams: updatedPlayers,
        dateModified: new Date().toISOString()
      };

      setCurrentTournament(updatedTournament);
      storage.saveTournament(updatedTournament);
      showToast('Match result updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update fixture:', error);
      showToast('Failed to update match result', 'error');
    }
  }, [currentTournament, showToast, calculatePlayerStats]);

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
      {/* Header */}
      <div className="w-full bg-background/95 backdrop-blur-sm border-b border-border">
        <div className={`${containers.wrapper} ${containers.section}`}>
          <TournamentHeader
            tournament={currentTournament}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onSettingsToggle={() => {
              setShowSettings(!showSettings);
              setShowPreferences(false);
            }}
            onPreferencesToggle={() => {
              setShowPreferences(!showPreferences);
              setShowSettings(false);
            }}
            showSettings={showSettings}
            showPreferences={showPreferences}
            onEdit={onEdit}
            onBack={onBack}
            selectedPlayerId={selectedPlayerId}
            onParticipantSelect={setSelectedPlayerId}
          />
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {(showSettings || showPreferences) && (
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
                  settings={settings}
                  onSettingChange={handleSettingChange}
                  showSettings={showPreferences}
                  onClose={() => setShowPreferences(false)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
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

                {viewMode === 'GRID' && (
                  <ResultsMatrix
                    tournament={currentTournament}
                    selectedPlayerId={settings.highlightMyMatches ? selectedPlayerId : undefined}
                    onUpdateResult={handleFixtureUpdate}
                  />
                )}

                {viewMode === 'TABLE' && (
                  <TournamentTable
                    tournament={currentTournament}
                    selectedPlayerId={selectedPlayerId}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Scroll to Top Button */}
          <ScrollToTop threshold={300} />
        </div>
      </main>
    </div>
  );
}
