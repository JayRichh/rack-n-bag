import { useState } from 'react';
import { Tournament, TournamentPhase, SwissSystemConfig } from '../types/tournament';
import { storage } from '../utils/storage';
import { importTournament, importFromClipboard, downloadTournamentFile, copyTournamentToClipboard } from '../utils/importExport';
import { useToast } from '../components/ToastContext';

export function useTournamentImportExport() {
  const { showToast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const migrateFormatSpecificData = (tournament: Tournament): Tournament => {
    const migrated = { ...tournament };

    // Ensure proper phase
    if (!['ROUND_ROBIN_SINGLE', 'SWISS_SYSTEM', 'SINGLE_ELIMINATION'].includes(migrated.phase)) {
      migrated.phase = 'ROUND_ROBIN_SINGLE';
    }

    // Ensure Swiss System config if needed
    if (migrated.phase === 'SWISS_SYSTEM' && !migrated.swissConfig) {
      const defaultSwissConfig: SwissSystemConfig = {
        maxRounds: Math.ceil(Math.log2(migrated.teams.length)),
        byeHandling: 'RANDOM',
        tiebreakers: ['BUCHHOLZ', 'HEAD_TO_HEAD', 'WINS'],
        byePoints: migrated.pointsConfig.byePoints || 3
      };
      migrated.swissConfig = defaultSwissConfig;
    }

    // Ensure bye points for points-based scoring
    if (migrated.pointsConfig.type === 'POINTS' && migrated.pointsConfig.byePoints === undefined) {
      migrated.pointsConfig.byePoints = 3;
    }

    // Ensure bracket positions for elimination format
    if (migrated.phase === 'SINGLE_ELIMINATION') {
      migrated.teams = migrated.teams.map(team => ({
        ...team,
        bracket: team.bracket || 'WINNERS',
        status: team.status || 'ACTIVE'
      }));
      migrated.fixtures = migrated.fixtures.map(fixture => ({
        ...fixture,
        bracket: fixture.bracket || 'WINNERS'
      }));
    }

    // Ensure progress data
    if (!migrated.progress) {
      migrated.progress = {
        currentRound: 1,
        totalRounds: migrated.phase === 'ROUND_ROBIN_SINGLE' ? migrated.teams.length - 1 :
                     migrated.phase === 'SWISS_SYSTEM' ? migrated.swissConfig?.maxRounds || Math.ceil(Math.log2(migrated.teams.length)) :
                     Math.ceil(Math.log2(migrated.teams.length)),
        phase: migrated.phase,
        roundComplete: false,
        requiresNewPairings: false
      };
    }

    return migrated;
  };

  const handleImportedTournament = (importedTournament: Tournament) => {
    const migratedTournament = migrateFormatSpecificData(importedTournament);
    const existingTournament = storage.getTournament(migratedTournament.id);
    
    if (existingTournament) {
      storage.saveTournament({
        ...migratedTournament,
        dateModified: new Date().toISOString()
      });
      showToast(`"${migratedTournament.name}" has been successfully updated.`, 'success');
    } else {
      storage.saveTournament(migratedTournament);
      showToast(`"${migratedTournament.name}" has been successfully imported.`, 'success');
    }
    
    return storage.getTournaments();
  };

  const importFromFile = async (file: File) => {
    setIsImporting(true);
    try {
      const importedTournament = await importTournament(file);
      const tournaments = handleImportedTournament(importedTournament);
      return tournaments;
    } catch (error) {
      showToast('Failed to import tournament file. Please ensure the file is valid.', 'error');
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const importFromShareCode = async () => {
    setIsImporting(true);
    try {
      const importedTournament = await importFromClipboard();
      const tournaments = handleImportedTournament(importedTournament);
      return tournaments;
    } catch (error) {
      showToast('Failed to import tournament from clipboard. Please ensure you have copied a valid share code.', 'error');
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const exportToFile = async (tournament: Tournament) => {
    setIsExporting(true);
    try {
      await downloadTournamentFile(tournament);
      showToast(`"${tournament.name}" has been downloaded successfully.`, 'success');
    } catch (error) {
      showToast('Failed to download tournament file.', 'error');
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToShareCode = async (tournament: Tournament) => {
    setIsExporting(true);
    try {
      await copyTournamentToClipboard(tournament);
      showToast(`Share code for "${tournament.name}" has been copied to clipboard.`, 'success');
    } catch (error) {
      showToast('Failed to copy tournament share code.', 'error');
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    importFromFile,
    importFromShareCode,
    exportToFile,
    exportToShareCode,
    isImporting,
    isExporting
  };
}
