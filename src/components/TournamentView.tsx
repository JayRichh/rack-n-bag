'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tournament, Fixture } from '../types/tournament';
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

export function TournamentView({ tournament, onEdit, onBack }: TournamentViewProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { getAnimationConfig, updateSettings: updateGlobalSettings, settings: globalSettings } = useGlobalSettings();
  const { showToast } = useToast();

  const [currentTournament, setCurrentTournament] = useState(tournament);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [participantTeamId, setParticipantTeamId] = useState<string>('');
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
      const storedParticipant = localStorage.getItem(`participant_team_${tournament.id}`);
      if (storedParticipant) {
        setParticipantTeamId(storedParticipant);
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

  // Save participant to localStorage
  useEffect(() => {
    if (!isInitialized || !isMounted) return;

    try {
      if (participantTeamId) {
        localStorage.setItem(`participant_team_${tournament.id}`, participantTeamId);
      } else {
        localStorage.removeItem(`participant_team_${tournament.id}`);
      }
    } catch (error) {
      console.warn('Failed to save participant to localStorage:', error);
    }
  }, [participantTeamId, tournament.id, isInitialized, isMounted]);

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

      const updatedTournament = {
        ...currentTournament,
        fixtures: existingFixtureIndex >= 0
          ? currentTournament.fixtures.map((f, i) => i === existingFixtureIndex ? updatedFixture : f)
          : [...currentTournament.fixtures, updatedFixture],
        dateModified: new Date().toISOString()
      };

      setCurrentTournament(updatedTournament);
      storage.saveTournament(updatedTournament);
      showToast('Match result updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update fixture:', error);
      showToast('Failed to update match result', 'error');
    }
  }, [currentTournament, showToast]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('view', mode);
    router.push(`${pathname}?${current.toString()}`);
  }, [searchParams, router, pathname]);

  if (!isInitialized || !isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border">
        <div className={containers.section}>
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
            participantTeamId={participantTeamId}
            onParticipantSelect={setParticipantTeamId}
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
            className="bg-background/95 backdrop-blur-sm border-b border-border overflow-hidden"
          >
            <div className={containers.section}>
              {showSettings && (
                <TournamentSettings
                  tournament={currentTournament}
                  onSave={(updatedTournament) => {
                    try {
                      setCurrentTournament(prev => ({ ...prev, ...updatedTournament }));
                      storage.saveTournament({ ...currentTournament, ...updatedTournament });
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
      <main className={`${containers.section} flex-1 py-8`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div 
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {viewMode === 'STATS' && (
              <TournamentStats
                tournament={currentTournament}
                participantTeamId={participantTeamId}
              />
            )}

            {viewMode === 'GRID' && (
              <ResultsMatrix
                tournament={currentTournament}
                participantTeamId={settings.highlightMyMatches ? participantTeamId : undefined}
                onUpdateResult={handleFixtureUpdate}
              />
            )}

            {viewMode === 'TABLE' && (
              <TournamentTable
                tournament={currentTournament}
                participantTeamId={participantTeamId}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Scroll to Top Button */}
        <ScrollToTop threshold={300} />
      </main>
    </div>
  );
}
