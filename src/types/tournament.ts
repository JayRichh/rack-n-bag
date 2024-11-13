export type TournamentPhase = 'SINGLE' | 'HOME_AND_AWAY';

export type TeamStatus = 'ACTIVE' | 'WITHDRAWN';

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
  win: number;
  loss: number;
  draw?: number;
}

export interface Fixture {
  datePlayed: string | number | Date;
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
  date?: string;  // ISO date string
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
