export type TournamentPhase = 'SINGLE' | 'HOME_AND_AWAY';

export type TeamStatus = 'ACTIVE' | 'WITHDRAWN';

export type ScoringType = 'WIN_LOSS' | 'POINTS';

export interface Team {
  id: string;
  name: string;
  status: TeamStatus;
  played: number;
  won: number;
  lost: number;
  points: number;
}

export interface PointsConfig {
  type: ScoringType;     // Whether to use simple win/loss or point-based scoring
  win: number;           // Points for win (typically 1 for WIN_LOSS, 2/3 for POINTS)
  loss: number;          // Points for loss (typically 0)
  draw?: number;         // Optional points for draw
}

export interface Fixture {
  datePlayed: string | number | Date;
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;    // Optional for point-based games
  awayScore?: number;    // Optional for point-based games
  winner?: string;       // Team ID of winner for WIN_LOSS games
  played: boolean;
  date?: string;         // ISO date string
  phase: 'HOME' | 'AWAY';
}

export interface Tournament {
  id: string;
  name: string;
  phase: TournamentPhase;
  teams: Team[];
  fixtures: Fixture[];
  pointsConfig: PointsConfig;
  dateCreated: string;    // ISO date string
  dateModified: string;   // ISO date string
}

export interface TournamentExport {
  version: string;        // For future compatibility
  tournament: Tournament;
  action: 'INSERT' | 'UPDATE';
}
