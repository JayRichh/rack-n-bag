export type TournamentPhase = 'ROUND_ROBIN_SINGLE' | 'SWISS_SYSTEM' | 'SINGLE_ELIMINATION';
export type TeamStatus = 'ACTIVE' | 'ELIMINATED';
export type BracketPosition = 'WINNERS' | 'CONSOLATION';
export type ScoringType = 'POINTS' | 'WIN_LOSS';
export type SwissTiebreaker = 'BUCHHOLZ' | 'HEAD_TO_HEAD' | 'WINS';

export interface Team {
  id: string;
  name: string;
  status: TeamStatus;
  played: number;
  wins: number;
  losses: number;
  points: number;
  seed?: number;
  buchholzScore?: number;
  bracket?: BracketPosition;
}

export interface PointsConfig {
  type: ScoringType;
  win: number;
  loss: number;
  draw?: number;
  byePoints?: number;
}

export interface SwissSystemConfig {
  maxRounds: number;
  byeHandling: 'RANDOM' | 'LOWEST_RANKED';
  tiebreakers: SwissTiebreaker[];
  byePoints: number;
}

export interface Fixture {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  played: boolean;
  round: number;
  datePlayed: string;
  homeScore?: number;
  awayScore?: number;
  winner?: string;
  bracket?: BracketPosition;
  significance?: string;
}

export interface TournamentProgress {
  currentRound: number;
  totalRounds: number;
  phase: TournamentPhase;
  roundComplete: boolean;
  requiresNewPairings: boolean;
  bracketStage?: string;
}

export interface Tournament {
  id: string;
  name: string;
  phase: TournamentPhase;
  teams: Team[];
  fixtures: Fixture[];
  pointsConfig: PointsConfig;
  swissConfig?: SwissSystemConfig;
  seedMethod?: 'RANDOM' | 'MANUAL' | 'RANKING';
  dateCreated: string;
  dateModified: string;
  progress: TournamentProgress;
}

// Import/Export Types
export interface TournamentExport {
  version: number;
  type: 'tournament_export';
  timestamp: string;
  data: Tournament;
}

export interface ImportError {
  code: string;
  message: string;
}

// Tournament System Types
export interface SwissRound {
  round: number;
  fixtures: Fixture[];
  complete: boolean;
}

export interface BracketNode {
  fixture?: Fixture;
  round: number;
  position: number;
  nextPosition?: number;
  bracket: BracketPosition;
}

export interface TournamentSystemError {
  code: string;
  message: string;
}
