import { Tournament, ScoringType, PointsConfig, TournamentExport, ImportError, TournamentPhase, SwissSystemConfig, TeamStatus, BracketPosition } from '../types/tournament';
import { encodeTournament, decodeTournament } from './shortener';

// Validation constants
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const VALID_SHARE_CODE_REGEX = /^[A-Za-z0-9_-]+$/;
const CURRENT_VERSION = 7; // Incremented for new format support

class TournamentImportError extends Error implements ImportError {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'TournamentImportError';
  }
}

function createExportData(tournament: Tournament): TournamentExport {
  return {
    version: CURRENT_VERSION,
    type: 'tournament_export',
    timestamp: new Date().toISOString(),
    data: tournament
  };
}

export function exportTournament(tournament: Tournament): string {
  try {
    return encodeTournament(tournament);
  } catch (error) {
    console.error('Export error:', error);
    throw new TournamentImportError('Failed to export tournament', 'EXPORT_FAILED');
  }
}

export function downloadTournamentFile(tournament: Tournament) {
  try {
    const data = createExportData(tournament);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `${tournament.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${tournament.id.slice(0, 8)}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw new TournamentImportError('Failed to download tournament file', 'DOWNLOAD_FAILED');
  }
}

export async function copyTournamentToClipboard(tournament: Tournament): Promise<void> {
  try {
    const shareCode = exportTournament(tournament);
    await navigator.clipboard.writeText(shareCode);
  } catch (error) {
    console.error('Clipboard write error:', error);
    throw new TournamentImportError('Failed to copy tournament to clipboard', 'CLIPBOARD_WRITE_FAILED');
  }
}

export async function importFromClipboardText(text: string): Promise<Tournament> {
  try {
    const sanitizedText = text.trim();
    
    if (!sanitizedText) {
      throw new TournamentImportError('Empty clipboard data', 'INVALID_DATA');
    }

    if (VALID_SHARE_CODE_REGEX.test(sanitizedText)) {
      try {
        return decodeTournament(sanitizedText);
      } catch (error) {
        console.error('Share code decode error:', error);
        throw new TournamentImportError('Invalid share code format', 'INVALID_SHARE_CODE');
      }
    }

    try {
      const parsed = JSON.parse(sanitizedText);
      
      if (parsed.version && parsed.type === 'tournament_export' && parsed.data) {
        return validateAndNormalizeTournament(parsed.data);
      }
      
      return validateAndNormalizeTournament(parsed);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new TournamentImportError('Invalid tournament data format', 'PARSE_FAILED');
    }
  } catch (error) {
    if (error instanceof TournamentImportError) throw error;
    console.error('Import error:', error);
    throw new TournamentImportError('Failed to import tournament data', 'IMPORT_FAILED');
  }
}

export async function importTournament(file: File): Promise<Tournament> {
  return new Promise((resolve, reject) => {
    if (!validateTournamentFile(file)) {
      reject(new TournamentImportError('Invalid tournament file', 'INVALID_FILE'));
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
        reject(new TournamentImportError('Failed to parse tournament file', 'PARSE_FAILED'));
      }
    };

    reader.onerror = () => {
      console.error('File read error:', reader.error);
      reject(new TournamentImportError('Failed to read tournament file', 'READ_FAILED'));
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
    throw new TournamentImportError('Failed to read from clipboard', 'CLIPBOARD_READ_FAILED');
  }
}

function validateAndNormalizeTournament(data: any): Tournament {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid tournament data structure');
    }

    const requiredFields = ['id', 'name', 'teams', 'fixtures'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(data.teams) || !Array.isArray(data.fixtures)) {
      throw new Error('Teams and fixtures must be arrays');
    }

    const now = new Date().toISOString();
    const phase: TournamentPhase = validatePhase(data.phase);
    const scoringType: ScoringType = validateScoringType(data.pointsConfig?.type);

    const pointsConfig: PointsConfig = {
      type: scoringType,
      win: Number(data.pointsConfig?.win) || (scoringType === 'WIN_LOSS' ? 1 : 3),
      loss: Number(data.pointsConfig?.loss) || 0,
      ...(scoringType === 'POINTS' && {
        draw: Number(data.pointsConfig?.draw) || 1,
        byePoints: Number(data.pointsConfig?.byePoints) || 3
      })
    };

    const teams = data.teams.map((team: any, index: number) => ({
      id: String(team.id || `t${index}`),
      name: String(team.name || `Team ${index + 1}`),
      status: validateTeamStatus(team.status),
      played: Math.max(0, Number(team.played) || 0),
      wins: Math.max(0, Number(team.wins) || 0),
      losses: Math.max(0, Number(team.losses) || 0),
      points: Number(team.points) || 0,
      ...(phase === 'SWISS_SYSTEM' && {
        buchholzScore: Number(team.buchholzScore) || 0
      }),
      ...(phase === 'SINGLE_ELIMINATION' && {
        bracket: validateBracketPosition(team.bracket),
        status: team.status === 'ELIMINATED' ? 'ELIMINATED' as TeamStatus : 'ACTIVE' as TeamStatus
      })
    }));

    const fixtures = data.fixtures.map((fixture: any, index: number) => ({
      id: String(fixture.id || `f${index}`),
      homeTeamId: String(fixture.homeTeamId),
      awayTeamId: String(fixture.awayTeamId),
      played: Boolean(fixture.played),
      round: Number(fixture.round) || 1,
      datePlayed: fixture.datePlayed || now,
      ...(scoringType === 'POINTS' && {
        homeScore: fixture.homeScore !== undefined ? Number(fixture.homeScore) : undefined,
        awayScore: fixture.awayScore !== undefined ? Number(fixture.awayScore) : undefined
      }),
      ...(scoringType === 'WIN_LOSS' && {
        winner: fixture.winner
      }),
      ...(phase === 'SINGLE_ELIMINATION' && {
        bracket: validateBracketPosition(fixture.bracket),
        significance: String(fixture.significance || '')
      })
    }));

    const tournament: Tournament = {
      id: String(data.id),
      name: String(data.name),
      phase,
      pointsConfig,
      teams,
      fixtures,
      dateCreated: data.dateCreated || now,
      dateModified: now,
      progress: {
        currentRound: Number(data.progress?.currentRound) || 1,
        totalRounds: Number(data.progress?.totalRounds) || 1,
        phase,
        roundComplete: Boolean(data.progress?.roundComplete),
        requiresNewPairings: Boolean(data.progress?.requiresNewPairings),
        ...(phase === 'SINGLE_ELIMINATION' && {
          bracketStage: String(data.progress?.bracketStage || '')
        })
      }
    };

    // Add format-specific configurations
    if (phase === 'SWISS_SYSTEM') {
      tournament.swissConfig = validateSwissConfig(data.swissConfig);
    }
    if (phase === 'SINGLE_ELIMINATION') {
      tournament.seedMethod = data.seedMethod || 'RANDOM';
    }

    return tournament;
  } catch (error) {
    console.error('Validation error:', error);
    throw new TournamentImportError(
      `Invalid tournament data: ${error instanceof Error ? error.message : 'unknown error'}`,
      'VALIDATION_FAILED'
    );
  }
}

function validatePhase(phase: any): TournamentPhase {
  const validPhases: TournamentPhase[] = ['ROUND_ROBIN_SINGLE', 'SWISS_SYSTEM', 'SINGLE_ELIMINATION'];
  return validPhases.includes(phase) ? phase : 'ROUND_ROBIN_SINGLE';
}

function validateScoringType(type: any): ScoringType {
  return type === 'POINTS' ? 'POINTS' : 'WIN_LOSS';
}

function validateTeamStatus(status: any): TeamStatus {
  return status === 'ELIMINATED' ? 'ELIMINATED' : 'ACTIVE';
}

function validateBracketPosition(bracket: any): BracketPosition {
  return bracket === 'CONSOLATION' ? 'CONSOLATION' : 'WINNERS';
}

function validateSwissConfig(config: any): SwissSystemConfig {
  return {
    maxRounds: Number(config?.maxRounds) || 0,
    byeHandling: config?.byeHandling === 'LOWEST_RANKED' ? 'LOWEST_RANKED' : 'RANDOM',
    tiebreakers: Array.isArray(config?.tiebreakers) ? config.tiebreakers : ['BUCHHOLZ', 'HEAD_TO_HEAD', 'WINS'],
    byePoints: Number(config?.byePoints) || 3
  };
}
