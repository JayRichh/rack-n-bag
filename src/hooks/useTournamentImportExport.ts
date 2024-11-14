import { useState } from 'react';
import { Tournament, TournamentExport } from '../types/tournament';
import { storage } from '../utils/storage';
import { importTournament, importFromClipboard, downloadTournamentFile, copyTournamentToClipboard } from '../utils/importExport';
import { useToast } from '../components/ToastContext';

export function useTournamentImportExport() {
  const { showToast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleImportedTournament = (importedTournament: Tournament) => {
    const existingTournament = storage.getTournament(importedTournament.id);
    
    if (existingTournament) {
      storage.saveTournament({
        ...importedTournament,
        dateModified: new Date().toISOString()
      });
      showToast(`"${importedTournament.name}" has been successfully updated.`, 'success');
    } else {
      storage.saveTournament(importedTournament);
      showToast(`"${importedTournament.name}" has been successfully imported.`, 'success');
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
