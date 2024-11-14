import { Tournament, ScoringType, PointsConfig } from '../types/tournament';
import { encodeTournament, decodeTournament } from './shortener';

// Validation constants
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const VALID_SHARE_CODE_REGEX = /^[A-Za-z0-9_-]+$/;

class ImportError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ImportError';
  }
}

export function exportTournament(tournament: Tournament): string {
  try {
    return encodeTournament(tournament);
  } catch (error) {
    console.error('Export error:', error);
    throw new ImportError('Failed to export tournament', 'EXPORT_FAILED');
  }
}

export function downloadTournamentFile(tournament: Tournament) {
  try {
    // Create a full export with metadata
    const data = {
      version: 2,
      type: 'tournament_export',
      timestamp: new Date().toISOString(),
      data: tournament
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `${tournament.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${tournament.id.slice(0, 8)}.json`;
    
    // Safely handle download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw new ImportError('Failed to download tournament file', 'DOWNLOAD_FAILED');
  }
}

export async function copyTournamentToClipboard(tournament: Tournament): Promise<void> {
  try {
    const shareCode = exportTournament(tournament);
    await navigator.clipboard.writeText(shareCode);
  } catch (error) {
    console.error('Clipboard write error:', error);
    throw new ImportError('Failed to copy tournament to clipboard', 'CLIPBOARD_WRITE_FAILED');
  }
}

export async function importFromClipboardText(text: string): Promise<Tournament> {
  try {
    // Remove whitespace and non-printable characters
    const sanitizedText = text.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    if (!sanitizedText) {
      throw new ImportError('Empty or invalid clipboard data', 'INVALID_DATA');
    }

    // Check if it's a share code
    if (VALID_SHARE_CODE_REGEX.test(sanitizedText)) {
      try {
        return decodeTournament(sanitizedText);
      } catch (error) {
        console.error('Share code decode error:', error);
        throw new ImportError('Invalid share code format', 'INVALID_SHARE_CODE');
      }
    }

    // Try parsing as JSON
    try {
      const parsed = JSON.parse(sanitizedText);
      
      // Handle full export format
      if (parsed.version === 2 && parsed.type === 'tournament_export' && parsed.data) {
        return validateAndNormalizeTournament(parsed.data);
      }
      
      // Try parsing as direct tournament data
      return validateAndNormalizeTournament(parsed);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new ImportError('Invalid tournament data format', 'PARSE_FAILED');
    }
  } catch (error) {
    if (error instanceof ImportError) {
      throw error;
    }
    console.error('Import error:', error);
    throw new ImportError('Failed to import tournament data', 'IMPORT_FAILED');
  }
}

export async function importTournament(file: File): Promise<Tournament> {
  return new Promise((resolve, reject) => {
    if (!validateTournamentFile(file)) {
      reject(new ImportError('Invalid tournament file', 'INVALID_FILE'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const tournament = await importFromClipboardText(content);
        resolve(tournament);
      } catch (error) {
        console.error('File parse error:', error);
        reject(new ImportError('Failed to parse tournament file', 'PARSE_FAILED'));
      }
    };

    reader.onerror = () => {
      console.error('File read error:', reader.error);
      reject(new ImportError('Failed to read tournament file', 'READ_FAILED'));
    };
    
    reader.readAsText(file);
  });
}

export function validateTournamentFile(file: File): boolean {
  if (!file.name.toLowerCase().endsWith('.json')) {
    console.warn('Invalid file type:', file.name);
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    console.warn('File too large:', file.size);
    return false;
  }

  return true;
}

export async function importFromClipboard(): Promise<Tournament> {
  try {
    const text = await navigator.clipboard.readText();
    return importFromClipboardText(text);
  } catch (error) {
    console.error('Clipboard read error:', error);
    throw new ImportError('Failed to read from clipboard', 'CLIPBOARD_READ_FAILED');
  }
}

function validateAndNormalizeTournament(data: any): Tournament {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid tournament data structure');
    }

    // Ensure required fields exist
    const requiredFields = ['id', 'name', 'teams', 'fixtures'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate arrays
    if (!Array.isArray(data.teams) || !Array.isArray(data.fixtures)) {
      throw new Error('Teams and fixtures must be arrays');
    }

    const now = new Date().toISOString();

    // Determine scoring type and validate points config
    const scoringType: ScoringType = ['WIN_LOSS', 'POINTS'].includes(data.pointsConfig?.type) 
      ? data.pointsConfig.type 
      : 'WIN_LOSS';

    // Set appropriate default points based on scoring type
    const pointsConfig: PointsConfig = {
      type: scoringType,
      win: Number(data.pointsConfig?.win) || (scoringType === 'WIN_LOSS' ? 1 : 3),
      loss: Number(data.pointsConfig?.loss) || 0
    };

    // Only include draw points for POINTS scoring type
    if (scoringType === 'POINTS' && data.pointsConfig?.draw !== undefined) {
      pointsConfig.draw = Number(data.pointsConfig.draw);
    }

    // Normalize and validate the tournament data
    const tournament: Tournament = {
      id: String(data.id),
      name: String(data.name),
      phase: ['SINGLE', 'HOME_AND_AWAY'].includes(data.phase) ? data.phase : 'SINGLE',
      pointsConfig,
      teams: data.teams.map((team: any, index: number) => ({
        id: String(team.id || `t${index}`),
        name: String(team.name || `Team ${index + 1}`),
        status: team.status === 'WITHDRAWN' ? 'WITHDRAWN' : 'ACTIVE',
        played: Math.max(0, Number(team.played) || 0),
        won: Math.max(0, Number(team.won) || 0),
        lost: Math.max(0, Number(team.lost) || 0),
        points: Math.max(0, Number(team.points) || 0)
      })),
      fixtures: data.fixtures.map((fixture: any, index: number) => ({
        id: String(fixture.id || `f${index}`),
        homeTeamId: String(fixture.homeTeamId),
        awayTeamId: String(fixture.awayTeamId),
        homeScore: fixture.homeScore !== undefined ? Math.max(0, Number(fixture.homeScore)) : undefined,
        awayScore: fixture.awayScore !== undefined ? Math.max(0, Number(fixture.awayScore)) : undefined,
        winner: fixture.winner,
        played: Boolean(fixture.played),
        phase: fixture.phase === 'AWAY' ? 'AWAY' : 'HOME',
        date: fixture.date || now,
        datePlayed: fixture.datePlayed || now
      })),
      dateCreated: data.dateCreated || now,
      dateModified: now
    };

    return tournament;
  } catch (error) {
    console.error('Validation error:', error);
    throw new ImportError(
      `Invalid tournament data: ${error instanceof Error ? error.message : 'unknown error'}`,
      'VALIDATION_FAILED'
    );
  }
}
